<template>
  <view class="container">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" />

    <!-- 筛选标签 -->
    <view class="filter-section">
      <scroll-view scroll-x class="tag-scroll">
        <view class="tag-group">
          <text class="group-label">性味：</text>
          <view
            v-for="item in natureTags"
            :key="item.value"
            class="tag"
            :class="{ active: selectedNature === item.value }"
            @tap="toggleNature(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 药物列表 -->
    <scroll-view scroll-y class="herb-list">
      <HerbCard
        v-for="item in filteredHerbs"
        :key="item.name"
        :herb="item"
        @tap="goToDetail(item.name)"
      />

      <view v-if="filteredHerbs.length === 0" class="empty">
        <text>未找到相关药物</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import HerbCard from '@/components/HerbCard.vue'
import herbsData from '@/data/herbs.json'

const keyword = ref('')
const selectedNature = ref('')

const natureTags = [
  { label: '全部', value: '' },
  { label: '温', value: '温' },
  { label: '热', value: '热' },
  { label: '寒', value: '寒' },
  { label: '凉', value: '凉' },
  { label: '平', value: '平' }
]

const filteredHerbs = computed(() => {
  let result = herbsData

  // 性味筛选
  if (selectedNature.value) {
    result = result.filter(h => h.nature.includes(selectedNature.value))
  }

  // 关键词搜索
  if (keyword.value.trim()) {
    const query = keyword.value.toLowerCase()
    result = result.filter(h => {
      return h.name.toLowerCase().includes(query) ||
        h.meridian.some(m => m.includes(query)) ||
        h.effect.includes(query) ||
        h.taste.includes(query)
    })
  }

  return result
})

function onSearch() {
  // 搜索已在 computed 中处理
}

function toggleNature(value: string) {
  selectedNature.value = selectedNature.value === value ? '' : value
}

function goToDetail(name: string) {
  uni.navigateTo({
    url: `/pages/herbs/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.filter-section {
  padding: 0 24rpx;
}

.tag-scroll {
  white-space: nowrap;
}

.tag-group {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0;
}

.group-label {
  font-size: 26rpx;
  color: #666;
}

.tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  border: 1rpx solid #eee;
}

.tag.active {
  background: #8B0000;
  color: #fff;
  border-color: #8B0000;
}

.herb-list {
  height: calc(100vh - 280rpx);
  padding: 0 24rpx;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
