<template>
  <view class="container" :class="themeClass" v-if="herb">
    <!-- 头部 -->
    <view class="header">
      <view class="header-top">
        <text class="name">{{ herb.name }}</text>
        <view class="tags">
          <text class="tag nature">{{ herb.nature }}</text>
          <text class="tag taste">{{ herb.taste }}</text>
        </view>
      </view>
    </view>

    <!-- 归经 -->
    <view class="section">
      <text class="section-title">归经</text>
      <view class="tag-list">
        <text v-for="item in meridianList" :key="item" class="tag meridian">{{ item }}</text>
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

    <!-- 用量 -->
    <view class="section" v-if="herb.dosage">
      <text class="section-title">用量</text>
      <text class="content">{{ herb.dosage }}</text>
    </view>

    <!-- 禁忌 -->
    <view class="section caution" v-if="herb.caution">
      <text class="section-title">禁忌</text>
      <text class="content">{{ herb.caution }}</text>
    </view>

    <!-- 相关药物 -->
    <view class="section" v-if="relatedHerbs.length > 0">
      <text class="section-title">同归经药物</text>
      <view class="related-list">
        <view
          v-for="item in relatedHerbs"
          :key="item.id || item.name"
          class="related-item"
          @tap="goToDetail(item.name)"
        >
          <text class="related-name">{{ item.name }}</text>
          <text class="related-effect">{{ item.effect?.substring(0, 15) }}...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const herb = ref<any>(null)
const herbName = ref('')

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

const meridianList = computed(() => {
  if (!herb.value) return []
  return parseJsonArray(herb.value.meridian)
})

const relatedHerbs = ref<any[]>([])

onLoad(async (options) => {
  if (options?.name) {
    herbName.value = decodeURIComponent(options.name)
    uni.setNavigationBarTitle({ title: herbName.value })
    
    // 从服务器获取药物详情
    try {
      const res = await api.getHerbDetail(undefined, herbName.value)
      if (res.code === 1 && res.data) {
        herb.value = res.data
        
        // 记录学习
        if (api.isLoggedIn()) {
          api.recordLearning('herb', res.data.id, res.data.name)
        }
      }
    } catch (e) {
      console.error('获取药物详情失败', e)
    }
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
  background: #F5F0E8;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #2D5F4A, #3D7A62);
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

.tag.meridian {
  background: rgba(45, 95, 74, 0.1);
  color: #2D5F4A;
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section.caution {
  border-left: 4rpx solid #DC3545;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.tag.meridian {
  background: rgba(45, 95, 74, 0.08);
  color: #2D5F4A;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.related-item {
  display: flex;
  flex-direction: column;
  padding: 16rpx;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.related-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.related-effect {
  font-size: 22rpx;
  color: #999;
}
</style>
