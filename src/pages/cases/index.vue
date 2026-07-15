<template>
  <view class="container">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" />

    <!-- 分类筛选 -->
    <TagFilter
      :tags="categoryTags"
      :selected-tags="selectedCategories"
      @change="onCategoryChange"
    />

    <!-- 医案列表 -->
    <scroll-view scroll-y class="case-list" @scrolltolower="loadMore">
      <CaseCard
        v-for="item in cases"
        :key="item.id"
        :case-item="item"
        @tap="goToDetail(item.id)"
      />

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-if="!loading && cases.length === 0" class="empty">
        <text>未找到相关医案</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import TagFilter from '@/components/TagFilter.vue'
import CaseCard from '@/components/CaseCard.vue'
import tcmApi from '@/utils/api'

const keyword = ref('')
const selectedCategories = ref<string[]>([])
const cases = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const categoryTags = [
  { label: '全部', value: '' },
  { label: '癌症', value: 'cancer' },
  { label: '心血管', value: 'cardiovascular' },
  { label: '代谢病', value: 'metabolic' },
  { label: '自身免疫', value: 'autoimmune' },
  { label: '神经精神', value: 'neurological' },
  { label: '其他', value: 'other' }
]

async function loadCases(reset = false) {
  if (loading.value) return
  
  if (reset) {
    page.value = 1
    cases.value = []
    hasMore.value = true
  }
  
  if (!hasMore.value) return
  
  loading.value = true
  
  try {
    const category = selectedCategories.value[0] || ''
    const res = await tcmApi.getCaseList(page.value, 20, category, keyword.value)
    
    if (res.code === 1) {
      const newList = res.data.list || []
      if (reset) {
        cases.value = newList
      } else {
        cases.value = [...cases.value, ...newList]
      }
      hasMore.value = newList.length >= 20
      page.value++
    }
  } catch (e) {
    console.error('加载医案失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadCases(false)
}

function onSearch() {
  loadCases(true)
}

function onCategoryChange(tags: string[]) {
  selectedCategories.value = tags
  loadCases(true)
}

function goToDetail(id: number) {
  uni.navigateTo({
    url: `/pages/cases/detail?id=${id}`
  })
}

onMounted(() => {
  loadCases(true)
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
}

.case-list {
  height: calc(100vh - 240rpx);
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
