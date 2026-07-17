<template>
  <view class="container" :class="themeClass">
    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo">
        <text class="logo-text">岐</text>
      </view>
      <text class="app-name">{{ getAppName() }}</text>
      <text class="app-desc">经方中医学习工具</text>
    </view>

    <!-- 微信一键登录 -->
    <view class="wx-login-section">
      <button class="btn-wx" @tap="handleWxLogin" :disabled="loading">
        <text class="wx-icon">微</text>
        <text>{{ loading ? '登录中...' : '微信一键登录' }}</text>
      </button>
    </view>

    <!-- #ifndef MP-WEIXIN -->
    <!-- 分割线（仅H5） -->
    <view class="divider">
      <view class="divider-line"></view>
      <text class="divider-text">或</text>
      <view class="divider-line"></view>
    </view>

    <!-- 密码登录表单（仅H5） -->
    <view class="form-section" v-if="!showRegister">
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">用户名</text>
          <input class="form-input" v-model="loginForm.username" placeholder="请输入用户名" />
        </view>

        <view class="form-group">
          <text class="form-label">密码</text>
          <input class="form-input" v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </view>

        <view v-if="errorMsg" class="error-msg">{{ errorMsg }}</view>

        <button class="btn-primary" @tap="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>

        <view class="switch-link" @tap="showRegister = true">
          <text>还没有账号？</text>
          <text class="link">注册新账号</text>
        </view>
      </view>
    </view>

    <!-- 注册表单（仅H5） -->
    <view class="form-section" v-else>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">用户名</text>
          <input class="form-input" v-model="registerForm.username" placeholder="3-20个字符" />
        </view>

        <view class="form-group">
          <text class="form-label">邮箱</text>
          <input class="form-input" v-model="registerForm.email" placeholder="请输入邮箱" />
        </view>

        <view class="form-group">
          <text class="form-label">密码</text>
          <input class="form-input" v-model="registerForm.password" type="password" placeholder="至少6位" />
        </view>

        <view class="form-group">
          <text class="form-label">确认密码</text>
          <input class="form-input" v-model="registerForm.password2" type="password" placeholder="再次输入密码" />
        </view>

        <view v-if="errorMsg" class="error-msg">{{ errorMsg }}</view>

        <button class="btn-primary" @tap="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注 册' }}
        </button>

        <view class="switch-link" @tap="showRegister = false">
          <text>已有账号？</text>
          <text class="link">返回登录</text>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- 登录后资料设置弹窗 -->
    <view class="modal-overlay" v-if="showProfileModal" @tap="skipProfileSetup">
      <view class="modal" @tap.stop>
        <text class="modal-title">设置个人资料</text>
        <text class="modal-desc">完善昵称和头像，让朋友更容易找到你</text>

        <!-- 头像选择 -->
        <view class="avatar-section">
          <!-- #ifdef MP-WEIXIN -->
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image v-if="setupForm.avatarUrl" class="edit-avatar" :src="resolveAvatarUrl(setupForm.avatarUrl)" mode="aspectFill" />
            <image v-else class="edit-avatar" src="/static/default-avatar.png" mode="aspectFill" />
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <view class="avatar-btn">
            <image v-if="setupForm.avatarUrl" class="edit-avatar" :src="resolveAvatarUrl(setupForm.avatarUrl)" mode="aspectFill" />
            <image v-else class="edit-avatar" src="/static/default-avatar.png" mode="aspectFill" />
          </view>
          <!-- #endif -->
          <text class="avatar-hint">点击选择头像</text>
        </view>

        <!-- 昵称输入 -->
        <view class="form-group">
          <text class="form-label">昵称</text>
          <input class="form-input" v-model="setupForm.nickname" type="nickname" placeholder="请输入昵称" />
        </view>

        <view class="modal-btns">
          <button class="btn-skip" @tap="skipProfileSetup">跳过</button>
          <button class="btn-confirm" @tap="saveProfileSetup">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api, { resolveAvatarUrl } from '@/utils/api'
import { useTheme } from "@/utils/theme"
import { getAppName } from '@/utils/platform'

const { themeClass } = useTheme()
const showRegister = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// 登录后资料设置弹窗
const showProfileModal = ref(false)
const setupForm = ref({
  nickname: '',
  avatarUrl: ''
})

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  password2: ''
})

