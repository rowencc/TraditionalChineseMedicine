<template>
  <view class="container">
    <!-- 搜索栏 -->
    <SearchBar v-model="searchQuery" @search="onSearch" />

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ formulas.length }}</text>
        <text class="stat-label">方剂</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ herbs.length }}</text>
        <text class="stat-label">药物</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ cases.length }}</text>
        <text class="stat-label">医案</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">6</text>
        <text class="stat-label">六经</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="section">
      <text class="section-title">功能导航</text>
      <view class="grid-nav">
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
          <view class="nav-icon about">关</view>
          <text class="nav-text">关于</text>
        </view>
      </view>
    </view>

    <!-- 六经速查 -->
    <view class="section">
      <text class="section-title">六经速查</text>
      <view class="meridian-list">
        <view
          v-for="item in sixMeridians"
          :key="item.name"
          class="meridian-card"
          @tap="goToDiagnosis(item.name)"
        >
          <text class="meridian-name">{{ item.name }}</text>
          <text class="meridian-desc">{{ item.description }}</text>
          <text class="meridian-formula">{{ item.formula }}</text>
        </view>
      </view>
    </view>

    <!-- 推荐方剂 -->
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
import { onShow } from '@dcloudio/uni-app'
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
  return formulas.value.slice(0, 8)
})

function onSearch() {
  if (searchQuery.value.trim()) {
    uni.navigateTo({
      url: `/pages/formulas/index?keyword=${encodeURIComponent(searchQuery.value)}`
    })
  }
}

function goTo(url: string) {
  // tabBar 页面使用 switchTab，其他页面使用 navigateTo
  const tabBarPages = ['/pages/index/index', '/pages/formulas/index', '/pages/herbs/index', '/pages/cases/index']
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
  background: #f5f5f5;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  margin: 24rpx;
  padding: 32rpx;
  background: linear-gradient(135deg, #8B0000, #A52A2A);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(139, 0, 0, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.section {
  margin: 24rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.grid-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
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
}

.nav-icon.formula { background: linear-gradient(135deg, #8B0000, #A52A2A); }
.nav-icon.herb { background: linear-gradient(135deg, #2E8B57, #3CB371); }
.nav-icon.case { background: linear-gradient(135deg, #4682B4, #5F9EA0); }
.nav-icon.diagnosis { background: linear-gradient(135deg, #DAA520, #FFD700); }
.nav-icon.acupuncture { background: linear-gradient(135deg, #9370DB, #BA55D3); }
.nav-icon.about { background: linear-gradient(135deg, #708090, #A9A9A9); }

.nav-text {
  font-size: 26rpx;
  color: #333;
}

.meridian-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.meridian-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.meridian-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #8B0000;
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
  color: #8B0000;
  background: rgba(139, 0, 0, 0.08);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
  display: inline-block;
}
</style>
