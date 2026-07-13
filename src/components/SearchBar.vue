<template>
  <view class="search-bar">
    <view class="search-input-wrap">
      <icon type="search" size="16" color="#999" />
      <input
        class="search-input"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        confirm-type="search"
        @input="onInput"
        @confirm="onSearch"
      />
      <view v-if="modelValue" class="clear-btn" @tap="onClear">
        <icon type="clear" size="14" color="#999" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索方剂、药物、医案...'
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

function onInput(e: any) {
  emit('update:modelValue', e.detail.value)
}

function onSearch() {
  emit('search')
}

function onClear() {
  emit('update:modelValue', '')
  emit('search')
}
</script>

<style lang="scss" scoped>
.search-bar {
  padding: 16rpx 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.clear-btn {
  padding: 8rpx;
}
</style>
