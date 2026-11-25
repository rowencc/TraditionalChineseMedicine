<template>
  <view class="container" :class="themeClass" v-if="formula">
    <!-- 头部 -->
    <view class="header">
      <text class="name">{{ formula.name }}</text>
      <text class="meridian">{{ formula.meridian }}病</text>
    </view>

    <!-- 组成 -->
    <view class="section">
      <text class="section-title">组成</text>
      <view class="tag-list">
        <text v-for="item in compositionList" :key="item" class="tag">{{ item }}</text>
      </view>
    </view>

    <!-- 配伍分析 -->
    <view class="section" v-if="compositionAnalysis">
      <text class="section-title">配伍分析（君臣佐使）</text>
      <view class="analysis-list">
        <view class="analysis-item" v-if="compositionAnalysis.jun">
          <text class="ai-role jun">君</text>
          <text class="ai-text">{{ compositionAnalysis.jun }}</text>
        </view>
        <view class="analysis-item" v-if="compositionAnalysis.chen">
          <text class="ai-role chen">臣</text>
          <text class="ai-text">{{ compositionAnalysis.chen }}</text>
        </view>
        <view class="analysis-item" v-if="compositionAnalysis.zuo">
          <text class="ai-role zuo">佐</text>
          <text class="ai-text">{{ compositionAnalysis.zuo }}</text>
        </view>
        <view class="analysis-item" v-if="compositionAnalysis.shi">
          <text class="ai-role shi">使</text>
          <text class="ai-text">{{ compositionAnalysis.shi }}</text>
        </view>
      </view>
    </view>

    <!-- 剂量 -->
    <view class="section">
      <text class="section-title">剂量</text>
      <text class="content">{{ formula.dosage }}</text>
    </view>

    <!-- 主治 -->
    <view class="section">
      <text class="section-title">主治症状</text>
      <view class="tag-list">
        <text v-for="item in symptomsList" :key="item" class="tag symptom">{{ item }}</text>
      </view>
    </view>

    <!-- 功效 -->
    <view class="section">
      <text class="section-title">功效</text>
      <text class="content">{{ formula.formula_usage || formula.usage }}</text>
    </view>

    <!-- 功效详解 -->
    <view class="section" v-if="formula.efficacy">
      <text class="section-title">功效详解</text>
      <text class="content efficacy">{{ formula.efficacy }}</text>
    </view>

    <!-- 禁忌 -->
    <view class="section warning-section" v-if="formula.contraindications">
      <text class="section-title warning-title">禁忌</text>
      <text class="content warning-text">{{ formula.contraindications }}</text>
    </view>

    <!-- 古籍引用 -->
    <view class="section" v-if="classicalQuotes && classicalQuotes.length">
      <text class="section-title">古籍引用</text>
      <view class="classical-list">
        <view v-for="(q, i) in classicalQuotes" :key="i" class="classical-item">
          <text class="cq-title">{{ q.title }}</text>
          <text class="cq-text">「{{ q.text }}」</text>
        </view>
      </view>
    </view>

    <!-- 组合方剂：合方 / 加减方展示原方完整内容 -->
    <view class="section" v-if="componentList.length">
      <text class="section-title">组合方剂</text>
      <text class="combo-hint">本方由以下经方组合或加减而成，点击查看原方完整内容</text>
      <view class="combo-card" v-for="c in componentList" :key="c.name" @tap="goToDetail(c.name)">
        <view class="combo-head">
          <text class="combo-name">{{ c.name }}</text>
          <text class="combo-arrow">›</text>
        </view>
        <text class="combo-line" v-if="c.compositionText">组成：{{ c.compositionText }}</text>
        <text class="combo-line" v-if="c.dosage">用量：{{ c.dosage }}</text>
        <text class="combo-eff" v-if="c.efficacy">{{ c.efficacy }}</text>
      </view>
    </view>

    <!-- 加减变化 -->
    <view class="section" v-if="modifications && modifications.length">
      <text class="section-title">加减变化</text>
      <view class="modification-list">
        <view v-for="(m, i) in modifications" :key="i" class="modification-item">
          <text class="mo-text">{{ m }}</text>
        </view>
      </view>
    </view>

    <!-- 来源 -->
    <view class="section">
      <text class="section-title">来源</text>
      <text class="content source">{{ formula.source }}</text>
    </view>

    <!-- 相关方剂 -->
    <view class="section" v-if="relatedFormulas.length > 0">
      <text class="section-title">相关方剂</text>
      <view class="related-list">
        <view
          v-for="item in relatedFormulas"
          :key="item.id || item.name"
          class="related-item"
          @tap="goToDetail(item.name)"
        >
          <text class="related-name">{{ item.name }}</text>
          <text class="related-meridian">{{ item.meridian }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 未收录时的兜底，避免白屏 -->
  <view class="container empty-state" :class="themeClass" v-else-if="!loading">
    <view class="empty-seal">方</view>
    <text class="empty-title">{{ formulaName || '未指定方剂' }}</text>
    <text class="empty-desc">知识库暂未收录该方剂。若为合方或加减方，可在经方列表中查看对应的基础方。</text>
    <view class="empty-btn" @tap="goBack">返回</view>
  </view>
</template>

<script lang="ts">
import { getCurrentPageShareInfo } from '@/utils/share'

export default {
  onShareAppMessage() {
    return getCurrentPageShareInfo('经方速查')
  },
  onShareTimeline() {
    return { title: getCurrentPageShareInfo('经方速查').title }
  }
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"
import formulasData from '@/data/formulas.json'

const { themeClass } = useTheme()
const formula = ref<any>(null)
const formulaName = ref('')
const loading = ref(true)

const localFormulas = formulasData as any[]

// 本地知识库查找：先精确匹配，再去掉"加减方"后缀重试
function findLocalFormula(name: string): any | null {
  if (!name) return null
  const clean = name.replace(/[（(].*$/, '').replace(/\s/g, '')
  let hit = localFormulas.find(f => f && f.name === clean)
  if (hit) return hit
  const base = clean.replace(/加减方?$/, '')
  if (base !== clean) hit = localFormulas.find(f => f && f.name === base)
  return hit || null
}

// 本地字段是驼峰命名，统一映射成模板/服务端使用的字段
function adaptLocalFormula(f: any) {
  return {
    ...f,
    meridian: f.meridian || '',
    formula_usage: f.usage || '',
    composition_analysis: f.compositionAnalysis || null,
    classical_quotes: f.classicalQuotes || [],
    modifications: f.modifications || [],
    components: f.components || []
  }
}

const componentList = computed(() => {
  const names = Array.isArray(formula.value?.components) ? formula.value.components : []
  return names.map((n: string) => {
    const local = findLocalFormula(n)
    if (!local) return { name: n, compositionText: '', dosage: '', efficacy: '' }
    const item = adaptLocalFormula(local)
    return {
      name: item.name,
      compositionText: Array.isArray(item.composition) ? item.composition.join('、') : (item.composition || ''),
      dosage: item.dosage || '',
      efficacy: item.efficacy || item.usage || ''
    }
  })
})

// 解析JSON数组
function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val)
      return Array.isArray(arr) ? arr : [val]
    } catch {
      return val ? [val] : []
    }
  }
  return []
}

