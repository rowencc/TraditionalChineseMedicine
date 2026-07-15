<template>
  <view class="container" :class="themeClass">
    <view v-if="!isLoggedIn" class="empty-state">
      <text class="empty-text">请先登录查看问一问记录</text>
      <button class="btn-login" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="records.length === 0 && !loading" class="empty-state">
      <text class="empty-text">暂无问一问记录</text>
      <text class="empty-desc">使用问一问功能后，记录将显示在这里</text>
    </view>

    <view v-else>
      <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
        <view v-for="item in records" :key="item.id" class="record-card" @tap="goToDetail(item.id)">
          <view class="record-header">
            <view class="meridian-badge" v-if="item.meridian">{{ item.meridian }}</view>
            <text class="record-date">{{ item.create_time }}</text>
          </view>
          <view class="record-body">
            <text class="record-question">{{ item.symptoms }}</text>
            <view class="record-formulas" v-if="getFormulas(item).length > 0">
              <text v-for="f in getFormulas(item)" :key="f" class="formula-tag">{{ f }}</text>
            </view>
          </view>
          <view class="record-footer">
            <text class="record-source" v-if="item.source">AI: {{ item.source }}</text>
          </view>
        </view>

        <view v-if="loading" class="loading">
          <text>加载中...</text>
        </view>

        <view v-if="!loading && records.length > 0 && !hasMore" class="no-more">
          <text>没有更多了</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
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
    const res = await api.getDiagnosisHistory(page.value, 20)
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

function goToDetail(id: number) {
  uni.navigateTo({ url: `/pages/diagnosis-history/detail?id=${id}` })
}

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function getFormulas(item: any): string[] {
  if (!item.suggested_formulas) return []
  try {
    const arr = typeof item.suggested_formulas === 'string' ? JSON.parse(item.suggested_formulas) : item.suggested_formulas
    return Array.isArray(arr) ? arr.slice(0, 3) : []
  } catch { return [] }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40rpx;
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
  height: calc(100vh - 40rpx);
  padding: 24rpx;
  overflow: hidden;
  width: auto;
}

.record-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.meridian-badge {
  font-size: 24rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.record-date {
  font-size: 22rpx;
  color: #999;
}

.record-body {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
  margin-bottom: 12rpx;
}

.record-question {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  line-height: 1.6;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.record-formulas {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  overflow: hidden;
}

.formula-tag {
  font-size: 22rpx;
  color: #8B2500;
  background: rgba(139, 37, 0, 0.08);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.record-source {
  font-size: 20rpx;
  color: #999;
}

.loading, .no-more {
  display: flex;
  justify-content: center;
  padding: 40rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
