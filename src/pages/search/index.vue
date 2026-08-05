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
    <scroll-view scroll-y class="result-list" @scrolltolower="loadMore">
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
            <text class="result-desc">{{ item.meridian || '' }} {{ item.composition ? '| ' + item.composition.substring(0, 30) + '...' : '' }}</text>
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
            <text class="result-desc">{{ (item.content || '').substring(0, 40) }}...</text>
          </view>
          <text class="result-arrow">›</text>
        </view>
      </template>

      <!-- 空状态 -->
      <view v-if="hasSearched && !loading && activeTabResults.length === 0" class="empty">
        <text>未找到相关结果</text>
      </view>

      <!-- 加载中 -->
      <view v-if="loading" class="loading">
        <text>搜索中...</text>
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
import api from '@/utils/api'
import { useTheme } from '@/utils/theme'
import meridiansData from '@/data/acupoints.json'

const { themeClass } = useTheme()
const keyword = ref('')
const activeTab = ref('formulas')
const loading = ref(false)
const hasSearched = ref(false)

const formulaResults = ref<any[]>([])
const herbResults = ref<any[]>([])
const acupointResults = ref<any[]>([])
const caseResults = ref<any[]>([])

// 分页状态
const formulaPage = ref(1)
const herbPage = ref(1)
const casePage = ref(1)
const formulaHasMore = ref(true)
const herbHasMore = ref(true)
const caseHasMore = ref(true)

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

function localSearchAcupoints(query: string) {
  const q = query.toLowerCase()
  const results: any[] = []
  for (const meridian of meridiansData.meridians) {
    for (const point of meridian.points) {
      if (
        point.name.toLowerCase().includes(q) ||
        point.position.toLowerCase().includes(q) ||
        (point.indication && point.indication.toLowerCase().includes(q))
      ) {
        results.push({
          ...point,
          meridian_name: meridian.name
        })
      }
    }
  }
  return results
}

async function onSearch() {
  const kw = keyword.value.trim()
  if (!kw) return

  hasSearched.value = true
  loading.value = true
  formulaResults.value = []
  herbResults.value = []
  acupointResults.value = []
  caseResults.value = []
  formulaPage.value = 1
  herbPage.value = 1
  casePage.value = 1
  formulaHasMore.value = true
  herbHasMore.value = true
  caseHasMore.value = true

  try {
    const [formulaRes, herbRes, caseRes] = await Promise.all([
      api.getFormulaList(1, 50, '', kw).catch(() => ({ code: 0, data: { list: [] } })),
      api.getHerbList(1, 50, '', '', kw).catch(() => ({ code: 0, data: { list: [] } })),
      api.getCaseList(1, 50, '', kw).catch(() => ({ code: 0, data: { list: [] } }))
    ])

    if (formulaRes.code === 1) {
      formulaResults.value = formulaRes.data?.list || []
      formulaHasMore.value = formulaResults.value.length >= 50
      formulaPage.value = 2
    }
    if (herbRes.code === 1) {
      // 过滤掉药物表中混入的非药物条目（如"乳癌形成机制"等）
      const nonHerbPatterns = /机制|因素|形成|高危|症状|预防|原因|治疗方式|诊断/
      herbResults.value = (herbRes.data?.list || []).filter(
        (h: any) => h.name && !h.name.endsWith('：') && !nonHerbPatterns.test(h.name)
      )
      herbHasMore.value = herbResults.value.length >= 50
      herbPage.value = 2
    }
    if (caseRes.code === 1) {
      caseResults.value = caseRes.data?.list || []
      caseHasMore.value = caseResults.value.length >= 50
      casePage.value = 2
    }

    // 穴位：优先走API，如果无结果则本地搜索
    try {
      const acupointRes = await api.getAcupointList(1, 50, '', kw)
      if (acupointRes.code === 1 && acupointRes.data?.list?.length > 0) {
        acupointResults.value = acupointRes.data.list
      } else {
        acupointResults.value = localSearchAcupoints(kw)
      }
    } catch {
      acupointResults.value = localSearchAcupoints(kw)
    }

    // 自动切到有结果的分类
    if (formulaResults.value.length > 0) {
      activeTab.value = 'formulas'
    } else if (herbResults.value.length > 0) {
      activeTab.value = 'herbs'
    } else if (acupointResults.value.length > 0) {
      activeTab.value = 'acupoints'
    } else if (caseResults.value.length > 0) {
      activeTab.value = 'cases'
    }
  } catch (e) {
    console.error('搜索失败', e)
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  const kw = keyword.value.trim()
  if (!kw || loading.value) return

  loading.value = true
  try {
    if (activeTab.value === 'formulas' && formulaHasMore.value) {
      const res = await api.getFormulaList(formulaPage.value, 50, '', kw)
      if (res.code === 1) {
        const list = res.data?.list || []
        formulaResults.value = [...formulaResults.value, ...list]
        formulaHasMore.value = list.length >= 50
        formulaPage.value++
      }
    } else if (activeTab.value === 'herbs' && herbHasMore.value) {
      const res = await api.getHerbList(herbPage.value, 50, '', '', kw)
      if (res.code === 1) {
        const nonHerbPatterns = /机制|因素|形成|高危|症状|预防|原因|治疗方式|诊断/
        const list = (res.data?.list || []).filter(
          (h: any) => h.name && !h.name.endsWith('：') && !nonHerbPatterns.test(h.name)
        )
        herbResults.value = [...herbResults.value, ...list]
        herbHasMore.value = list.length >= 50
        herbPage.value++
      }
    } else if (activeTab.value === 'cases' && caseHasMore.value) {
      const res = await api.getCaseList(casePage.value, 50, '', kw)
      if (res.code === 1) {
        const list = res.data?.list || []
        caseResults.value = [...caseResults.value, ...list]
        caseHasMore.value = list.length >= 50
        casePage.value++
      }
    }
  } catch (e) {
    console.error('加载更多失败', e)
  } finally {
    loading.value = false
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
  background: #F5F0E8;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
  gap: 8rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab.active {
  color: #8B2500;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24rpx;
  right: 24rpx;
  height: 4rpx;
  background: #8B2500;
  border-radius: 2rpx;
}

.tab-count {
  font-size: 20rpx;
  color: #999;
  background: #f5f5f5;
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
}

.tab.active .tab-count {
  color: #8B2500;
  background: rgba(139, 37, 0, 0.08);
}

.result-list {
  height: calc(100vh - 240rpx);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: #fff;
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

.tag-formula { background: #8B2500; }
.tag-herb { background: #2D5F4A; }
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
  color: #333;
  margin-bottom: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-desc {
  display: block;
  font-size: 22rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-arrow {
  font-size: 28rpx;
  color: #ccc;
  flex-shrink: 0;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100rpx;
  color: #999;
  font-size: 26rpx;
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
  color: #999;
}
</style>
