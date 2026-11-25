/**
 * 登录态管理
 *
 * 解决三个问题：
 * 1. 页面只知道"本地有没有 token"，不知道 token 是否还有效 → 提供响应式 authState；
 * 2. 服务端返回 401 时无人处理 → 统一静默退出登录（不跳转页面，浏览功能继续可用）；
 * 3. 重新打开小程序时无法预判过期 → 本地解析 JWT 的 exp，过期立即清理并标记原因。
 *
 * 约定：本模块只负责本地状态与判定，不发请求；网络校验放在 utils/api.ts 的 validateSession。
 */
import { reactive } from 'vue'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const EXPIRED_KEY = 'auth_expired_at'

export interface AuthUser {
  id?: number
  username?: string
  nickname?: string
  avatarUrl?: string
  [key: string]: any
}

export const authState = reactive({
  token: '',
  user: null as AuthUser | null,
  loggedIn: false,
  /** 上次会话是否因过期/失效被自动登出（用于"登录已过期"提示文案） */
  expired: false
})

function parseUser(raw: any): AuthUser | null {
  if (!raw) return null
  if (typeof raw === 'object') return raw as AuthUser
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

// 读取 token：优先内存状态，兜底本地存储（防止 initAuth 之前的调用）
export function getToken(): string {
  if (authState.token) return authState.token
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function getUser(): AuthUser | null {
  if (authState.user) return authState.user
  try {
    return parseUser(uni.getStorageSync(USER_KEY))
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * 本地 base64url 解码（小程序无 atob）
 */
function decodeBase64Url(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4 !== 0) str += '='
  let output = ''
  let buffer = 0
  let bits = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i)
    if (c === '=') break
    const value = chars.indexOf(c)
    if (value < 0) continue
    buffer = ((buffer << 6) | value) & 0xffffff
    bits += 6
    if (bits >= 8) {
      bits -= 8
      output += String.fromCharCode((buffer >> bits) & 0xff)
    }
  }
  return output
}

/**
 * 读取 JWT 的过期时间戳（秒）。
 * 返回 null 表示无法解析（例如不是标准 JWT），此时交给服务端判定。
 */
export function getTokenExpireAt(token?: string): number | null {
  const raw = token || getToken()
  if (!raw) return null
  const parts = raw.split('.')
  if (parts.length < 2) return null
  try {
    const payload = decodeBase64Url(parts[1])
    const matched = payload.match(/"exp"\s*:\s*(\d+)/)
    if (!matched) return null
    const exp = Number(matched[1])
    return Number.isFinite(exp) && exp > 0 ? exp : null
  } catch {
    return null
  }
}

/**
 * 本地判定 token 是否过期。
 * true=已过期，false=未过期，null=无法判断（交给服务端）
 */
export function isTokenExpired(token?: string): boolean | null {
  const exp = getTokenExpireAt(token)
  if (exp === null) return null
  // 预留 30 秒余量，避免临界时刻请求刚好失败
  return Date.now() >= exp * 1000 - 30 * 1000
}

/**
 * 从本地存储恢复登录态（App onLaunch 调用）。
 * 本地已过期时直接静默登出并记录过期原因，不跳转任何页面。
 */
export function initAuth(): boolean {
  let token = ''
  let user: AuthUser | null = null
  let hadExpired = false
  try {
    token = uni.getStorageSync(TOKEN_KEY) || ''
    user = parseUser(uni.getStorageSync(USER_KEY))
    hadExpired = !!uni.getStorageSync(EXPIRED_KEY)
  } catch {
    // 存储异常时按未登录处理
  }

  if (!token) {
    authState.token = ''
    authState.user = null
    authState.loggedIn = false
    authState.expired = hadExpired
    return false
  }

  authState.token = token
  authState.user = user
  authState.loggedIn = true
  authState.expired = false

  if (isTokenExpired(token) === true) {
    clearAuth({ expired: true })
    return false
  }
  return true
}

/**
 * 保存登录信息。登录成功会清除"已过期"标记。
 */
export function saveAuth(token: string, user: any) {
  try {
    uni.setStorageSync(TOKEN_KEY, token)
    uni.setStorageSync(USER_KEY, JSON.stringify(user))
    uni.removeStorageSync(EXPIRED_KEY)
  } catch {}
  authState.token = token
  authState.user = parseUser(user)
  authState.loggedIn = !!token
  authState.expired = false
}

/**
 * 更新本地用户资料（保留 token）。
 */
export function updateUser(partial: Partial<AuthUser> | null) {
  const merged = { ...(getUser() || {}), ...(partial || {}) } as AuthUser
  const token = getToken()
  if (!token) return
  try {
    uni.setStorageSync(USER_KEY, JSON.stringify(merged))
  } catch {}
  authState.user = merged
}

/**
 * 清除登录信息。
 * @param opts.expired 是否为"会话过期"导致的清理（用于后续提示文案）
 */
export function clearAuth(opts: { expired?: boolean } = {}) {
  try {
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_KEY)
    if (opts.expired) {
      uni.setStorageSync(EXPIRED_KEY, Date.now())
    } else {
      uni.removeStorageSync(EXPIRED_KEY)
    }
  } catch {}
  authState.token = ''
  authState.user = null
  authState.loggedIn = false
  authState.expired = !!opts.expired
}

let lastExpireAt = 0

/**
 * 会话失效（token 过期 / 服务端 401 / 被踢下线）。
 * 静默退出登录：不跳转页面、不弹全局提示，由各页面根据 authState 自行展示，
 * 保证用户仍可正常浏览方剂、药物、穴位、医案等内容。
 * @returns 是否确实处理了一次失效
 */
export function expireSession(message?: string): boolean {
  const hadSession = isLoggedIn()
  if (!hadSession) {
    // 本来就没有登录，只保证内存状态一致，避免误报"已过期"
    authState.token = ''
    authState.user = null
    authState.loggedIn = false
    return false
  }
  // 多个并发请求同时返回 401 时只处理一次
  const now = Date.now()
  if (now - lastExpireAt < 1000) return false
  lastExpireAt = now

  clearAuth({ expired: true })
  try {
    uni.$emit('auth:expired', { message: message || '登录已过期，请重新登录' })
  } catch {}
  return true
}

/**
 * 订阅会话失效事件，返回取消订阅函数（页面 onUnload 时调用）。
 */
export function onSessionExpired(handler: (payload: { message: string }) => void): () => void {
  const wrapped = (payload: any) => handler(payload || { message: '' })
  try {
    uni.$on('auth:expired', wrapped)
  } catch {}
  return () => {
    try {
      uni.$off('auth:expired', wrapped)
    } catch {}
  }
}

/**
 * 跳转登录页并带上回流参数。
 * @param redirect 'back' 表示登录成功后返回上一页，也可传具体页面路径
 */
export function goToLogin(redirect = 'back') {
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  uni.navigateTo({ url: `/pages/login/index${query}` })
}

export default {
  authState,
  initAuth,
  getToken,
  getUser,
  isLoggedIn,
  getTokenExpireAt,
  isTokenExpired,
  saveAuth,
  updateUser,
  clearAuth,
  expireSession,
  onSessionExpired,
  goToLogin
}
