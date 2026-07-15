<template>
  <view class="container">
    <view v-if="!isLoggedIn" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">请先登录查看问诊记录</text>
      <button class="btn-login" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="records.length === 0 && !loading" class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无问诊记录</text>
      <text class="empty-desc">使用AI问诊功能后，记录将显示在这里</text>
    </view>

    <view v-else>
      <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
        <view v-for="item in records" :key="item.id" class="record-card">
          <view class="record-header">
            <text class="record-date">{{ item.create_time }}</text>
            <text class="record-tag">AI问诊</text>
          </view>
          <view class="record-body">
            <text class="record-question">{{ item.symptoms }}</text>
            <text class="record-answer">{{ item.diagnosis }}</text>
          </view>
        </view>

        <view v-if="loading" class="loading">
          <text>加载中...</text>
        </view>

        <view v-if="!loading && records.length === 0" class="empty-hint">
          <text>暂无记录</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import api from '@/utils/api'

const isLoggedIn = ref(false)
const records = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

onShow(() => {
  isLoggedIn.value = api.isLoggedIn()
  if (isLoggedIn.value) {
    loadRecords(true)
  }
})

async function loadRecords(reset = false) {
  if (loading.value) return
  
  if (reset) {
    page.value = 1
    records.value = []
    hasMore.value = true
  }
  
  if (!hasMore.value) return
  
  loading.value = true
  
  try {
    const res = await api.getLearningList('diagnosis', page.value, 20)
    if (res.code === 1) {
      const newList = res.data.list || []
      if (reset) {
        records.value = newList
      } else {
        records.value = [...records.value, ...newList]
      }
      hasMore.value = newList.length >= 20
      page.value++
    }
  } catch (e) {
    console.error('加载问诊记录失败', e)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadRecords(false)
}

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #999;
}

.btn-login {
  margin-top: 24rpx;
  padding: 16rpx 48rpx;
  background: #8B2500;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.record-list {
  height: calc(100vh - 120rpx);
  padding: 24rpx;
}

.record-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-date {
  font-size: 24rpx;
  color: #999;
}

.record-tag {
  font-size: 22rpx;
  color: #8B2500;
  background: rgba(139, 37, 0, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.record-body {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.record-question {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.record-answer {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40rpx;
  color: #999;
}

.empty-hint {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
</style>
