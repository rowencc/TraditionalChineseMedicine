<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="logo-icon">
        <text class="logo-text">倪</text>
      </view>
      <text class="app-name">倪海厦中医</text>
      <text class="version">v1.0.0</text>
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
      <text class="section-title">功能说明</text>
      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-icon">方</text>
          <view class="feature-info">
            <text class="feature-name">方剂速查</text>
            <text class="feature-desc">收录常用经方，按六经分类，支持搜索</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon herb">药</text>
          <view class="feature-info">
            <text class="feature-name">药物查询</text>
            <text class="feature-desc">收录常用中药，按性味归经分类</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon case">案</text>
          <view class="feature-info">
            <text class="feature-name">医案浏览</text>
            <text class="feature-desc">收录倪海厦临床医案，按疾病分类</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon diagnosis">经</text>
          <view class="feature-info">
            <text class="feature-name">六经辨证</text>
            <text class="feature-desc">六经辨证辅助诊断，症状自测</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon acupuncture">穴</text>
          <view class="feature-info">
            <text class="feature-name">针灸穴位</text>
            <text class="feature-desc">十二经络穴位查询，常用配穴</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer">
      <text class="disclaimer-title">免责声明</text>
      <text class="disclaimer-text">
        本小程序内容仅供中医学习与研究，不替代专业医疗诊断。所有诊疗请务必咨询执业医师。
      </text>
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

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.header {
  background: linear-gradient(135deg, #8B0000, #A52A2A);
  border-radius: 16rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.logo-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
}

.logo-text {
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
}

.app-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.version {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.content {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 12rpx;
}

.source-list {
  display: grid;
  gap: 12rpx;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}

.source-name {
  font-size: 28rpx;
  color: #333;
}

.source-pages {
  font-size: 24rpx;
  color: #999;
}

.feature-list {
  display: grid;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.feature-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #8B0000, #A52A2A);
  flex-shrink: 0;
}

.feature-icon.herb { background: linear-gradient(135deg, #2E8B57, #3CB371); }
.feature-icon.case { background: linear-gradient(135deg, #4682B4, #5F9EA0); }
.feature-icon.diagnosis { background: linear-gradient(135deg, #DAA520, #FFD700); }
.feature-icon.acupuncture { background: linear-gradient(135deg, #9370DB, #BA55D3); }

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

.disclaimer {
  background: #FFF8DC;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
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
