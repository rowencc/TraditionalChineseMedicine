<template>
  <view class="container" :class="themeClass" v-if="formula">
    <!-- 头部 -->
    <view class="header">
      <text class="name">{{ formula.name }}</text>
      <text class="meridian">{{ formula.meridian }}病</text>
    </view>

    <!-- 组成 -->
    <view class="section">
      <text class="section-title">组成</text>
      <view class="tag-list">
        <text v-for="item in compositionList" :key="item" class="tag">{{ item }}</text>
      </view>
    </view>

    <!-- 剂量 -->
    <view class="section">
      <text class="section-title">剂量</text>
      <text class="content">{{ formula.dosage }}</text>
    </view>

    <!-- 主治 -->
    <view class="section">
      <text class="section-title">主治症状</text>
      <view class="tag-list">
        <text v-for="item in symptomsList" :key="item" class="tag symptom">{{ item }}</text>
      </view>
    </view>

    <!-- 功效 -->
    <view class="section">
      <text class="section-title">功效</text>
      <text class="content">{{ formula.formula_usage || formula.usage }}</text>
    </view>

    <!-- 来源 -->
    <view class="section">
      <text class="section-title">来源</text>
      <text class="content source">{{ formula.source }}</text>
    </view>

    <!-- 相关方剂 -->
    <view class="section" v-if="relatedFormulas.length > 0">
      <text class="section-title">相关方剂</text>
      <view class="related-list">
        <view
          v-for="item in relatedFormulas"
          :key="item.id || item.name"
          class="related-item"
          @tap="goToDetail(item.name)"
        >
          <text class="related-name">{{ item.name }}</text>
          <text class="related-meridian">{{ item.meridian }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { getCurrentPageShareInfo } from '@/utils/share'

export default {
  onShareAppMessage() {
    return getCurrentPageShareInfo('经方速查')
  },
  onShareTimeline() {
    return { title: getCurrentPageShareInfo('经方速查').title }
  }
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const formula = ref<any>(null)
const formulaName = ref('')

// 解析JSON数组
function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val)
      return Array.isArray(arr) ? arr : [val]
    } catch {
      return val ? [val] : []
    }
  }
  return []
}

const compositionList = computed(() => {
  if (!formula.value) return []
  return parseJsonArray(formula.value.composition)
})

const symptomsList = computed(() => {
  if (!formula.value) return []
  return parseJsonArray(formula.value.symptoms)
})

const relatedFormulas = ref<any[]>([])

onLoad(async (options) => {
  if (options?.name) {
    formulaName.value = decodeURIComponent(options.name)
    uni.setNavigationBarTitle({ title: formulaName.value })
    
    // 从服务器获取方剂详情
    try {
      const res = await api.getFormulaDetail(undefined, formulaName.value)
      if (res.code === 1 && res.data) {
        formula.value = res.data

        // 记录学习
        if (api.isLoggedIn()) {
          api.recordLearning('formula', res.data.id, res.data.name)
        }
      } else {
        uni.showToast({ title: '未找到该方剂', icon: 'none' })
      }
    } catch (e) {
      console.error('获取方剂详情失败', e)
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
    
    // 获取相关方剂
    try {
      const res = await api.getFormulaList(1, 4, formula.value?.meridian || '')
      if (res.code === 1 && res.data?.list) {
        relatedFormulas.value = res.data.list.filter((f: any) => f.name !== formulaName.value)
      }
    } catch (e) {
      console.error('获取相关方剂失败', e)
    }
  }
})

function goToDetail(name: string) {
  uni.redirectTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.meridian {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  display: inline-block;
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

.source {
  color: #8B2500;
  font-style: italic;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 8rpx 16rpx;
  background: rgba(139, 37, 0, 0.08);
  color: #8B2500;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.tag.symptom {
  background: rgba(46, 139, 74, 0.08);
  color: #2D5F4A;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.related-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

.related-meridian {
  font-size: 22rpx;
  color: #8B2500;
}
</style>
