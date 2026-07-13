<template>
  <view class="container">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" />

    <!-- 六经筛选 -->
    <TagFilter
      :tags="meridianTags"
      :selected-tags="selectedMeridians"
      @change="onMeridianChange"
    />

    <!-- 方剂列表 -->
    <scroll-view scroll-y class="formula-list">
      <FormulaCard
        v-for="item in filteredFormulas"
        :key="item.name"
        :formula="item"
        @tap="goToDetail(item.name)"
      />

      <view v-if="filteredFormulas.length === 0" class="empty">
        <text>未找到相关方剂</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SearchBar from '@/components/SearchBar.vue'
import TagFilter from '@/components/TagFilter.vue'
import FormulaCard from '@/components/FormulaCard.vue'
import formulasData from '@/data/formulas.json'

const keyword = ref('')
const selectedMeridians = ref<string[]>([])

const meridianTags = [
  { label: '全部', value: '' },
  { label: '太阳', value: '太阳' },
  { label: '阳明', value: '阳明' },
  { label: '少阳', value: '少阳' },
  { label: '太阴', value: '太阴' },
  { label: '少阴', value: '少阴' },
  { label: '厥阴', value: '厥阴' }
]

const filteredFormulas = computed(() => {
  let result = formulasData

  // 六经筛选
  if (selectedMeridians.value.length > 0 && selectedMeridians.value[0] !== '') {
    result = result.filter(f => selectedMeridians.value.includes(f.meridian))
  }

  // 关键词搜索
  if (keyword.value.trim()) {
    const query = keyword.value.toLowerCase()
    result = result.filter(f => {
      return f.name.toLowerCase().includes(query) ||
        f.composition.some(c => c.includes(query)) ||
        f.symptoms.some(s => s.includes(query)) ||
        f.usage.includes(query)
    })
  }

  return result
})

onLoad((options) => {
  if (options?.keyword) {
    keyword.value = decodeURIComponent(options.keyword)
  }
})

function onSearch() {
  // 搜索已在 computed 中处理
}

function onMeridianChange(tags: string[]) {
  selectedMeridians.value = tags
}

function goToDetail(name: string) {
  uni.navigateTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.formula-list {
  height: calc(100vh - 200rpx);
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
