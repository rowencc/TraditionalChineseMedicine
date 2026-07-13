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
    <scroll-view scroll-y class="case-list">
      <CaseCard
        v-for="item in filteredCases"
        :key="item.id"
        :case-item="item"
        @tap="goToDetail(item.id)"
      />

      <view v-if="filteredCases.length === 0" class="empty">
        <text>未找到相关医案</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import TagFilter from '@/components/TagFilter.vue'
import CaseCard from '@/components/CaseCard.vue'
import casesData from '@/data/cases.json'

const keyword = ref('')
const selectedCategories = ref<string[]>([])

const categoryTags = [
  { label: '全部', value: '' },
  { label: '癌症', value: 'cancer' },
  { label: '心血管', value: 'cardiovascular' },
  { label: '代谢病', value: 'metabolic' },
  { label: '自身免疫', value: 'autoimmune' },
  { label: '神经精神', value: 'neurological' },
  { label: '其他', value: 'other' }
]

const filteredCases = computed(() => {
  let result = casesData

  // 分类筛选
  if (selectedCategories.value.length > 0 && selectedCategories.value[0] !== '') {
    result = result.filter(c => selectedCategories.value.includes(c.category))
  }

  // 关键词搜索
  if (keyword.value.trim()) {
    const query = keyword.value.toLowerCase()
    result = result.filter(c => {
      return c.disease.toLowerCase().includes(query) ||
        c.summary.toLowerCase().includes(query) ||
        (c.meridian && c.meridian.includes(query)) ||
        (c.prescription && c.prescription.includes(query))
    })
  }

  return result
})

function onSearch() {
  // 搜索已在 computed 中处理
}

function onCategoryChange(tags: string[]) {
  selectedCategories.value = tags
}

function goToDetail(id: string) {
  uni.navigateTo({
    url: `/pages/cases/detail?id=${id}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.case-list {
  height: calc(100vh - 240rpx);
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
