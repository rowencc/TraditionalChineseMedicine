<template>
  <view class="container" v-if="caseItem">
    <!-- 头部 -->
    <view class="header">
      <view class="header-top">
        <text class="date">{{ caseItem.date || '未知日期' }}</text>
        <text class="category">{{ categoryLabel }}</text>
      </view>
      <text class="disease">{{ caseItem.disease }}</text>
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view v-if="caseItem.patient" class="info-row">
        <text class="info-label">患者</text>
        <text class="info-value">{{ caseItem.patient }}</text>
      </view>
      <view v-if="caseItem.meridian" class="info-row">
        <text class="info-label">六经</text>
        <text class="info-value">{{ caseItem.meridian }}</text>
      </view>
      <view v-if="caseItem.treatment" class="info-row treatment-row">
        <text class="info-label">方剂</text>
        <text class="info-value highlight">{{ caseItem.treatment }}</text>
      </view>
      <view v-if="caseItem.outcome" class="info-row">
        <text class="info-label">疗效</text>
        <text class="info-value outcome" :class="caseItem.outcome">{{ caseItem.outcome }}</text>
      </view>
    </view>

    <!-- 针灸处方分组 -->
    <view v-if="acupuncturePrescription" class="section prescription-section">
      <text class="section-title">针灸处方</text>
      <view class="prescription-card">
        <view v-if="mainPoints.length > 0" class="point-group">
          <text class="group-label main">主穴</text>
          <view class="point-tags">
            <text v-for="point in mainPoints" :key="point" class="point-tag main">{{ point }}</text>
          </view>
        </view>
        <view v-if="supplementaryPoints.length > 0" class="point-group">
          <text class="group-label supplementary">配穴</text>
          <view class="point-tags">
            <text v-for="point in supplementaryPoints" :key="point" class="point-tag supplementary">{{ point }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 治疗方法提取 -->
    <view v-if="treatmentSections.length > 0" class="section treatment-section">
      <text class="section-title">治疗方法</text>
      <view class="treatment-list">
        <view v-for="(item, index) in treatmentSections" :key="index" class="treatment-item">
          <text class="treatment-text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 医案内容 -->
    <view class="section">
      <text class="section-title">医案详情</text>
      <view class="content-wrapper">
        <rich-text class="content" :nodes="highlightedContent"></rich-text>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="disclaimer-title">免责声明</text>
      <text class="disclaimer-text">本医案仅供中医学习参考，不替代专业医疗诊断。如有不适，请咨询执业医师。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import casesData from '@/data/cases.json'

const caseId = ref('')
const caseItem = computed(() => {
  return casesData.find(c => c.id === caseId.value)
})

const categoryMap: Record<string, string> = {
  cancer: '癌症',
  cardiovascular: '心血管',
  metabolic: '代谢病',
  autoimmune: '自身免疫',
  neurological: '神经精神',
  other: '其他'
}

const categoryLabel = computed(() => {
  return categoryMap[caseItem.value?.category || ''] || ''
})

// 常见方剂列表
const KNOWN_FORMULAS = [
  '桂枝汤', '麻黄汤', '小青龙汤', '大青龙汤', '桂枝加葛根汤',
  '白虎汤', '承气汤', '大承气汤', '小承气汤', '调胃承气汤',
  '小柴胡汤', '大柴胡汤', '柴胡桂枝干姜汤',
  '理中汤', '四逆汤', '真武汤', '乌梅丸',
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
  '生附子', '炮附子', '生硫磺', '汉唐77号'
]

// 针灸穴位名称
const ACUPUNCTURE_POINTS = [
  '合谷', '曲池', '足三里', '三阴交', '太冲', '内关', '外关',
  '百会', '风池', '大椎', '关元', '气海', '神门', '后溪',
  '太溪', '委中', '承山', '昆仑', '阳陵泉', '阴陵泉',
  '中脘', '天枢', '列缺', '尺泽', '少商', '商阳',
  '迎香', '地仓', '颊车', '下关', '头维', '攒竹', '睛明',
  '听宫', '翳风', '风府', '哑门', '大杼', '风门',
  '肺俞', '心俞', '肝俞', '脾俞', '肾俞', '命门',
  '腰阳关', '志室', '委中', '承筋', '飞扬', '昆仑',
  '申脉', '金门', '京骨', '束骨', '至阴',
  '涌泉', '然谷', '大钟', '水泉', '照海', '复溜',
  '阴谷', '天池', '曲泽', '郄门', '间使', '大陵', '劳宫', '中冲',
  '关冲', '液门', '中渚', '阳池', '支沟', '会宗', '天井',
  '肩井', '肩髃', '肩髎', '臂臑', '手三里',
  '梁丘', '犊鼻', '上巨虚', '下巨虚', '丰隆', '解溪', '内庭',
  '血海', '箕门', '冲门', '公孙', '太白', '大都', '隐白',
  '行间', '大敦', '中封', '蠡沟', '中都', '曲泉', '章门', '期门',
  '环跳', '风市', '阳辅', '悬钟', '丘墟', '足临泣',
  '瞳子髎', '听会', '上关', '率谷', '完骨',
  '丝竹空', '耳门', '角孙', '天柱', '膏肓'
]

// 主穴（常用核心穴位）
const MAIN_POINTS = [
  '合谷', '曲池', '足三里', '三阴交', '太冲', '内关', '外关',
  '百会', '风池', '大椎', '关元', '气海', '神门', '后溪',
  '太溪', '委中', '承山', '昆仑', '阳陵泉', '阴陵泉', '中脘',
  '涌泉', '中冲', '少商', '劳宫', '肩井', '环跳', '委中'
]

// 提取针灸处方
const acupuncturePrescription = computed(() => {
  const content = caseItem.value?.content || ''
  const foundPoints: string[] = []

  for (const point of ACUPUNCTURE_POINTS) {
    if (content.includes(point)) {
      foundPoints.push(point)
    }
  }

  return foundPoints.length > 0 ? foundPoints : null
})

// 主穴
const mainPoints = computed(() => {
  if (!acupuncturePrescription.value) return []
  return acupuncturePrescription.value.filter(p => MAIN_POINTS.includes(p))
})

// 配穴
const supplementaryPoints = computed(() => {
  if (!acupuncturePrescription.value) return []
  return acupuncturePrescription.value.filter(p => !MAIN_POINTS.includes(p))
})

// 治疗相关关键词
const TREATMENT_KEYWORDS = [
  '使用', '给予', '服用', '开方', '处方', '用药',
  '汤剂', '丸剂', '粉剂', '胶囊',
  '一付', '二付', '三付', '五付', '七付', '十付',
  '每天', '每日', '早晚', '饭前', '饭后',
  '生附子', '炮附子', '桂枝', '白芍', '甘草',
  '大黄', '芒硝', '枳实', '厚朴', '柴胡', '黄芩',
  '半夏', '生姜', '大枣', '人参', '白术', '茯苓',
  '附子', '干姜', '细辛', '五味子', '麻黄', '石膏'
]

// 提取治疗方法段落
const treatmentSections = computed(() => {
  const content = caseItem.value?.content || ''
  const sections: string[] = []

  // 按句号分句
  const sentences = content.split(/[。，]/)

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length < 5) continue

    // 检查是否包含治疗相关关键词
    const hasTreatmentKeyword = TREATMENT_KEYWORDS.some(kw => trimmed.includes(kw))
    const hasFormula = KNOWN_FORMULAS.some(f => trimmed.includes(f))

    if (hasTreatmentKeyword || hasFormula) {
      // 提取包含方剂名的句子
      if (hasFormula && trimmed.length > 10 && trimmed.length < 100) {
        sections.push(trimmed)
      }
    }
  }

  // 去重并限制数量
  const unique = [...new Set(sections)]
  return unique.slice(0, 8)
})

