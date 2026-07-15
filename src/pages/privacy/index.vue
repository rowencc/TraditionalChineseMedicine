<template>
  <view class="container">
    <view class="content-card">
      <text class="title">隐私协议</text>
      <text class="update-time">更新时间：2026年1月1日</text>
      
      <view class="section">
        <text class="section-title">一、信息收集</text>
        <text class="paragraph">
          本应用收集以下信息用于提供服务：账号信息（用户名、密码）、设备信息（设备型号、操作系统）、使用数据（学习记录、问诊记录）。
        </text>
      </view>

      <view class="section">
        <text class="section-title">二、信息使用</text>
        <text class="paragraph">
          收集的信息仅用于：提供和改进服务、个性化学习体验、保障账号安全、遵守法律法规。
        </text>
      </view>

      <view class="section">
        <text class="section-title">三、信息存储</text>
        <text class="paragraph">
          您的数据存储在安全的服务器上，采用加密传输和存储。我们不会向第三方出售您的个人信息。
        </text>
      </view>

      <view class="section">
        <text class="section-title">四、信息共享</text>
        <text class="paragraph">
          除法律法规要求外，我们不会与第三方共享您的个人信息。在以下情况下可能共享：获得您的明确同意、法律法规要求、保护用户合法权益。
        </text>
      </view>

      <view class="section">
        <text class="section-title">五、信息保护</text>
        <text class="paragraph">
          我们采取严格的安全措施保护您的信息，包括数据加密、访问控制、安全审计等。如发生数据泄露，我们将及时通知受影响的用户。
        </text>
      </view>

      <view class="section">
        <text class="section-title">六、您的权利</text>
        <text class="paragraph">
          您有权访问、更正、删除您的个人信息。您可以通过应用设置管理您的数据。如需帮助，请联系客服。
        </text>
      </view>

      <view class="section">
        <text class="section-title">七、联系我们</text>
        <text class="paragraph">
          如有任何问题或建议，请联系：rowen@rowen.cc
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
