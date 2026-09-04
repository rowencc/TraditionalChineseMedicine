<template>
  <view class="container" :class="themeClass">
    <!-- 代币余额卡片 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-label">我的古币</text>
        <text class="free-hint" v-if="balanceInfo.free_remaining > 0">今日免费次数：{{ balanceInfo.free_remaining }}次</text>
        <text class="free-hint used" v-else>今日免费次数已用完</text>
      </view>
      <view class="balance-main">
        <text class="balance-num">{{ balanceInfo.balance }}</text>
        <text class="balance-unit">古币</text>
      </view>
      <view class="balance-stats">
        <view class="stat-item">
          <text class="stat-val">{{ balanceInfo.total_recharged }}</text>
          <text class="stat-label">累计充值</text>
        </view>
        <view class="stat-item">
          <text class="stat-val">{{ balanceInfo.total_consumed }}</text>
          <text class="stat-label">累计消费</text>
        </view>
      </view>
    </view>

    <!-- 每日签到 -->
    <view class="section sign-section">
      <view class="sign-header">
        <text class="section-title">每日签到</text>
        <text class="sign-streak" v-if="signInStatus.streak > 1">连续{{ signInStatus.streak }}天</text>
      </view>
      <!-- 近7天签到日历 -->
      <view class="sign-week">
        <view
          v-for="(day, idx) in signInStatus.week_days"
          :key="idx"
          class="sign-day"
          :class="{ signed: day.signed, today: isToday(day.date) }"
        >
          <text class="day-label">{{ getDayLabel(day.date) }}</text>
          <view class="day-dot">
            <text v-if="day.signed">✓</text>
            <text v-else-if="isToday(day.date)">今</text>
          </view>
        </view>
      </view>
      <!-- 签到按钮 -->
      <button
        class="sign-btn"
        :class="{ signed: signInStatus.is_signed }"
        :disabled="signInStatus.is_signed || signingIn"
        @tap="handleSignIn"
      >
        {{ signInStatus.is_signed ? '今日已签到 ✓' : (signingIn ? '签到中...' : '签到领' + signInStatus.coins_per_day + '古币') }}
      </button>
    </view>

    <!-- 使用说明 -->
    <view class="section">
      <text class="section-title">代币说明</text>
      <view class="info-list">
        <text class="info-item">每天可免费使用1次「问一问」AI辨证服务</text>
        <text class="info-item">第2次起每次消耗1古币</text>
        <text class="info-item">充值后古币永久有效，不会过期</text>
      </view>
    </view>

    <!-- 充值套餐 -->
    <view class="section">
      <text class="section-title">充值套餐</text>
      <view class="package-grid">
        <view
          v-for="pkg in packages"
          :key="pkg.product_id"
          class="package-card"
          :class="{ active: selectedPackage === pkg.product_id }"
          @tap="selectedPackage = pkg.product_id"
        >
          <view class="pkg-coins-wrap">
            <text class="pkg-coins">{{ pkg.coins }}</text>
            <text class="pkg-unit">古币</text>
          </view>
          <text class="pkg-price">¥{{ (pkg.price / 100).toFixed(2) }}</text>
          <text class="pkg-tag" v-if="pkg.coins >= 100">超值</text>
          <text class="pkg-tag" v-else-if="pkg.coins >= 50">推荐</text>
        </view>
      </view>
    </view>

    <!-- 充值按钮 -->
    <view class="recharge-bottom">
      <button
        class="recharge-btn"
        :disabled="!selectedPackage || paying"
        @tap="handleRecharge"
      >
        {{ paying ? '支付中...' : selectedPackage ? `立即充值 ¥${getSelectedPrice()}` : '请选择充值套餐' }}
      </button>
      <text class="recharge-hint">充值即表示同意《充值服务协议》</text>
    </view>

    <!-- 交易记录入口 -->
    <view class="section" v-if="isLoggedIn">
      <view class="record-link" @tap="goToTransactions">
        <text class="record-text">交易记录</text>
        <text class="record-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/utils/theme'
import api from '@/utils/api'
import { getBalance, getProducts, createOrderAndPay, getSignInStatus, signIn } from '@/utils/pay'
import type { CoinBalance, CoinPackage, SignInStatus } from '@/utils/pay'

const { themeClass } = useTheme()
const isLoggedIn = ref(false)
const balanceInfo = ref<CoinBalance>({
  balance: 0,
  total_recharged: 0,
  total_consumed: 0,
  free_remaining: 1,
  free_used: 0
})
const packages = ref<CoinPackage[]>([])
const selectedPackage = ref('')
const paying = ref(false)
const signingIn = ref(false)
const signInStatus = ref<SignInStatus>({
  is_signed: false,
  streak: 1,
  coins_per_day: 3,
  week_days: []
})

onShow(() => {
  isLoggedIn.value = api.isLoggedIn()
  if (isLoggedIn.value) {
    loadData()
  }
})

