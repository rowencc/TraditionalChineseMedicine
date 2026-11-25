/**
 * 平台配置 - 运行时检测平台并返回不同配置
 */

let cachedPlatform: string | null = null

export function getPlatform(): string {
  if (cachedPlatform) return cachedPlatform
  // #ifdef H5
  cachedPlatform = 'h5'
  // #endif
  // #ifdef MP-WEIXIN
  cachedPlatform = 'mp-weixin'
  // #endif
  // #ifdef MP-ALIPAY
  cachedPlatform = 'mp-alipay'
  // #endif
  // #ifdef APP-PLUS
  cachedPlatform = 'app'
  // #endif
  // eslint-disable-next-line no-unreachable
  if (!cachedPlatform) {
    // 运行时兜底检测
    try {
      // @ts-ignore
      if (typeof wx !== 'undefined' && typeof wx.getDeviceInfo === 'function') {
        cachedPlatform = 'mp-weixin'
      } else if (typeof window !== 'undefined') {
        cachedPlatform = 'h5'
      }
    } catch (e) {
      cachedPlatform = 'unknown'
    }
  }
  return cachedPlatform || 'unknown'
}

// 应用名称：优先从服务器配置读取 app_name，其次使用默认值
export function getAppName(): string {
  // 优先从缓存的服务器配置中读取
  try {
    const cached = uni.getStorageSync('site_config')
    if (cached?.app_name) return cached.app_name
  } catch {}
  // 默认值
  return '岐闻小识'
}

// 应用副标题
export function getAppSubtitle(): string {
  return '经方中医学习工具'
}

export function getAppDesc(): string {
  return '基于倪海厦中医知识体系'
}

// 从 site_config 获取导航/标签名称
export function getTabName(key: 'home' | 'diagnosis' | 'profile'): string {
  const keyMap = {
    home: 'tab_home',
    diagnosis: 'tab_diagnosis',
    profile: 'tab_profile'
  }
  try {
    const cached = uni.getStorageSync('site_config')
    if (cached?.[keyMap[key]]) return cached[keyMap[key]]
  } catch {}
  // 默认值
  const defaults = { home: '首页', diagnosis: '问一问', profile: '我的' }
  return defaults[key]
}

// 获取导航卡片名称
export function getNavName(key: 'formulas' | 'herbs' | 'cases' | 'diagnosis' | 'acupuncture' | 'about'): string {
  const keyMap = {
    formulas: 'nav_formulas',
    herbs: 'nav_herbs',
    cases: 'nav_cases',
    diagnosis: 'nav_diagnosis',
    acupuncture: 'nav_acupuncture',
    about: 'nav_about'
  }
  try {
    const cached = uni.getStorageSync('site_config')
    if (cached?.[keyMap[key]]) return cached[keyMap[key]]
  } catch {}
  // 默认值
  const defaults = {
    formulas: '识方剂',
    herbs: '识药',
    cases: '识医案',
    diagnosis: '识六经',
    acupuncture: '识穴',
    about: '关于'
  }
  return defaults[key]
}
