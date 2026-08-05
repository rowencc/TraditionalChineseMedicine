import { getAppName } from './platform'

/**
 * 获取当前页面的分享信息（供 Options API onShareAppMessage / onShareTimeline 使用）
 * 通过 getCurrentPages() 读取页面 URL 参数来生成分享标题和路径
 */
export function getCurrentPageShareInfo(suffix?: string) {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  const options = page?.options || {}
  const route = page?.route || ''
  const fullPath = page?.$page?.fullPath || ''

  // 从 URL 参数中提取标题主体
  let title = ''
  if (options.name) {
    title = decodeURIComponent(options.name)
  } else if (options.point) {
    title = decodeURIComponent(options.point) + '穴'
  } else if (options.id) {
    title = '医案详情'
  }

  // 追加后缀
  if (suffix) {
    title = title ? `${title} - ${suffix}` : suffix
  }

  if (!title) {
    title = getAppName()
  }

  return {
    title,
    path: fullPath || `/${route}`
  }
}