async function loadData() {
  try {
    const [bal, pkgs, signStatus] = await Promise.all([getBalance(), getProducts(), getSignInStatus()])
    balanceInfo.value = bal
    packages.value = pkgs
    signInStatus.value = signStatus
    if (pkgs.length > 0 && !selectedPackage.value) {
      selectedPackage.value = pkgs[0].product_id
    }
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

function getSelectedPrice(): string {
  const pkg = packages.value.find(p => p.product_id === selectedPackage.value)
  return pkg ? (pkg.price / 100).toFixed(2) : '0.00'
}

async function handleRecharge() {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  if (!selectedPackage.value) {
    uni.showToast({ title: '请选择充值套餐', icon: 'none' })
    return
  }
  if (paying.value) return

  paying.value = true
  try {
    const success = await createOrderAndPay(selectedPackage.value)
    if (success) {
      // 刷新余额
      await loadData()
    }
  } finally {
    paying.value = false
  }
}

async function handleSignIn() {
  if (signInStatus.value.is_signed || signingIn.value) return
  signingIn.value = true
  try {
    const result = await signIn()
    if (result.success) {
      uni.showToast({ title: `签到成功 +${result.coins}古币`, icon: 'success' })
      // 刷新数据
      await loadData()
    }
  } finally {
    signingIn.value = false
  }
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return dateStr === `${y}-${m}-${d}`
}

function getDayLabel(dateStr: string): string {
  const dayMap: Record<string, string> = { 'Mon': '一', 'Tue': '二', 'Wed': '三', 'Thu': '四', 'Fri': '五', 'Sat': '六', 'Sun': '日' }
  const date = new Date(dateStr)
  const dayEn = date.toLocaleDateString('en-US', { weekday: 'short' })
  return dayMap[dayEn] || dateStr.slice(-2)
}

function goToTransactions() {
  uni.navigateTo({ url: '/pages/transactions/index' })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 200rpx;
}

.balance-card {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  color: #fff;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.balance-label {
  font-size: 28rpx;
  opacity: 0.8;
}

.free-hint {
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.free-hint.used {
  background: rgba(0, 0, 0, 0.2);
}

.balance-main {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.balance-num {
  font-size: 72rpx;
  font-weight: 700;
  line-height: 1;
}

.balance-unit {
  font-size: 28rpx;
  opacity: 0.7;
}

.balance-stats {
  display: flex;
  gap: 40rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stat-val {
  font-size: 28rpx;
  font-weight: 600;
}

.stat-label {
  font-size: 22rpx;
  opacity: 0.6;
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

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-item {
  font-size: 24rpx;
  color: #666;
  padding-left: 16rpx;
  position: relative;
}

.info-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14rpx;
  width: 8rpx;
  height: 8rpx;
  background: #8B2500;
  border-radius: 50%;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.package-card {
  position: relative;
  background: #FAFAF7;
  border: 2rpx solid #E8E0D4;
  border-radius: 12rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  transition: all 0.2s;
}

.package-card.active {
  border-color: #8B2500;
  background: rgba(139, 37, 0, 0.05);
  box-shadow: 0 4rpx 16rpx rgba(139, 37, 0, 0.15);
}

.pkg-coins-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
  margin-bottom: 8rpx;
}

.pkg-coins {
  font-size: 40rpx;
  font-weight: 700;
  color: #8B2500;
}

.pkg-unit {
  font-size: 22rpx;
  color: #999;
}

.pkg-price {
  display: block;
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.pkg-tag {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  background: linear-gradient(135deg, #DAA520, #B8860B);
  color: #fff;
  font-size: 18rpx;
  padding: 2rpx 12rpx;
  border-radius: 0 12rpx 0 12rpx;
}

.recharge-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.recharge-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  padding: 0;
}

.recharge-btn:disabled {
  background: #ccc;
  color: #fff;
}

.recharge-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
}

.record-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.record-text {
  font-size: 28rpx;
  color: #333;
}

.record-arrow {
  font-size: 32rpx;
  color: #ccc;
}

/* 签到区域 */
.sign-section {
  position: relative;
  overflow: hidden;
}

.sign-section::after {
  content: '';
  position: absolute;
  top: -20rpx;
  right: -20rpx;
  width: 120rpx;
  height: 120rpx;
  background: rgba(139, 37, 0, 0.05);
  border-radius: 50%;
}

.sign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.sign-streak {
  font-size: 24rpx;
  color: #DAA520;
  font-weight: 600;
  background: rgba(218, 165, 32, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.sign-week {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.sign-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.day-label {
  font-size: 22rpx;
  color: #999;
}

.day-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #F5F0E8;
  border: 2rpx solid #E8E0D4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #ccc;
  transition: all 0.3s;
}

.sign-day.signed .day-dot {
  background: linear-gradient(135deg, #2D5F4A, #3D7A62);
  border-color: #2D5F4A;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
}

.sign-day.today .day-dot {
  border-color: #8B2500;
  color: #8B2500;
  font-weight: 600;
}

.sign-day.today.signed .day-dot {
  background: linear-gradient(135deg, #2D5F4A, #3D7A62);
  border-color: #2D5F4A;
  color: #fff;
}

.sign-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, #DAA520, #B8860B);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
  padding: 0;
}

.sign-btn.signed {
  background: #E8E0D4;
  color: #999;
}

.sign-btn:disabled {
  opacity: 0.8;
}
</style>
