/**
 * 从源数据提取完整的医案数据
 * 包括治疗方案、患者反馈、疗效等
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const CASES_DIR = join(__dirname, '../temp_nihaixia/cases')
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

// 疾病分类映射
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

// 从内容中提取治疗信息
function extractTreatment(content: string): string | undefined {
  const treatmentPatterns = [
    /使用[了]?([\u4e00-\u9fa5]+汤[\u4e00-\u9fa5]*)/g,
    /处方[：:]([\u4e00-\u9fa5，、]+)/g,
    /开[了]?([\u4e00-\u9fa5]+方)/g,
    /给予([\u4e00-\u9fa5]+汤)/g
  ]

  const treatments: string[] = []
  for (const pattern of treatmentPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[1].length < 20) {
        treatments.push(match[1])
      }
    }
  }
  return treatments.length > 0 ? treatments.join('、') : undefined
}

// 从内容中提取患者反馈
function extractFeedback(content: string): string | undefined {
  const feedbackPatterns = [
    /自述[：:](.{10,50})[。，]/g,
    /病人[说讲答][：:](.{10,50})[。，]/g,
    /她[他]说[：:](.{10,50})[。，]/g,
    /复诊时[：:](.{10,50})[。，]/g
  ]

  const feedbacks: string[] = []
  for (const pattern of feedbackPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[1].length > 10) {
        feedbacks.push(match[1].trim())
      }
    }
  }
  return feedbacks.length > 0 ? feedbacks.slice(0, 2).join('；') : undefined
}

// 从内容中提取疗效
function extractOutcome(content: string): string | undefined {
  const outcomePatterns = [
    /好转/g,
    /痊愈/g,
    /恢复/g,
    /症状消除/g,
    /明显改善/g,
    /肿瘤缩小/g,
    /精神好/g
  ]

  for (const pattern of outcomePatterns) {
    if (pattern.test(content)) {
      if (/痊愈|恢复|症状消除/.test(content)) return '痊愈'
      if (/好转|明显改善|肿瘤缩小/.test(content)) return '好转'
    }
  }
  return undefined
}

// 解析单个医案文件
function parseCaseFile(filePath: string, category: string): CaseItem[] {
  const content = readFileSync(filePath, 'utf-8')
  const cases: CaseItem[] = []

  // 匹配医案格式
  const caseRegex = /###\s*(\d+)\.\s*(.+?)\n([\s\S]*?)(?=###\s*\d+\.|$)/g
  let match

  while ((match = caseRegex.exec(content)) !== null) {
    const caseId = match[1]
    const caseTitle = match[2].trim()
    const caseContent = match[3].trim()

    // 提取日期
    const dateMatch = caseContent.match(/\*\*日期\*\*[：:](.+)/)
    const date = dateMatch ? dateMatch[1].trim() : ''

    // 提取疾病
    const diseaseMatch = caseContent.match(/\*\*疾病\*\*[：:](.+)/)
    const disease = diseaseMatch ? diseaseMatch[1].trim() : caseTitle

    // 提取六经
    const meridianMatch = caseContent.match(/\*\*六经\*\*[：:](.+)/)
    const meridian = meridianMatch ? meridianMatch[1].trim() : undefined

    // 提取方剂
    const prescriptionMatch = caseContent.match(/\*\*方剂\*\*[：:](.+)/)
    const prescription = prescriptionMatch ? prescriptionMatch[1].trim() : undefined

    // 提取医案内容
    const contentMatch = caseContent.match(/\*\*医案内容\*\*[：:]\s*\n([\s\S]*?)(?=来源[：:]|$)/)
    const mainContent = contentMatch ? contentMatch[1].trim() : caseContent

    // 提取患者信息
    const patientMatch = caseContent.match(/\*\*患者\*\*[：:](.+)/)
    const patient = patientMatch ? patientMatch[1].trim() : undefined

    // 从内容中提取治疗、反馈、疗效
    const treatment = extractTreatment(mainContent) || prescription
    const feedback = extractFeedback(mainContent)
    const outcome = extractOutcome(mainContent)

    // 生成摘要（取前100字）
    const summary = mainContent.replace(/\n/g, ' ').substring(0, 100) + '...'

    cases.push({
      id: caseId,
      date,
      disease,
      patient,
      meridian: meridian || undefined,
      prescription,
      treatment,
      feedback,
      outcome,
      summary,
      category: getDiseaseCategory(disease),
      content: mainContent
    })
  }

  return cases
}

// 主函数
function main() {
  console.log('=== 提取完整医案数据 ===\n')

  const allCases: CaseItem[] = []

  // 处理所有分类文件
  const files = readdirSync(CASES_DIR).filter(f => f.endsWith('.md'))
  for (const file of files) {
    const filePath = join(CASES_DIR, file)
    const category = file.replace('.md', '').replace(/^\d+_/, '')
    console.log(`处理: ${file}`)
    const cases = parseCaseFile(filePath, category)
    allCases.push(...cases)
    console.log(`  提取 ${cases.length} 个医案`)
  }

  // 按日期排序
  allCases.sort((a, b) => a.date.localeCompare(b.date))

  // 写入输出文件
  writeFileSync(OUTPUT_FILE, JSON.stringify(allCases, null, 2), 'utf-8')
  console.log(`\n=== 完成 ===`)
  console.log(`共提取 ${allCases.length} 个医案`)
  console.log(`输出到: ${OUTPUT_FILE}`)

  // 统计
  const stats = {
    total: allCases.length,
    withTreatment: allCases.filter(c => c.treatment).length,
    withFeedback: allCases.filter(c => c.feedback).length,
    withOutcome: allCases.filter(c => c.outcome).length,
    byCategory: {} as Record<string, number>
  }

  for (const c of allCases) {
    stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1
  }

  console.log('\n统计:')
  console.log(`  有治疗方案: ${stats.withTreatment}`)
  console.log(`  有患者反馈: ${stats.withFeedback}`)
  console.log(`  有疗效记录: ${stats.withOutcome}`)
  console.log('  分类统计:', stats.byCategory)
}

main()
