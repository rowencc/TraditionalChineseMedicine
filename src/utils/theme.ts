/**
 * 岐黄小识 - 主题管理
 * 亮色模式 (light) / 暗色模式 (dark)
 */
import { ref, computed } from 'vue'

const THEME_KEY = 'theme'
export const isDark = ref(false)

// 初始化主题
export function initTheme() {
  const saved = uni.getStorageSync(THEME_KEY)
  isDark.value = saved === 'dark'
  applyPageClass()
}

// 切换主题
export function toggleTheme() {
  isDark.value = !isDark.value
  uni.setStorageSync(THEME_KEY, isDark.value ? 'dark' : 'light')
  applyPageClass()
}

// 设置主题
export function setTheme(dark: boolean) {
  isDark.value = dark
  uni.setStorageSync(THEME_KEY, dark ? 'dark' : 'light')
  applyPageClass()
}

// 应用 page 级别背景（小程序无法直接切换 page 的 class）
function applyPageClass() {
  const dark = isDark.value
  // #ifdef MP-WEIXIN
  try {
    uni.setBackgroundColor({
      backgroundColor: dark ? '#14110E' : '#F5F0E8',
      backgroundColorTop: dark ? '#14110E' : '#F5F0E8',
      backgroundColorBottom: dark ? '#14110E' : '#F5F0E8'
    })
    // 状态栏文字：暗色下用白字，亮色下用黑字
    uni.setNavigationBarColor({
      frontColor: dark ? '#ffffff' : '#000000',
      backgroundColor: dark ? '#1D1916' : '#8B2500'
    })
  } catch (e) {
    // 非小程序环境忽略
  }
  // #endif
}

// 获取当前主题状态
export function useTheme() {
  return {
    isDark: computed(() => isDark.value),
    themeClass: computed(() => isDark.value ? 'is-dark' : ''),
    toggleTheme,
    setTheme
  }
}

export default { initTheme, toggleTheme, setTheme, useTheme, isDark }
