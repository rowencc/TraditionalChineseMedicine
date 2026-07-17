<template>
  <view class="container" :class="themeClass" v-if="item">
    <!-- 头部 -->
    <view class="header" :class="'hd-' + item.cssClass">
      <text class="hd-name">{{ item.name }}经</text>
      <text class="hd-en">{{ item.enName }}</text>
      <text class="hd-nature">{{ item.detail.nature }}</text>
    </view>

    <!-- 概述 -->
    <view class="section">
      <text class="section-title">经络位置</text>
      <text class="content">{{ item.detail.position }}</text>
    </view>

    <view class="section">
      <text class="section-title">所属脏腑</text>
      <text class="content">{{ item.detail.organs }}</text>
    </view>

    <!-- 主要症状 -->
    <view class="section">
      <text class="section-title">主要症状</text>
      <view class="symptom-list">
        <view v-for="s in item.detail.mainSymptoms.split('、')" :key="s" class="symptom-tag">
          <text>{{ s }}</text>
        </view>
      </view>
    </view>

    <!-- 治法 -->
    <view class="section">
      <text class="section-title">治则治法</text>
      <view class="treatment-card">
        <text class="treatment-text">{{ item.detail.treatment }}</text>
      </view>
    </view>

    <!-- 代表方剂 -->
    <view class="section">
      <text class="section-title">代表方剂</text>
      <view v-for="f in item.detail.formulas" :key="f.name" class="formula-card" @tap="goToFormula(f.name)">
        <view class="fc-header">
          <text class="fc-name">{{ f.name }}</text>
          <text class="fc-arrow">></text>
        </view>
        <text class="fc-usage">{{ f.usage }}</text>
        <text class="fc-composition">组成：{{ f.composition }}</text>
      </view>
    </view>

    <!-- 预防保养 -->
    <view class="section">
      <text class="section-title">预防保养</text>
      <view class="prevention-card">
        <text class="prevention-text">{{ item.detail.prevention }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { getAppName } from '@/utils/platform'

export default {
  onShareAppMessage() {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1] as any
    const path = '/' + (page?.route || 'pages/liujing/detail')
    const data = uni.getStorageSync('liujing_detail')
    let title = getAppName()
    try {
      const item = JSON.parse(data)
      title = `${item.name}经 - 六经辨证`
    } catch {}
    return { title, path }
  },
  onShareTimeline() {
    const data = uni.getStorageSync('liujing_detail')
    let title = getAppName()
    try {
      const item = JSON.parse(data)
      title = `${item.name}经 - 六经辨证`
    } catch {}
    return { title }
  }
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTheme } from '@/utils/theme'

const { themeClass } = useTheme()
const item = ref<any>(null)

onLoad(() => {
  const data = uni.getStorageSync('liujing_detail')
  if (data) {
    try {
      item.value = JSON.parse(data)
      uni.setNavigationBarTitle({ title: item.value.name + '经' })
    } catch (e) {
      console.error('解析六经数据失败', e)
    }
  }
})

function goToFormula(name: string) {
  uni.navigateTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.header {
  border-radius: 16rpx;
  padding: 48rpx 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.hd-sun { background: linear-gradient(135deg, #C0392B, #E74C3C); }
.hd-yangming { background: linear-gradient(135deg, #E67E22, #F39C12); }
.hd-shaoyang { background: linear-gradient(135deg, #D4A017, #F1C40F); }
.hd-taiyin { background: linear-gradient(135deg, #8B4513, #A0522D); }
.hd-shaoyin { background: linear-gradient(135deg, #2980B9, #3498DB); }
.hd-jueyin { background: linear-gradient(135deg, #8E44AD, #9B59B6); }

.hd-name {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.hd-en {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12rpx;
}

.hd-nature {
  display: inline-block;
  font-size: 24rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
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
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.content {
  font-size: 26rpx;
  color: #555;
  line-height: 1.8;
}

.symptom-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.symptom-tag {
  padding: 10rpx 20rpx;
  background: rgba(139, 37, 0, 0.08);
  color: #8B2500;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.treatment-card {
  background: linear-gradient(135deg, #2D5F4A, #3D7A62);
  border-radius: 12rpx;
  padding: 24rpx;
}

.treatment-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.formula-card {
  background: #FAFAF7;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
}

.fc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.fc-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #8B2500;
}

.fc-arrow {
  font-size: 28rpx;
  color: #ccc;
}

.fc-usage {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 6rpx;
}

.fc-composition {
  font-size: 24rpx;
  color: #999;
}

.prevention-card {
  background: #FFF8DC;
  border-radius: 12rpx;
  padding: 20rpx;
  border-left: 4rpx solid #B8860B;
}

.prevention-text {
  font-size: 26rpx;
  color: #8B4513;
  line-height: 1.8;
}
</style>
