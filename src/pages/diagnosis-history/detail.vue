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
      <markdown-view :content="record.analysis || record.raw_response" />
    </view>

    <!-- 注意事项 -->
    <view class="section advice" v-if="record.advice">
      <text class="section-title">注意事项</text>
      <markdown-view :content="record.advice" />
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

  <!-- 未登录 / 加载失败 -->
  <view v-else class="state-wrap">
    <text class="state-text">{{ needLogin ? '登录后可查看该问诊记录' : '记录加载失败' }}</text>
    <button v-if="needLogin" class="btn-login" @tap="goToLogin">去登录</button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"
import { getTabName } from '@/utils/platform'
import MarkdownView from '@/components/MarkdownView.vue'

const { themeClass } = useTheme()
const diagnosisName = computed(() => getTabName('diagnosis'))
const record = ref<any>(null)
const loading = ref(true)
const needLogin = ref(false)
const formulas = ref<string[]>([])
const recordId = ref<number | null>(null)

onLoad((options) => {
  if (options?.id) {
    recordId.value = Number(options.id)
    loadDetail(recordId.value)
  }
})

// 从登录页返回后自动继续加载
onShow(() => {
  if (needLogin.value && recordId.value && api.isLoggedIn()) {
    needLogin.value = false
    loadDetail(recordId.value)
  }
})

async function loadDetail(id: number) {
  if (!id) return

  // 未登录直接引导登录，避免白屏（接口会返回 401）
  if (!api.isLoggedIn()) {
    needLogin.value = true
    loading.value = false
    return
  }

  loading.value = true
  needLogin.value = false

  try {
    const res = await api.getDiagnosisDetail(id)
    if (res.code === 401) {
      needLogin.value = true
      return
    }
    if (res.code === 1 && res.data) {
      record.value = res.data
      // 解析方剂
      if (res.data.suggested_formulas) {
        try {
          const arr = typeof res.data.suggested_formulas === 'string'
            ? JSON.parse(res.data.suggested_formulas)
            : res.data.suggested_formulas
          formulas.value = Array.isArray(arr) ? arr : []
        } catch {
          const raw = String(res.data.suggested_formulas)
          formulas.value = raw.includes('、') ? raw.split('、').filter(Boolean) : raw ? [raw] : []
        }
      }
      uni.setNavigationBarTitle({ title: record.value.meridian ? record.value.meridian + '辨证' : `${diagnosisName.value}详情` })

      // 如果是分享链接打开，且用户已登录，尝试将记录导入到当前用户账户
      if (api.isLoggedIn() && res.data.user_id && res.data.user_id !== api.getUser()?.id) {
        let importRes: any
        try {
          importRes = await api.request('ai', 'import_shared', { source_id: id }, 'POST')
          if (importRes.code === 1 && importRes.data?.new_id) {
            // 导入成功，更新 recordId 为新的记录
            recordId.value = importRes.data.new_id
            uni.showToast({ title: '已加入我的问诊记录', icon: 'success' })
          }
        } catch {
          // 导入失败，不影响查看，静默处理
          console.warn('导入分享记录失败', importRes?.msg)
        }
      }
    }
  } catch (e) {
    console.error('加载问诊详情失败', e)
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  uni.navigateTo({ url: `/pages/login/index?redirect=${encodeURIComponent('back')}` })
}

onShareAppMessage(() => {
  const id = recordId.value
  const meridian = record.value?.meridian || ''
  const title = meridian ? `【岐黄小识】${meridian}辨证分析` : '【岐黄小识】中医六经辨证分析'
  return {
    title,
    path: id ? `/pages/diagnosis-history/detail?id=${id}` : '/pages/diagnosis-history/detail',
    imageUrl: ''
  }
})

// 分享朋友圈
onShareTimeline(() => {
  const id = recordId.value
  const meridian = record.value?.meridian || ''
  const title = meridian ? `【岐黄小识】${meridian}辨证分析` : '【岐黄小识】中医六经辨证分析'
  return {
    title,
    query: id ? `id=${id}` : '',
    imageUrl: ''
  }
})

function goToFormula(name: string) {
  uni.navigateTo({ url: `/pages/formulas/detail?name=${encodeURIComponent(name)}` })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.section {
  background: var(--bg-card);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.content {
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
}

.analysis {
  color: var(--text-secondary);
}

.meridian-card {
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
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
  background: var(--brand-soft);
  border-radius: 20rpx;
}

.formula-name {
  font-size: 26rpx;
  color: var(--brand-ink);
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
  color: var(--text-muted);
}

.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.state-text {
  font-size: 30rpx;
  color: var(--text-secondary);
  margin-bottom: 24rpx;
}

.btn-login {
  padding: 16rpx 48rpx;
  background: var(--brand);
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>
