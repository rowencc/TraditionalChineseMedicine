<template>
  <view class="tag-filter">
    <scroll-view scroll-x class="tag-list">
      <view
        v-for="(tag, index) in tags"
        :key="index"
        class="tag-item"
        :class="{ active: selectedTags.includes(tag.value) }"
        @tap="toggleTag(tag.value)"
      >
        {{ tag.label }}
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
interface Tag {
  label: string
  value: string
}

const props = defineProps({
  tags: {
    type: Array as () => Tag[],
    required: true
  },
  selectedTags: {
    type: Array as () => string[],
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selectedTags', 'change'])

function toggleTag(value: string) {
  let newSelected: string[]

  if (props.multiple) {
    if (props.selectedTags.includes(value)) {
      newSelected = props.selectedTags.filter(v => v !== value)
    } else {
      newSelected = [...props.selectedTags, value]
    }
  } else {
    newSelected = props.selectedTags.includes(value) ? [] : [value]
  }

  emit('update:selectedTags', newSelected)
  emit('change', newSelected)
}
</script>

<style lang="scss" scoped>
.tag-filter {
  padding: 16rpx 0;
  max-width: 100%;
  overflow: hidden;
}

.tag-list {
  white-space: nowrap;
  padding: 0 24rpx;
}

.tag-item {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 32rpx;
  transition: all 0.2s;

  &.active {
    color: #fff;
    background: #8B0000;
  }
}
</style>
