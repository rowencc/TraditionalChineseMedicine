<template>
  <view class="container" :class="themeClass" v-if="record">
    <!-- 症状 -->
    <view class="section">
      <text class="section-title">症状描述</text>
      <text class="content">{{ record.symptoms }}</text>
    </view>

    <!-- 六经归属 -->
    <view class="meridian-card" v-if="record.meridian">
      <text class="meridian-label">六经归属</text>
      <text class="meridian-value">{{ record.meridian }}</text>
    </view>

    <!-- 推荐方剂 -->
    <view class="section" v-if="formulas.length > 0">
      <text class="section-title">推荐方剂</text>
      <view class="formula-list">
        <view v-for="f in formulas" :key="f" class="formula-item" @tap="goToFormula(f)">
          <text class="formula-name">{{ f }}</text>
        </view>
      </view>
    </view>

    <!-- 详细分析 -->
    <view class="section">
      <text class="section-title">辨证分析</text>
      <text class="content analysis">{{ record.analysis || record.raw_response }}</text>
    </view>

    <!-- 注意事项 -->
    <view class="section advice" v-if="record.advice">
      <text class="section-title">注意事项</text>
      <text class="content">{{ record.advice }}</text>
    </view>

    <!-- 元信息 -->
    <view class="meta">
      <text v-if="record.source">AI模型：{{ record.source }}</text>
      <text v-if="record.create_time">{{ record.create_time }}</text>
    </view>
  </view>

  <view v-else-if="loading" class="loading-wrap">
    <text>加载中...</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const record = ref<any>(null)
const loading = ref(true)
const formulas = ref<string[]>([])

onLoad(async (options) => {
  if (options?.id) {
    try {
      const res = await api.getDiagnosisDetail(Number(options.id))
      if (res.code === 1 && res.data) {
        record.value = res.data
        // 解析方剂
        if (res.data.suggested_formulas) {
          const arr = typeof res.data.suggested_formulas === 'string'
            ? JSON.parse(res.data.suggested_formulas)
            : res.data.suggested_formulas
          formulas.value = Array.isArray(arr) ? arr : []
        }
        uni.setNavigationBarTitle({ title: record.value.meridian ? record.value.meridian + '辨证' : '问一问详情' })
      }
    } catch (e) {
      console.error('加载问诊详情失败', e)
    } finally {
      loading.value = false
    }
  }
})

function goToFormula(name: string) {
  uni.navigateTo({ url: `/pages/formulas/detail?name=${encodeURIComponent(name)}` })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
  padding-bottom: 60rpx;
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
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
}

.analysis {
  color: #444;
}

.meridian-card {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  text-align: center;
}

.meridian-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8rpx;
}

.meridian-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.formula-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.formula-item {
  padding: 10rpx 24rpx;
  background: rgba(139, 37, 0, 0.08);
  border-radius: 20rpx;
}

.formula-name {
  font-size: 26rpx;
  color: #8B2500;
  font-weight: 500;
}

.advice {
  border-left: 4rpx solid #B8860B;
}

.meta {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 8rpx;
  font-size: 22rpx;
  color: #bbb;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  color: #999;
}
</style>
