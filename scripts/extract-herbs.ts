/**
 * 从 modules/09_zhenjiu_bencao.md 提取完整药物数据
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SOURCE_FILE = join(__dirname, '../temp_nihaixia/modules/09_zhenjiu_bencao.md')
const OUTPUT_FILE = join(__dirname, '../src/data/herbs.json')

interface Herb {
  name: string
  category: string
  nature: string
  taste: string
  meridian: string[]
  effect: string
  usage: string
  caution?: string
  dosage?: string
  source?: string
}

// 药物分类
function getHerbCategory(section: string): string {
  if (section.includes('上经')) return '上经'
  if (section.includes('中经')) return '中经'
  if (section.includes('下经')) return '下经'
  return '中经'
}

// 性味映射
const natureMap: Record<string, string> = {
  '寒': '寒', '大寒': '大寒', '微寒': '微寒', '凉': '凉',
  '热': '热', '大热': '大热', '温': '温', '微温': '微温',
  '平': '平', '冷': '寒', '大温': '热'
}

// 五味映射
const tasteMap: Record<string, string> = {
  '甘': '甘', '苦': '苦', '辛': '辛', '酸': '酸', '咸': '咸',
  '淡': '淡', '涩': '涩', '甘苦': '甘苦', '辛苦': '辛苦',
  '甘辛': '甘辛', '苦辛': '苦辛', '酸苦': '酸苦', '甘淡': '甘淡',
  '辛苦甘': '辛苦甘', '辛甘': '辛甘'
}

// 经络映射
const meridianMap: Record<string, string[]> = {
  '心': ['心'], '肝': ['肝'], '脾': ['脾'], '肺': ['肺'], '肾': ['肾'],
  '胃': ['胃'], '大肠': ['大肠'], '小肠': ['小肠'], '膀胱': ['膀胱'],
  '胆': ['胆'], '三焦': ['三焦'], '心包': ['心包'],
  '心肝': ['心', '肝'], '肝肺': ['肝', '肺'], '脾肺': ['脾', '肺'],
  '肺肝': ['肺', '肝'], '肾肺': ['肾', '肺'], '肝肾': ['肝', '肾'],
  '脾肾': ['脾', '肾'], '心肾': ['心', '肾'], '肺胃': ['肺', '胃'],
  '肝胆': ['肝', '胆'], '脾胃': ['脾', '胃'], '心肺': ['心', '肺'],
  '肝脾': ['肝', '脾'], '肝胃': ['肝', '胃'], '肾膀胱': ['肾', '膀胱'],
  '肺大肠': ['肺', '大肠'], '肝胆肺': ['肝', '胆', '肺']
}

function parseHerbs(): Herb[] {
  const content = readFileSync(SOURCE_FILE, 'utf-8')
  const herbs: Herb[] = []

  // 匹配药物条目格式：**药名**
  const herbRegex = /\*\*([^*]+)\*\*\s*\n[\s\S]*?(?=\*\*[^*]+\*\*\s*\n|$)/g
  let match

  // 获取上经、中经、下经的范围
  const shangJingStart = content.indexOf('### 上经')
  const zhongJingStart = content.indexOf('### 中经')
  const xiaJingStart = content.indexOf('### 下经')

  while ((match = herbRegex.exec(content)) !== null) {
    const herbName = match[1].trim()

    // 跳过非药物标题
    if (herbName.length > 10 || herbName.includes('倪师') || herbName.includes('原文') ||
        herbName.includes('主治') || herbName.includes('用量') || herbName.includes('禁忌') ||
        herbName.includes('性味') || herbName.includes('容川') || herbName.includes('倪注')) {
      continue
    }

    const herbContent = match[0]

    // 确定分类
    let category = '中经'
    const herbPos = match.index
    if (shangJingStart > 0 && herbPos > shangJingStart && (zhongJingStart < 0 || herbPos < zhongJingStart)) {
      category = '上经'
    } else if (xiaJingStart > 0 && herbPos > xiaJingStart) {
      category = '下经'
    }

    // 提取性味
    let nature = '平'
    let taste = '甘'

    const natureMatch = herbContent.match(/性味[：:]\s*[味]?\s*([^\s，。,]+)/)
    if (natureMatch) {
      const natureStr = natureMatch[1]
      for (const [key, value] of Object.entries(natureMap)) {
        if (natureStr.includes(key)) {
          nature = value
          break
        }
      }
      for (const [key, value] of Object.entries(tasteMap)) {
        if (natureStr.includes(key)) {
          taste = value
          break
        }
      }
    }

    // 提取原文中的性味
    if (nature === '平' && taste === '甘') {
      const originalMatch = herbContent.match(/原文[：:]\s*味(\S+)/)
      if (originalMatch) {
        const tasteStr = originalMatch[1]
        for (const [key, value] of Object.entries(tasteMap)) {
          if (tasteStr.includes(key)) {
            taste = value
            break
          }
        }
      }
    }

    // 提取主治
    let effect = ''
    const effectMatch = herbContent.match(/主治[：:]\s*(.+?)(?:\n|$)/)
    if (effectMatch) {
      effect = effectMatch[1].trim().substring(0, 50)
    }

    // 提取用量
    let dosage = ''
    const dosageMatch = herbContent.match(/用量[：:]\s*(.+?)(?:\n|$)/)
    if (dosageMatch) {
      dosage = dosageMatch[1].trim()
    }

    // 提取禁忌
    let caution = ''
    const cautionMatch = herbContent.match(/禁忌[：:]\s*(.+?)(?:\n|$)/)
    if (cautionMatch) {
      caution = cautionMatch[1].trim().substring(0, 50)
    }

    // 提取归经
    const meridians: string[] = []
    const meridianStr = herbContent.match(/归经[：:]\s*(.+)/)
    if (meridianStr) {
      const meridianText = meridianStr[1]
      for (const [key, value] of Object.entries(meridianMap)) {
        if (meridianText.includes(key)) {
          meridians.push(...value)
        }
      }
    }

    // 如果没有明确归经，根据功效推断
    if (meridians.length === 0) {
      if (effect.includes('肺') || effect.includes('咳')) meridians.push('肺')
      if (effect.includes('心') || effect.includes('安神')) meridians.push('心')
      if (effect.includes('肝') || effect.includes('明目')) meridians.push('肝')
      if (effect.includes('脾') || effect.includes('健脾')) meridians.push('脾')
      if (effect.includes('肾') || effect.includes('腰')) meridians.push('肾')
      if (effect.includes('胃') || effect.includes('呕吐')) meridians.push('胃')
      if (meridians.length === 0) meridians.push('肺')
    }

    if (herbName && effect) {
      herbs.push({
        name: herbName,
        category,
        nature,
        taste,
        meridian: [...new Set(meridians)].slice(0, 3),
        effect: effect,
        usage: effect,
        dosage: dosage || undefined,
        caution: caution || undefined,
        source: '神农本草经'
      })
    }
  }

  return herbs
}

function main() {
  console.log('=== 提取神农本草经药物数据 ===\n')

  const herbs = parseHerbs()

  // 统计
  const categories = {
    '上经': herbs.filter(h => h.category === '上经').length,
    '中经': herbs.filter(h => h.category === '中经').length,
    '下经': herbs.filter(h => h.category === '下经').length
  }

  console.log(`提取完成: ${herbs.length} 味药物`)
  console.log(`  上经: ${categories['上经']} 味`)
  console.log(`  中经: ${categories['中经']} 味`)
  console.log(`  下经: ${categories['下经']} 味`)

  // 写入文件
  writeFileSync(OUTPUT_FILE, JSON.stringify(herbs, null, 2), 'utf-8')
  console.log(`\n输出到: ${OUTPUT_FILE}`)

  // 显示前10个样本
  console.log('\n样本数据:')
  herbs.slice(0, 10).forEach(h => {
    console.log(`  [${h.category}] ${h.name} - ${h.nature}${h.taste} - ${h.effect.substring(0, 30)}`)
  })
}

main()
