<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="logo-icon">
        <text class="logo-text">岐</text>
      </view>
      <text class="app-name">岐黄小识</text>
      <text class="version">v1.0.0</text>
    </view>

    <!-- 用户信息 -->
    <view class="section user-section" v-if="isLoggedIn">
      <view class="user-info">
        <text class="user-name">{{ user?.username }}</text>
        <text class="user-role">{{ user?.role === 'admin' ? '管理员' : '用户' }}</text>
      </view>
      <button class="btn-small" @tap="goToUser">个人中心</button>
    </view>
    <view class="section user-section" v-else>
      <view class="user-info">
        <text class="user-name">未登录</text>
        <text class="user-desc">登录后可同步数据</text>
      </view>
      <button class="btn-small btn-primary" @tap="goToLogin">登录</button>
    </view>

    <!-- 服务状态 -->
    <view class="section">
      <text class="section-title">服务状态</text>
      <view class="status-list">
        <view class="status-item">
          <view class="status-dot" :class="serverConnected ? 'online' : 'offline'"></view>
          <text class="status-text">服务器连接</text>
          <text class="status-value">{{ serverConnected ? '正常' : '离线' }}</text>
        </view>
        <view class="status-item">
          <view class="status-dot online"></view>
          <text class="status-text">数据状态</text>
          <text class="status-value">{{ stats.formula_count }} 经方 / {{ stats.herb_count }} 药物</text>
        </view>
      </view>
    </view>

    <!-- 学习进度 -->
    <view class="section" v-if="isLoggedIn">
      <text class="section-title">学习进度</text>
      <view class="learning-grid">
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.formula }}</text>
          <text class="learning-label">已学方剂</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.herb }}</text>
          <text class="learning-label">已学药物</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.acupoint }}</text>
          <text class="learning-label">已学穴位</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.case }}</text>
          <text class="learning-label">已阅医案</text>
        </view>
      </view>
      <view class="learning-total">
        <text>共学习 {{ learningStats.total }} 项内容</text>
      </view>
    </view>

    <!-- 简介 -->
    <view class="section">
      <text class="section-title">关于</text>
      <text class="content">
        本小程序基于倪海厦（1954-2012）中医知识库开发，收录伤寒论129条、金匮23篇、黄帝内经71篇、神农本草经345种药物、849个临床医案。
      </text>
      <text class="content">
        倪海厦是台湾经方派中医代表人物，汉唐中医创始人。其核心学术思想包括六经辨证、阳气论、经典至上、经方为主。
      </text>
    </view>

    <!-- 数据来源 -->
    <view class="section">
      <text class="section-title">数据来源</text>
      <view class="source-list">
        <view class="source-item">
          <text class="source-name">伤寒论讲义</text>
          <text class="source-pages">209页</text>
        </view>
        <view class="source-item">
          <text class="source-name">金匮要略讲义</text>
          <text class="source-pages">419页</text>
        </view>
        <view class="source-item">
          <text class="source-name">黄帝内经讲义</text>
          <text class="source-pages">461页</text>
        </view>
        <view class="source-item">
          <text class="source-name">针灸教程讲义</text>
          <text class="source-pages">216页</text>
        </view>
        <view class="source-item">
          <text class="source-name">神农本草经文稿</text>
          <text class="source-pages">339页</text>
        </view>
      </view>
    </view>

    <!-- 功能说明 -->
    <view class="section">
      <text class="section-title">功能模块</text>
      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-icon">经</text>
          <view class="feature-info">
            <text class="feature-name">方剂速查</text>
            <text class="feature-desc">92首经方，按六经分类</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon herb">药</text>
          <view class="feature-info">
            <text class="feature-name">药物查询</text>
            <text class="feature-desc">349味药物，性味归经</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon case">案</text>
          <view class="feature-info">
            <text class="feature-name">医案浏览</text>
            <text class="feature-desc">188例倪海厦临床医案</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon diagnosis">辨</text>
          <view class="feature-info">
            <text class="feature-name">六经辨证</text>
            <text class="feature-desc">交互式辨证辅助</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon acupuncture">穴</text>
          <view class="feature-info">
            <text class="feature-name">针灸穴位</text>
            <text class="feature-desc">309个穴位，12条经络</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="disclaimer-title">免责声明</text>
      <text class="disclaimer-text">本小程序内容仅供中医学习与研究，不替代专业医疗诊断。所有诊疗请务必咨询执业医师。</text>
    </view>

    <!-- 致谢 -->
    <view class="section">
      <text class="section-title">致谢</text>
      <text class="content">
        感谢倪海厦先生留下的宝贵中医知识，感谢 huoyalong 提供的 nihaisha-skill 基础框架，感谢 9527qingfeng 提供的医案数据支持。
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const isLoggedIn = ref(false)
const user = ref<any>(null)
const serverConnected = ref(false)
const stats = ref({
  formula_count: 0,
  herb_count: 0,
  acupoint_count: 0,
  case_count: 0
})

