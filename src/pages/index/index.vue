<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-wrap">
        <icon type="search" size="16" color="#999" />
        <input
          class="search-input"
          type="text"
          v-model="searchQuery"
          placeholder="搜索方剂、药物、穴位..."
          placeholder-class="placeholder"
          confirm-type="search"
          @confirm="onSearch"
        />
      </view>
    </view>

    <!-- Hero区域 - 云纹装饰 -->
    <view class="hero-section">
      <view class="cloud-pattern"></view>
      <view class="hero-content">
        <text class="hero-title">岐黄小识</text>
        <text class="hero-subtitle">经方中医学习工具</text>
        <text class="hero-desc">基于倪海厦中医知识体系</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card">
        <text class="stat-num">92</text>
        <text class="stat-label">经方</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">349</text>
        <text class="stat-label">药物</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">309</text>
        <text class="stat-label">穴位</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">188</text>
        <text class="stat-label">医案</text>
      </view>
    </view>

    <!-- 功能导航 -->
    <view class="section">
      <text class="section-title">功能导航</text>
      <view class="nav-grid">
        <view class="nav-item" @tap="goTo('/pages/formulas/index')">
          <view class="nav-icon formula">方</view>
          <text class="nav-text">方剂速查</text>
        </view>
        <view class="nav-item" @tap="goTo('/pages/herbs/index')">
          <view class="nav-icon herb">药</view>
          <text class="nav-text">药物查询</text>
        </view>
        <view class="nav-item" @tap="goTo('/pages/cases/index')">
          <view class="nav-icon case">案</view>
          <text class="nav-text">医案浏览</text>
        </view>
        <view class="nav-item" @tap="goTo('/pages/diagnosis/index')">
          <view class="nav-icon diagnosis">经</view>
          <text class="nav-text">六经辨证</text>
        </view>
        <view class="nav-item" @tap="goTo('/pages/acupuncture/index')">
          <view class="nav-icon acupuncture">穴</view>
          <text class="nav-text">针灸穴位</text>
        </view>
        <view class="nav-item" @tap="goTo('/pages/about/index')">
          <view class="nav-icon about">识</view>
          <text class="nav-text">关于</text>
        </view>
      </view>
    </view>

    <!-- 六经速查 -->
    <view class="section">
      <text class="section-title">六经速查</text>
      <view class="meridian-grid">
        <view
          v-for="item in sixMeridians"
          :key="item.name"
          class="meridian-card"
          :class="'meridian-' + item.name"
          @tap="goToDiagnosis(item.name)"
        >
          <text class="meridian-name">{{ item.name }}</text>
          <text class="meridian-desc">{{ item.description }}</text>
          <text class="meridian-formula">{{ item.formula }}</text>
        </view>
      </view>
    </view>

    <!-- 常用经方 -->
    <view class="section">
      <text class="section-title">常用经方</text>
      <view class="formula-grid">
        <view
          v-for="item in hotFormulas"
          :key="item.name"
          class="formula-card"
          @tap="goToFormula(item.name)"
        >
          <text class="formula-name">{{ item.name }}</text>
          <text class="formula-meridian">{{ item.meridian }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import formulasData from '@/data/formulas.json'
import herbsData from '@/data/herbs.json'
import casesData from '@/data/cases.json'
import sixMeridiansData from '@/data/six-meridians.json'

const searchQuery = ref('')
const formulas = ref(formulasData)
const herbs = ref(herbsData)
const cases = ref(casesData)
const sixMeridians = ref(sixMeridiansData)

const hotFormulas = computed(() => {
  return formulas.value.slice(0, 9)
})

function onSearch() {
  if (searchQuery.value.trim()) {
    uni.navigateTo({
      url: `/pages/formulas/index?keyword=${encodeURIComponent(searchQuery.value)}`
    })
  }
}

function goTo(url: string) {
  const tabBarPages = ['/pages/index/index', '/pages/formulas/index', '/pages/herbs/index', '/pages/cases/index', '/pages/acupuncture/index']
  if (tabBarPages.some(p => url.startsWith(p))) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

function goToDiagnosis(name: string) {
  uni.navigateTo({
    url: `/pages/diagnosis/index?meridian=${encodeURIComponent(name)}`
  })
}

function goToFormula(name: string) {
  uni.navigateTo({
    url: `/pages/formulas/detail?name=${encodeURIComponent(name)}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
}

/* 搜索栏 */
.search-section {
  padding: 24rpx;
  background: linear-gradient(180deg, #8B2500, #A63A1E);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.placeholder {
  color: #999;
}

/* Hero区域 */
.hero-section {
  position: relative;
  padding: 60rpx 24rpx 40rpx;
  background: linear-gradient(180deg, #A63A1E, #8B2500);
  overflow: hidden;
}

.cloud-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(ellipse 60px 40px at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 80px 50px at 70% 20%, rgba(255,255,255,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 50px 30px at 50% 70%, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-title {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 8rpx;
  margin-bottom: 12rpx;
}

.hero-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8rpx;
}

.hero-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 统计卡片 */
.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 32rpx 24rpx;
  margin: -20rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #8B2500;
  font-family: 'Georgia', serif;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 区块 */
.section {
  padding: 0 24rpx 32rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 20rpx;
  position: relative;
  padding-left: 20rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 28rpx;
  background: linear-gradient(180deg, #8B2500, #B8860B);
  border-radius: 3rpx;
}

/* 功能导航 */
.nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
}

.nav-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.nav-icon.formula { background: linear-gradient(135deg, #8B2500, #A63A1E); }
.nav-icon.herb { background: linear-gradient(135deg, #2D5F4A, #3D7A62); }
.nav-icon.case { background: linear-gradient(135deg, #2980B9, #3498DB); }
.nav-icon.diagnosis { background: linear-gradient(135deg, #B8860B, #D4A017); }
.nav-icon.acupuncture { background: linear-gradient(135deg, #8E44AD, #9B59B6); }
.nav-icon.about { background: linear-gradient(135deg, #7F8C8D, #95A5A6); }

.nav-text {
  font-size: 24rpx;
  color: #333;
}

/* 六经速查 */
.meridian-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.meridian-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.meridian-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6rpx;
  height: 100%;
}

.meridian-sun::before { background: #C0392B; }
.meridian-yangming::before { background: #E67E22; }
.meridian-shaoyang::before { background: #F39C12; }
.meridian-taiyin::before { background: #8B4513; }
.meridian-shaoyin::before { background: #2980B9; }
.meridian-jueyin::before { background: #8E44AD; }

.meridian-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 8rpx;
}

.meridian-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.meridian-formula {
  display: block;
  font-size: 22rpx;
  color: #999;
}

/* 常用经方 */
.formula-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.formula-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 12rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;
}

.formula-card:active {
  transform: scale(0.95);
}

.formula-card .formula-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.formula-card .formula-meridian {
  font-size: 22rpx;
  color: #8B2500;
  background: rgba(139, 37, 0, 0.08);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
  display: inline-block;
}
</style>
