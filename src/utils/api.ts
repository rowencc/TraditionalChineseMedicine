/**
 * 岐黄小识 - API 服务层
 * 处理小程序与服务器的通信
 */

const API_BASE = 'https://tcm.rowen.cc/index.php'

// 存储 Token
function getToken(): string | null {
  return uni.getStorageSync('token') || null
}

function setToken(token: string) {
  uni.setStorageSync('token', token)
}

function removeToken() {
  uni.removeStorageSync('token')
}

function getUser() {
  const user = uni.getStorageSync('user')
  return user ? JSON.parse(user) : null
}

function setUser(user: any) {
  uni.setStorageSync('user', JSON.stringify(user))
}

function clearUser() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
}

// 检查是否已登录
function isLoggedIn(): boolean {
  return !!getToken()
}

// 通用请求方法
async function request(module: string, action: string, params: Record<string, any> = {}, method: 'GET' | 'POST' = 'GET'): Promise<any> {
  const token = getToken()
  
  let url = `${API_BASE}?module=${module}&action=${action}`
  
  if (method === 'GET') {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url += `&${key}=${encodeURIComponent(params[key])}`
      }
    })
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data: method === 'POST' ? params : {},
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res: any) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error('请求失败'))
        }
      },
      fail: (err: any) => {
        reject(err)
      }
    })
  })
}

// 认证相关 API
export const authApi = {
  // 登录
  async login(username: string, password: string) {
    const res = await request('auth', 'login', { username, password }, 'POST')
    if (res.code === 1) {
      setToken(res.data.token)
      setUser(res.data.user)
    }
    return res
  },

  // 注册
  async register(username: string, password: string, email: string) {
    return await request('auth', 'register', { username, password, email }, 'POST')
  },

  // 获取用户信息
  async getProfile() {
    return await request('auth', 'profile')
  },

  // 修改密码
  async changePassword(oldPassword: string, newPassword: string) {
    return await request('auth', 'change_password', { old_password: oldPassword, new_password: newPassword }, 'POST')
  },

  // 退出登录
  logout() {
    clearUser()
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

// TCM 数据 API
export const tcmApi = {
  // 统计数据
  async getStats() {
    return await request('tcm', 'stats')
  },

  // 方剂相关
  async getFormulaList(page = 1, limit = 20, meridian = '', keyword = '') {
    return await request('tcm', 'formula_list', { page, limit, meridian, keyword })
  },

  async getFormulaDetail(id?: number, name?: string) {
    return await request('tcm', 'formula_detail', { id, name })
  },

  // 药物相关
  async getHerbList(page = 1, limit = 20, category = '', nature = '', keyword = '') {
    return await request('tcm', 'herb_list', { page, limit, category, nature, keyword })
  },

  async getHerbDetail(id?: number, name?: string) {
    return await request('tcm', 'herb_detail', { id, name })
  },

  // 穴位相关
  async getAcupointList(page = 1, limit = 50, meridian = '', keyword = '') {
    return await request('tcm', 'acupoint_list', { page, limit, meridian, keyword })
  },

  async getAcupointDetail(id?: number, name?: string) {
    return await request('tcm', 'acupoint_detail', { id, name })
  },

  // 医案相关
  async getCaseList(page = 1, limit = 20, category = '', keyword = '') {
    return await request('tcm', 'case_list', { page, limit, category, keyword })
  },

  async getCaseDetail(id: number) {
    return await request('tcm', 'case_detail', { id })
  },

  // AI 问诊
  async aiDiagnosis(symptoms: string) {
    return await request('tcm', 'ai_diagnosis', { symptoms }, 'POST')
  }
}

// 导出
export default {
  auth: authApi,
  tcm: tcmApi,
  getToken,
  isLoggedIn,
  getUser
}
