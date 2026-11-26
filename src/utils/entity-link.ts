/**
 * 内容实体识别与关联
 *
 * 1. 把 AI 结果正文里出现的方剂名 / 穴位名识别出来，变成可点击的实体节点；
 * 2. 根据结果中的方剂、穴位，回溯本地医案库，给出相关医案；
 * 3. 从本地穴位数据生成"针刺 / 艾灸"操作说明，作为 AI 未给出操作时的兜底。
 *
 * 全部依赖打包进小程序的本地 JSON，不产生额外网络请求。
 */
import formulasData from '@/data/formulas.json'
import acupointsData from '@/data/acupoints.json'
import casesData from '@/data/cases-lite.json'
import type { InlineNode } from '@/utils/markdown'

export type EntityKind = 'formula' | 'acupoint'

interface EntityMeta {
  name: string
  kind: EntityKind
}

let cachedIndex: EntityMeta[] | null = null
let cachedRegex: RegExp | null = null

/** 穴位名 → 数据对象（含归经、主治、针刺灸法） */
let cachedPoints: Map<string, any> | null = null

/** 构建实体索引：方剂 + 穴位 */
function buildIndex(): EntityMeta[] {
  if (cachedIndex) return cachedIndex
  const list: EntityMeta[] = []
  try {
    for (const f of formulasData as any[]) {
      const name = String(f?.name || '').trim()
      if (name.length >= 2) list.push({ name, kind: 'formula' })
    }
    const meridians = (acupointsData as any)?.meridians || []
    for (const m of meridians) {
      for (const p of m?.points || []) {
        const name = String(p?.name || '').trim()
        if (name.length >= 2) list.push({ name, kind: 'acupoint' })
      }
    }
  } catch (e) {
    console.error('构建实体索引失败', e)
  }
  // 长名优先，避免"桂枝"抢先匹配"桂枝汤"
  list.sort((a, b) => b.name.length - a.name.length)
  cachedIndex = list
  return list
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRegex(): RegExp | null {
  if (cachedRegex) return cachedRegex
  const index = buildIndex()
  if (!index.length) return null
  const names = index.map(e => escapeReg(e.name))
  // 穴位常写作"太冲穴"，允许吞掉后缀"穴"
  cachedRegex = new RegExp(`(${names.join('|')})(穴)?`, 'g')
  return cachedRegex
}

function kindOf(name: string): EntityKind {
  const index = buildIndex()
  const hit = index.find(e => e.name === name)
  return hit ? hit.kind : 'acupoint'
}

/** 把纯文本切成 普通文本 / 实体 节点 */
export function splitEntities(text: string, maxLinks = 30): InlineNode[] {
  const src = String(text || '')
  if (!src) return []
  const re = buildRegex()
  if (!re) return [{ type: 'text', content: src }]
  re.lastIndex = 0
  const out: InlineNode[] = []
  let last = 0
  let count = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    if (count >= maxLinks) break
    const name = m[1]
    const withSuffix = m[1] + (m[2] || '')
    if (m.index > last) out.push({ type: 'text', content: src.slice(last, m.index) })
    out.push({ type: 'entity', kind: kindOf(name), content: withSuffix, name })
    last = m.index + withSuffix.length
    count += 1
    if (re.lastIndex <= m.index) re.lastIndex = m.index + 1
  }
  if (last < src.length) out.push({ type: 'text', content: src.slice(last) })
  return out.length ? out : [{ type: 'text', content: src }]
}

/** 从一段文字里挑出出现过的方剂 / 穴位（去重，按出现顺序） */
export function findMentions(text: string, limit = 12): Array<{ kind: EntityKind; name: string }> {
  const src = String(text || '')
  if (!src) return []
  const re = buildRegex()
  if (!re) return []
  re.lastIndex = 0
  const seen = new Set<string>()
  const out: Array<{ kind: EntityKind; name: string }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    const name = m[1]
    if (!seen.has(name)) {
      seen.add(name)
      out.push({ kind: kindOf(name), name })
      if (out.length >= limit) break
    }
    if (re.lastIndex <= m.index) re.lastIndex = m.index + 1
  }
  return out
}

