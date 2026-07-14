<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('岐黄小识 App Launch')
})
</script>

<style>
page {
  background-color: #F5F0E8;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 全局卡片样式 */
.card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 全局标题样式 */
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2C;
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
</style>
