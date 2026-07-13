/**
 * 从 modules/03_yian.md 提取完整医案内容
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SOURCE_FILE = join(__dirname, '../temp_nihaixia/modules/03_yian.md')
const OUTPUT_FILE = join(__dirname, '../src/data/cases.json')

interface CaseItem {
  id: string
  date: string
  disease: string
  patient?: string
  meridian?: string
  prescription?: string
  treatment?: string
  feedback?: string
  outcome?: string
  summary: string
  category: string
  content: string
}

const categoryMap: Record<string, string> = {
  '乳癌': 'cancer', '肝癌': 'cancer', '肺癌': 'cancer', '脑瘤': 'cancer',
  '血癌': 'cancer', '淋巴癌': 'cancer', '大肠癌': 'cancer', '胰脏癌': 'cancer',
  '骨癌': 'cancer', '舌癌': 'cancer', '摄护腺癌': 'cancer', '皮肤癌': 'cancer',
  '心脏病': 'cardiovascular', '高血压': 'cardiovascular', '中风': 'cardiovascular',
  '动脉阻塞': 'cardiovascular', '心律不齐': 'cardiovascular',
  '糖尿病': 'metabolic', '肾衰竭': 'metabolic', '尿毒症': 'metabolic',
  '肝硬化': 'metabolic', '痛风': 'metabolic',
  '类风湿': 'autoimmune', '红斑狼疮': 'autoimmune', '硬皮症': 'autoimmune',
  '癫痫': 'neurological', '帕金森': 'neurological', '忧郁': 'neurological'
}

function getDiseaseCategory(disease: string): string {
  for (const [key, value] of Object.entries(categoryMap)) {
    if (disease.includes(key)) return value
  }
  return 'other'
}

// 常见方剂
const KNOWN_FORMULAS = [
  '桂枝汤', '麻黄汤', '小青龙汤', '大青龙汤', '桂枝加葛根汤',
  '白虎汤', '承气汤', '大承气汤', '小承气汤', '调胃承气汤',
  '小柴胡汤', '大柴胡汤', '柴胡桂枝干姜汤',
  '理中汤', '理中丸', '四逆汤', '真武汤', '乌梅丸',
  '五苓散', '猪苓汤', '十枣汤', '甘遂半夏汤',
  '炙甘草汤', '小建中汤', '黄芪建中汤',
  '麻杏石甘汤', '葛根黄芩黄连汤', '茵陈蒿汤',
  '吴茱萸汤', '黄连阿胶汤', '麻黄附子细辛汤',
  '四逆散', '当归四逆汤', '当归芍药散',
  '肾气丸', '六味地黄丸', '桂附八味丸',
  '麻子仁丸', '桃核承气汤', '抵当汤',
  '大陷胸汤', '小陷胸汤', '泻心汤',
  '半夏泻心汤', '生姜泻心汤', '甘草泻心汤',
  '旋覆代赭汤', '橘皮竹茹汤',
  '乌头桂枝汤', '薏苡附子败酱散', '排脓散', '排脓汤',
  '防己黄芪汤', '防己茯苓汤', '越婢汤',
  '苓桂术甘汤', '苓桂甘枣汤',
  '麦门冬汤', '百合地黄汤', '酸枣仁汤',
  '温经汤', '胶艾汤', '桂枝茯苓丸',
  '大黄牡丹汤', '射干麻黄汤', '厚朴麻黄汤',
  '枳实薤白桂枝汤', '瓜蒌薤白半夏汤',
  '生附子', '炮附子', '生硫磺'
]

function extractTreatment(content: string): string | undefined {
  const treatments: string[] = []

  // 匹配方剂名
  for (const formula of KNOWN_FORMULAS) {
    if (content.includes(formula)) {
      treatments.push(formula)
    }
  }

  const unique = [...new Set(treatments)]
  return unique.length > 0 ? unique.slice(0, 8).join('、') : undefined
}

function extractOutcome(content: string): string | undefined {
  if (/已经痊愈|完全恢复|恢复正常|病好了|治好了/.test(content)) return '痊愈'
  if (/好转|改善|进步|减轻|好转中|恢复中|有效|见效|肿瘤缩小/.test(content)) return '好转'
  return undefined
}

function extractPatient(content: string): string | undefined {
  const patterns = [
    /女[，,]\s*(\d+)\s*岁/,
    /男[，,]\s*(\d+)\s*岁/,
    /(\d+)\s*岁[，,]\s*女/,
    /(\d+)\s*岁[，,]\s*男/
  ]

  for (const p of patterns) {
    const match = content.match(p)
    if (match) {
      const age = match[1]
      const gender = content.includes('女') ? '女' : '男'
      return `${gender}，${age}岁`
    }
  }
  return undefined
}

function main() {
  console.log('=== 从 modules/03_yian.md 提取完整医案 ===\n')

  const sourceContent = readFileSync(SOURCE_FILE, 'utf-8')
  const cases: CaseItem[] = []

  // 匹配医案格式：### ID 标题
  const caseRegex = /###\s*(\d{6})[^\n]*\n([\s\S]*?)(?=###\s*\d{6}|$)/g
  let match

  while ((match = caseRegex.exec(sourceContent)) !== null) {
    const caseId = match[1]
    const caseBlock = match[2]

    // 提取各字段
    const dateMatch = caseBlock.match(/\*\*日期\*\*[：:]\s*(.+)/)
    const date = dateMatch ? dateMatch[1].trim() : ''

    const diseaseMatch = caseBlock.match(/\*\*疾病\*\*[：:]\s*(.+)/)
    const disease = diseaseMatch ? diseaseMatch[1].trim() : ''

    const meridianMatch = caseBlock.match(/\*\*六经\*\*[：:]\s*(.+)/)
    const meridian = meridianMatch ? meridianMatch[1].trim() : undefined

    const prescriptionMatch = caseBlock.match(/\*\*方剂\*\*[：:]\s*(.+)/)
    const prescription = prescriptionMatch ? prescriptionMatch[1].trim() : undefined

    const patientMatch = caseBlock.match(/\*\*患者\*\*[：:]\s*(.+)/)
    const patient = patientMatch ? patientMatch[1].trim() : extractPatient(caseBlock)

    // 提取医案内容 - 完整提取
    const contentMatch = caseBlock.match(/\*\*医案内容\*\*[：:]\s*\n\n([\s\S]*?)(?=\n>\s*来源[：:]|$)/)
    let mainContent = contentMatch ? contentMatch[1].trim() : ''

    // 清理内容
    mainContent = mainContent
      .replace(/^>\s*来源[：:].*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!mainContent || mainContent.length < 50) continue

    // 提取治疗和疗效
    const treatment = extractTreatment(mainContent) || prescription
    const outcome = extractOutcome(mainContent)

    // 生成摘要（前200字）
    const plainContent = mainContent.replace(/\n/g, ' ')
    const summary = plainContent.substring(0, 200) + (plainContent.length > 200 ? '...' : '')

    cases.push({
      id: caseId,
      date,
      disease,
      patient,
      meridian: meridian || undefined,
      prescription,
      treatment,
      outcome,
      summary,
      category: getDiseaseCategory(disease),
      content: mainContent  // 完整内容
    })
  }

  // 按日期排序
  cases.sort((a, b) => a.date.localeCompare(b.date))

  // 统计
  const withTreatment = cases.filter(c => c.treatment).length
  const withOutcome = cases.filter(c => c.outcome).length
  const avgContentLength = Math.round(cases.reduce((sum, c) => sum + c.content.length, 0) / cases.length)

  console.log(`提取完成: ${cases.length} 个医案`)
  console.log(`有治疗方案: ${withTreatment} (${(withTreatment/cases.length*100).toFixed(1)}%)`)
  console.log(`有疗效记录: ${withOutcome} (${(withOutcome/cases.length*100).toFixed(1)}%)`)
  console.log(`平均内容长度: ${avgContentLength} 字符`)

  writeFileSync(OUTPUT_FILE, JSON.stringify(cases, null, 2), 'utf-8')
  console.log(`\n输出到: ${OUTPUT_FILE}`)

  // 显示前3个样本
  console.log('\n样本数据:')
  cases.slice(0, 3).forEach(c => {
    console.log(`  [${c.id}] ${c.disease} - 内容长度: ${c.content.length} 字符`)
  })
}

main()