const compositionList = computed(() => {
  if (!formula.value) return []
  return parseJsonArray(formula.value.composition)
})

const symptomsList = computed(() => {
  if (!formula.value) return []
  return parseJsonArray(formula.value.symptoms)
})

const classicalQuotes = computed(() => {
  if (!formula.value?.classical_quotes) return []
  try {
    const val = formula.value.classical_quotes
    const arr = typeof val === 'string' ? JSON.parse(val) : val
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
})

const compositionAnalysis = computed(() => {
  if (!formula.value?.composition_analysis) return null
  try {
    const val = formula.value.composition_analysis
    return typeof val === 'string' ? JSON.parse(val) : val
  } catch { return null }
})

const modifications = computed(() => {
  if (!formula.value?.modifications) return []
  try {
    const val = formula.value.modifications
    const arr = typeof val === 'string' ? JSON.parse(val) : val
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
})

const relatedFormulas = ref<any[]>([])

onLoad(async (options) => {
  if (options?.name) {
    formulaName.value = decodeURIComponent(options.name)
    uni.setNavigationBarTitle({ title: formulaName.value })
    
    // 从服务器获取方剂详情，未收录时回落到本地知识库
    try {
      const res = await api.getFormulaDetail(undefined, formulaName.value)
      if (res.code === 1 && res.data) {
        formula.value = res.data
        // 组合关系只存在于本地知识库，服务端返回后补齐
        const local = findLocalFormula(formulaName.value)
        if (local && !formula.value.components) {
          formula.value.components = local.components || []
        }

        // 记录学习
        if (api.isLoggedIn()) {
          api.recordLearning('formula', res.data.id, res.data.name)
        }
      } else {
        const local = findLocalFormula(formulaName.value)
        if (local) {
          formula.value = adaptLocalFormula(local)
        } else {
          uni.showToast({ title: '未找到该方剂', icon: 'none' })
        }
      }
    } catch (e) {
      console.error('获取方剂详情失败', e)
      const local = findLocalFormula(formulaName.value)
      if (local) {
        formula.value = adaptLocalFormula(local)
      } else {
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    } finally {
      loading.value = false
    }
    
    // 获取相关方剂
    try {
      const res = await api.getFormulaList(1, 4, formula.value?.meridian || '')
      if (res.code === 1 && res.data?.list) {
        relatedFormulas.value = res.data.list.filter((f: any) => f.name !== formulaName.value)
      }
    } catch (e) {
      console.error('获取相关方剂失败', e)
    }
  }
})

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/diagnosis/index' })
  }
}

function goToDetail(name: string) {
  uni.redirectTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.meridian {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  display: inline-block;
}

.section {
  background: var(--bg-card);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.content {
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.8;
}

.source {
  color: var(--brand-ink);
  font-style: italic;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 8rpx 16rpx;
  background: var(--brand-soft);
  color: var(--brand-ink);
  border-radius: 16rpx;
  font-size: 24rpx;
}

.tag.symptom {
  background: rgba(46, 139, 74, 0.08);
  color: var(--jade-ink);
}

.related-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: var(--bg-elevated);
  border-radius: 8rpx;
}

.related-name {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-primary);
}

.related-meridian {
  font-size: 22rpx;
  color: var(--brand-ink);
}

.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.analysis-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: var(--bg-elevated);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.ai-role {
  display: inline-block;
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  border-radius: 50%;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.ai-role.jun { background: linear-gradient(135deg, var(--brand), var(--brand-light)); }
.ai-role.chen { background: linear-gradient(135deg, var(--jade), var(--jade)); }
.ai-role.zuo { background: linear-gradient(135deg, var(--accent), #DAA520); }
.ai-role.shi { background: linear-gradient(135deg, #4A90E2, #5BA3E8); }

.ai-text {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.7;
  flex: 1;
}

.efficacy {
  color: var(--jade-ink);
  font-weight: 500;
}

.warning-section {
  border-left: 4rpx solid #C0392B;
}

.warning-title {
  color: #C0392B;
}

.warning-text {
  color: #C0392B;
  font-weight: 500;
}

.classical-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.classical-item {
  background: var(--bg-quote);
  border-radius: 12rpx;
  padding: 20rpx;
  border-left: 4rpx solid #B8860B;
}

.cq-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #B8860B;
  margin-bottom: 8rpx;
}

.cq-text {
  font-size: 26rpx;
  color: #5D4E37;
  line-height: 1.8;
  font-style: italic;
}

.modification-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.modification-item {
  background: var(--bg-base);
  border-radius: 8rpx;
  padding: 14rpx 20rpx;
  border-left: 3rpx solid #2D5F4A;
}

.mo-text {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 组合方剂 */
.combo-hint {
  display: block;
  font-size: 22rpx;
  color: var(--text-muted);
  margin-bottom: 16rpx;
  line-height: 1.6;
}

.combo-card {
  padding: 22rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(184, 134, 11, 0.06);
  border: 1rpx solid rgba(184, 134, 11, 0.22);
  margin-bottom: 16rpx;
}

.combo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.combo-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--brand-ink);
}

.combo-arrow {
  font-size: 32rpx;
  color: #C0A46A;
}

.combo-line {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6A5A3A;
  line-height: 1.6;
}

.combo-eff {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #8A7A58;
  line-height: 1.6;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 220rpx;
  background: var(--bg-base);
}

.empty-seal {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14rpx;
}

.empty-desc {
  width: 80%;
  text-align: center;
  font-size: 25rpx;
  color: #8A8A8A;
  line-height: 1.7;
  margin-bottom: 40rpx;
}

.empty-btn {
  padding: 18rpx 64rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: #fff;
  font-size: 28rpx;
}
</style>
