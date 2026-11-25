<script lang="ts">
import { getAppName } from '@/utils/platform'

export default {
  onShareAppMessage() {
    return { title: getAppName(), path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: getAppName() }
  }
}
</script>

<template>
  <view class="container" :class="themeClass">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-wrap">
        <text class="search-icon">🔍</text>
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

    <!-- 用户状态 -->
    <view class="user-bar" v-if="isLoggedIn">
      <view class="user-avatar">
        <text>{{ displayName?.charAt(0).toUpperCase() }}</text>
      </view>
      <text class="user-greeting">欢迎回来，{{ displayName }}</text>
      <text class="user-learning">已学习 {{ learningTotal }} 项</text>
    </view>

    <!-- Hero区域 -->
    <view class="hero-section">
      <view class="cloud-pattern"></view>
      <view class="hero-content">
        <text class="hero-title">{{ appName }}</text>
        <text class="hero-subtitle">经方中医学习工具</text>
        <text class="hero-desc">基于倪海厦中医知识体系</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card" v-for="(item, index) in stats" :key="index">
        <text class="stat-num">{{ item.value }}</text>
        <text class="stat-label">{{ item.label }}</text>
      </view>
    </view>

    <!-- 功能导航 -->
    <view class="section">
      <text class="section-title">功能导航</text>
      <view class="nav-grid">
        <view class="nav-item" v-for="(item, index) in navItems" :key="index" @tap="goTo(item.url)">
          <view class="nav-icon" :class="item.color">{{ item.icon }}</view>
          <text class="nav-text">{{ item.name }}</text>
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
          :class="'meridian-' + item.cssClass"
          @tap="goToMeridian(item.name)"
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
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { authState } from '@/utils/auth'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
// 登录态改为响应式：token 过期被静默登出时，首页用户栏自动隐藏
const isLoggedIn = computed(() => authState.loggedIn)
const user = ref<any>(null)
const learningTotal = ref(0)
const searchQuery = ref('')
const appName = ref('')

// 计算显示名称：优先使用nickname，其次username
const displayName = computed(() => {
  if (user.value?.nickname) return user.value.nickname
  if (user.value?.username) return user.value.username
  return ''
})
const stats = ref([
  { value: 0, label: '经方' },
  { value: 0, label: '药物' },
  { value: 0, label: '穴位' },
  { value: 0, label: '医案' }
])

const navItems = ref([
  { name: '方剂速查', url: '/pages/formulas/index', icon: '方', color: 'formula' },
  { name: '药物查询', url: '/pages/herbs/index', icon: '药', color: 'herb' },
  { name: '医案浏览', url: '/pages/cases/index', icon: '案', color: 'case' },
  { name: '六经辨证', url: '/pages/liujing/index', icon: '经', color: 'diagnosis' },
  { name: '针灸穴位', url: '/pages/acupuncture/index', icon: '穴', color: 'acupuncture' },
  { name: '关于', url: '/pages/about/index', icon: '识', color: 'about' }
])

const sixMeridians = ref([
  { name: '太阳', cssClass: 'sun', description: '表证', formula: '桂枝汤、麻黄汤' },
  { name: '阳明', cssClass: 'yangming', description: '里热证', formula: '白虎汤、承气汤' },
  { name: '少阳', cssClass: 'shaoyang', description: '半表半里证', formula: '小柴胡汤' },
  { name: '太阴', cssClass: 'taiyin', description: '脾虚寒湿证', formula: '理中汤' },
  { name: '少阴', cssClass: 'shaoyin', description: '心肾阳虚证', formula: '四逆汤、真武汤' },
  { name: '厥阴', cssClass: 'jueyin', description: '寒热错杂证', formula: '乌梅丸' }
])

const hotFormulas = ref<any[]>([])

// 页面显示时检查登录状态
onShow(() => {
  user.value = api.getUser()

  // 刷新应用名称（从缓存读取最新配置）
  const cached = uni.getStorageSync('site_config')
  if (cached?.app_name) appName.value = cached.app_name

  if (isLoggedIn.value) {
    loadLearningStats()
  }
})

