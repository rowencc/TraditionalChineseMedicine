<template>
  <view class="container" :class="themeClass">
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/utils/theme'
import api from '@/utils/api'

const { themeClass } = useTheme()
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
  if (!api.isLoggedIn()) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  page.value = 1
  orders.value = []
  loadOrders()
})

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
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.balance-card {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
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
  background: #fff;
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
  color: #333;
}

.order-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.status-completed {
  color: #2D5F4A;
  background: rgba(45, 95, 74, 0.1);
}

.status-pending {
  color: #DAA520;
  background: rgba(218, 165, 32, 0.1);
}

.status-refunded {
  color: #999;
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
  color: #8B2500;
  font-weight: 600;
}

.order-time {
  font-size: 22rpx;
  color: #999;
}

.order-no {
  display: flex;
  font-size: 22rpx;
  color: #999;
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
  color: #999;
}

.loading-more, .load-more {
  text-align: center;
  padding: 24rpx;
}

.loading-text, .load-more-text {
  font-size: 24rpx;
  color: #999;
}

.load-more-text {
  color: #8B2500;
}
</style>