/** 对已解析的行内节点做二次切分（只处理纯文本节点） */
export function linkifyInlineNodes(nodes: InlineNode[]): InlineNode[] {
  if (!Array.isArray(nodes) || !nodes.length) return nodes
  const out: InlineNode[] = []
  for (const node of nodes) {
    if (node && node.type === 'text') {
      out.push(...splitEntities(node.content))
    } else {
      out.push(node)
    }
  }
  return out
}

/** 穴位基础资料（归经 / 针刺 / 灸法），用于生成兜底操作说明 */
export function getAcupoint(name: string): any {
  if (!cachedPoints) {
    cachedPoints = new Map()
    const meridians = (acupointsData as any)?.meridians || []
    for (const m of meridians) {
      for (const p of m?.points || []) {
        if (p?.name) cachedPoints.set(String(p.name), { ...p, meridian: m.name })
      }
    }
  }
  return cachedPoints.get(String(name || ''))
}

function extractNeedle(text: string): string {
  const src = String(text || '')
  // 优先规范刺法；斜刺类容易混入医案叙述，只有在没有叙述词时才采用
  const strict = src.match(/(?:直刺|平刺|沿皮刺|透刺|点刺)[^。；;|\n]{0,26}/)
  if (strict) return strict[0].trim().replace(/[，,、；;]$/, '')
  const oblique = src.match(/(?:斜刺)[^。；;|\n]{0,20}/)
  if (oblique && !/留针|提针|捻转|痊愈/.test(oblique[0])) return oblique[0].trim().replace(/[，,、；;]$/, '')
  return ''
}

function extractMoxa(text: string): string {
  const m = String(text || '').match(/(?:艾炷灸|艾条灸|温针灸|雀啄灸)[^。；;|\n]{0,30}/)
  return m ? m[0].trim() : ''
}

/**
 * 用本地穴位数据生成操作说明（AI 未返回【穴位操作】时兜底）
 * 输出 Markdown，供 MarkdownView 渲染。
 */
export function buildAcupointMethods(names: string[]): string {
  const valid = (names || []).filter(Boolean)
  if (!valid.length) return ''
  const lines: string[] = []
  for (const name of valid) {
    const p = getAcupoint(name)
    if (!p) continue
    const needle = extractNeedle(p.contraindications)
    const moxa = extractMoxa(p.contraindications)
    if (!needle && !moxa) continue
    lines.push(`**${name}**（${p.meridian || ''}）`)
    if (needle) lines.push(`- 针刺：${needle}`)
    if (moxa) lines.push(`- 艾灸：${moxa}`)
    lines.push(`- 按摩：拇指指腹按揉 1~2 分钟，以局部酸胀为度`)
  }
  return lines.join('\n')
}

export interface RelatedCase {
  id: number | string
  disease: string
  meridian?: string
  outcome?: string
  summary?: string
  hits: string[]
}

/**
 * 根据方剂 / 穴位回溯相关医案：命中名称越多越靠前
 */
export function findRelatedCases(formulas: string[], acupoints: string[], limit = 3): RelatedCase[] {
  const keys = [...(formulas || []), ...(acupoints || [])].filter(k => k && String(k).length >= 2)
  if (!keys.length) return []
  const rows: RelatedCase[] = []
  try {
    for (const c of casesData as any[]) {
      const text = [c?.summary, c?.treatment, c?.disease].filter(Boolean).join(' ')
      if (!text) continue
      const hits = keys.filter(k => text.includes(k))
      if (!hits.length) continue
      rows.push({
        id: c.id,
        disease: c.disease || '医案',
        meridian: c.meridian,
        outcome: c.outcome,
        summary: c.summary,
        hits
      })
    }
  } catch (e) {
    console.error('检索相关医案失败', e)
  }
  rows.sort((a, b) => b.hits.length - a.hits.length)
  return rows.slice(0, limit)
}
