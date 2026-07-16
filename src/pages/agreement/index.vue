<template>
  <view class="container" :class="themeClass">
    <view class="content-card">
      <text class="title">服务协议</text>
      <text class="update-time">更新时间：2026年1月1日</text>
      
      <view class="section">
        <text class="section-title">一、服务条款的接受</text>
        <text class="paragraph">
          欢迎使用若闻小识（以下简称"本应用"）。本应用由开发者提供，基于倪海厦中医知识体系开发的传统文化学习工具。在使用本应用之前，请您仔细阅读本服务协议。
        </text>
      </view>

      <view class="section">
        <text class="section-title">二、服务内容</text>
        <text class="paragraph">
          本应用提供以下服务：方剂查询、药物查询、穴位查询、医案浏览、六经辨证、问一问等功能。本应用内容仅供中医学习与研究，不替代专业医疗诊断。
        </text>
      </view>

      <view class="section">
        <text class="section-title">三、用户责任</text>
        <text class="paragraph">
          用户应遵守相关法律法规，合理使用本应用。禁止利用本应用从事违法违规活动。用户应对自己的账号安全负责。
        </text>
      </view>

      <view class="section">
        <text class="section-title">四、免责声明</text>
        <text class="paragraph">
          本应用内容仅供中医学习参考，不构成医疗建议。如有身体不适，请咨询专业医师。本应用不对因使用本应用内容而产生的任何后果承担责任。
        </text>
      </view>

      <view class="section">
        <text class="section-title">五、知识产权</text>
        <text class="paragraph">
          本应用的软件、界面设计、文字内容等受著作权法保护。中医知识来源于公开典籍，仅供学习参考。
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
  padding: 24rpx;
}

.content-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #2C2C2C;
  text-align: center;
  margin-bottom: 8rpx;
}

.update-time {
  display: block;
  font-size: 22rpx;
  color: #999;
  text-align: center;
  margin-bottom: 32rpx;
}

.section {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 12rpx;
}

.paragraph {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}
</style>
