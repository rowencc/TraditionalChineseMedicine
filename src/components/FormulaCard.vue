<template>
  <view class="formula-card" @tap="onTap">
    <view class="card-header">
      <text class="formula-name">{{ formula.name }}</text>
      <text class="meridian-tag">{{ formula.meridian }}</text>
    </view>
    <view class="card-body">
      <view class="info-row">
        <text class="label">组成：</text>
        <text class="value">{{ compositionText }}</text>
      </view>
      <view class="info-row">
        <text class="label">主治：</text>
        <text class="value">{{ symptomsText }}</text>
      </view>
    </view>
    <view class="card-footer">
      <text class="source">{{ formula.source }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  formula: any
}>()

const emit = defineEmits(['tap'])

// 处理JSON字符串为数组
function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val)
      return Array.isArray(arr) ? arr : [val]
    } catch {
      return [val]
    }
  }
  return []
}

const compositionText = computed(() => parseJsonArray(props.formula.composition).join('、'))
const symptomsText = computed(() => parseJsonArray(props.formula.symptoms).join('、'))

function onTap() {
  emit('tap')
}
</script>

<style lang="scss" scoped>
.formula-card {
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
  margin-bottom: 16rpx;
}

.formula-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.meridian-tag {
  font-size: 22rpx;
  color: #8B0000;
  background: rgba(139, 0, 0, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.card-body {
  margin-bottom: 12rpx;
}

.info-row {
  display: flex;
  margin-bottom: 8rpx;
  font-size: 26rpx;
  line-height: 1.6;
}

.label {
  color: #999;
  flex-shrink: 0;
}

.value {
  color: #666;
}

.card-footer {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.source {
  font-size: 22rpx;
  color: #999;
}
</style>
