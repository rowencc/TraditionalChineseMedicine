<template>
  <view class="container" v-if="herb">
    <!-- 头部 -->
    <view class="header">
      <view class="header-top">
        <text class="name">{{ herb.name }}</text>
        <view class="tags">
          <text class="tag nature">{{ herb.nature }}</text>
          <text class="tag taste">{{ herb.taste }}</text>
          <text class="tag category">{{ herb.category }}</text>
        </view>
      </view>
    </view>

    <!-- 归经 -->
    <view class="section">
      <text class="section-title">归经</text>
      <view class="tag-list">
        <text v-for="item in herb.meridian" :key="item" class="tag meridian">{{ item }}</text>
      </view>
    </view>

    <!-- 功效 -->
    <view class="section">
      <text class="section-title">功效</text>
      <text class="content">{{ herb.effect }}</text>
    </view>

    <!-- 主治 -->
    <view class="section">
      <text class="section-title">主治</text>
      <text class="content">{{ herb.usage }}</text>
    </view>

    <!-- 禁忌 -->
    <view v-if="herb.caution" class="section caution">
      <text class="section-title">禁忌</text>
      <text class="content">{{ herb.caution }}</text>
    </view>

    <!-- 相关药物 -->
    <view class="section">
      <text class="section-title">同归经药物</text>
      <view class="related-list">
        <view
          v-for="item in relatedHerbs"
          :key="item.name"
          class="related-item"
          @tap="goToDetail(item.name)"
        >
          <text class="related-name">{{ item.name }}</text>
          <text class="related-effect">{{ item.effect }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import herbsData from '@/data/herbs.json'

const herbName = ref('')
const herb = computed(() => {
  return herbsData.find(h => h.name === herbName.value)
})

const relatedHerbs = computed(() => {
  if (!herb.value) return []
  return herbsData
    .filter(h => {
      const hasCommonMeridian = h.meridian.some(m => herb.value?.meridian.includes(m))
      return hasCommonMeridian && h.name !== herb.value?.name
    })
    .slice(0, 6)
})

onLoad((options) => {
  if (options?.name) {
    herbName.value = decodeURIComponent(options.name)
    uni.setNavigationBarTitle({ title: herbName.value })
  }
})

function goToDetail(name: string) {
  uni.redirectTo({
    url: `/pages/herbs/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #2E8B57, #3CB371);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.name {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
}

.tags {
  display: flex;
  gap: 8rpx;
}

.tag {
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
}

.tag.nature {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.tag.taste {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.tag.category {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.tag.meridian {
  background: rgba(46, 139, 87, 0.08);
  color: #2E8B57;
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section.caution {
  border-left: 4rpx solid #FF6B6B;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.related-list {
  display: grid;
  gap: 12rpx;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}

.related-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.related-effect {
  font-size: 22rpx;
  color: #999;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
