<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar" @tap="isLoggedIn ? null : goToLogin()">
        <text class="avatar-text" v-if="isLoggedIn">{{ user?.username?.charAt(0).toUpperCase() }}</text>
        <text class="avatar-text" v-else>?</text>
      </view>
      <view class="user-info" v-if="isLoggedIn">
        <text class="username">{{ user?.username }}</text>
        <text class="user-role">{{ user?.role === 'admin' ? '管理员' : '学习者' }}</text>
      </view>
      <view class="user-info" v-else @tap="goToLogin">
        <text class="username">点击登录</text>
        <text class="user-role">登录后同步学习数据</text>
      </view>
    </view>

    <!-- 学习进度 -->
    <view class="section" v-if="isLoggedIn">
      <text class="section-title">学习进度</text>
      <view class="learning-grid">
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.formula }}</text>
          <text class="learning-label">方剂</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.herb }}</text>
          <text class="learning-label">药物</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.acupoint }}</text>
          <text class="learning-label">穴位</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.case }}</text>
          <text class="learning-label">医案</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goTo('/pages/cases/index')">
        <view class="menu-icon diagnosis-icon">
          <text class="icon-text">诊</text>
        </view>
        <text class="menu-text">问诊记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/cases/index?type=learning')">
        <view class="menu-icon learning-icon">
          <text class="icon-text">学</text>
        </view>
        <text class="menu-text">学习记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="toggleTheme">
        <view class="menu-icon theme-icon">
          <text class="icon-text">{{ isDarkMode ? '亮' : '暗' }}</text>
        </view>
        <text class="menu-text">主题模式</text>
        <text class="menu-switch">
          <switch :checked="isDarkMode" @change="toggleTheme" color="#8B2500" />
        </text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/agreement/index')">
        <view class="menu-icon agreement-icon">
          <text class="icon-text">协</text>
        </view>
        <text class="menu-text">服务协议</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/privacy/index')">
        <view class="menu-icon privacy-icon">
          <text class="icon-text">隐</text>
        </view>
        <text class="menu-text">隐私协议</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/about/index')">
        <view class="menu-icon about-icon">
          <text class="icon-text">关</text>
        </view>
        <text class="menu-text">关于</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLoggedIn">
      <button class="btn-logout" @tap="handleLogout">退出登录</button>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text>岐黄小识 v1.0.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const isLoggedIn = ref(false)
const user = ref<any>(null)
const isDarkMode = ref(false)

const learningStats = ref({
  formula: 0,
  herb: 0,
  acupoint: 0,
  case: 0,
  total: 0
})

onMounted(() => {
  // 检查登录状态
  isLoggedIn.value = api.isLoggedIn()
  user.value = api.getUser()

  // 加载主题设置
  const theme = uni.getStorageSync('theme')
  isDarkMode.value = theme === 'dark'

  // 获取学习进度
  if (isLoggedIn.value) {
    loadLearningStats()
  }
})

async function loadLearningStats() {
  try {
    const res = await api.getLearningStats()
    if (res.code === 1) {
      learningStats.value = res.data
    }
  } catch (e) {
    console.error('获取学习进度失败', e)
  }
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  uni.setStorageSync('theme', isDarkMode.value ? 'dark' : 'light')
  uni.showToast({ title: isDarkMode.value ? '已切换到暗色模式' : '已切换到亮色模式', icon: 'none' })
}

function goTo(url: string) {
  uni.navigateTo({ url })
}

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        api.logout()
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
}

.user-card {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  padding: 60rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 48rpx;
  color: #fff;
  font-weight: 700;
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4rpx;
}

.user-role {
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

.learning-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.learning-item {
  text-align: center;
  padding: 16rpx 0;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.learning-num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #8B2500;
  margin-bottom: 4rpx;
}

.learning-label {
  font-size: 22rpx;
  color: #999;
}

.menu-section {
  margin: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.icon-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

.diagnosis-icon { background: linear-gradient(135deg, #8B2500, #A63A1E); }
.learning-icon { background: linear-gradient(135deg, #2D5F4A, #3D7A62); }
.theme-icon { background: linear-gradient(135deg, #B8860B, #D4A017); }
.agreement-icon { background: linear-gradient(135deg, #2980B9, #3498DB); }
.privacy-icon { background: linear-gradient(135deg, #8E44AD, #9B59B6); }
.about-icon { background: linear-gradient(135deg, #7F8C8D, #95A5A6); }

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.menu-switch {
  margin-right: 8rpx;
}

.logout-section {
  margin: 40rpx 24rpx;
}

.btn-logout {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: #DC3545;
  border: 2rpx solid #DC3545;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.version-info {
  text-align: center;
  padding: 40rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
