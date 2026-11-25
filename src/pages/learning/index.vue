<template>
  <view class="container" :class="themeClass">
    <view v-if="!isLoggedIn" class="empty-state">
      <text class="empty-icon">📚</text>
      <text class="empty-text">请先登录查看学习记录</text>
      <button class="btn-login" @tap="goToLogin">去登录</button>
    </view>

    <view v-else>
      <!-- 学习进度总览 -->
      <view class="progress-section">
        <text class="section-title">学习进度</text>
        <view class="progress-grid">
          <view class="progress-item">
            <view class="progress-header">
              <text class="progress-label">方剂</text>
              <text class="progress-num">{{ stats.formula }}/{{ totalStats.formula }}</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getPercent(stats.formula, totalStats.formula) + '%' }"></view>
            </view>
          </view>
          <view class="progress-item">
            <view class="progress-header">
              <text class="progress-label">药物</text>
              <text class="progress-num">{{ stats.herb }}/{{ totalStats.herb }}</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill herb" :style="{ width: getPercent(stats.herb, totalStats.herb) + '%' }"></view>
            </view>
          </view>
          <view class="progress-item">
            <view class="progress-header">
              <text class="progress-label">穴位</text>
              <text class="progress-num">{{ stats.acupoint }}/{{ totalStats.acupoint }}</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill acupoint" :style="{ width: getPercent(stats.acupoint, totalStats.acupoint) + '%' }"></view>
            </view>
          </view>
          <view class="progress-item">
            <view class="progress-header">
              <text class="progress-label">医案</text>
              <text class="progress-num">{{ stats.case }}/{{ totalStats.case }}</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill case" :style="{ width: getPercent(stats.case, totalStats.case) + '%' }"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 学习记录列表 -->
      <view class="section">
        <text class="section-title">最近学习</text>
        <view class="learning-list">
          <view v-for="item in learningList" :key="item.id" class="learning-item">
            <view class="learning-icon" :class="item.content_type">
              <text>{{ getTypeIcon(item.content_type) }}</text>
            </view>
            <view class="learning-info">
              <text class="learning-name">{{ item.content_name }}</text>
              <text class="learning-meta">{{ getTypeName(item.content_type) }} · 查看{{ item.view_count }}次</text>
            </view>
            <text class="learning-time">{{ item.last_view_time }}</text>
          </view>

          <view v-if="learningList.length === 0 && !loading" class="empty-hint">
            <text>暂无学习记录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { authState } from '@/utils/auth'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
// 登录态响应式：会话过期时自动切回"请先登录"状态
const isLoggedIn = computed(() => authState.loggedIn)
const loading = ref(false)
const learningList = ref<any[]>([])

const stats = ref({
  formula: 0,
  herb: 0,
  acupoint: 0,
  case: 0,
  total: 0
})

// 总数统计（从API动态获取）
const totalStats = ref({
  formula: 0,
  herb: 0,
  acupoint: 0,
  case: 0
})

onShow(() => {
  loadTotalStats()
  if (isLoggedIn.value) {
    loadLearningStats()
    loadLearningList()
  } else {
    learningList.value = []
  }
})

function goToLogin() {
  uni.navigateTo({ url: `/pages/login/index?redirect=${encodeURIComponent('back')}` })
}

async function loadTotalStats() {
  try {
    const res = await api.getStats()
    if (res.code === 1) {
      totalStats.value = {
        formula: res.data.formula_count || 0,
        herb: res.data.herb_count || 0,
        acupoint: res.data.acupoint_count || 0,
        case: res.data.case_count || 0
      }
    }
  } catch (e) {
    console.error('加载总数统计失败', e)
  }
}

async function loadLearningStats() {
  try {
    const res = await api.getLearningStats()
    if (res.code === 1) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('加载学习统计失败', e)
  }
}

async function loadLearningList() {
  loading.value = true
  try {
    const res = await api.request('learning', 'list', { exclude_type: 'diagnosis', page: 1, limit: 50 })
    if (res.code === 1) {
      learningList.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载学习记录失败', e)
  } finally {
    loading.value = false
  }
}

function getPercent(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, (current / total) * 100)
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'formula': '方',
    'herb': '药',
    'acupoint': '穴',
    'case': '案'
  }
  return icons[type] || '?'
}

function getTypeName(type: string): string {
  const names: Record<string, string> = {
    'formula': '方剂',
    'herb': '药物',
    'acupoint': '穴位',
    'case': '医案'
  }
  return names[type] || type
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: var(--bg-base);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
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

.progress-section {
  margin: 24rpx;
  background: var(--bg-card);
  border-radius: 12rpx;
  padding: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20rpx;
}

.progress-grid {
  display: grid;
  gap: 20rpx;
}

.progress-item {
  padding: 16rpx;
  background: var(--bg-elevated);
  border-radius: 8rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.progress-label {
  font-size: 26rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.progress-num {
  font-size: 26rpx;
  color: var(--brand-ink);
  font-weight: 600;
}

.progress-bar {
  height: 12rpx;
  background: var(--border);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand), var(--brand-light));
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.progress-fill.herb {
  background: linear-gradient(90deg, var(--jade), var(--jade));
}

.progress-fill.acupoint {
  background: linear-gradient(90deg, var(--accent), var(--accent));
}

.progress-fill.case {
  background: linear-gradient(90deg, #2980B9, #3498DB);
}

.section {
  margin: 24rpx;
  background: var(--bg-card);
  border-radius: 12rpx;
  padding: 24rpx;
}

.learning-list {
  display: grid;
  gap: 12rpx;
}

.learning-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: var(--bg-elevated);
  border-radius: 8rpx;
  gap: 16rpx;
}

.learning-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
}

.learning-icon.formula { background: var(--brand); }
.learning-icon.herb { background: var(--jade); }
.learning-icon.acupoint { background: var(--accent); }
.learning-icon.case { background: #2980B9; }

.learning-info {
  flex: 1;
}

.learning-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4rpx;
}

.learning-meta {
  font-size: 22rpx;
  color: var(--text-muted);
}

.learning-time {
  font-size: 22rpx;
  color: var(--text-muted);
}

.empty-hint {
  text-align: center;
  padding: 40rpx;
  color: var(--text-muted);
}
</style>