// 高亮内容
const highlightedContent = computed(() => {
  let content = caseItem.value?.content || caseItem.value?.summary || ''

  // 清理内容
  content = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/, '')
    .trim()

  // 转义HTML
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 高亮方剂名
  for (const formula of KNOWN_FORMULAS) {
    const regex = new RegExp(`(${formula})`, 'g')
    content = content.replace(regex, '<span style="color:#8B0000;font-weight:bold;background:rgba(139,0,0,0.1);padding:1px 4px;border-radius:3px;">$1</span>')
  }

  // 高亮穴位名
  for (const point of ACUPUNCTURE_POINTS) {
    const regex = new RegExp(`(${point})`, 'g')
    content = content.replace(regex, '<span style="color:#9370DB;font-weight:bold;background:rgba(147,112,219,0.1);padding:1px 4px;border-radius:3px;">$1</span>')
  }

  // 高亮治疗关键词
  const highlightWords = ['使用', '给予', '服用', '处方', '开方', '用药']
  for (const word of highlightWords) {
    const regex = new RegExp(`(${word})`, 'g')
    content = content.replace(regex, '<span style="color:#2E8B57;font-weight:bold;">$1</span>')
  }

  // 高亮剂量描述
  content = content.replace(/(一付|二付|三付|五付|七付|十付|\d+付)/g, '<span style="color:#B8860B;font-weight:bold;">$1</span>')

  // 换行转为<br/>
  content = content.replace(/\n/g, '<br/>')

  return content
})

