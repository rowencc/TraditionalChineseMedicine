<template>
  <view class="case-card" @tap="onTap">
    <view class="card-header">
      <text class="case-date">{{ caseItem.date || '未知日期' }}</text>
      <text class="category-tag">{{ categoryLabel }}</text>
    </view>
    <view class="card-body">
      <text class="disease">{{ caseItem.disease }}</text>
      <text class="summary">{{ caseItem.summary }}</text>
    </view>
    <view class="card-tags">
      <text v-if="caseItem.meridian" class="tag meridian">六经：{{ caseItem.meridian }}</text>
      <text v-if="caseItem.treatment" class="tag treatment">方剂：{{ caseItem.treatment }}</text>
      <text v-if="caseItem.outcome" class="tag" :class="outcomeClass">{{ caseItem.outcome }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface CaseItem {
  id: string
  date: string
  disease: string
  patient?: string
  meridian?: string
  prescription?: string
  treatment?: string
  feedback?: string
  outcome?: string
  summary: string
  category: string
  content?: string
}

const props = defineProps<{
  caseItem: CaseItem
}>()

const emit = defineEmits(['tap'])

const categoryMap: Record<string, string> = {
  cancer: '癌症',
  cardiovascular: '心血管',
  metabolic: '代谢病',
  autoimmune: '自身免疫',
  neurological: '神经精神',
  other: '其他'
}

const categoryLabel = computed(() => categoryMap[props.caseItem.category] || props.caseItem.category)

const outcomeClass = computed(() => {
  if (props.caseItem.outcome === '好转') return 'outcome-improved'
  if (props.caseItem.outcome === '痊愈') return 'outcome-cured'
  return 'outcome-default'
})

function onTap() {
  emit('tap')
}
</script>

<style lang="scss" scoped>
.case-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.case-date {
  font-size: 24rpx;
  color: #999;
}

.category-tag {
  font-size: 22rpx;
  color: #8B0000;
  background: rgba(139, 0, 0, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.card-body {
  margin-bottom: 12rpx;
}

.disease {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
}

.tag.meridian {
  color: #8B4513;
  background: rgba(139, 69, 19, 0.1);
}

.tag.treatment {
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.1);
}

.tag.outcome-default {
  font-weight: 500;
}

.tag.outcome-improved {
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.1);
}

.tag.outcome-cured {
  color: #fff;
  background: #2E8B57;
}
</style>
