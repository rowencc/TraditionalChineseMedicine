/**
 * 改进的医案数据提取脚本
 * 更完整地提取治疗方案、方剂、疗效
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

// 常见方剂列表
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
  '旋覆代赭汤', '橘皮竹茹汤', '干姜黄芩黄连人参汤',
  '乌头桂枝汤', '薏苡附子败酱散', '排脓散', '排脓汤',
  '防己黄芪汤', '防己茯苓汤', '越婢汤',
  '苓桂术甘汤', '苓桂甘枣汤', '苓甘五味姜辛汤',
  '麦门冬汤', '百合地黄汤', '酸枣仁汤',
  '温经汤', '胶艾汤', '桂枝茯苓丸',
  '大黄牡丹汤', '薏苡附子败酱散',
  '木防己汤', '葶苈大枣泻肺汤',
  '射干麻黄汤', '厚朴麻黄汤', '小半夏汤',
  '枳实薤白桂枝汤', '瓜蒌薤白半夏汤',
  '天雄散', '薯蓣丸', '酸枣仁汤',
  '奔豚汤', '桂枝加桂汤',
  '汉唐77号', '汉唐系列'
]

// 提取治疗方案
function extractTreatment(content: string, explicitPrescription?: string): string | undefined {
  // 如果有明确的方剂字段，优先使用
  if (explicitPrescription) {
    return explicitPrescription
  }

  const treatments: string[] = []

  // 1. 从"使用"、"给予"等后面提取
  const usePatterns = [
    /使用[了]?([\u4e00-\u9fa5]+汤[\u4e00-\u9fa5]*)/g,
    /给予([\u4e00-\u9fa5]+汤)/g,
    /开[了]?([\u4e00-\u9fa5]+方)/g,
    /服用([\u4e00-\u9fa5]+汤)/g
  ]

  for (const pattern of usePatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[1].length >= 3 && match[1].length < 15) {
        treatments.push(match[1])
      }
    }
  }

  // 2. 匹配已知方剂名
  for (const formula of KNOWN_FORMULAS) {
    if (content.includes(formula) && !treatments.includes(formula)) {
      treatments.push(formula)
    }
  }

  // 去重并限制数量
  const unique = [...new Set(treatments)]
  return unique.length > 0 ? unique.slice(0, 5).join('、') : undefined
}

// 提取疗效
function extractOutcome(content: string): string | undefined {
  const positivePatterns = [
    /已经痊愈/, /完全恢复/, /恢复正常/, /病好了/, /治好了/,
    /已经好转/, /明显好转/, /大有好转/, /进步很多/, /好转许多/,
    /肿瘤缩小/, /症状消除/, /不再发作/
  ]

  const improvingPatterns = [
    /好转/, /改善/, /进步/, /减轻/, /好转中/,
    /恢复中/, /有效/, /见效/
  ]

  for (const p of positivePatterns) {
    if (p.test(content)) return '痊愈'
  }

  for (const p of improvingPatterns) {
    if (p.test(content)) return '好转'
  }

  return undefined
}

// 解析医案
function parseCaseFile(filePath: string): CaseItem[] {
  const content = readFileSync(filePath, 'utf-8')
  const cases: CaseItem[] = []

  const caseRegex = /###\s*(\d+)\.\s*(.+?)\n([\s\S]*?)(?=###\s*\d+\.|$)/g
  let match

  while ((match = caseRegex.exec(content)) !== null) {
    const caseId = match[1]
    const caseTitle = match[2].trim()
    const caseContent = match[3].trim()

    // 提取各字段
    const dateMatch = caseContent.match(/\*\*日期\*\*[：:](.+)/)
    const date = dateMatch ? dateMatch[1].trim() : ''

    const diseaseMatch = caseContent.match(/\*\*疾病\*\*[：:](.+)/)
    const disease = diseaseMatch ? diseaseMatch[1].trim() : caseTitle

    const meridianMatch = caseContent.match(/\*\*六经\*\*[：:](.+)/)
    const meridian = meridianMatch ? meridianMatch[1].trim() : undefined

    const prescriptionMatch = caseContent.match(/\*\*方剂\*\*[：:](.+)/)
    const prescription = prescriptionMatch ? prescriptionMatch[1].trim() : undefined

    const patientMatch = caseContent.match(/\*\*患者\*\*[：:](.+)/)
    const patient = patientMatch ? patientMatch[1].trim() : undefined

    // 提取医案正文
    const contentMatch = caseContent.match(/\*\*医案内容\*\*[：:]\s*\n([\s\S]*?)(?=来源[：:]|$)/)
    let mainContent = contentMatch ? contentMatch[1].trim() : ''

    // 如果没有医案内容字段，尝试提取摘要后的内容
    if (!mainContent) {
      const summaryMatch = caseContent.match(/\*\*摘要\*\*[：:](.+)/)
      mainContent = summaryMatch ? summaryMatch[1].trim() : caseContent
    }

    // 清理内容格式
    mainContent = mainContent
      .replace(/^[-*]\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .trim()

    // 提取治疗和疗效
    const treatment = extractTreatment(mainContent, prescription)
    const outcome = extractOutcome(mainContent)

    // 生成摘要
    const summary = mainContent.replace(/\n/g, ' ').substring(0, 150) + (mainContent.length > 150 ? '...' : '')

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
      content: mainContent
    })
  }

  return cases
}

// 主函数
function main() {
  console.log('=== 改进版医案提取 ===\n')

  const allCases: CaseItem[] = []

  const files = readdirSync(CASES_DIR).filter(f => f.endsWith('.md'))
  for (const file of files) {
    const filePath = join(CASES_DIR, file)
    console.log(`处理: ${file}`)
    const cases = parseCaseFile(filePath)
    allCases.push(...cases)
    console.log(`  提取 ${cases.length} 个医案`)
  }

  // 按日期排序
  allCases.sort((a, b) => a.date.localeCompare(b.date))

  // 统计
  const withTreatment = allCases.filter(c => c.treatment).length
  const withOutcome = allCases.filter(c => c.outcome).length
  console.log(`\n总计: ${allCases.length} 个医案`)
  console.log(`有治疗方案: ${withTreatment} (${(withTreatment/allCases.length*100).toFixed(1)}%)`)
  console.log(`有疗效记录: ${withOutcome} (${(withOutcome/allCases.length*100).toFixed(1)}%)`)

  writeFileSync(OUTPUT_FILE, JSON.stringify(allCases, null, 2), 'utf-8')
  console.log(`\n输出到: ${OUTPUT_FILE}`)
}

main()