onLoad((options) => {
  if (options?.id) {
    caseId.value = options.id
    uni.setNavigationBarTitle({ title: `医案 ${caseId.value}` })
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #4682B4, #5F9EA0);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.category {
  font-size: 24rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.disease {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.info-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.treatment-row {
  background: rgba(139, 0, 0, 0.03);
  margin: 8rpx -12rpx;
  padding: 12rpx;
  border-radius: 8rpx;
}

.info-label {
  width: 120rpx;
  font-size: 26rpx;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.info-value.highlight {
  color: #8B0000;
  font-weight: 500;
}

.info-value.outcome {
  font-weight: 500;
}

.info-value.outcome.好转 {
  color: #2E8B57;
}

.info-value.outcome.痊愈 {
  color: #fff;
  background: #2E8B57;
  padding: 2px 8px;
  border-radius: 4px;
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.prescription-section {
  border-left: 4rpx solid #9370DB;
}

.prescription-card {
  background: #f9f9f9;
  border-radius: 8rpx;
  padding: 16rpx;
}

.point-group {
  margin-bottom: 16rpx;
}

.point-group:last-child {
  margin-bottom: 0;
}

.group-label {
  display: inline-block;
  font-size: 24rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  margin-bottom: 8rpx;
}

.group-label.main {
  color: #8B0000;
  background: rgba(139, 0, 0, 0.1);
}

.group-label.supplementary {
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.1);
}

.point-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.point-tag {
  font-size: 24rpx;
  padding: 6rpx 12rpx;
  border-radius: 16rpx;
}

.point-tag.main {
  color: #8B0000;
  background: rgba(139, 0, 0, 0.08);
  border: 1rpx solid rgba(139, 0, 0, 0.2);
}

.point-tag.supplementary {
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.08);
  border: 1rpx solid rgba(46, 139, 87, 0.2);
}

.treatment-section {
  border-left: 4rpx solid #8B0000;
}

.treatment-list {
  display: grid;
  gap: 12rpx;
}

.treatment-item {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 16rpx;
  background: rgba(139, 0, 0, 0.03);
  border-radius: 8rpx;
  border-left: 3rpx solid #8B0000;
}

.treatment-text {
  font-size: 26rpx;
  color: #444;
  line-height: 1.6;
}

.content-wrapper {
  background: #fafafa;
  border-radius: 8rpx;
  padding: 20rpx;
}

.content {
  font-size: 28rpx;
  color: #444;
  line-height: 2;
  word-break: break-all;
}

.disclaimer {
  background: #FFF8DC;
  border-radius: 12rpx;
  padding: 24rpx;
  border-left: 4rpx solid #DAA520;
}

.disclaimer-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #8B4513;
  margin-bottom: 8rpx;
}

.disclaimer-text {
  font-size: 24rpx;
  color: #8B4513;
  line-height: 1.6;
}
</style>
