/**
 * 岐黄小识 - API 服务层
 * 支持微信登录和学习记录
 */

import manifest from '../manifest.json'
import { getToken, getUser, saveAuth, clearAuth, isLoggedIn, expireSession, updateUser } from './auth'
import { authState, initAuth, isTokenExpired, onSessionExpired, goToLogin } from './auth'

const API_BASE = 'https://tcm.rowen.cc/index.php'
const SERVER_BASE = 'https://tcm.rowen.cc'

// 解析头像URL（相对路径补全为完整URL；拒绝 http:// — 真机 <image> 不加载非 HTTPS）
export function resolveAvatarUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://')) return ''
  if (url.startsWith('https://')) return url
  if (url.startsWith('/')) return SERVER_BASE + url
  return url
}

// Token 和用户管理统一由 utils/auth.ts 负责（响应式登录态 + 本地过期判定）
export { authState, initAuth, isTokenExpired, onSessionExpired, goToLogin }

// 处理服务端 401：静默退出登录，不跳转页面；具体提示由各页面根据 authState 展示
function handleUnauthorized(body: any) {
  if (body && body.code === 401) {
    expireSession(body.msg)
  }
  return body
}

// 通用请求
function request(module: string, action: string, params: Record<string, any> = {}, method: 'GET' | 'POST' = 'GET'): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    let url = `${API_BASE}?module=${module}&action=${action}`
    
    if (method === 'GET') {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          url += `&${key}=${encodeURIComponent(params[key])}`
        }
      })
    }

    uni.request({
      url,
      method,
      data: method === 'POST' ? params : {},
      timeout: 180000,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      success: (res: any) => resolve(handleUnauthorized(res.data)),
      fail: (err: any) => reject(err)
    })
  })
}

// 流式 SSE 请求：AI 思考中即收到 start/progress 事件，done 事件携带最终结果。
// 后端 consult 以 text/event-stream 输出 data:{type:start|progress|done}。
// enableChunked 接收分片；若分片未生效（降级），success 的完整 body 一次性解析。
// resolve 成功为 {code:1, data:result}；后端错误（非流式）resolve 原始错误对象。
export function streamRequest(
  module: string,
  action: string,
  params: Record<string, any> = {},
  onEvent: (evt: any) => void = () => {},
  method: 'GET' | 'POST' = 'POST'
): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    let url = `${API_BASE}?module=${module}&action=${action}`
    if (method === 'GET') {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          url += `&${key}=${encodeURIComponent(params[key])}`
        }
      })
    }

    let buffer = ''
    let byteBuf = new Uint8Array(0)
    let receivedChunk = false
    let resolved = false
    const finish = (val: any) => { if (!resolved) { resolved = true; resolve(val) } }

    const handleEvent = (evt: any) => {
      if (evt && evt.type === 'done') {
        onEvent(evt)
        finish(evt.result ? { code: 1, data: evt.result } : { code: 1, data: null })
        return
      }
      onEvent(evt)
    }

    const feedSSE = (text: string) => {
      buffer += text.replace(/\r\n/g, '\n')
      let idx: number
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        let data = ''
        frame.split('\n').forEach(line => {
          const l = line.trim()
          if (l.indexOf('data:') === 0) data += l.substring(5).trim()
        })
        if (data && data !== '[DONE]') {
          try { handleEvent(JSON.parse(data)) } catch { /* 忽略非 JSON 帧 */ }
        }
      }
    }

    const task: any = uni.request({
      url,
      method,
      data: method === 'POST' ? params : {},
      timeout: 180000,
      enableChunked: true,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      success: (res: any) => {
        // 未收到分片 → enableChunked 未生效：res.data 为完整响应体
        if (!receivedChunk) {
          const body = typeof res.data === 'string' ? res.data : ''
          if (body && body.indexOf('"type":"done"') >= 0) {
            feedSSE(body)
          } else {
            try {
              const obj = JSON.parse(body)
              handleUnauthorized(obj)
              onEvent({ type: 'legacy', data: obj })
              finish(obj)
            } catch {
              finish(res.data)
            }
          }
        } else {
          finish(res.data)
        }
      },
      fail: (err: any) => reject(err)
    })

    // 累积字节 + 完整 UTF-8 解码（分片边界可能切开多字节中文，回退保留不完整尾部）
    const decodeUtf8 = (bytes: Uint8Array, from: number, to: number): string => {
      let s = ''
      for (let i = from; i < to; i++) s += String.fromCharCode(bytes[i])
      try { return decodeURIComponent(escape(s)) } catch { return '' }
    }
    if (task && typeof task.onChunkReceived === 'function') {
      task.onChunkReceived((res: any) => {
        // 小程序偶发空分片，直接跳过，避免 new Uint8Array(null) 之后的异常
        if (!res || !res.data) return
        receivedChunk = true
        const incoming = new Uint8Array(res.data as ArrayBuffer)
        const merged = new Uint8Array(byteBuf.length + incoming.length)
        merged.set(byteBuf, 0)
        merged.set(incoming, byteBuf.length)
        // 尝试解码全部；若末尾多字节不完整（UTF-8 最多 3 字节），回退保留尾部待下次
        let text = ''
        let keep = 0
        for (let cut = merged.length; cut >= Math.max(0, merged.length - 3); cut--) {
          text = decodeUtf8(merged, 0, cut)
          if (text !== '') { keep = merged.length - cut; break }
        }
        byteBuf = keep > 0 ? merged.slice(merged.length - keep) : new Uint8Array(0)
        if (text) feedSSE(text)
      })
    }
  })
}

