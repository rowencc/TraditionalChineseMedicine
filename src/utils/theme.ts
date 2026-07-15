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

// 应用 page 级别 class
function applyPageClass() {
  // 微信小程序不支持直接操作 page 元素 class
  // 通过 page-meta 组件在各页面实现
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
