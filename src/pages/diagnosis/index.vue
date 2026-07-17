<script lang="ts">
export default {
  onShareAppMessage() {
    return { title: '问一问 - 六经辨证辅助分析', path: '/pages/diagnosis/index' }
  },
  onShareTimeline() {
    return { title: '问一问 - 六经辨证辅助分析' }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 标题 -->
    <view class="header">
      <text class="title">问一问</text>
      <text class="subtitle">基于六经辨证的中医辅助分析</text>
    </view>

    <!-- 症状输入 -->
    <view class="section">
      <text class="section-title">描述您的症状</text>
      <textarea 
        class="symptom-input" 
        v-model="symptoms" 
        placeholder="请详细描述您的症状，例如：发热、恶寒、头痛、无汗、口渴..."
        :maxlength="500"
      />
      <text class="char-count">{{ symptoms.length }}/500</text>
    </view>

    <!-- 快捷症状 -->
    <view class="section">
      <text class="section-title">常见症状（点击添加）</text>
      <view class="quick-tags">
        <view 
          v-for="tag in quickSymptoms" 
          :key="tag"
          class="quick-tag"
          @tap="addSymptom(tag)"
        >
          {{ tag }}
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <button 
      class="submit-btn" 
      @tap="analyzeSymptoms" 
      :disabled="!symptoms || loading"
    >
      {{ loading ? '分析中...' : '辅助辨证' }}
    </button>

    <!-- 诊断结果 -->
    <view v-if="result" class="result-section">
      <view class="result-header">
        <text class="result-title">辨证结果</text>
        <text class="result-source" v-if="result.source">来源：{{ result.source }}</text>
      </view>
      
      <!-- 六经归属 -->
      <view class="meridian-result" v-if="result.meridian">
        <text class="meridian-label">六经归属</text>
        <text class="meridian-value">{{ result.meridian }}</text>
      </view>

      <!-- 推荐方剂 -->
      <view class="section" v-if="result.suggested_formulas?.length > 0">
        <text class="section-title">推荐方剂</text>
        <view class="formula-tags">
          <view 
            v-for="formula in result.suggested_formulas" 
            :key="formula"
            class="formula-tag"
            @tap="goToFormula(formula)"
          >
            {{ formula }}
          </view>
        </view>
      </view>

      <!-- 详细分析 -->
      <view class="section">
        <text class="section-title">详细分析</text>
        <text class="analysis-text">{{ result.analysis || result.raw_response }}</text>
      </view>

      <!-- 注意事项 -->
      <view class="section advice-section" v-if="result.advice">
        <text class="section-title">注意事项</text>
        <text class="advice-text">{{ result.advice }}</text>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="disclaimer-text">
        温馨提示：本功能仅供参考学习，不替代专业医疗诊断。如有不适，请咨询执业医师。
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const symptoms = ref('')
const loading = ref(false)
const result = ref<any>(null)

const quickSymptoms = [
  '发热', '恶寒', '头痛', '无汗', '有汗', '口渴',
  '呕吐', '腹痛', '腹泻', '便秘', '咳嗽', '失眠',
  '心悸', '眩晕', '腰痛', '水肿'
]

function addSymptom(tag: string) {
  if (symptoms.value) {
    symptoms.value += '，' + tag
  } else {
    symptoms.value = tag
  }
}

async function analyzeSymptoms() {
  if (!symptoms.value.trim()) {
    uni.showToast({ title: '请描述您的症状', icon: 'none' })
    return
  }

  loading.value = true
  result.value = null

  try {
    const res = await api.request('ai', 'consult', { symptoms: symptoms.value }, 'POST')
    if (res.code === 1) {
      result.value = res.data
      // 记录问诊
      if (api.isLoggedIn()) {
        api.recordLearning('diagnosis', 0, '问诊: ' + symptoms.value.substring(0, 30))
      }
    } else {
      uni.showToast({ title: res.msg || '分析失败', icon: 'none' })
    }
  } catch (e) {
    console.error('AI问诊失败', e)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goToFormula(name: string) {
  uni.navigateTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
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
}

.symptom-input {
  width: 100%;
  height: 200rpx;
  padding: 16rpx;
  border: 2rpx solid #E8E0D4;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #FAFAF7;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.quick-tag {
  padding: 12rpx 20rpx;
  background: #FAFAF7;
  border: 1rpx solid #E8E0D4;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.quick-tag:active {
  background: rgba(139, 37, 0, 0.1);
  color: #8B2500;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 500;
  margin: 24rpx 0;
  text-align: center;
}

.submit-btn:disabled {
  background: #ccc;
  color: #fff;
}

.result-section {
  margin-top: 24rpx;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.result-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2C2C2C;
}

.result-source {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.meridian-result {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  text-align: center;
}

.meridian-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8rpx;
}

.meridian-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
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
  margin-bottom: 12rpx;
}

.formula-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.formula-tag {
  padding: 10rpx 20rpx;
  background: rgba(139, 37, 0, 0.08);
  color: #8B2500;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.formula-tag:active {
  background: rgba(139, 37, 0, 0.15);
}

.analysis-text {
  font-size: 26rpx;
  color: #444;
  line-height: 1.8;
  white-space: pre-wrap;
}

.advice-section {
  border-left: 4rpx solid #B8860B;
}

.advice-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

.disclaimer {
  margin-top: 32rpx;
  padding: 20rpx;
  background: #FFF8DC;
  border-radius: 8rpx;
  border-left: 4rpx solid #DAA520;
}

.disclaimer-text {
  font-size: 22rpx;
  color: #8B4513;
  line-height: 1.6;
}
</style>
