/**
 * 本地相关性搜索
 *
 * 背景：后端 tcm 模块的 formula_list / herb_list / acupoint_list / case_list
 * 接口会忽略 keyword 参数（只支持 meridian / nature / category 过滤），
 * 导致搜索页对任何关键词都原样返回每类前 50 条数据。
 * 在后端支持关键词过滤之前，关键词搜索全部改为对本地 JSON 数据做相关性匹配。
 *
 * 数据与后端同源（数量一致：方剂 92 / 药物 349 / 穴位 309 / 医案 188）。
 *
 * 匹配策略（两阶段）：
 * 1. 精确匹配：整词命中字段，或条目名称被关键词包含（如搜"桂枝汤怎么做"命中桂枝汤）
 * 2. 相关匹配：该分类精确匹配为 0 条时，退化为二元组（bigram）切分匹配，
 *    使"不孕不育"能命中含"不孕"的医案/穴位/药物，而不是返回一堆无关数据
 * 结果按字段权重排序（名称 > 主治/功效 > 组成/用法 > 正文），每类最多返回 100 条。
 *
 * 注意：cases-lite.json 由 cases.json 生成（去掉 content 以控制小程序包体积，
 * id 与后端自增 id 对齐），重新执行 `npm run convert` 后会同步重建。
 */
import formulasData from '@/data/formulas.json'
import herbsData from '@/data/herbs.json'
import acupointsData from '@/data/acupoints.json'
import casesData from '@/data/cases-lite.json'

export interface SearchResults {
  formulas: any[]
  herbs: any[]
  acupoints: any[]
  cases: any[]
}

/** 每个分类最多返回的结果数 */
const MAX_RESULTS = 100

/** 药物表中混入的非药物条目（如"乳癌形成机制："等笔记类数据） */
const NON_HERB_PATTERN = /机制|因素|形成|高危|症状|预防|原因|治疗方式|诊断/

function isRealHerb(item: any): boolean {
  const name = String(item?.name || '')
  return !!name && !name.endsWith('：') && !NON_HERB_PATTERN.test(name)
}

/** 把任意字段值（含数组/嵌套对象）拍平成可匹配的文本 */
function toText(v: any): string {
  if (v == null) return ''
  if (Array.isArray(v)) return v.map(toText).join(' ')
  if (typeof v === 'object') return Object.values(v).map(toText).join(' ')
  return String(v)
}

interface WeightedField {
  text: string
  w: number
}

interface Indexed {
  doc: any
  fields: WeightedField[]
}

/** 各分类参与匹配的字段及权重（名称类字段权重最高） */
const FORMULA_SPEC: Record<string, number> = {
  name: 100,
  symptoms: 40,
  efficacy: 40,
  usage: 20,
  composition: 20,
  meridian: 20,
  source: 10,
  dosage: 10,
  contraindications: 10,
  modifications: 10,
  classicalQuotes: 10,
  compositionAnalysis: 10
}

const HERB_SPEC: Record<string, number> = {
  name: 100,
  alias: 90,
  effect: 40,
  usage: 20,
  nature: 20,
  meridian: 20,
  category: 20,
  taste: 10,
  caution: 10,
  dosage: 10,
  source: 10
}

const ACUPOINT_SPEC: Record<string, number> = {
  name: 100,
  indication: 40,
  function: 40,
  position: 20,
  meridian_name: 20,
  classification: 20,
  combination: 10,
  classical: 10,
  combinationEffect: 10,
  contraindications: 10
}

const CASE_SPEC: Record<string, number> = {
  disease: 80,
  meridian: 20,
  category: 15,
  treatment: 15,
  outcome: 10,
  summary: 10
}

function buildFields(item: any, spec: Record<string, number>): WeightedField[] {
  const fields: WeightedField[] = []
  for (const key of Object.keys(spec)) {
    const text = toText(item[key])
    if (text) fields.push({ text, w: spec[key] })
  }
  return fields
}

// ---------- 懒加载索引（首次搜索时构建一次） ----------

let formulaIndex: Indexed[] | null = null
let herbIndex: Indexed[] | null = null
let acupointIndex: Indexed[] | null = null
let caseIndex: Indexed[] | null = null

function getFormulaIndex(): Indexed[] {
  if (!formulaIndex) {
    formulaIndex = (formulasData as any[]).map((f) => ({ doc: f, fields: buildFields(f, FORMULA_SPEC) }))
  }
  return formulaIndex
}

