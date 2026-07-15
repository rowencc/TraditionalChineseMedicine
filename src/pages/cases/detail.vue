<template>
  <view class="container" v-if="caseItem">
    <!-- 头部 -->
    <view class="header">
      <view class="header-top">
        <text class="date">{{ caseItem.case_date || '未知日期' }}</text>
        <text class="category">{{ categoryLabel }}</text>
      </view>
      <text class="disease">{{ caseItem.disease }}</text>
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view v-if="caseItem.patient" class="info-row">
        <text class="info-label">患者</text>
        <text class="info-value">{{ caseItem.patient }}</text>
      </view>
      <view v-if="caseItem.meridian" class="info-row">
        <text class="info-label">六经</text>
        <text class="info-value">{{ caseItem.meridian }}</text>
      </view>
      <view v-if="caseItem.treatment" class="info-row treatment-row">
        <text class="info-label">方剂</text>
        <text class="info-value highlight">{{ caseItem.treatment }}</text>
      </view>
    </view>

    <!-- 医案内容 -->
    <view class="section">
      <text class="section-title">医案详情</text>
      <view class="content-wrapper">
        <text class="content" user-select>{{ caseItem.content || caseItem.summary }}</text>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="disclaimer-title">免责声明</text>
      <text class="disclaimer-text">本医案仅供中医学习参考，不替代专业医疗诊断。如有不适，请咨询执业医师。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import tcmApi from '@/utils/api'

const caseItem = ref<any>(null)
const caseId = ref('')

const categoryMap: Record<string, string> = {
  cancer: '癌症',
  cardiovascular: '心血管',
  metabolic: '代谢病',
  autoimmune: '自身免疫',
  neurological: '神经精神',
  other: '其他'
}

const categoryLabel = computed(() => {
  return categoryMap[caseItem.value?.category || ''] || ''
})

onLoad(async (options) => {
  if (options?.id) {
    caseId.value = options.id
    uni.setNavigationBarTitle({ title: '医案详情' })
    
    try {
      const res = await tcmApi.getCaseDetail(Number(options.id))
      if (res.code === 1) {
        caseItem.value = res.data
      } else {
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    } catch (e) {
      console.error('加载医案详情失败', e)
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #4682B4, #5F9EA0);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.category {
  font-size: 24rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.disease {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.info-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.treatment-row {
  background: rgba(139, 37, 0, 0.03);
  margin: 8rpx -12rpx;
  padding: 12rpx;
  border-radius: 8rpx;
}

.info-label {
  width: 120rpx;
  font-size: 26rpx;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.info-value.highlight {
  color: #8B2500;
  font-weight: 500;
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
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.content-wrapper {
  background: #fafafa;
  border-radius: 8rpx;
  padding: 20rpx;
}

.content {
  font-size: 28rpx;
  color: #444;
  line-height: 2;
  white-space: pre-wrap;
  word-break: break-all;
}

.disclaimer {
  background: #FFF8DC;
  border-radius: 12rpx;
  padding: 24rpx;
  border-left: 4rpx solid #DAA520;
}

.disclaimer-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #8B4513;
  margin-bottom: 8rpx;
}

.disclaimer-text {
  font-size: 24rpx;
  color: #8B4513;
  line-height: 1.6;
}
</style>
