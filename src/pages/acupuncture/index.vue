<script lang="ts">
export default {
  onShareAppMessage() {
    return { title: '针灸穴位 - 经方中医学习', path: '/pages/acupuncture/index' }
  },
  onShareTimeline() {
    return { title: '针灸穴位 - 经方中医学习' }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" placeholder="搜索穴位名称..." />

    <!-- 经络列表 -->
    <scroll-view scroll-y class="meridian-list">
      <!-- 搜索无结果提示 -->
      <view v-if="keyword.trim() && filteredMeridians.length === 0" class="empty-hint">
        <text>未找到匹配的穴位或经络</text>
      </view>
      <view
        v-for="meridian in filteredMeridians"
        :key="meridian.name"
        class="meridian-section"
      >
        <view class="meridian-header" @tap="toggleMeridian(meridian.name)">
          <view class="meridian-info">
            <view class="meridian-title">
              <text class="meridian-name">{{ meridian.name }}</text>
              <text class="meridian-count">{{ meridian.points.length }}/{{ meridian.pointCount }}穴</text>
            </view>
            <text class="meridian-desc">{{ meridian.description }}</text>
          </view>
          <text class="arrow" :class="{ expanded: expandedMeridians.includes(meridian.name) }">›</text>
        </view>

        <view v-if="expandedMeridians.includes(meridian.name)" class="points-list">
          <view
            v-for="point in meridian.points"
            :key="point.name"
            class="point-item"
            @tap="goToDetail(meridian.name, point.name)"
          >
            <view class="point-main">
              <text class="point-name">{{ point.name }}</text>
              <text class="point-position">{{ point.position.substring(0, 25) }}...</text>
            </view>
            <text class="point-arrow">›</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import meridiansData from '@/data/acupoints.json'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const keyword = ref('')
const expandedMeridians = ref<string[]>(['手太阴肺经'])

const filteredMeridians = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return meridiansData.meridians

  return meridiansData.meridians
    .map(meridian => {
      const matchedPoints = meridian.points.filter(point =>
        point.name.toLowerCase().includes(q) ||
        point.position.toLowerCase().includes(q) ||
        (point.indication && point.indication.toLowerCase().includes(q))
      )
      if (matchedPoints.length > 0 || meridian.name.toLowerCase().includes(q)) {
        return { ...meridian, points: matchedPoints.length > 0 ? matchedPoints : meridian.points }
      }
      return null
    })
    .filter(Boolean) as typeof meridiansData.meridians
})

function onSearch() {
  // 搜索时自动展开所有匹配的经络
  if (keyword.value.trim()) {
    expandedMeridians.value = filteredMeridians.value.map(m => m.name)
  } else {
    expandedMeridians.value = ['手太阴肺经']
  }
}

function toggleMeridian(name: string) {
  const index = expandedMeridians.value.indexOf(name)
  if (index > -1) {
    expandedMeridians.value.splice(index, 1)
  } else {
    expandedMeridians.value.push(name)
  }
}

function goToDetail(meridian: string, point: string) {
  uni.navigateTo({
    url: `/pages/acupuncture/detail?meridian=${encodeURIComponent(meridian)}&point=${encodeURIComponent(point)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.meridian-list {
  height: calc(100vh - 120rpx);
}

.meridian-section {
  background: #fff;
  border-radius: 12rpx;
  margin: 0 24rpx 16rpx;
  overflow: hidden;
}

.meridian-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
}

.meridian-info {
  flex: 1;
}

.meridian-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 4rpx;
}

.meridian-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.meridian-count {
  font-size: 22rpx;
  color: #9370DB;
  background: rgba(147, 112, 219, 0.1);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
}

.meridian-desc {
  display: block;
  font-size: 22rpx;
  color: #999;
  line-height: 1.4;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
  transition: transform 0.2s;
}

.arrow.expanded {
  transform: rotate(90deg);
}

.points-list {
  border-top: 1rpx solid #f0f0f0;
}

.point-item {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #f8f8f8;
}

.point-item:last-child {
  border-bottom: none;
}

.point-main {
  flex: 1;
}

.point-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 2rpx;
}

.point-position {
  display: block;
  font-size: 22rpx;
  color: #999;
  line-height: 1.4;
}

.point-arrow {
  font-size: 28rpx;
  color: #ccc;
}

.empty-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
