<template>
  <view class="container">
    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo">
        <text class="logo-text">岐</text>
      </view>
      <text class="app-name">岐黄小识</text>
      <text class="app-desc">经方中医学习工具</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-section" v-if="!showRegister">
      <view class="form-card">
        <text class="form-title">登录</text>
        
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

    <!-- 注册表单 -->
    <view class="form-section" v-else>
      <view class="form-card">
        <text class="form-title">注册</text>
        
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import tcmApi from '@/utils/api'

const showRegister = ref(false)
const loading = ref(false)
const errorMsg = ref('')

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

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await tcmApi.auth.login(loginForm.value.username, loginForm.value.password)
    if (res.code === 1) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
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
    const res = await tcmApi.auth.register(
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

.form-section {
  margin-top: 40rpx;
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.form-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 32rpx;
  text-align: center;
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
}

.form-input:focus {
  border-color: #8B2500;
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
</style>
