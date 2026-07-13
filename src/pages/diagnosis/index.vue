<template>
  <view class="container">
    <!-- 六经选择 -->
    <view class="meridian-grid">
      <view
        v-for="item in sixMeridians"
        :key="item.name"
        class="meridian-card"
        :class="{ active: selectedMeridian === item.name }"
        @tap="selectMeridian(item.name)"
      >
        <text class="meridian-name">{{ item.name }}</text>
        <text class="meridian-desc">{{ item.description }}</text>
      </view>
    </view>

    <!-- 辨证结果 -->
    <view v-if="currentMeridian" class="result-section">
      <view class="result-header">
        <text class="result-title">{{ currentMeridian.name }}病</text>
        <text class="result-desc">{{ currentMeridian.description }}</text>
      </view>

      <!-- 主要症状 -->
      <view class="section">
        <text class="section-title">主要症状</text>
        <view class="tag-list">
          <text v-for="item in currentMeridian.symptoms" :key="item" class="tag symptom">{{ item }}</text>
        </view>
      </view>

      <!-- 代表方剂 -->
      <view class="section">
        <text class="section-title">代表方剂</text>
        <view class="formula-list">
          <view
            v-for="item in relatedFormulas"
            :key="item.name"
            class="formula-item"
            @tap="goToFormula(item.name)"
          >
            <text class="formula-name">{{ item.name }}</text>
            <text class="formula-usage">{{ item.usage }}</text>
          </view>
        </view>
      </view>

      <!-- 辨证要点 -->
      <view class="section">
        <text class="section-title">辨证要点</text>
        <view class="points-list">
          <view v-for="(point, index) in diagnosisPoints" :key="index" class="point-item">
            <text class="point-index">{{ index + 1 }}</text>
            <text class="point-text">{{ point }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 症状输入 -->
    <view class="input-section">
      <text class="section-title">输入症状自测</text>
      <textarea
        v-model="symptomInput"
        class="symptom-input"
        placeholder="请输入您的症状，如：发热、恶寒、头痛..."
        :maxlength="500"
      />
      <button class="analyze-btn" @tap="analyzeSymptoms">分析症状</button>

      <!-- 分析结果 -->
      <view v-if="analysisResult" class="analysis-result">
        <text class="analysis-title">分析结果</text>
        <view class="analysis-list">
          <view
            v-for="item in analysisResult"
            :key="item.name"
            class="analysis-item"
            @tap="selectMeridian(item.name)"
          >
            <text class="analysis-name">{{ item.name }}病</text>
            <text class="analysis-score">匹配度 {{ item.score }}%</text>
            <text class="analysis-formula">{{ item.formula }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import sixMeridiansData from '@/data/six-meridians.json'
import formulasData from '@/data/formulas.json'

const selectedMeridian = ref('')
const symptomInput = ref('')
const analysisResult = ref<any[]>([])

const sixMeridians = ref(sixMeridiansData)

const currentMeridian = computed(() => {
  return sixMeridians.value.find(m => m.name === selectedMeridian.value)
})

const relatedFormulas = computed(() => {
  if (!currentMeridian.value) return []
  const formulaNames = currentMeridian.value.formula.split('、')
  return formulasData.filter(f => formulaNames.includes(f.name))
})

const diagnosisPoints = computed(() => {
  const points: Record<string, string[]> = {
    '太阳': [
      '脉浮，头项强痛而恶寒',
      '有汗为中风（桂枝汤），无汗为伤寒（麻黄汤）',
      '发热恶寒为表证特征',
      '病在体表，为六经之藩篱'
    ],
    '阳明': [
      '胃家实是也',
      '身热汗自出，不恶寒反恶热',
      '脉洪大或沉实',
      '白虎汤清热，承气汤攻下'
    ],
    '少阳': [
      '口苦咽干目眩',
      '往来寒热，胸胁苦满',
      '嘿嘿不欲饮食，心烦喜呕',
      '但见一证便是，不必悉具'
    ],
    '太阴': [
      '腹满而吐，食不下',
      '自利益甚，时腹自痛',
      '口不渴，脉缓弱',
      '脾虚寒湿，理中汤主之'
    ],
    '少阴': [
      '脉微细，但欲寐',
      '畏寒蜷卧，四肢厥逆',
      '心肾阳虚，为六经最危阶段',
      '四逆汤回阳，真武汤温阳利水'
    ],
    '厥阴': [
      '消渴，气上撞心',
      '心中疼热，饥不欲食',
      '寒热错杂，上热下寒',
      '乌梅丸主之'
    ]
  }
  return points[selectedMeridian.value] || []
})

onLoad((options) => {
  if (options?.meridian) {
    selectedMeridian.value = decodeURIComponent(options.meridian)
  }
})

function selectMeridian(name: string) {
  selectedMeridian.value = name
}

function goToFormula(name: string) {
  uni.navigateTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}

function analyzeSymptoms() {
  if (!symptomInput.value.trim()) {
    uni.showToast({ title: '请输入症状', icon: 'none' })
    return
  }

  const input = symptomInput.value.toLowerCase()
  const results: any[] = []

  for (const meridian of sixMeridians.value) {
    let score = 0
    const matchedSymptoms: string[] = []

    for (const symptom of meridian.symptoms) {
      if (input.includes(symptom)) {
        score += 20
        matchedSymptoms.push(symptom)
      }
    }

    // 关键词匹配
    const keywords: Record<string, string[]> = {
      '太阳': ['发热', '恶寒', '头痛', '项强', '鼻塞', '咳嗽', '无汗', '有汗'],
      '阳明': ['壮热', '大汗', '大渴', '便秘', '腹满', '谵语', '高烧'],
      '少阳': ['口苦', '咽干', '目眩', '往来寒热', '胸胁', '呕吐', '苦满'],
      '太阴': ['腹痛', '呕吐', '下利', '腹泻', '腹满', '不渴', '食不下'],
      '少阴': ['畏寒', '蜷卧', '厥逆', '脉微', '但欲寐', '嗜睡', '无力'],
      '厥阴': ['消渴', '撞心', '心疼', '饥不欲食', '寒热', '错杂']
    }

    if (keywords[meridian.name]) {
      for (const keyword of keywords[meridian.name]) {
        if (input.includes(keyword)) {
          score += 15
        }
      }
    }

    if (score > 0) {
      results.push({
        name: meridian.name,
        score: Math.min(score, 100),
        formula: meridian.formula,
        matchedSymptoms
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  analysisResult.value = results.slice(0, 3)
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.meridian-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.meridian-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.meridian-card.active {
  background: linear-gradient(135deg, #8B0000, #A52A2A);
}

.meridian-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.meridian-card.active .meridian-name {
  color: #fff;
}

.meridian-desc {
  font-size: 24rpx;
  color: #666;
}

.meridian-card.active .meridian-desc {
  color: rgba(255, 255, 255, 0.8);
}

.result-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.result-header {
  margin-bottom: 24rpx;
}

.result-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #8B0000;
  margin-bottom: 8rpx;
}

.result-desc {
  font-size: 28rpx;
  color: #666;
}

.section {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.tag.symptom {
  background: rgba(255, 107, 107, 0.1);
  color: #FF6B6B;
}

.formula-list {
  display: grid;
  gap: 12rpx;
}

.formula-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}

.formula-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.formula-usage {
  font-size: 22rpx;
  color: #999;
}

.points-list {
  display: grid;
  gap: 12rpx;
}

.point-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.point-index {
  width: 36rpx;
  height: 36rpx;
  background: #8B0000;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  flex-shrink: 0;
}

.point-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.input-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.symptom-input {
  width: 100%;
  height: 200rpx;
  padding: 16rpx;
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}

.analyze-btn {
  width: 100%;
  height: 88rpx;
  background: #8B0000;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.analysis-result {
  margin-top: 24rpx;
}

.analysis-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.analysis-list {
  display: grid;
  gap: 12rpx;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}

.analysis-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.analysis-score {
  font-size: 24rpx;
  color: #8B0000;
  font-weight: 600;
}

.analysis-formula {
  font-size: 22rpx;
  color: #999;
}
</style>
