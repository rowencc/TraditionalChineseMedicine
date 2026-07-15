/**
 * 岐黄小识 - API 服务层
 */

const API_BASE = 'https://tcm.rowen.cc/index.php'

// Token 管理
function getToken(): string | null {
  return uni.getStorageSync('token') || null
}

function setToken(token: string) {
  uni.setStorageSync('token', token)
}

function clearToken() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
}

function isLoggedIn(): boolean {
  return !!getToken()
}

function getUser() {
  const user = uni.getStorageSync('user')
  return user ? JSON.parse(user) : null
}

function setUser(user: any) {
  uni.setStorageSync('user', JSON.stringify(user))
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

// 认证 API
export function login(username: string, password: string) {
  return request('auth', 'login', { username, password }, 'POST')
}

export function register(username: string, password: string, email: string) {
  return request('auth', 'register', { username, password, email }, 'POST')
}

export function getProfile() {
  return request('auth', 'profile')
}

export function changePassword(oldPassword: string, newPassword: string) {
  return request('auth', 'change_password', { old_password: oldPassword, new_password: newPassword }, 'POST')
}

export function logout() {
  clearToken()
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

// 导出
export default {
  login,
  register,
  getProfile,
  changePassword,
  logout,
  isLoggedIn,
  getUser,
  setUser,
  getStats,
  getFormulaList,
  getFormulaDetail,
  getHerbList,
  getHerbDetail,
  getAcupointList,
  getAcupointDetail,
  getCaseList,
  getCaseDetail
}
