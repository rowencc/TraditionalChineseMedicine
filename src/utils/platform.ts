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
      if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
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
