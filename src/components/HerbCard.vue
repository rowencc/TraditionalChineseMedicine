<template>
  <view class="herb-card" @tap="onTap">
    <view class="card-header">
      <text class="herb-name">{{ herb.name }}</text>
      <view class="tags">
        <text class="tag nature">{{ herb.nature }}</text>
        <text class="tag taste">{{ herb.taste }}</text>
      </view>
    </view>
    <view class="card-body">
      <text class="effect">{{ herb.effect }}</text>
    </view>
    <view class="card-footer">
      <text class="meridian">归经：{{ herb.meridian.join('、') }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface Herb {
  name: string
  category: string
  nature: string
  taste: string
  meridian: string[]
  effect: string
  usage: string
  caution?: string
}

defineProps<{
  herb: Herb
}>()

const emit = defineEmits(['tap'])

function onTap() {
  emit('tap')
}
</script>

<style lang="scss" scoped>
.herb-card {
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

.herb-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.tags {
  display: flex;
  gap: 8rpx;
}

.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
}

.tag.nature {
  color: #8B4513;
  background: rgba(139, 69, 19, 0.1);
}

.tag.taste {
  color: #2E8B57;
  background: rgba(46, 139, 87, 0.1);
}

.card-body {
  margin-bottom: 12rpx;
}

.effect {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.card-footer {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.meridian {
  font-size: 22rpx;
  color: #999;
}
</style>
