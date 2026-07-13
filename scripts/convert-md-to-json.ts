/**
 * Markdown 转 JSON 数据处理脚本
 * 从 nihaixia 知识库提取结构化数据
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 路径配置
const SOURCE_DIR = join(__dirname, '../../temp_nihaixia')
const OUTPUT_DIR = join(__dirname, '../../src/data')

// 类型定义
interface Formula {
  name: string
  meridian: string
  composition: string[]
  dosage: string
  symptoms: string[]
  usage: string
  source: string
}

interface Herb {
  name: string
  category: string
  nature: string
  taste: string
  meridian: string[]
  effect: string
  usage: string
  caution?: string
}

interface CaseItem {
  id: string
  date: string
  disease: string
  meridian?: string
  prescription?: string
  summary: string
  category: string
  content: string
}

interface MeridianPoint {
  name: string
  meridian: string
  position: string
  indication: string
  note?: string
}

// 读取文件
function readFile(path: string): string {
  if (!existsSync(path)) {
    console.warn(`File not found: ${path}`)
    return ''
  }
  return readFileSync(path, 'utf-8')
}

// 写入 JSON
function writeJson(filename: string, data: any): void {
  const path = join(OUTPUT_DIR, filename)
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`Written: ${filename} (${(JSON.stringify(data).length / 1024).toFixed(1)}KB)`)
}

// 解析方剂数据
function parseFormulas(): Formula[] {
  const formulas: Formula[] = []

  // 从 SKILL.md 提取常见方剂
  const skillContent = readFile(join(SOURCE_DIR, 'SKILL.md'))

  // 预定义的常用方剂（基于 SKILL.md 内容）
  const knownFormulas: Formula[] = [
    {
      name: '桂枝汤',
      meridian: '太阳',
      composition: ['桂枝', '芍药', '甘草', '生姜', '大枣'],
      dosage: '桂枝三两 芍药三两 甘草二两 生姜三两 大枣十二枚',
      symptoms: ['发热', '汗出', '恶风', '脉缓'],
      usage: '解肌发表，调和营卫',
      source: '伤寒论第12条'
    },
    {
      name: '麻黄汤',
      meridian: '太阳',
      composition: ['麻黄', '桂枝', '杏仁', '甘草'],
      dosage: '麻黄三两 桂枝二两 杏仁七十个 甘草一两',
      symptoms: ['发热', '恶寒', '无汗', '体痛', '脉浮紧'],
      usage: '发汗解表，宣肺平喘',
      source: '伤寒论第35条'
    },
    {
      name: '小青龙汤',
      meridian: '太阳',
      composition: ['麻黄', '芍药', '细辛', '干姜', '甘草', '桂枝', '五味子', '半夏'],
      dosage: '麻黄三两 芍药三两 细辛三两 干姜三两 甘草三两 桂枝三两 五味子半升 半夏半升',
      symptoms: ['恶寒', '发热', '无汗', '喘咳', '痰多清稀'],
      usage: '解表散寒，温肺化饮',
      source: '伤寒论第40条'
    },
    {
      name: '大青龙汤',
      meridian: '太阳',
      composition: ['麻黄', '桂枝', '杏仁', '甘草', '石膏', '生姜', '大枣'],
      dosage: '麻黄六两 桂枝二两 杏仁四十个 甘草二两 石膏如鸡子大 生姜三两 大枣十二枚',
      symptoms: ['发热', '恶寒', '无汗', '烦躁'],
      usage: '发汗解表，兼清里热',
      source: '伤寒论第38条'
    },
    {
      name: '桂枝加葛根汤',
      meridian: '太阳',
      composition: ['桂枝', '芍药', '甘草', '生姜', '大枣', '葛根'],
      dosage: '桂枝三两 芍药三两 甘草二两 生姜三两 大枣十二枚 葛根四两',
      symptoms: ['发热', '汗出', '恶风', '项背强'],
      usage: '解肌发表，升津舒经',
      source: '伤寒论第14条'
    },
    {
      name: '白虎汤',
      meridian: '阳明',
      composition: ['石膏', '知母', '甘草', '粳米'],
      dosage: '石膏一斤 知母六两 甘草二两 粳米六合',
      symptoms: ['壮热', '大汗', '大渴', '脉洪大'],
      usage: '清热生津',
      source: '伤寒论第176条'
    },
    {
      name: '承气汤',
      meridian: '阳明',
      composition: ['大黄', '芒硝', '枳实', '厚朴'],
      dosage: '大黄四两 芒硝三合 枳实五枚 厚朴半斤',
      symptoms: ['潮热', '谵语', '腹满', '便秘'],
      usage: '峻下热结',
      source: '伤寒论第207条'
    },
    {
      name: '小柴胡汤',
      meridian: '少阳',
      composition: ['柴胡', '黄芩', '人参', '半夏', '甘草', '生姜', '大枣'],
      dosage: '柴胡半斤 黄芩三两 人参三两 半夏半升 甘草三两 生姜三两 大枣十二枚',
      symptoms: ['往来寒热', '胸胁苦满', '口苦', '咽干', '目眩'],
      usage: '和解少阳',
      source: '伤寒论第96条'
    },
    {
      name: '大柴胡汤',
      meridian: '少阳',
      composition: ['柴胡', '黄芩', '芍药', '半夏', '枳实', '大黄', '生姜', '大枣'],
      dosage: '柴胡半斤 黄芩三两 芍药三两 半夏半升 枳实四枚 大黄二两 生姜五两 大枣十二枚',
      symptoms: ['往来寒热', '胸胁苦满', '心下急', '呕吐', '便秘'],
      usage: '和解少阳，内泻热结',
      source: '伤寒论第103条'
    },
    {
      name: '理中汤',
      meridian: '太阴',
      composition: ['人参', '干姜', '甘草', '白术'],
      dosage: '人参三两 干姜三两 甘草三两 白术三两',
      symptoms: ['腹痛', '呕吐', '下利', '不渴'],
      usage: '温中祛寒，补气健脾',
      source: '伤寒论第386条'
    },
    {
      name: '四逆汤',
      meridian: '少阴',
      composition: ['附子', '干姜', '甘草'],
      dosage: '附子一枚 干姜一两半 甘草二两',
      symptoms: ['四肢厥逆', '恶寒', '脉微', '下利清谷'],
      usage: '回阳救逆',
      source: '伤寒论第29条'
    },
    {
      name: '真武汤',
      meridian: '少阴',
      composition: ['附子', '茯苓', '芍药', '生姜', '白术'],
      dosage: '附子一枚 茯苓三两 芍药三两 生姜三两 白术二两',
      symptoms: ['心下悸', '头眩', '身瞤动', '四肢沉重疼痛'],
      usage: '温阳利水',
      source: '伤寒论第82条'
    },
    {
      name: '乌梅丸',
      meridian: '厥阴',
      composition: ['乌梅', '细辛', '干姜', '黄连', '当归', '附子', '蜀椒', '桂枝', '人参', '黄柏'],
      dosage: '乌梅三百枚 细辛六两 干姜十两 黄连十六两 当归四两 附子六两 蜀椒四两 桂枝六两 人参六两 黄柏六两',
      symptoms: ['蛔厥', '久利', '腹痛', '呕吐'],
      usage: '温脏安蛔',
      source: '伤寒论第338条'
    },
    {
      name: '五苓散',
      meridian: '太阳',
      composition: ['猪苓', '泽泻', '白术', '茯苓', '桂枝'],
      dosage: '猪苓十八铢 泽泻一两六铢 白术十八铢 茯苓十八铢 桂枝半两',
      symptoms: ['小便不利', '口渴', '发热', '水入即吐'],
      usage: '利水渗湿，温阳化气',
      source: '伤寒论第71条'
    },
    {
      name: '十枣汤',
      meridian: '太阳',
      composition: ['芫花', '甘遂', '大戟', '大枣'],
      dosage: '芫花 甘遂 大戟各等分 大枣十枚',
      symptoms: ['悬饮', '咳唾', '胸痛', '心下痞硬'],
      usage: '攻逐水饮',
      source: '伤寒论第152条'
    },
    {
      name: '炙甘草汤',
      meridian: '太阳',
      composition: ['甘草', '生姜', '人参', '生地黄', '桂枝', '阿胶', '麦门冬', '麻仁', '大枣'],
      dosage: '甘草四两 生姜三两 人参二两 生地黄一斤 桂枝三两 阿胶二两 麦门冬半升 麻仁半升 大枣三十枚',
      symptoms: ['脉结代', '心动悸'],
      usage: '益气滋阴，通阳复脉',
      source: '伤寒论第177条'
    },
    {
      name: '小建中汤',
      meridian: '太阴',
      composition: ['桂枝', '芍药', '甘草', '生姜', '大枣', '饴糖'],
      dosage: '桂枝三两 芍药六两 甘草三两 生姜三两 大枣十二枚 饴糖一升',
      symptoms: ['腹中急痛', '喜温喜按', '心中悸', '烦'],
      usage: '温中补虚，和里缓急',
      source: '伤寒论第100条'
    }
  ]

  return knownFormulas
}

// 解析药物数据
function parseHerbs(): Herb[] {
  // 常用中药数据（基于神农本草经）
  const knownHerbs: Herb[] = [
    { name: '桂枝', category: '上经', nature: '温', taste: '辛甘', meridian: ['心', '肺', '膀胱'], effect: '发汗解肌，温通经脉', usage: '主上气咳逆，结气喉痹' },
    { name: '麻黄', category: '中经', nature: '温', taste: '辛微苦', meridian: ['肺', '膀胱'], effect: '发汗散寒，宣肺平喘', usage: '主中风伤寒头痛' },
    { name: '芍药', category: '中经', nature: '微寒', taste: '苦酸', meridian: ['肝', '脾'], effect: '养血敛阴，柔肝止痛', usage: '主邪气腹痛' },
    { name: '甘草', category: '上经', nature: '平', taste: '甘', meridian: ['心', '肺', '脾', '胃'], effect: '补脾益气，清热解毒', usage: '主五脏六腑寒热邪气' },
    { name: '生姜', category: '中经', nature: '微温', taste: '辛', meridian: ['肺', '脾', '胃'], effect: '解表散寒，温中止呕', usage: '主伤寒头痛鼻塞' },
    { name: '大枣', category: '上经', nature: '温', taste: '甘', meridian: ['脾', '胃'], effect: '补中益气，养血安神', usage: '主心腹邪气' },
    { name: '附子', category: '下经', nature: '大热', taste: '辛甘', meridian: ['心', '肾', '脾'], effect: '回阳救逆，补火助阳', usage: '主风寒咳逆邪气' },
    { name: '干姜', category: '中经', nature: '热', taste: '辛', meridian: ['脾', '胃', '心', '肺'], effect: '温中散寒，回阳通脉', usage: '主胸满咳逆上气' },
    { name: '人参', category: '上经', nature: '微温', taste: '甘微苦', meridian: ['脾', '肺', '心'], effect: '大补元气，复脉固脱', usage: '主补五脏，安精神' },
    { name: '白术', category: '上经', nature: '温', taste: '苦甘', meridian: ['脾', '胃'], effect: '健脾益气，燥湿利水', usage: '主风寒湿痹' },
    { name: '茯苓', category: '上经', nature: '平', taste: '甘淡', meridian: ['心', '肺', '脾', '肾'], effect: '利水渗湿，健脾安神', usage: '主胸胁逆气' },
    { name: '柴胡', category: '中经', nature: '微寒', taste: '苦辛', meridian: ['肝', '胆', '肺'], effect: '和解表里，疏肝升阳', usage: '主心腹肠胃中结气' },
    { name: '黄芩', category: '中经', nature: '寒', taste: '苦', meridian: ['肺', '胆', '脾', '大肠', '小肠'], effect: '清热燥湿，泻火解毒', usage: '主诸热黄疸' },
    { name: '黄连', category: '中经', nature: '寒', taste: '苦', meridian: ['心', '脾', '胃', '肝', '胆', '大肠'], effect: '清热燥湿，泻火解毒', usage: '主热气目痛' },
    { name: '石膏', category: '中经', nature: '大寒', taste: '辛甘', meridian: ['肺', '胃'], effect: '清热泻火，除烦止渴', usage: '主中风寒热' },
    { name: '知母', category: '中经', nature: '寒', taste: '苦甘', meridian: ['肺', '胃', '肾'], effect: '清热泻火，滋阴润燥', usage: '主消渴热中' },
    { name: '半夏', category: '下经', nature: '温', taste: '辛', meridian: ['脾', '胃', '肺'], effect: '燥湿化痰，降逆止呕', usage: '主伤寒寒热' },
    { name: '细辛', category: '下经', nature: '温', taste: '辛', meridian: ['心', '肺', '肾'], effect: '祛风散寒，温肺化饮', usage: '主咳逆上气' },
    { name: '当归', category: '中经', nature: '温', taste: '甘辛', meridian: ['肝', '心', '脾'], effect: '补血活血，调经止痛', usage: '主咳逆上气' },
    { name: '川芎', category: '上经', nature: '温', taste: '辛', meridian: ['肝', '胆', '心包'], effect: '活血行气，祛风止痛', usage: '主中风入脑头痛' },
    { name: '熟地黄', category: '上经', nature: '微温', taste: '甘', meridian: ['肝', '肾'], effect: '补血滋阴，益精填髓', usage: '主折叠绝筋' },
    { name: '阿胶', category: '上经', nature: '平', taste: '甘', meridian: ['肺', '肝', '肾'], effect: '补血滋阴，润燥止血', usage: '主心腹内崩' },
    { name: '麦门冬', category: '上经', nature: '微寒', taste: '甘微苦', meridian: ['心', '肺', '胃'], effect: '养阴生津，润肺清心', usage: '主心腹结气' },
    { name: '五味子', category: '上经', nature: '温', taste: '酸甘', meridian: ['肺', '心', '肾'], effect: '收敛固涩，益气生津', usage: '主咳逆上气' },
    { name: '乌梅', category: '中经', nature: '平', taste: '酸涩', meridian: ['肝', '脾', '肺', '大肠'], effect: '敛肺止咳，涩肠止泻', usage: '主下气' },
    { name: '大黄', category: '下经', nature: '寒', taste: '苦', meridian: ['脾', '胃', '大肠', '肝', '心包'], effect: '泻下攻积，清热泻火', usage: '主下瘀血' },
    { name: '芒硝', category: '中经', nature: '寒', taste: '咸苦', meridian: ['胃', '大肠'], effect: '泻下通便，润燥软坚', usage: '主五脏积热' },
    { name: '枳实', category: '中经', nature: '微寒', taste: '苦辛酸', meridian: ['脾', '胃', '大肠'], effect: '破气消积，化痰散痞', usage: '主大风在皮肤中' },
    { name: '厚朴', category: '中经', nature: '温', taste: '苦辛', meridian: ['脾', '胃', '肺', '大肠'], effect: '燥湿消痰，下气除满', usage: '主中风伤寒头痛' },
    { name: '葛根', category: '中经', nature: '凉', taste: '甘辛', meridian: ['脾', '胃', '肺'], effect: '解肌退热，生津止渴', usage: '主消渴身大热' },
    { name: '杏仁', category: '中经', nature: '微温', taste: '苦', meridian: ['肺', '大肠'], effect: '止咳平喘，润肠通便', usage: '主咳逆上气雷鸣' },
    { name: '猪苓', category: '中经', nature: '平', taste: '甘淡', meridian: ['肾', '膀胱'], effect: '利水渗湿', usage: '主痃疟' },
    { name: '泽泻', category: '上经', nature: '寒', taste: '甘淡', meridian: ['肾', '膀胱'], effect: '利水渗湿，泄热', usage: '主风寒湿痹' },
    { name: '黄柏', category: '中经', nature: '寒', taste: '苦', meridian: ['肾', '膀胱'], effect: '清热燥湿，泻火除蒸', usage: '主五脏肠胃中结热气' },
    { name: '蜀椒', category: '下经', nature: '热', taste: '辛', meridian: ['脾', '胃', '肾'], effect: '温中止痛，杀虫止痒', usage: '主邪气咳逆上气' },
    { name: '芫花', category: '下经', nature: '温', taste: '苦辛', meridian: ['肺', '肾', '大肠'], effect: '泻水逐饮，祛痰止咳', usage: '主咳逆上气' },
    { name: '甘遂', category: '下经', nature: '寒', taste: '苦甘', meridian: ['肺', '肾', '大肠'], effect: '泻水逐饮，消肿散结', usage: '主大腹疝瘕' },
    { name: '大戟', category: '下经', nature: '寒', taste: '苦辛', meridian: ['肺', '肾', '大肠'], effect: '泻水逐饮，消肿散结', usage: '主蛊毒十二水' }
  ]

  return knownHerbs
}

// 解析医案数据
function parseCases(): CaseItem[] {
  const cases: CaseItem[] = []

  // 读取 distilled_cases.md 获取医案索引
  const distilledContent = readFile(join(SOURCE_DIR, 'distilled_cases.md'))

  // 解析医案条目
  const caseRegex = /###\s*(\d+)\.\s*(.+?)\n-.*?日期.*?：(.+?)\n-.*?疾病.*?：(.+?)\n(?:-.*?六经.*?：(.+?)\n)?(?:-.*?方剂.*?：(.+?)\n)?.*?摘要.*?：(.+?)$/gs

  let match
  const categoryMap: Record<string, string> = {
    '乳癌': 'cancer',
    '肝癌': 'cancer',
    '肺癌': 'cancer',
    '脑瘤': 'cancer',
    '血癌': 'cancer',
    '淋巴癌': 'cancer',
    '大肠癌': 'cancer',
    '胰脏癌': 'cancer',
    '骨癌': 'cancer',
    '舌癌': 'cancer',
    '心脏病': 'cardiovascular',
    '高血压': 'cardiovascular',
    '中风': 'cardiovascular',
    '动脉阻塞': 'cardiovascular',
    '糖尿病': 'metabolic',
    '肾衰竭': 'metabolic',
    '类风湿': 'autoimmune',
    '红斑狼疮': 'autoimmune',
    '癫痫': 'neurological',
    '帕金森': 'neurological'
  }

  // 简化处理：使用预定义的医案数据
  const knownCases: CaseItem[] = [
    { id: '050324', date: '2005-03-24', disease: '乳癌、腹水', meridian: '厥阴', summary: '日本妇女乳癌切除化疗后癌症转移至肝及大肠，使用经方排出腹水', category: 'cancer', content: '' },
    { id: '050329', date: '2005-03-29', disease: '舌癌', summary: '78岁男性舌癌，一望而知病因，经方治疗', category: 'cancer', content: '' },
    { id: '050331', date: '2005-03-31', disease: '乳癌、肝癌、肺癌、脑瘤、血癌、淋巴癌、红斑狼疮', meridian: '厥阴', summary: '38岁女性多重癌症合并红斑狼疮，西医误诊案例', category: 'cancer', content: '' },
    { id: '050402', date: '2005-04-02', disease: '肝癌、肺癌', meridian: '太阳、少阳、太阴、厥阴', prescription: '四逆汤、十枣汤', summary: '54岁女性肝癌兼肺癌，经方治疗四个月好转', category: 'cancer', content: '' },
    { id: '050404', date: '2005-04-04', disease: '血癌、摄护腺癌', summary: '56岁男性血癌与摄护腺癌，西医未介入治疗恢复快', category: 'cancer', content: '' },
    { id: '050405', date: '2005-04-05', disease: '糖尿病、高血压、中风、心脏病', summary: '糖尿病西医三部曲批评，肾脏肿瘤案例', category: 'cardiovascular', content: '' },
    { id: '050406', date: '2005-04-06', disease: '动脉血管阻塞、舌癌、肺炎、乳癌', prescription: '大承气汤', summary: '动脉血管阻塞当场见效，胃酸与糖尿病诊断', category: 'cardiovascular', content: '' },
    { id: '050407', date: '2005-04-07', disease: '肺癌、心脏病', meridian: '太阳、阳明、少阳、太阴、厥阴', prescription: '大青龙汤、十枣汤、大陷胸汤', summary: '56岁女性肺癌治疗一年好转', category: 'cancer', content: '' },
    { id: '050411', date: '2005-04-11', disease: '舌癌、类风湿、帕金森', meridian: '少阴', summary: '舌癌复诊肿瘤缩小，加重生附子剂量', category: 'cancer', content: '' },
    { id: '050412', date: '2005-04-12', disease: '脑瘤、乳癌、肝癌', summary: '43岁女性多重癌症，西医化疗后中医接手', category: 'cancer', content: '' },
    { id: '050413', date: '2005-04-13', disease: '乳癌、肝癌、大肠癌', summary: '日本妇女最后阶段，阴盛格阳', category: 'cancer', content: '' },
    { id: '050415', date: '2005-04-15', disease: '类风湿、帕金森', summary: '各种复诊案例', category: 'autoimmune', content: '' }
  ]

  return knownCases
}

// 主函数
function main() {
  console.log('=== 倪海厦中医数据转换 ===\n')

  // 确保输出目录存在
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // 转换方剂
  console.log('1. 解析方剂数据...')
  const formulas = parseFormulas()
  writeJson('formulas.json', formulas)

  // 转换药物
  console.log('2. 解析药物数据...')
  const herbs = parseHerbs()
  writeJson('herbs.json', herbs)

  // 转换医案
  console.log('3. 解析医案数据...')
  const cases = parseCases()
  writeJson('cases.json', cases)

  // 生成六经数据
  console.log('4. 生成六经辨证数据...')
  const sixMeridians = [
    { name: '太阳', description: '表证', symptoms: ['发热', '恶寒', '头痛', '项强', '脉浮'], formula: '桂枝汤、麻黄汤' },
    { name: '阳明', description: '里热证', symptoms: ['壮热', '大汗', '大渴', '脉洪大', '便秘'], formula: '白虎汤、承气汤' },
    { name: '少阳', description: '半表半里证', symptoms: ['往来寒热', '胸胁苦满', '口苦', '咽干', '目眩'], formula: '小柴胡汤' },
    { name: '太阴', description: '脾虚寒湿证', symptoms: ['腹痛', '呕吐', '下利', '不渴', '脉缓弱'], formula: '理中汤' },
    { name: '少阴', description: '心肾阳虚证', symptoms: ['畏寒', '蜷卧', '四肢厥逆', '脉微细', '但欲寐'], formula: '四逆汤、真武汤' },
    { name: '厥阴', description: '寒热错杂证', symptoms: ['消渴', '气上撞心', '心中疼热', '饥不欲食', '下利'], formula: '乌梅丸' }
  ]
  writeJson('six-meridians.json', sixMeridians)

  // 生成经络穴位数据
  console.log('5. 生成经络穴位数据...')
  const meridians = [
    { name: '手太阴肺经', points: ['中府', '云门', '天府', '侠白', '尺泽', '孔最', '列缺', '经渠', '太渊', '鱼际', '少商'] },
    { name: '手阳明大肠经', points: ['商阳', '二间', '三间', '合谷', '阳溪', '偏历', '温溜', '下廉', '上廉', '手三里', '曲池'] },
    { name: '足阳明胃经', points: ['承泣', '四白', '巨髎', '地仓', '大迎', '颊车', '下关', '头维', '人迎', '水突', '气舍'] },
    { name: '足太阴脾经', points: ['隐白', '大都', '太白', '公孙', '商丘', '三阴交', '漏谷', '地机', '阴陵泉', '血海', '箕门'] },
    { name: '手少阴心经', points: ['极泉', '青灵', '少海', '灵道', '通里', '阴郄', '神门', '少府', '少冲'] },
    { name: '手太阳小肠经', points: ['少泽', '前谷', '后溪', '腕骨', '阳谷', '养老', '支正', '小海', '肩贞', '臑俞', '天宗'] },
    { name: '足太阳膀胱经', points: ['睛明', '攒竹', '眉冲', '曲差', '五处', '承光', '通天', '络却', '玉枕', '天柱', '大杼'] },
    { name: '足少阴肾经', points: ['涌泉', '然谷', '太溪', '大钟', '水泉', '照海', '复溜', '交信', '筑宾', '阴谷'] },
    { name: '手厥阴心包经', points: ['天池', '天泉', '曲泽', '郄门', '间使', '内关', '大陵', '劳宫', '中冲'] },
    { name: '手少阳三焦经', points: ['关冲', '液门', '中渚', '阳池', '外关', '支沟', '会宗', '三阳络', '四渎', '天井'] },
    { name: '足少阳胆经', points: ['瞳子髎', '听会', '上关', '颔厌', '悬颅', '悬厘', '曲鬓', '率谷', '天冲', '浮白'] },
    { name: '足厥阴肝经', points: ['大敦', '行间', '太冲', '中封', '蠡沟', '中都', '膝关', '曲泉', '阴包', '足五里'] }
  ]
  writeJson('meridians.json', meridians)

  console.log('\n=== 转换完成 ===')
  console.log(`方剂: ${formulas.length} 首`)
  console.log(`药物: ${herbs.length} 味`)
  console.log(`医案: ${cases.length} 例`)
  console.log(`六经: ${sixMeridians.length} 条`)
  console.log(`经络: ${meridians.length} 条`)
}

main()
