<template>
  <view class="container" :class="themeClass">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar">
        <text class="avatar-text">{{ user?.username?.charAt(0).toUpperCase() || 'U' }}</text>
      </view>
      <text class="username">{{ user?.username || '未登录' }}</text>
      <text class="user-role">{{ user?.role === 'admin' ? '管理员' : '普通用户' }}</text>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goTo('/pages/user/profile')">
        <text class="menu-icon">👤</text>
        <text class="menu-text">个人资料</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="showPasswordModal = true">
        <text class="menu-icon">🔑</text>
        <text class="menu-text">修改密码</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/about/index')">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-text">关于</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="btn-logout" @tap="handleLogout">退出登录</button>
    </view>

    <!-- 修改密码弹窗 -->
    <view class="modal-overlay" v-if="showPasswordModal" @tap="showPasswordModal = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">修改密码</text>
        
        <view class="form-group">
          <text class="form-label">旧密码</text>
          <input class="form-input" v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </view>
        
        <view class="form-group">
          <text class="form-label">新密码</text>
          <input class="form-input" v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </view>
        
        <view class="form-group">
          <text class="form-label">确认密码</text>
          <input class="form-input" v-model="passwordForm.newPassword2" type="password" placeholder="请再次输入新密码" />
        </view>
        
        <view v-if="errorMsg" class="error-msg">{{ errorMsg }}</view>
        
        <view class="modal-btns">
          <button class="btn-cancel" @tap="showPasswordModal = false">取消</button>
          <button class="btn-confirm" @tap="handleChangePassword">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { useTheme } from "@/utils/theme"

const { themeClass } = useTheme()
const user = ref<any>(null)
const showPasswordModal = ref(false)
const errorMsg = ref('')

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  newPassword2: ''
})

onMounted(() => {
  user.value = api.getUser()
})

async function handleChangePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    errorMsg.value = '请填写完整信息'
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.newPassword2) {
    errorMsg.value = '两次密码不一致'
    return
  }
  
  try {
    const res = await api.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )
    if (res.code === 1) {
      uni.showToast({ title: '修改成功', icon: 'success' })
      showPasswordModal.value = false
      passwordForm.value = { oldPassword: '', newPassword: '', newPassword2: '' }
    } else {
      errorMsg.value = res.msg || '修改失败'
    }
  } catch (e) {
    errorMsg.value = '网络错误，请重试'
  }
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

function goTo(url: string) {
  uni.navigateTo({ url })
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
  text-align: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.avatar-text {
  font-size: 48rpx;
  color: #fff;
  font-weight: 700;
}

.username {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.user-role {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
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
  font-size: 36rpx;
  margin-right: 16rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}

.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24rpx;
}

.form-group {
  margin-bottom: 20rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.form-input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border: 2rpx solid #E8E0D4;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.error-msg {
  color: #DC3545;
  font-size: 24rpx;
  margin-bottom: 16rpx;
  text-align: center;
}

.modal-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.btn-cancel {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.btn-confirm {
  flex: 1;
  height: 72rpx;
  background: #8B2500;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>