// 微信登录（自动保存token和用户信息）
export async function wxLogin(code: string): Promise<any> {
  // 获取当前小程序的 appid，传给服务端匹配对应的 secret
  const appid = (manifest as any)?.['mp-weixin']?.appid || ''

  const res = await request('auth', 'wx_login', { code, appid }, 'POST')
  if (res.code === 1 && res.data) {
    saveAuth(res.data.token, res.data.user)
  }
  return res
}

// 密码登录（自动保存token和用户信息）
export async function login(username: string, password: string): Promise<any> {
  const res = await request('auth', 'login', { username, password }, 'POST')
  if (res.code === 1 && res.data) {
    saveAuth(res.data.token, res.data.user)
  }
  return res
}

// 注册
export function register(username: string, password: string, email: string) {
  return request('auth', 'register', { username, password, email }, 'POST')
}

// 获取用户信息
export function getProfile() {
  return request('auth', 'profile')
}

// 会话校验：本地已过期直接登出；否则向服务端确认一次
// 返回 true=登录态有效/暂无法判定（离线容错），false=已失效并完成静默登出
let sessionValidation: Promise<boolean> | null = null
export function validateSession(): Promise<boolean> {
  const token = getToken()
  if (!token) return Promise.resolve(false)

  if (isTokenExpired(token) === true) {
    expireSession('登录已过期，请重新登录')
    return Promise.resolve(false)
  }

  if (sessionValidation) return sessionValidation

  sessionValidation = request('auth', 'profile')
    .then((res: any) => {
      if (res && res.code === 1 && res.data) {
        // 顺带同步最新资料，保证首页/我的显示与服务端一致
        const localUser = getUser() || {}
        const avatar = res.data.avatar_url ? resolveAvatarUrl(res.data.avatar_url) : ''
        updateUser({
          id: res.data.id || localUser.id,
          username: res.data.username || localUser.username || '',
          nickname: res.data.nickname || localUser.nickname || '',
          avatarUrl: avatar || localUser.avatarUrl || ''
        } as any)
        return true
      }
      // 401 已由 request 统一登出；其他异常（网络/服务端错误）保留本地登录态
      return !(res && res.code === 401)
    })
    .catch(() => true)

  sessionValidation.then(() => { sessionValidation = null })
  return sessionValidation
}

