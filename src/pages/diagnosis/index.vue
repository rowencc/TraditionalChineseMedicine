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
      <view class="header-top">
        <text class="title">问一问</text>
        <view class="coin-badge" v-if="api.isLoggedIn()" @tap="goToRecharge">
          <text class="coin-icon">币</text>
          <text class="coin-count">{{ coinBalance.balance }}</text>
        </view>
      </view>
      <text class="subtitle">基于六经辨证的中医辅助分析</text>
      <view class="usage-info" v-if="api.isLoggedIn()">
        <text class="free-tag" v-if="coinBalance.free_remaining > 0">今日免费：{{ coinBalance.free_remaining }}次</text>
        <text class="free-tag used" v-else>今日免费已用完 · 消耗1古币/次</text>
      </view>
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
      {{ loading ? '分析中...' : (coinBalance.free_remaining > 0 ? '免费辨证' : '消耗1古币辨证') }}
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
import { onShow } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"
import { getBalance, useFree, consumeCoins } from '@/utils/pay'
import type { CoinBalance } from '@/utils/pay'

const { themeClass } = useTheme()
const symptoms = ref('')
const loading = ref(false)
const result = ref<any>(null)

// 代币信息
const coinBalance = ref<CoinBalance>({
  balance: 0,
  total_recharged: 0,
  total_consumed: 0,
  free_remaining: 1,
  free_used: 0
})

// 从首页六经卡片跳转过来时，读取 storage 中的经络名
onShow(() => {
  const meridian = uni.getStorageSync('diagnosis_meridian')
  if (meridian) {
    uni.removeStorageSync('diagnosis_meridian')
    symptoms.value = meridian + '证'
  }
  // 加载代币余额
  if (api.isLoggedIn()) {
    loadCoinBalance()
  }
})

async function loadCoinBalance() {
  try {
    const data = await getBalance()
    coinBalance.value = data
  } catch {}
}

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

  // 检查登录状态
  if (!api.isLoggedIn()) {
    uni.showModal({
      title: '提示',
      content: '请先登录后使用问一问服务',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/login/index' })
        }
      }
    })
    return
  }

  // 检查免费次数和代币
  let isFreeUse = false
  try {
    await loadCoinBalance()
    if (coinBalance.value.free_remaining > 0) {
      isFreeUse = true
    } else if (coinBalance.value.balance <= 0) {
      // 无免费次数且无代币
      uni.showModal({
        title: '次数不足',
        content: '今日免费次数已用完，古币余额不足。充值古币可继续使用。',
        confirmText: '去充值',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/recharge/index' })
          }
        }
      })
      return
    } else {
      // 提示将消耗代币
      const confirmRes = await new Promise<boolean>((resolve) => {
        uni.showModal({
          title: '提示',
          content: '今日免费次数已用完，本次问诊将消耗1古币。当前余额：' + coinBalance.value.balance + '古币',
          confirmText: '继续',
          cancelText: '取消',
          success: (res) => resolve(!!res.confirm)
        })
      })
      if (!confirmRes) return
    }
  } catch {}

  loading.value = true
  result.value = null

  try {
    const res = await api.request('ai', 'consult', { symptoms: symptoms.value }, 'POST')
    if (res.code === 1) {
      result.value = res.data

      // 扣费/记录免费使用
      if (isFreeUse) {
        await useFree()
      } else {
        await consumeCoins(1, 'AI问诊')
      }

      // 刷新余额
      await loadCoinBalance()

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

function goToRecharge() {
  uni.navigateTo({ url: '/pages/recharge/index' })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 120rpx;
  box-sizing: border-box;
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

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.coin-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}

.coin-icon {
  width: 32rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #fff;
  font-weight: 700;
}

.coin-count {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}

.usage-info {
  margin-top: 12rpx;
}

.free-tag {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.free-tag.used {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.15);
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
