/**
 * 岐黄小识 - API 服务层
 * 支持微信登录和学习记录
 */

const API_BASE = 'https://tcm.rowen.cc/index.php'

// Token 和用户管理
function getToken(): string | null {
  return uni.getStorageSync('token') || null
}

function isLoggedIn(): boolean {
  return !!getToken()
}

function getUser() {
  try {
    const user = uni.getStorageSync('user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

// 保存登录信息（token + user）
function saveAuth(token: string, user: any) {
  uni.setStorageSync('token', token)
  uni.setStorageSync('user', JSON.stringify(user))
}

// 清除登录信息
function clearAuth() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
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
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res: any) => resolve(res.data),
      fail: (err: any) => reject(err)
    })
  })
}

// 微信登录（自动保存token和用户信息）
export function wxLogin(code: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await request('auth', 'wx_login', { code }, 'POST')
      if (res.code === 1 && res.data) {
        saveAuth(res.data.token, res.data.user)
      }
      resolve(res)
    } catch (e) {
      reject(e)
    }
  })
}

// 密码登录（自动保存token和用户信息）
export function login(username: string, password: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await request('auth', 'login', { username, password }, 'POST')
      if (res.code === 1 && res.data) {
        saveAuth(res.data.token, res.data.user)
      }
      resolve(res)
    } catch (e) {
      reject(e)
    }
  })
}

// 注册
export function register(username: string, password: string, email: string) {
  return request('auth', 'register', { username, password, email }, 'POST')
}

// 获取用户信息
export function getProfile() {
  return request('auth', 'profile')
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

  // 认证
  wxLogin,
  login,
  register,
  getProfile,
  changePassword,
  logout,
  isLoggedIn,
  getUser,
  saveAuth,

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

  // 站点配置
  getSiteConfig,
}
