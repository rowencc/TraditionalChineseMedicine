// 搜索工具函数

export interface SearchResult<T> {
  item: T
  score: number
}

// 简单的模糊搜索
export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): SearchResult<T>[] {
  if (!query.trim()) return items.map(item => ({ item, score: 1 }))

  const lowerQuery = query.toLowerCase()
  const results: SearchResult<T>[] = []

  for (const item of items) {
    let score = 0
    for (const key of keys) {
      const value = String(item[key] || '').toLowerCase()
      if (value === lowerQuery) {
        score = 100
        break
      }
      if (value.includes(lowerQuery)) {
        score = Math.max(score, 80)
      }
      // 分词匹配
      const words = lowerQuery.split(/\s+/)
      for (const word of words) {
        if (word && value.includes(word)) {
          score = Math.max(score, 60)
        }
      }
    }
    if (score > 0) {
      results.push({ item, score })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

// 关键词高亮
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
