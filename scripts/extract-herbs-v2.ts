/**
 * 改进版药物提取脚本
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
  alias?: string
}

function parseHerbs(): Herb[] {
  const content = readFileSync(SOURCE_FILE, 'utf-8')
  const herbs: Herb[] = []

  // 找到各区间的起始位置
  const shangStart = content.indexOf('### 上经')
  const zhongStart = content.indexOf('### 中经')
  const xiaStart = content.indexOf('### 下经')

  // 提取每个区间的药物
  function extractFromSection(start: number, end: number, category: string) {
    const section = content.substring(start, end)
    const regex = /\*\*([^*]{1,15})\*\*\s*\n([\s\S]*?)(?=\*\*[^*]+\*\*\s*\n|$)/g
    let match

    while ((match = regex.exec(section)) !== null) {
      const herbName = match[1].trim()
      const herbContent = match[2]

      // 过滤非药物条目
      if (herbName.length === 0 || herbName.length > 15 ||
          herbName.includes('穴') || herbName.includes('原文') ||
          herbName.includes('主治') || herbName.includes('用量') ||
          herbName.includes('禁忌') || herbName.includes('性味') ||
          herbName.includes('倪师') || herbName.includes('容川') ||
          herbName.includes('倪注') || herbName.includes('症状')) {
        continue
      }

      // 提取别名
      let alias = ''
      const aliasMatch = herbContent.match(/又名(.+?)(?:\n|。)/)
      if (aliasMatch) {
        alias = aliasMatch[1].trim()
      }

      // 提取性味
      let nature = '平'
      let taste = '甘'

      // 从性味字段提取
      const natureMatch = herbContent.match(/性味[：:]\s*[味]?\s*([^\s，。,]+)/)
      if (natureMatch) {
        const natureStr = natureMatch[1]
        if (natureStr.includes('寒')) nature = '寒'
        else if (natureStr.includes('热')) nature = '热'
        else if (natureStr.includes('温')) nature = '温'
        else if (natureStr.includes('凉')) nature = '凉'
        else if (natureStr.includes('平')) nature = '平'

        if (natureStr.includes('甘')) taste = '甘'
        else if (natureStr.includes('苦')) taste = '苦'
        else if (natureStr.includes('辛')) taste = '辛'
        else if (natureStr.includes('酸')) taste = '酸'
        else if (natureStr.includes('咸')) taste = '咸'
      }

      // 从原文提取性味
      if (nature === '平' && taste === '甘') {
        const originalMatch = herbContent.match(/味(\S+?)(?:性|，|,)/)
        if (originalMatch) {
          const tasteStr = originalMatch[1]
          if (tasteStr.includes('甘')) taste = '甘'
          else if (tasteStr.includes('苦')) taste = '苦'
          else if (tasteStr.includes('辛')) taste = '辛'
          else if (tasteStr.includes('酸')) taste = '酸'
          else if (tasteStr.includes('咸')) taste = '咸'
        }
      }

      // 提取主治
      let effect = ''
      const effectMatch = herbContent.match(/主治[：:]\s*(.+?)(?:\n|容川|用量|禁忌|$)/)
      if (effectMatch) {
        effect = effectMatch[1].trim().substring(0, 80)
      }

      // 提取用量
      let dosage = ''
      const dosageMatch = herbContent.match(/用量[：:]\s*(.+?)(?:\n|禁忌|$)/)
      if (dosageMatch) {
        dosage = dosageMatch[1].trim().substring(0, 50)
      }

      // 提取禁忌
      let caution = ''
      const cautionMatch = herbContent.match(/禁忌[：:]\s*(.+?)(?:\n|$)/)
      if (cautionMatch) {
        caution = cautionMatch[1].trim().substring(0, 80)
      }

      // 根据功效推断归经
      const meridians: string[] = []
      if (effect.includes('肺') || effect.includes('咳') || effect.includes('喘')) meridians.push('肺')
      if (effect.includes('心') || effect.includes('安神') || effect.includes('失眠')) meridians.push('心')
      if (effect.includes('肝') || effect.includes('明目') || effect.includes('目')) meridians.push('肝')
      if (effect.includes('脾') || effect.includes('健脾') || effect.includes('胃')) meridians.push('脾')
      if (effect.includes('肾') || effect.includes('腰') || effect.includes('阳痿')) meridians.push('肾')
      if (effect.includes('胃') || effect.includes('呕吐')) meridians.push('胃')
      if (effect.includes('大肠') || effect.includes('便秘') || effect.includes('泻')) meridians.push('大肠')
      if (effect.includes('小肠') || effect.includes('淋')) meridians.push('小肠')
      if (effect.includes('膀胱') || effect.includes('利尿')) meridians.push('膀胱')
      if (meridians.length === 0) meridians.push('肺')

      if (herbName && (effect || herbContent.length > 50)) {
        herbs.push({
          name: herbName,
          category,
          nature,
          taste,
          meridian: [...new Set(meridians)].slice(0, 3),
          effect: effect || herbContent.substring(0, 50).replace(/\n/g, ' '),
          usage: effect || '',
          dosage: dosage || undefined,
          caution: caution || undefined,
          source: '神农本草经',
          alias: alias || undefined
        })
      }
    }
  }

  // 按顺序提取
  extractFromSection(shangStart, zhongStart, '上经')
  extractFromSection(zhongStart, xiaStart, '中经')
  extractFromSection(xiaStart, content.length, '下经')

  return herbs
}

function main() {
  console.log('=== 改进版药物提取 ===\n')

  const herbs = parseHerbs()

  // 统计
  const categories: Record<string, number> = {
    '上经': 0,
    '中经': 0,
    '下经': 0
  }
  herbs.forEach(h => categories[h.category]++)

  console.log(`提取完成: ${herbs.length} 味药物`)
  console.log(`  上经: ${categories['上经']} 味 (标准127种)`)
  console.log(`  中经: ${categories['中经']} 味 (标准101种)`)
  console.log(`  下经: ${categories['下经']} 味 (标准117种)`)
  console.log(`  总计标准: 345种`)

  // 写入文件
  writeFileSync(OUTPUT_FILE, JSON.stringify(herbs, null, 2), 'utf-8')
  console.log(`\n输出到: ${OUTPUT_FILE}`)

  // 显示前15个样本
  console.log('\n样本数据:')
  herbs.slice(0, 15).forEach(h => {
    console.log(`  [${h.category}] ${h.name} - ${h.nature}${h.taste} - ${h.effect.substring(0, 40)}`)
  })
}

main()
