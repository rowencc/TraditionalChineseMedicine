<template>
  <view class="container" v-if="formula">
    <!-- 头部 -->
    <view class="header">
      <text class="name">{{ formula.name }}</text>
      <text class="meridian">{{ formula.meridian }}病</text>
    </view>

    <!-- 组成 -->
    <view class="section">
      <text class="section-title">组成</text>
      <view class="tag-list">
        <text v-for="item in formula.composition" :key="item" class="tag">{{ item }}</text>
      </view>
    </view>

    <!-- 剂量 -->
    <view class="section">
      <text class="section-title">剂量</text>
      <text class="content">{{ formula.dosage }}</text>
    </view>

    <!-- 主治 -->
    <view class="section">
      <text class="section-title">主治症状</text>
      <view class="tag-list">
        <text v-for="item in formula.symptoms" :key="item" class="tag symptom">{{ item }}</text>
      </view>
    </view>

    <!-- 功效 -->
    <view class="section">
      <text class="section-title">功效</text>
      <text class="content">{{ formula.usage }}</text>
    </view>

    <!-- 来源 -->
    <view class="section">
      <text class="section-title">来源</text>
      <text class="content source">{{ formula.source }}</text>
    </view>

    <!-- 相关方剂 -->
    <view class="section">
      <text class="section-title">相关方剂</text>
      <view class="related-list">
        <view
          v-for="item in relatedFormulas"
          :key="item.name"
          class="related-item"
          @tap="goToDetail(item.name)"
        >
          <text class="related-name">{{ item.name }}</text>
          <text class="related-meridian">{{ item.meridian }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import formulasData from '@/data/formulas.json'

const formulaName = ref('')
const formula = computed(() => {
  return formulasData.find(f => f.name === formulaName.value)
})

const relatedFormulas = computed(() => {
  if (!formula.value) return []
  return formulasData
    .filter(f => f.meridian === formula.value?.meridian && f.name !== formula.value?.name)
    .slice(0, 4)
})

onLoad((options) => {
  if (options?.name) {
    formulaName.value = decodeURIComponent(options.name)
    uni.setNavigationBarTitle({ title: formulaName.value })
  }
})

function goToDetail(name: string) {
  uni.redirectTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
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
  background: linear-gradient(135deg, #8B0000, #A52A2A);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
}

.name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.meridian {
  font-size: 28rpx;
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

.content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.source {
  color: #8B0000;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 8rpx 20rpx;
  background: rgba(139, 0, 0, 0.08);
  color: #8B0000;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.tag.symptom {
  background: rgba(46, 139, 87, 0.08);
  color: #2E8B57;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  font-size: 26rpx;
  color: #333;
}

.related-meridian {
  font-size: 22rpx;
  color: #8B0000;
}
</style>
