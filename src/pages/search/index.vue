<script lang="ts">
export default {
  onShareAppMessage() {
    return { title: '搜索 - 岐闻小识', path: '/pages/search/index' }
  },
  onShareTimeline() {
    return { title: '搜索 - 岐闻小识' }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 搜索栏 -->
    <SearchBar v-model="keyword" @search="onSearch" placeholder="搜索方剂、药物、穴位、医案..." />

    <!-- 搜索结果分类标签 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @tap="activeTab = tab.key"
      >
        <text>{{ tab.label }}</text>
        <text v-if="tab.count > 0" class="tab-count">{{ tab.count }}</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <scroll-view scroll-y class="result-list">
      <!-- 方剂结果 -->
      <template v-if="activeTab === 'formulas'">
        <view
          v-for="item in formulaResults"
          :key="'f-' + (item.id || item.name)"
          class="result-item"
          @tap="goToFormula(item.name)"
        >
          <view class="result-tag tag-formula">方剂</view>
          <view class="result-content">
            <text class="result-name">{{ item.name }}</text>
            <text class="result-desc">{{ formulaDesc(item) }}</text>
          </view>
          <text class="result-arrow">›</text>
        </view>
      </template>

      <!-- 药物结果 -->
      <template v-if="activeTab === 'herbs'">
        <view
          v-for="item in herbResults"
          :key="'h-' + (item.id || item.name)"
          class="result-item"
          @tap="goToHerb(item.name)"
        >
          <view class="result-tag tag-herb">药物</view>
          <view class="result-content">
            <text class="result-name">{{ item.name }}</text>
            <text class="result-desc">{{ item.nature || '' }} {{ item.taste ? '| ' + item.taste : '' }}</text>
          </view>
          <text class="result-arrow">›</text>
        </view>
      </template>

      <!-- 穴位结果 -->
      <template v-if="activeTab === 'acupoints'">
        <view
          v-for="item in acupointResults"
          :key="'a-' + (item.id || item.name)"
          class="result-item"
          @tap="goToAcupoint(item)"
        >
          <view class="result-tag tag-acupoint">穴位</view>
          <view class="result-content">
            <text class="result-name">{{ item.name }}</text>
            <text class="result-desc">{{ item.meridian_name || item.meridian || '' }} | {{ item.position ? item.position.substring(0, 25) + '...' : '' }}</text>
          </view>
          <text class="result-arrow">›</text>
        </view>
      </template>

      <!-- 医案结果 -->
      <template v-if="activeTab === 'cases'">
        <view
          v-for="item in caseResults"
          :key="'c-' + item.id"
          class="result-item"
          @tap="goToCase(item.id)"
        >
          <view class="result-tag tag-case">医案</view>
          <view class="result-content">
            <text class="result-name">{{ item.disease || item.title || item.name || '医案' }}</text>
            <text class="result-desc">{{ (item.summary || item.content || '').substring(0, 40) }}</text>
          </view>
          <text class="result-arrow">›</text>
        </view>
      </template>

      <!-- 空状态 -->
      <view v-if="hasSearched && activeTabResults.length === 0" class="empty">
        <text>未找到与「{{ keyword.trim() }}」相关的结果</text>
      </view>

      <!-- 未搜索提示 -->
      <view v-if="!hasSearched" class="hint">
        <text class="hint-icon">🔍</text>
        <text class="hint-text">输入关键词搜索方剂、药物、穴位、医案</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SearchBar from '@/components/SearchBar.vue'
import { useTheme } from '@/utils/theme'
import { searchAll } from '@/utils/search'

const { themeClass } = useTheme()
const keyword = ref('')
const activeTab = ref('formulas')
const hasSearched = ref(false)

const formulaResults = ref<any[]>([])
const herbResults = ref<any[]>([])
const acupointResults = ref<any[]>([])
const caseResults = ref<any[]>([])

const tabs = computed(() => [
  { key: 'formulas', label: '方剂', count: formulaResults.value.length },
  { key: 'herbs', label: '药物', count: herbResults.value.length },
  { key: 'acupoints', label: '穴位', count: acupointResults.value.length },
  { key: 'cases', label: '医案', count: caseResults.value.length }
])

const activeTabResults = computed(() => {
  switch (activeTab.value) {
    case 'formulas': return formulaResults.value
    case 'herbs': return herbResults.value
    case 'acupoints': return acupointResults.value
    case 'cases': return caseResults.value
    default: return []
  }
})

/** 方剂结果描述：composition 本地数据是数组，后端是 JSON 字符串，统一拍平后截断 */
function formulaDesc(item: any): string {
  const comp = Array.isArray(item.composition)
    ? item.composition.join('、')
    : String(item.composition || '')
  const parts: string[] = []
  if (item.meridian) parts.push(String(item.meridian))
  if (comp) parts.push('| ' + (comp.length > 30 ? comp.substring(0, 30) + '...' : comp))
  return parts.join(' ')
}

function onSearch() {
  const kw = keyword.value.trim()
  if (!kw) return

  hasSearched.value = true

  // 本地相关性搜索（后端 keyword 参数无效，见 src/utils/search.ts）
  const results = searchAll(kw)
  formulaResults.value = results.formulas
  herbResults.value = results.herbs
  acupointResults.value = results.acupoints
  caseResults.value = results.cases

  // 自动切到有结果的分类
  if (results.formulas.length > 0) {
    activeTab.value = 'formulas'
  } else if (results.herbs.length > 0) {
    activeTab.value = 'herbs'
  } else if (results.acupoints.length > 0) {
    activeTab.value = 'acupoints'
  } else if (results.cases.length > 0) {
    activeTab.value = 'cases'
  }
}

function goToFormula(name: string) {
  uni.navigateTo({ url: `/pages/formulas/detail?name=${encodeURIComponent(name)}` })
}

function goToHerb(name: string) {
  uni.navigateTo({ url: `/pages/herbs/detail?name=${encodeURIComponent(name)}` })
}

function goToAcupoint(item: any) {
  const meridian = item.meridian_name || item.meridian || ''
  uni.navigateTo({
    url: `/pages/acupuncture/detail?meridian=${encodeURIComponent(meridian)}&point=${encodeURIComponent(item.name)}`
  })
}

function goToCase(id: number) {
  uni.navigateTo({ url: `/pages/cases/detail?id=${id}` })
}

onLoad((options) => {
  if (options?.keyword) {
    keyword.value = decodeURIComponent(options.keyword)
    onSearch()
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: var(--bg-base);
}

.tabs {
  display: flex;
  background: var(--bg-card);
  padding: 0 24rpx;
  gap: 8rpx;
  border-bottom: 1rpx solid var(--border-light);
}

.tab {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
  position: relative;
}

.tab.active {
  color: var(--brand-ink);
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24rpx;
  right: 24rpx;
  height: 4rpx;
  background: var(--brand);
  border-radius: 2rpx;
}

.tab-count {
  font-size: 20rpx;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
}

.tab.active .tab-count {
  color: var(--brand-ink);
  background: var(--brand-soft);
}

.result-list {
  height: calc(100vh - 240rpx);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: var(--bg-card);
  margin: 0 24rpx 12rpx;
  border-radius: 12rpx;
}

.result-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  color: #fff;
  flex-shrink: 0;
}

.tag-formula { background: var(--brand); }
.tag-herb { background: var(--jade); }
.tag-acupoint { background: #9370DB; }
.tag-case { background: #2980B9; }

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-desc {
  display: block;
  font-size: 22rpx;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-arrow {
  font-size: 28rpx;
  color: var(--text-muted);
  flex-shrink: 0;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: var(--text-muted);
  font-size: 28rpx;
}

.hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
  gap: 16rpx;
}

.hint-icon {
  font-size: 60rpx;
}

.hint-text {
  font-size: 28rpx;
  color: var(--text-muted);
}
</style>