function getHerbIndex(): Indexed[] {
  if (!herbIndex) {
    herbIndex = (herbsData as any[])
      .filter(isRealHerb)
      .map((h) => ({ doc: h, fields: buildFields(h, HERB_SPEC) }))
  }
  return herbIndex
}

function getAcupointIndex(): Indexed[] {
  if (!acupointIndex) {
    acupointIndex = []
    for (const meridian of (acupointsData as any).meridians) {
      for (const point of meridian.points) {
        const doc = { ...point, meridian_name: meridian.name }
        acupointIndex.push({ doc, fields: buildFields(doc, ACUPOINT_SPEC) })
      }
    }
  }
  return acupointIndex
}

function getCaseIndex(): Indexed[] {
  if (!caseIndex) {
    caseIndex = (casesData as any[]).map((c) => ({ doc: c, fields: buildFields(c, CASE_SPEC) }))
  }
  return caseIndex
}

// ---------- 打分与筛选 ----------

/** 精确匹配得分：关键词完整命中字段 */
function exactScore(fields: WeightedField[], kw: string): number {
  let s = 0
  for (const f of fields) {
    if (f.text.includes(kw)) s += f.w
  }
  return s
}

/** 相关匹配得分：按二元组切分后命中字段 */
function partialScore(fields: WeightedField[], bigrams: string[]): number {
  let s = 0
  for (const f of fields) {
    for (const bg of bigrams) {
      if (f.text.includes(bg)) s += f.w
    }
  }
  return s
}

/** 条目名称被关键词包含（如搜"桂枝汤怎么做"命中"桂枝汤"），名称至少 3 字避免过宽 */
function nameBonus(doc: any, kw: string): number {
  const name = String(doc.name || doc.disease || '')
  if (name.length >= 3 && kw.includes(name)) return 80
  return 0
}

/** 关键词 >=3 字时按二元组切分（"不孕不育" -> 不孕/孕不/不育），只保留纯中文二元组，
 *  避免英文/数字子串（如 "st"、"99"）在文本中产生大量误匹配 */
function bigramsOf(kw: string): string[] {
  if (kw.length < 3) return []
  const set = new Set<string>()
  for (let i = 0; i < kw.length - 1; i++) {
    const bg = kw.slice(i, i + 2)
    if (/^[一-龥]{2}$/.test(bg)) set.add(bg)
  }
  return Array.from(set)
}

/**
 * 选择一个分类的结果：
 * 先做精确匹配；该分类一条精确命中都没有时，才退化为二元组相关匹配。
 * 按得分降序，最多 MAX_RESULTS 条。
 */
function select(
  index: Indexed[],
  kw: string,
  bigrams: string[],
  filter?: (doc: any) => boolean
): any[] {
  const pool: Array<{ doc: any; s: number }> = []

  for (const it of index) {
    if (filter && !filter(it.doc)) continue
    const s = exactScore(it.fields, kw) + nameBonus(it.doc, kw)
    if (s > 0) pool.push({ doc: it.doc, s })
  }

  if (pool.length === 0 && bigrams.length > 0) {
    for (const it of index) {
      if (filter && !filter(it.doc)) continue
      const s = partialScore(it.fields, bigrams)
      if (s > 0) pool.push({ doc: it.doc, s })
    }
  }

  pool.sort((a, b) => b.s - a.s)
  return pool.slice(0, MAX_RESULTS).map((x) => x.doc)
}

// ---------- 对外接口 ----------

export function searchFormulas(kw: string, meridian = ''): any[] {
  const q = kw.trim()
  if (!q) return []
  return select(
    getFormulaIndex(),
    q,
    bigramsOf(q),
    meridian ? (d) => String(d.meridian || '') === meridian : undefined
  )
}

export function searchHerbs(kw: string, nature = ''): any[] {
  const q = kw.trim()
  if (!q) return []
  return select(
    getHerbIndex(),
    q,
    bigramsOf(q),
    nature ? (d) => String(d.nature || '') === nature : undefined
  )
}

export function searchAcupoints(kw: string): any[] {
  const q = kw.trim()
  if (!q) return []
  return select(getAcupointIndex(), q, bigramsOf(q))
}

export function searchCases(kw: string, category = ''): any[] {
  const q = kw.trim()
  if (!q) return []
  return select(
    getCaseIndex(),
    q,
    bigramsOf(q),
    category ? (d) => String(d.category || '') === category : undefined
  )
}

/** 一次搜索全部四个分类（搜索页用） */
export function searchAll(kw: string): SearchResults {
  return {
    formulas: searchFormulas(kw),
    herbs: searchHerbs(kw),
    acupoints: searchAcupoints(kw),
    cases: searchCases(kw)
  }
}
