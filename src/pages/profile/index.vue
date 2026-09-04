<template>
  <view class="container" :class="themeClass">
    <!-- 用户信息卡片 -->
    <view class="user-card" @tap="isLoggedIn ? showEditModal = true : goToLogin()">
      <view class="avatar-wrap">
        <image v-if="user?.avatarUrl" class="avatar-img" :src="resolveAvatarUrl(user.avatarUrl)" mode="aspectFill" />
        <image v-else class="avatar-img" src="/static/default-avatar.png" mode="aspectFill" />
        <view class="edit-icon">
          <text>✎</text>
        </view>
      </view>
      <view class="user-info" v-if="isLoggedIn">
        <text class="nickname">{{ user?.nickname || user?.username }}</text>
        <text class="user-id">ID: {{ user?.id }}</text>
      </view>
      <view class="user-info" v-else @tap="goToLogin">
        <text class="nickname">点击登录</text>
        <text class="user-id">登录后同步学习数据</text>
      </view>
    </view>

    <!-- 代币余额 -->
    <view class="section coin-section" v-if="isLoggedIn">
      <view class="coin-header">
        <text class="section-title">我的古币</text>
        <view class="coin-recharge" @tap="goTo('/pages/recharge/index')">
          <text class="recharge-text">充值</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
      <view class="coin-body">
        <view class="coin-main">
          <text class="coin-num">{{ coinBalance.balance }}</text>
          <text class="coin-label">古币</text>
        </view>
        <view class="coin-info">
          <text class="coin-tip" v-if="coinBalance.free_remaining > 0">今日免费：{{ coinBalance.free_remaining }}次</text>
          <text class="coin-tip used" v-else>今日免费已用完</text>
        </view>
      </view>
    </view>

    <!-- 学习进度 -->
    <view class="section" v-if="isLoggedIn">
      <text class="section-title">学习进度</text>
      <view class="learning-grid">
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.formula }}</text>
          <text class="learning-label">方剂</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.herb }}</text>
          <text class="learning-label">药物</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.acupoint }}</text>
          <text class="learning-label">穴位</text>
        </view>
        <view class="learning-item">
          <text class="learning-num">{{ learningStats.case }}</text>
          <text class="learning-label">医案</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goTo('/pages/diagnosis-history/index')">
        <view class="menu-icon diagnosis-icon">
          <text class="icon-text">诊</text>
        </view>
        <text class="menu-text">问一问记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/learning/index')">
        <view class="menu-icon learning-icon">
          <text class="icon-text">学</text>
        </view>
        <text class="menu-text">学习记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="handleToggleTheme">
        <view class="menu-icon theme-icon">
          <text class="icon-text">{{ isDark ? '亮' : '暗' }}</text>
        </view>
        <text class="menu-text">主题模式</text>
        <text class="menu-switch">
          <switch :checked="isDark" @change="handleToggleTheme" color="#8B2500" />
        </text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/agreement/index')">
        <view class="menu-icon agreement-icon">
          <text class="icon-text">协</text>
        </view>
        <text class="menu-text">服务协议</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/privacy/index')">
        <view class="menu-icon privacy-icon">
          <text class="icon-text">隐</text>
        </view>
        <text class="menu-text">隐私协议</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/about/index')">
        <view class="menu-icon about-icon">
          <text class="icon-text">关</text>
        </view>
        <text class="menu-text">关于</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLoggedIn">
      <button class="btn-logout" @tap="handleLogout">退出登录</button>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text>{{ getAppName() }} v1.0.0</text>
    </view>

    <!-- 编辑信息弹窗 -->
    <view class="modal-overlay" v-if="showEditModal" @tap="showEditModal = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">编辑个人信息</text>
        
        <!-- 获取微信头像 -->
        <view class="avatar-section">
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image v-if="editForm.avatarUrl" class="edit-avatar" :src="resolveAvatarUrl(editForm.avatarUrl)" mode="aspectFill" />
            <image v-else class="edit-avatar" src="/static/default-avatar.png" mode="aspectFill" />
          </button>
          <text class="avatar-hint">点击更换头像</text>
        </view>

        <!-- 获取微信昵称 -->
        <view class="form-group">
          <text class="form-label">昵称</text>
          <input class="form-input" v-model="editForm.nickname" type="nickname" placeholder="请输入昵称" />
        </view>

        <view v-if="editError" class="error-msg">{{ editError }}</view>
        
        <view class="modal-btns">
          <button class="btn-cancel" @tap="showEditModal = false">取消</button>
          <button class="btn-confirm" @tap="saveProfile">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import api, { resolveAvatarUrl } from '@/utils/api'
import { useTheme } from "@/utils/theme"
import { getAppName } from '@/utils/platform'
import { getBalance } from '@/utils/pay'
import type { CoinBalance } from '@/utils/pay'

const { themeClass, isDark, toggleTheme: doToggleTheme } = useTheme()
const isLoggedIn = ref(false)
const user = ref<any>(null)
const showEditModal = ref(false)
const editError = ref('')

const editForm = ref({
  avatarUrl: '',
  nickname: ''
})

const learningStats = ref({
  formula: 0,
  herb: 0,
  acupoint: 0,
  case: 0,
  total: 0
})

const coinBalance = ref<CoinBalance>({
  balance: 0,
  total_recharged: 0,
  total_consumed: 0,
  free_remaining: 1,
  free_used: 0
})

onShow(() => {
  isLoggedIn.value = api.isLoggedIn()
  user.value = api.getUser()

  // 初始化编辑表单
  if (user.value) {
    editForm.value.avatarUrl = user.value.avatarUrl || ''
    editForm.value.nickname = user.value.nickname || user.value.username || ''
  }

  if (isLoggedIn.value) {
    loadLearningStats()
    loadCoinBalance()
    // 从服务端刷新用户资料（昵称、头像）
    refreshUserProfile()
  }
})

