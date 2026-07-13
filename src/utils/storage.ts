// 本地存储工具

const STORAGE_PREFIX = 'nihaixia_'

export function setStorage(key: string, value: any): void {
  try {
    uni.setStorageSync(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (e) {
    console.error('Storage set error:', e)
  }
}

export function getStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const value = uni.getStorageSync(`${STORAGE_PREFIX}${key}`)
    return value ? JSON.parse(value) : defaultValue
  } catch (e) {
    console.error('Storage get error:', e)
    return defaultValue
  }
}

export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(`${STORAGE_PREFIX}${key}`)
  } catch (e) {
    console.error('Storage remove error:', e)
  }
}

// 搜索历史
export function getSearchHistory(): string[] {
  return getStorage<string[]>('search_history', []) || []
}

export function addSearchHistory(query: string): void {
  const history = getSearchHistory()
  const filtered = history.filter(item => item !== query)
  filtered.unshift(query)
  setStorage('search_history', filtered.slice(0, 20))
}

export function clearSearchHistory(): void {
  setStorage('search_history', [])
}