// 更新用户资料
export function updateProfile(nickname: string, avatarUrl: string) {
  return request('auth', 'update_profile', { nickname, avatar_url: avatarUrl }, 'POST')
}

// 上传头像到服务端
export function uploadAvatar(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    uni.uploadFile({
      url: `${API_BASE}?module=upload&action=avatar`,
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res: any) => {
        try {
          resolve(handleUnauthorized(JSON.parse(res.data)))
        } catch {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err: any) => reject(err)
    })
  })
}

// 修改密码
export function changePassword(oldPassword: string, newPassword: string) {
  return request('auth', 'change_password', { old_password: oldPassword, new_password: newPassword }, 'POST')
}

// 退出登录
export function logout() {
  clearAuth()
  uni.reLaunch({ url: '/pages/index/index' })
}

// TCM API
export function getStats() {
  return request('tcm', 'stats')
}

export function getFormulaList(page = 1, limit = 20, meridian = '', keyword = '') {
  return request('tcm', 'formula_list', { page, limit, meridian, keyword })
}

export function getFormulaDetail(id?: number, name?: string) {
  return request('tcm', 'formula_detail', { id, name })
}

export function getHerbList(page = 1, limit = 20, category = '', nature = '', keyword = '') {
  return request('tcm', 'herb_list', { page, limit, category, nature, keyword })
}

export function getHerbDetail(id?: number, name?: string) {
  return request('tcm', 'herb_detail', { id, name })
}

export function getAcupointList(page = 1, limit = 50, meridian = '', keyword = '') {
  return request('tcm', 'acupoint_list', { page, limit, meridian, keyword })
}

export function getAcupointDetail(id?: number, name?: string) {
  return request('tcm', 'acupoint_detail', { id, name })
}

export function getCaseList(page = 1, limit = 20, category = '', keyword = '') {
  return request('tcm', 'case_list', { page, limit, category, keyword })
}

export function getCaseDetail(id: number) {
  return request('tcm', 'case_detail', { id })
}

// 学习记录 API
export function recordLearning(contentType: string, contentId: number, contentName: string) {
  return request('learning', 'record', { content_type: contentType, content_id: contentId, content_name: contentName }, 'POST')
}

export function getLearningStats() {
  return request('learning', 'stats')
}

export function getLearningList(contentType = '', page = 1, limit = 20) {
  return request('learning', 'list', { content_type: contentType, page, limit })
}

export function getDiagnosisList(page = 1, limit = 20) {
  return request('learning', 'diagnosis_list', { page, limit })
}

// 问诊记录 API（ai_diagnosis 表）
export function getDiagnosisHistory(page = 1, limit = 20) {
  return request('ai', 'list', { page, limit })
}

export function getDiagnosisDetail(id: number) {
  return request('ai', 'detail', { id })
}

// 导入分享的问诊记录到当前用户账户
export function importSharedDiagnosis(sourceId: number) {
  return request('ai', 'import_shared', { source_id: sourceId }, 'POST')
}

// 站点配置（公开接口）
export function getSiteConfig() {
  return request('site', 'config')
}

export function checkLearned(contentType: string, contentId: number) {
  return request('learning', 'check', { content_type: contentType, content_id: contentId })
}

// 导出
export default {
  // 通用请求
  request,
  streamRequest,

  // 认证
  wxLogin,
  login,
  register,
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  logout,
  isLoggedIn,
  getUser,
  saveAuth,
  validateSession,
  authState,
  goToLogin,

  // TCM 数据
  getStats,
  getFormulaList,
  getFormulaDetail,
  getHerbList,
  getHerbDetail,
  getAcupointList,
  getAcupointDetail,
  getCaseList,
  getCaseDetail,

  // 学习记录
  recordLearning,
  getLearningStats,
  getLearningList,
  getDiagnosisList,
  checkLearned,

  // 问诊记录
  getDiagnosisHistory,
  getDiagnosisDetail,
  importSharedDiagnosis,

  // 站点配置
  getSiteConfig,
}
