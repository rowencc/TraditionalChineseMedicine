<template>
  <view class="container" :class="themeClass">
    <!-- 未登录：留在本页提示，不再自动跳转登录页（可在登录后回到本页） -->
    <view v-if="!isLoggedIn" class="login-state">
      <text class="login-state-text">登录后可查看交易记录</text>
      <button class="btn-login" @tap="goToLogin">去登录</button>
    </view>

    <block v-else>
    <!-- 余额卡片 -->
    <view class="balance-card">
      <text class="balance-label">当前余额</text>
      <view class="balance-row">
        <text class="balance-num">{{ balance }}</text>
        <text class="balance-unit">古币</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="section" v-for="order in orders" :key="order.id">
      <view class="order-header">
        <text class="order-product">{{ productNames[order.product_id] || order.product_id }}</text>
        <text class="order-status" :class="getStatusClass(order)">{{ getStatusText(order) }}</text>
      </view>
      <view class="order-info">
        <text class="order-amount">{{ order.coins }} 古币 / ¥{{ (order.amount / 100).toFixed(2) }}</text>
        <text class="order-time">{{ order.create_time }}</text>
      </view>
      <view class="order-no">
        <text class="label">订单号：</text>
        <text class="value">{{ order.out_trade_no }}</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-if="!loading && orders.length === 0">
      <text class="empty-text">暂无交易记录</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-more" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="!loading && hasMore" @tap="loadMore">
      <text class="load-more-text">加载更多</text>
    </view>
    </block>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/utils/theme'
import api from '@/utils/api'
import { authState } from '@/utils/auth'

const { themeClass } = useTheme()
// 登录态响应式：会话过期时自动回到登录提示，不再反复跳转登录页
const isLoggedIn = computed(() => authState.loggedIn)
const orders = ref<any[]>([])
const balance = ref(0)
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)

const productNames: Record<string, string> = {
  'coin_pack_1': '体验1古币',
  'coin_pack_10': '10古币',
  'coin_pack_50': '50古币',
  'coin_pack_100': '100古币',
  'coin_pack_200': '200古币'
}

onShow(() => {
  if (!isLoggedIn.value) {
    // 未登录时清空列表，由页面内提示引导登录，避免"返回即跳登录页"的死循环
    orders.value = []
    balance.value = 0
    hasMore.value = true
    page.value = 1
    return
  }
  page.value = 1
  orders.value = []
  loadOrders()
})

function goToLogin() {
  uni.navigateTo({ url: `/pages/login/index?redirect=${encodeURIComponent('back')}` })
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await api.request('pay', 'my_orders', { page: page.value, limit: 20 })
    if (res.code === 1) {
      const list = res.data.list || []
      if (page.value === 1) {
        orders.value = list
      } else {
        orders.value = [...orders.value, ...list]
      }
      balance.value = res.data.balance || 0
      hasMore.value = list.length >= 20
    }
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  loadOrders()
}

function getStatusText(order: any): string {
  if (order.refund_status === 0) return '退款审核中'
  if (order.refund_status === 1) return '已退款'
  if (order.status === 2) return '已完成'
  if (order.status === 3) return '已退款'
  return '未知'
}

function getStatusClass(order: any): string {
  if (order.refund_status === 0) return 'status-pending'
  if (order.refund_status === 1 || order.status === 3) return 'status-refunded'
  if (order.status === 2) return 'status-completed'
  return ''
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.login-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.login-state-text {
  font-size: 30rpx;
  color: var(--text-secondary);
  margin-bottom: 24rpx;
}

.btn-login {
  padding: 16rpx 48rpx;
  background: var(--brand);
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.balance-card {
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  border-radius: 16rpx;
  padding: 32rpx 40rpx;
  margin-bottom: 24rpx;
  color: #fff;
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.balance-row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 8rpx;
}

.balance-num {
  font-size: 56rpx;
  font-weight: 700;
}

.balance-unit {
  font-size: 24rpx;
  opacity: 0.7;
}

.section {
  background: var(--bg-card);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.order-product {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.order-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.status-completed {
  color: var(--jade-ink);
  background: var(--jade-soft);
}

.status-pending {
  color: #DAA520;
  background: rgba(218, 165, 32, 0.1);
}

.status-refunded {
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.05);
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.order-amount {
  font-size: 28rpx;
  color: var(--brand-ink);
  font-weight: 600;
}

.order-time {
  font-size: 22rpx;
  color: var(--text-muted);
}

.order-no {
  display: flex;
  font-size: 22rpx;
  color: var(--text-muted);
  margin-bottom: 12rpx;
}

.order-no .label {
  flex-shrink: 0;
}

.order-no .value {
  word-break: break-all;
}

.empty {
  text-align: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-muted);
}

.loading-more, .load-more {
  text-align: center;
  padding: 24rpx;
}

.loading-text, .load-more-text {
  font-size: 24rpx;
  color: var(--text-muted);
}

.load-more-text {
  color: var(--brand-ink);
}
</style>