// 微信一键登录
async function handleWxLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject
      })
    })

    if (loginRes.code) {
      const res = await api.wxLogin(loginRes.code)
      if (res.code === 1) {
        // 检查是否已有昵称（老用户）
        const user = api.getUser()
        if (user?.nickname) {
          // 老用户，直接跳转
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/profile/index' })
          }, 1500)
        } else {
          // 新用户，弹出资料设置弹窗
          showProfileModal.value = true
        }
      } else {
        errorMsg.value = res.msg || '登录失败'
      }
    }
  } catch (e) {
    console.error('微信登录失败', e)
    errorMsg.value = '微信登录失败，请重试'
  } finally {
    loading.value = false
  }
}

// 选择微信头像
async function onChooseAvatar(e: any) {
  const { avatarUrl } = e.detail
  if (!avatarUrl) return

  try {
    const uploadRes = await api.uploadAvatar(avatarUrl)
    if (uploadRes.code === 1) {
      setupForm.value.avatarUrl = uploadRes.data.avatar_url
    } else {
      setupForm.value.avatarUrl = avatarUrl
    }
  } catch (err) {
    setupForm.value.avatarUrl = avatarUrl
  }
}

// 跳过资料设置，使用默认值
function skipProfileSetup() {
  saveProfileData('微信用户', '')
}

// 保存资料设置
async function saveProfileSetup() {
  const nickname = setupForm.value.nickname.trim() || '微信用户'
  saveProfileData(nickname, setupForm.value.avatarUrl)
}

// 统一保存资料并跳转
async function saveProfileData(nickname: string, avatarUrl: string) {
  try {
    await api.updateProfile(nickname, avatarUrl)
  } catch {}
  showProfileModal.value = false
  uni.switchTab({ url: '/pages/profile/index' })
}

// 密码登录（仅H5）
async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await api.login(loginForm.value.username, loginForm.value.password)
    if (res.code === 1) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/profile/index' })
      }, 1500)
    } else {
      errorMsg.value = res.msg || '登录失败'
    }
  } catch (e) {
    errorMsg.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

// 注册（仅H5）
async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.password) {
    errorMsg.value = '请填写完整信息'
    return
  }

  if (registerForm.value.password !== registerForm.value.password2) {
    errorMsg.value = '两次密码不一致'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await api.register(
      registerForm.value.username,
      registerForm.value.password,
      registerForm.value.email
    )
    if (res.code === 1) {
      uni.showToast({ title: '注册成功，请登录', icon: 'success' })
      showRegister.value = false
      loginForm.value.username = registerForm.value.username
    } else {
      errorMsg.value = res.msg || '注册失败'
    }
  } catch (e) {
    errorMsg.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0E8, #E8E0D4);
  padding: 40rpx;
}

.logo-section {
  text-align: center;
  padding: 60rpx 0 40rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(139, 37, 0, 0.3);
}

.logo-text {
  font-size: 48rpx;
  color: #fff;
  font-weight: 700;
}

.app-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #2C2C2C;
  margin-bottom: 8rpx;
}

.app-desc {
  font-size: 26rpx;
  color: #999;
}

.wx-login-section {
  margin: 40rpx 0;
}

.btn-wx {
  width: 100%;
  height: 88rpx;
  background: #07C160;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.btn-wx:disabled {
  opacity: 0.6;
}

.wx-icon {
  width: 40rpx;
  height: 40rpx;
  background: #fff;
  color: #07C160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.divider {
  display: flex;
  align-items: center;
  margin: 32rpx 0;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #E8E0D4;
}

.divider-text {
  padding: 0 24rpx;
  font-size: 24rpx;
  color: #999;
}

.form-section {
  margin-top: 20rpx;
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  border: 2rpx solid #E8E0D4;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #FAFAF7;
  box-sizing: border-box;
}

.error-msg {
  color: #DC3545;
  font-size: 24rpx;
  margin-bottom: 16rpx;
  text-align: center;
}

.btn-primary {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 500;
  margin-top: 20rpx;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.switch-link {
  text-align: center;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #999;
}

.link {
  color: #8B2500;
  margin-left: 8rpx;
}

/* 资料设置弹窗 */
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
  width: 620rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  overflow: hidden;
}

.modal-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
  color: #333;
  margin-bottom: 8rpx;
}

.modal-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  text-align: center;
  margin-bottom: 32rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28rpx;
}

.avatar-btn {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f5f5;
  border: none;
  padding: 0;
  line-height: normal;
  margin-bottom: 8rpx;
}

.avatar-btn::after {
  border: none;
}

.edit-avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
}

.avatar-hint {
  font-size: 22rpx;
  color: #999;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  border: 2rpx solid #E8E0D4;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #FAFAF7;
  box-sizing: border-box;
}

.modal-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}

.btn-skip {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn-confirm {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>