async function refreshUserProfile() {
  try {
    const res = await api.getProfile()
    if (res.code === 1 && res.data) {
      const updatedUser = {
        ...user.value,
        nickname: res.data.nickname || user.value?.nickname || '',
        avatarUrl: (res.data.avatar_url ? resolveAvatarUrl(res.data.avatar_url) : '') || user.value?.avatarUrl || ''
      }
      api.saveAuth(uni.getStorageSync('token'), updatedUser)
      user.value = updatedUser
    }
  } catch (e) {
    // 网络失败忽略，使用本地缓存
  }
}

async function loadLearningStats() {
  try {
    const res = await api.getLearningStats()
    if (res.code === 1) {
      learningStats.value = res.data
    }
  } catch (e) {
    console.error('获取学习进度失败', e)
  }
}

async function loadCoinBalance() {
  try {
    const data = await getBalance()
    coinBalance.value = data
  } catch (e) {
    console.error('获取代币余额失败', e)
  }
}

// 选择微信头像并上传到服务端
async function onChooseAvatar(e: any) {
  const { avatarUrl } = e.detail
  if (!avatarUrl) return

  try {
    // 上传到服务端
    const uploadRes = await api.uploadAvatar(avatarUrl)
    if (uploadRes.code === 1) {
      editForm.value.avatarUrl = uploadRes.data.avatar_url
    } else {
      // 上传失败，使用原 URL 作为备用
      editForm.value.avatarUrl = avatarUrl
    }
  } catch (err) {
    // 上传失败，使用原 URL
    editForm.value.avatarUrl = avatarUrl
  }
}

// 保存个人信息（同步到服务端）
async function saveProfile() {
  if (!editForm.value.nickname) {
    editError.value = '请输入昵称'
    return
  }

  try {
    // 保存到服务端
    const res = await api.updateProfile(editForm.value.nickname, editForm.value.avatarUrl)
    if (res.code === 1) {
      // 用服务端返回的数据更新本地
      const updatedUser = {
        ...user.value,
        nickname: res.data.nickname || editForm.value.nickname,
        avatarUrl: res.data.avatar_url || editForm.value.avatarUrl
      }
      api.saveAuth(uni.getStorageSync('token'), updatedUser)
      user.value = updatedUser

      uni.showToast({ title: '保存成功', icon: 'success' })
      showEditModal.value = false
    } else {
      editError.value = res.msg || '保存失败'
    }
  } catch (e) {
    // 网络失败也保存到本地（离线容错）
    const updatedUser = {
      ...user.value,
      nickname: editForm.value.nickname,
      avatarUrl: editForm.value.avatarUrl
    }
    api.saveAuth(uni.getStorageSync('token'), updatedUser)
    user.value = updatedUser
    uni.showToast({ title: '已保存到本地', icon: 'none' })
    showEditModal.value = false
  }
}

function handleToggleTheme() {
  doToggleTheme()
  uni.showToast({ title: isDark.value ? '已切换到暗色模式' : '已切换到亮色模式', icon: 'none' })
}

function goTo(url: string) {
  uni.navigateTo({ url })
}

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
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
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F0E8;
}

.user-card {
  background: linear-gradient(135deg, #8B2500, #A63A1E);
  padding: 60rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar-wrap {
  position: relative;
}

.avatar-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 48rpx;
  color: #fff;
  font-weight: 700;
}

.edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #fff;
}

.user-info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4rpx;
}

.user-id {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
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

.learning-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.learning-item {
  text-align: center;
  padding: 16rpx 0;
  background: #FAFAF7;
  border-radius: 8rpx;
}

.learning-num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #8B2500;
  margin-bottom: 4rpx;
}

.learning-label {
  font-size: 22rpx;
  color: #999;
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
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.icon-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

.diagnosis-icon { background: linear-gradient(135deg, #8B2500, #A63A1E); }
.learning-icon { background: linear-gradient(135deg, #2D5F4A, #3D7A62); }
.theme-icon { background: linear-gradient(135deg, #B8860B, #D4A017); }
.agreement-icon { background: linear-gradient(135deg, #2980B9, #3498DB); }
.privacy-icon { background: linear-gradient(135deg, #8E44AD, #9B59B6); }
.about-icon { background: linear-gradient(135deg, #7F8C8D, #95A5A6); }

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.menu-switch {
  margin-right: 8rpx;
}

.logout-section {
  margin: 40rpx 24rpx;
}

.btn-logout {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #DC3545;
  border: 2rpx solid #DC3545;
  border-radius: 12rpx;
  font-size: 30rpx;
  text-align: center;
  padding: 0;
}

.version-info {
  text-align: center;
  padding: 40rpx;
  font-size: 24rpx;
  color: #999;
}

/* 编辑弹窗 */
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

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24rpx;
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
  margin-top: 8rpx;
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
  box-sizing: border-box;
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
  line-height: 72rpx;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  padding: 0;
}

.btn-confirm {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: #8B2500;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  padding: 0;
}

/* 代币卡片 */
.coin-section {
  position: relative;
}

.coin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.coin-recharge {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.recharge-text {
  font-size: 26rpx;
  color: #8B2500;
  font-weight: 500;
}

.coin-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coin-main {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.coin-num {
  font-size: 52rpx;
  font-weight: 700;
  color: #8B2500;
  line-height: 1;
}

.coin-label {
  font-size: 24rpx;
  color: #999;
}

.coin-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.coin-tip {
  font-size: 22rpx;
  color: #2D5F4A;
  background: rgba(45, 95, 74, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.coin-tip.used {
  color: #999;
  background: rgba(0, 0, 0, 0.05);
}
</style>
