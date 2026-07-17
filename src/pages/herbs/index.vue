<script lang="ts">
export default {
  onShareAppMessage() {
    return { title: '药物查询 - 经方中医学习' }
  },
  onShareTimeline() {
    return { title: '药物查询 - 经方中医学习' }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" placeholder="搜索药物名称..." />

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
    <scroll-view scroll-y class="herb-list" @scrolltolower="loadMore">
      <HerbCard
        v-for="item in herbs"
        :key="item.id || item.name"
        :herb="item"
        @tap="goToDetail(item.name)"
      />

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-if="!loading && herbs.length === 0" class="empty">
        <text>未找到相关药物</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import HerbCard from '@/components/HerbCard.vue'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const keyword = ref('')
const selectedNature = ref('')
const herbs = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const natureTags = [
  { label: '全部', value: '' },
  { label: '温', value: '温' },
  { label: '热', value: '热' },
  { label: '寒', value: '寒' },
  { label: '凉', value: '凉' },
  { label: '平', value: '平' }
]

async function loadHerbs(reset = false) {
  if (loading.value) return
  
  if (reset) {
    page.value = 1
    herbs.value = []
    hasMore.value = true
  }
  
  if (!hasMore.value) return
  
  loading.value = true
  
  try {
    const res = await api.getHerbList(page.value, 20, '', selectedNature.value, keyword.value)
    
    if (res.code === 1) {
      const newList = res.data.list || []
      if (reset) {
        herbs.value = newList
      } else {
        herbs.value = [...herbs.value, ...newList]
      }
      hasMore.value = newList.length >= 20
      page.value++
    }
  } catch (e) {
    console.error('加载药物失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadHerbs(false)
}

function onSearch() {
  loadHerbs(true)
}

function toggleNature(value: string) {
  selectedNature.value = selectedNature.value === value ? '' : value
  loadHerbs(true)
}

function goToDetail(name: string) {
  uni.navigateTo({
    url: `/pages/herbs/detail?name=${encodeURIComponent(name)}`
  })
}

onMounted(() => {
  loadHerbs(true)
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
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
  background: #8B2500;
  color: #fff;
  border-color: #8B2500;
}

.herb-list {
  height: calc(100vh - 280rpx);
  padding: 0 24rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100rpx;
  color: #999;
  font-size: 26rpx;
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
