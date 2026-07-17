<script lang="ts">
export default {
  onShareAppMessage() {
    return { title: '方剂速查 - 经方中医学习' }
  },
  onShareTimeline() {
    return { title: '方剂速查 - 经方中医学习' }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" />

    <!-- 六经筛选 -->
    <TagFilter
      :tags="meridianTags"
      :selected-tags="selectedMeridians"
      @change="onMeridianChange"
    />

    <!-- 方剂列表 -->
    <scroll-view scroll-y class="formula-list" @scrolltolower="loadMore">
      <FormulaCard
        v-for="item in formulas"
        :key="item.id || item.name"
        :formula="item"
        @tap="goToDetail(item.name)"
      />

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-if="!loading && formulas.length === 0" class="empty">
        <text>未找到相关方剂</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SearchBar from '@/components/SearchBar.vue'
import TagFilter from '@/components/TagFilter.vue'
import FormulaCard from '@/components/FormulaCard.vue'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const keyword = ref('')
const selectedMeridians = ref<string[]>([])
const formulas = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const meridianTags = [
  { label: '全部', value: '' },
  { label: '太阳', value: '太阳' },
  { label: '阳明', value: '阳明' },
  { label: '少阳', value: '少阳' },
  { label: '太阴', value: '太阴' },
  { label: '少阴', value: '少阴' },
  { label: '厥阴', value: '厥阴' }
]

// 加载方剂列表
async function loadFormulas(reset = false) {
  if (loading.value) return
  
  if (reset) {
    page.value = 1
    formulas.value = []
    hasMore.value = true
  }
  
  if (!hasMore.value) return
  
  loading.value = true
  
  try {
    const meridian = selectedMeridians.value[0] || ''
    const res = await api.getFormulaList(page.value, 20, meridian, keyword.value)
    
    if (res.code === 1) {
      const newList = res.data.list || []
      if (reset) {
        formulas.value = newList
      } else {
        formulas.value = [...formulas.value, ...newList]
      }
      hasMore.value = newList.length >= 20
      page.value++
    }
  } catch (e) {
    console.error('加载方剂失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadFormulas(false)
}

function onSearch() {
  loadFormulas(true)
}

function onMeridianChange(tags: string[]) {
  selectedMeridians.value = tags
  loadFormulas(true)
}

function goToDetail(name: string) {
  uni.navigateTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}

onLoad((options) => {
  if (options?.keyword) {
    keyword.value = decodeURIComponent(options.keyword)
  }
  loadFormulas(true)
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
}

.formula-list {
  height: calc(100vh - 200rpx);
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
