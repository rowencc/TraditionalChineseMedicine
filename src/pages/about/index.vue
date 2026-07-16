<template>
  <view class="container" :class="themeClass">
    <!-- 头部 -->
    <view class="header">
      <view class="logo-icon">
        <text class="logo-text">岐</text>
      </view>
      <text class="app-name">若闻小识</text>
      <text class="version">v1.0.0</text>
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

    <!-- 简介 -->
    <view class="section">
      <text class="section-title">关于</text>
      <text class="content">
        <text class="app-desc">本小程序基于倪海厦（1954-2012）中医知识库开发，收录伤寒论129条、金匮23篇、黄帝内经71篇、神农本草经345种药物、849个临床医案。</text>
      </text>
      <text class="content">
        倪海厦是台湾经方派中医代表人物，汉唐中医创始人。其核心学术思想包括六经辨证、阳气论、经典至上、经方为主。
      </text>
    </view>

    <!-- 功能模块 -->
    <view class="section">
      <text class="section-title">功能模块</text>
      <view class="feature-list">
        <view class="feature-item">
          <view class="feature-icon formula">经</view>
          <view class="feature-info">
            <text class="feature-name">方剂速查</text>
            <text class="feature-desc">92首经方，按六经分类</text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon herb">药</view>
          <view class="feature-info">
            <text class="feature-name">药物查询</text>
            <text class="feature-desc">349味药物，性味归经</text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon case">案</view>
          <view class="feature-info">
            <text class="feature-name">医案浏览</text>
            <text class="feature-desc">188例倪海厦临床医案</text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon diagnosis">辨</view>
          <view class="feature-info">
            <text class="feature-name">六经辨证</text>
            <text class="feature-desc">交互式辨证辅助</text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon acupuncture">穴</view>
          <view class="feature-info">
            <text class="feature-name">针灸穴位</text>
            <text class="feature-desc">309个穴位，12条经络</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 作者信息 -->
    <view class="section">
      <text class="section-title">关于作者</text>
      <view class="author-info">
        <text class="author-name">开发者</text>
        <text class="author-contact">邮箱：rowen@rowen.cc</text>
        <text class="author-desc">本项目为个人学习项目，旨在传播中医知识，仅供学习参考。</text>
      </view>
    </view>

    <!-- 开源信息 -->
    <view class="section">
      <text class="section-title">开源信息</text>
      <view class="opensource-info">
        <text class="opensource-item">GitHub: github.com/rowencc/TraditionalChineseMedicine</text>
        <text class="opensource-item">许可证：MulanPSL-2.0（木兰宽松许可证）</text>
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
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const serverConnected = ref(false)
const stats = ref({
  formula_count: 0,
  herb_count: 0,
  acupoint_count: 0,
  case_count: 0
})

onMounted(async () => {
  try {
    const res = await api.getStats()
    if (res.code === 1) {
      serverConnected.value = true
      stats.value = res.data
    }
  } catch (e) {
    serverConnected.value = false
  }
})
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

.status-dot.online { background: #28a745; }
.status-dot.offline { background: #dc3545; }

.status-text {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.status-value {
  font-size: 24rpx;
  color: #999;
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
}

.feature-icon.formula { background: linear-gradient(135deg, #8B2500, #A63A1E); }
.feature-icon.herb { background: linear-gradient(135deg, #2D5F4A, #3D7A62); }
.feature-icon.case { background: linear-gradient(135deg, #2980B9, #3498DB); }
.feature-icon.diagnosis { background: linear-gradient(135deg, #B8860B, #D4A017); }
.feature-icon.acupuncture { background: linear-gradient(135deg, #8E44AD, #9B59B6); }

.feature-info { flex: 1; }
.feature-name { display: block; font-size: 28rpx; font-weight: 500; color: #333; margin-bottom: 4rpx; }
.feature-desc { font-size: 24rpx; color: #999; }

/* 作者信息 */
.author-info {
  padding: 16rpx;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.author-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.author-contact {
  display: block;
  font-size: 26rpx;
  color: #8B2500;
  margin-bottom: 8rpx;
}

.author-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

/* 开源信息 */
.opensource-info {
  padding: 16rpx;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.opensource-item {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.opensource-item:last-child {
  margin-bottom: 0;
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