// 加载统计数据
onMounted(async () => {
  // 先从缓存加载站点配置（快速显示）
  const cached = uni.getStorageSync('site_config')
  if (cached) {
    applyNavConfig(cached)
  }

  // 再从服务器刷新站点配置
  try {
    const cfg = await api.getSiteConfig()
    if (cfg.code === 1 && cfg.data) {
      uni.setStorageSync('site_config', cfg.data)
      applyNavConfig(cfg.data)
    }
  } catch (e) {
    // 使用缓存或默认值
  }

  try {
    const res = await api.getStats()
    if (res.code === 1) {
      stats.value = [
        { value: res.data.formula_count || 0, label: '经方' },
        { value: res.data.herb_count || 0, label: '药物' },
        { value: res.data.acupoint_count || 0, label: '穴位' },
        { value: res.data.case_count || 0, label: '医案' }
      ]
    }
  } catch (e) {
    console.error('加载统计数据失败', e)
  }

  // 加载常用经方
  try {
    const res = await api.getFormulaList(1, 9)
    if (res.code === 1) {
      hotFormulas.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载方剂数据失败', e)
  }
})

async function loadLearningStats() {
  try {
    const res = await api.getLearningStats()
    if (res.code === 1) {
      learningTotal.value = res.data.total || 0
    }
  } catch (e) {
    console.error('加载学习进度失败', e)
  }
}

function applyNavConfig(c: any) {
  appName.value = c.app_name || getAppName()
  navItems.value = [
    { name: c.nav_formulas || '识方剂', url: '/pages/formulas/index', icon: '方', color: 'formula' },
    { name: c.nav_herbs || '识药', url: '/pages/herbs/index', icon: '药', color: 'herb' },
    { name: c.nav_cases || '识医案', url: '/pages/cases/index', icon: '案', color: 'case' },
    { name: c.nav_diagnosis || '识六经', url: '/pages/liujing/index', icon: '经', color: 'diagnosis' },
    { name: c.nav_acupuncture || '识穴', url: '/pages/acupuncture/index', icon: '穴', color: 'acupuncture' },
    { name: c.nav_about || '关于', url: '/pages/about/index', icon: '识', color: 'about' }
  ]
}

function onSearch() {
  if (searchQuery.value.trim()) {
    uni.navigateTo({
      url: `/pages/search/index?keyword=${encodeURIComponent(searchQuery.value)}`
    })
  }
}

function goTo(url: string) {
  // tabBar 页面必须用 switchTab
  const tabBarPages = ['/pages/index/index', '/pages/diagnosis/index', '/pages/profile/index']
  if (tabBarPages.some(p => url.startsWith(p))) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

function goToMeridian(name: string) {
  // 六经速查 → 直接进入该经的详情页（不再跳到问一问）
  uni.navigateTo({ url: `/pages/liujing/index?meridian=${encodeURIComponent(name)}` })
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
  background: var(--bg-base);
}

.search-section {
  padding: 24rpx;
  background: linear-gradient(180deg, var(--brand-light), var(--brand));
}

.user-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: linear-gradient(180deg, var(--brand), var(--brand-light));
  gap: 12rpx;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
  font-weight: 600;
}

.user-greeting {
  flex: 1;
  font-size: 26rpx;
  color: #fff;
}

.user-learning {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: var(--bg-card);
  border-radius: 40rpx;
}

.search-icon {
  font-size: 28rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary);
}

.placeholder {
  color: var(--text-muted);
}

.hero-section {
  position: relative;
  padding: 60rpx 24rpx 40rpx;
  background: linear-gradient(180deg, var(--brand-light), var(--brand));
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
    radial-gradient(ellipse 80px 50px at 70% 20%, rgba(255,255,255,0.06) 0%, transparent 70%);
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

.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 32rpx 24rpx;
  margin: -20rpx 24rpx 24rpx;
  background: var(--bg-card);
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
  color: var(--brand-ink);
}

.stat-label {
  font-size: 22rpx;
  color: var(--text-muted);
  margin-top: 4rpx;
}

.section {
  padding: 0 24rpx 32rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
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
  background: linear-gradient(180deg, var(--brand), var(--accent));
  border-radius: 3rpx;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  background: var(--bg-card);
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

.nav-icon.formula { background: linear-gradient(135deg, var(--brand), var(--brand-light)); }
.nav-icon.herb { background: linear-gradient(135deg, var(--jade), var(--jade)); }
.nav-icon.case { background: linear-gradient(135deg, #2980B9, #3498DB); }
.nav-icon.diagnosis { background: linear-gradient(135deg, var(--accent), var(--accent)); }
.nav-icon.acupuncture { background: linear-gradient(135deg, #8E44AD, #9B59B6); }
.nav-icon.about { background: linear-gradient(135deg, #7F8C8D, #95A5A6); }

.nav-text {
  font-size: 24rpx;
  color: var(--text-primary);
}

.meridian-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.meridian-card {
  background: var(--bg-card);
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
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.meridian-desc {
  display: block;
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.meridian-formula {
  display: block;
  font-size: 22rpx;
  color: var(--text-muted);
}

.formula-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.formula-card {
  background: var(--bg-card);
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
  color: var(--text-primary);
  margin-bottom: 6rpx;
}

.formula-card .formula-meridian {
  font-size: 22rpx;
  color: var(--brand-ink);
  background: var(--brand-soft);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
  display: inline-block;
}
</style>