const learningStats = ref({
  formula: 0,
  herb: 0,
  acupoint: 0,
  case: 0,
  total: 0
})

onMounted(async () => {
  // 检查登录状态
  isLoggedIn.value = api.isLoggedIn()
  user.value = api.getUser()

  // 检查服务器连接并获取统计数据
  try {
    const res = await api.getStats()
    if (res.code === 1) {
      serverConnected.value = true
      stats.value = res.data
    }
  } catch (e) {
    serverConnected.value = false
  }

  // 获取学习进度
  if (isLoggedIn.value) {
    try {
      const res = await api.getLearningStats()
      if (res.code === 1) {
        learningStats.value = res.data
      }
    } catch (e) {
      console.error('获取学习进度失败', e)
    }
  }
})

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function goToUser() {
  uni.navigateTo({ url: '/pages/user/index' })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding-bottom: 40rpx;
}

.header {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  padding: 60rpx 40rpx;
  text-align: center;
}

.logo-icon {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.logo-text {
  font-size: 56rpx;
  color: #fff;
  font-weight: 700;
}

.app-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.version {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.section {
  margin: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.content {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 12rpx;
}

/* 用户信息 */
.user-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.user-role, .user-desc {
  font-size: 24rpx;
  color: #999;
}

.btn-small {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  color: #666;
  border: none;
}

.btn-primary {
  background: #8B2500;
  color: #fff;
}

/* 服务状态 */
.status-list {
  display: grid;
  gap: 16rpx;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.status-dot.online {
  background: #28a745;
}

.status-dot.offline {
  background: #dc3545;
}

.status-text {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.status-value {
  font-size: 24rpx;
  color: #999;
}

/* 数据来源 */
.source-list {
  display: grid;
  gap: 12rpx;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.source-item:last-child {
  border-bottom: none;
}

.source-name {
  font-size: 26rpx;
  color: #333;
}

.source-pages {
  font-size: 24rpx;
  color: #999;
}

/* 学习进度 */
.learning-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.learning-item {
  text-align: center;
  padding: 20rpx;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.learning-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #8B2500;
  margin-bottom: 4rpx;
}

.learning-label {
  font-size: 22rpx;
  color: #999;
}

.learning-total {
  text-align: center;
  font-size: 24rpx;
  color: #666;
  padding-top: 8rpx;
  border-top: 1rpx solid #f0f0f0;
}

/* 功能模块 */
.feature-list {
  display: grid;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.feature-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  margin-right: 16rpx;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
}

.feature-icon.herb {
  background: linear-gradient(135deg, #2D5F4A, #3D7A62);
}

.feature-icon.case {
  background: linear-gradient(135deg, #2980B9, #3498DB);
}

.feature-icon.diagnosis {
  background: linear-gradient(135deg, #B8860B, #D4A017);
}

.feature-icon.acupuncture {
  background: linear-gradient(135deg, #8E44AD, #9B59B6);
}

.feature-info {
  flex: 1;
}

.feature-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.feature-desc {
  font-size: 24rpx;
  color: #999;
}

/* 免责声明 */
.disclaimer {
  margin: 24rpx;
  background: #FFF8DC;
  border-radius: 12rpx;
  padding: 24rpx;
  border-left: 4rpx solid #DAA520;
}

.disclaimer-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #8B4513;
  margin-bottom: 8rpx;
}

.disclaimer-text {
  font-size: 24rpx;
  color: #8B4513;
  line-height: 1.6;
}
</style>
