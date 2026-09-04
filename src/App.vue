<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { initTheme, isDark } from '@/utils/theme'
import { getAppName, getPlatform } from '@/utils/platform'
import api from '@/utils/api'

const isMp = getPlatform().startsWith('mp-')

onLaunch(() => {
  initTheme()
  loadSiteConfig()
  if (isMp) updateTabBarStyle()
})

// 监听主题变化，更新 tabBar 样式
import { watch } from 'vue'
watch(isDark, () => {
  if (isMp) updateTabBarStyle()
})

function updateTabBarStyle() {
  const dark = isDark.value
  // tabBar 背景和文字颜色
  try {
    uni.setTabBarStyle({
      color: dark ? '#888' : '#999',
      selectedColor: dark ? '#E07050' : '#8B2500',
      backgroundColor: dark ? '#1A1A1A' : '#ffffff',
      borderStyle: 'black'
    })
  } catch (e) {
    // H5 等无 tabBar 平台忽略
  }
}

function loadSiteConfig() {
  // 公开接口，不需要登录
  uni.request({
    url: 'https://tcm.rowen.cc/index.php?module=site&action=config',
    success: (res: any) => {
      if (res.data?.code === 1 && res.data?.data) {
        const cfg = res.data.data
        // 动态更新 tabBar 文字（仅小程序）
        if (isMp) {
          try {
            if (cfg.tab_diagnosis) {
              uni.setTabBarItem({ index: 1, text: cfg.tab_diagnosis })
            }
            if (cfg.app_name) {
              uni.setTabBarItem({ index: 0, text: cfg.tab_home || '首页' })
              uni.setTabBarItem({ index: 2, text: cfg.tab_profile || '我的' })
            }
          } catch (e) {}
        }
        // 缓存配置供各页面使用
        uni.setStorageSync('site_config', cfg)
      }
    },
    fail: () => {}
  })
}
</script>

<style lang="scss">
page {
  background-color: #F5F0E8;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow-x: hidden;
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

/* ========== 暗色主题 ========== */
page.is-dark {
  background-color: #121212;
}

.is-dark {
  background: #121212;
  color: #E0E0E0;

  /* 卡片和容器 */
  .card,
  .section,
  .menu-section,
  .progress-section,
  .record-card,
  .learning-item,
  .table-card,
  .nav-grid,
  .formula-grid,
  .meridian-grid,
  .quick-tags,
  .learning-grid,
  .combo-list,
  .related-list,
  .tag-list,
  .formula-list {
    background: #1E1E1E;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.3);
  }

  /* 页面背景 */
  .container {
    background: #121212;
  }

  /* 标题文字 */
  .section-title {
    color: #E8E8E8;
  }

  /* 正文内容 */
  .content,
  .effect,
  .value,
  .combo-effect,
  .analysis-text,
  .advice-text,
  .record-question,
  .learning-name,
  .nickname,
  .name,
  .point-name,
  .herb-name,
  .formula-name,
  .case-title,
  .hero-title,
  .hero-subtitle,
  .hero-desc,
  .search-input,
  input,
  textarea {
    color: #E0E0E0;
  }

  .placeholder {
    color: #777;
  }

  /* 次要文字 */
  .text-secondary,
  .meridian-desc,
  .learning-meta,
  .formula-meridian,
  .related-effect,
  .source,
  .record-source,
  .learning-time,
  .meta,
  .combo-points,
  .related-name,
  .formula-meridian,
  .stat-label {
    color: #A0A0A0;
  }

  /* 弱化文字 */
  .text-muted,
  .learning-label,
  .char-count,
  .empty-text,
  .empty-desc,
  .empty-hint,
  .no-more,
  .loading,
  .version-info,
  .meridian-formula,
  .user-id,
  .disclaimer-text,
  .date {
    color: #707070;
  }

  /* 搜索栏 */
  .search-wrap {
    background: #2A2A2A;
  }

  .search-section {
    background: linear-gradient(180deg, #3A1500, #2A1000);
  }

  /* 标签 */
  .quick-tag {
    background: #2A2A2A;
    border-color: #3A3A3A;
    color: #B0B0B0;
  }

  .quick-tag:active {
    background: rgba(192, 69, 32, 0.2);
    color: #E07050;
  }

  .formula-tag {
    background: rgba(192, 69, 32, 0.15);
    color: #E07050;
  }

  .tag {
    background: #2A2A2A;
    color: #B0B0B0;
  }

  .tag.nature {
    background: rgba(139, 69, 19, 0.15);
    color: #C09060;
  }

  .tag.taste {
    background: rgba(46, 139, 87, 0.15);
    color: #60B080;
  }

  .meridian-tag {
    background: rgba(139, 0, 0, 0.15);
    color: #E07070;
  }

  /* 统计数字 */
  .stat-num {
    color: #E07050;
  }

  /* 菜单 */
  .menu-item {
    border-bottom-color: #2C2C2C;
  }

  .menu-text {
    color: #E0E0E0;
  }

  .menu-arrow {
    color: #555;
  }

  /* 进度条 */
  .progress-item {
    background: #2A2A2A;
  }

  .progress-num {
    color: #E07050;
  }

  .progress-fill {
    background: linear-gradient(90deg, #C04520, #E06040);
  }

  .progress-fill.herb {
    background: linear-gradient(90deg, #3D8A6A, #50A080);
  }

  .progress-fill.acupoint {
    background: linear-gradient(90deg, #C8960B, #E0B020);
  }

  .progress-fill.case {
    background: linear-gradient(90deg, #3090C0, #40A0D0);
  }

  /* 免责声明 */
  .disclaimer {
    background: #2A2010;
    border-left-color: #C8960B;
  }

  .disclaimer-text {
    color: #C09060;
  }

  .advice {
    border-left-color: #C8960B;
  }

  .caution {
    border-left-color: #E05050;
  }

  /* 按钮 */
  .btn-logout {
    background: #1E1E1E;
    border-color: #E05050;
    color: #E05050;
  }

  .submit-btn {
    background: linear-gradient(135deg, #C04520, #E06040);
  }

  /* 弹窗 */
  .modal-overlay {
    background: rgba(0, 0, 0, 0.7);
  }

  .modal {
    background: #1E1E1E;
  }

  .modal-title {
    color: #E8E8E8;
  }

  .form-label {
    color: #A0A0A0;
  }

  .form-input {
    background: #2A2A2A;
    border-color: #3A3A3A;
    color: #E0E0E0;
  }

  .btn-cancel {
    background: #2A2A2A;
    color: #A0A0A0;
  }

  .btn-confirm {
    background: #C04520;
  }

  /* 输入框 */
  .symptom-input {
    background: #2A2A2A;
    border-color: #3A3A3A;
    color: #E0E0E0;
  }

  /* 头像 */
  .edit-avatar-placeholder {
    background: #2A2A2A;
    color: #707070;
  }

  .avatar {
    background: rgba(255, 255, 255, 0.1);
  }

  .edit-icon {
    background: rgba(0, 0, 0, 0.6);
  }

  /* Hero 区域 */
  .hero-section {
    background: linear-gradient(180deg, #3A1500, #2A1000);
  }

  .cloud-pattern {
    opacity: 0.3;
  }

  /* 用户栏 */
  .user-bar {
    background: linear-gradient(180deg, #3A1500, #2A1000);
  }

  /* 用户卡片 */
  .user-card {
    background: linear-gradient(135deg, #3A1500, #2A1000);
  }

  /* 页头 */
  .header {
    background: linear-gradient(135deg, #3A1500, #2A1000);
  }

  /* 导航项图标 */
  .nav-icon {
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
  }

  /* 方剂卡片 */
  .formula-card {
    background: #1E1E1E;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
  }

  /* 六经卡片 */
  .meridian-card {
    background: #1E1E1E;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
  }

  /* 表格 */
  .table {
    color: #E0E0E0;
  }

  .table .th-cell,
  .table th {
    background: #2A2A2A;
    color: #A0A0A0;
    border-bottom-color: #3A3A3A;
  }

  .table td {
    border-bottom-color: #2C2C2C;
  }

  /* 分隔线 */
  hr,
  .divider {
    border-color: #2C2C2C;
  }

  /* 加载和空状态 */
  .loading,
  .no-more,
  .empty-hint {
    color: #707070;
  }

  /* 选择器 */
  .filter-item {
    background: #2A2A2A;
    color: #A0A0A0;
  }

  .filter-item.active {
    background: rgba(192, 69, 32, 0.15);
    color: #E07050;
  }

  /* 滚动条和边框 */
  .border-top,
  .border-bottom {
    border-color: #2C2C2C;
  }

  /* 穴位图片 */
  .point-image {
    background: #2A2A2A;
  }

  /* 临床笔记 */
  .clinical-notes,
  .diagram-placeholder {
    background: #2A2A2A;
  }

  /* 问诊结果 */
  .meridian-result {
    background: linear-gradient(135deg, #5C1A00, #7A2800);
  }

  .result-section {
    background: transparent;
  }

  /* 搜索结果高亮 */
  .highlight {
    color: #E07050;
  }

  /* Switch 组件 */
  switch .wx-switch-input {
    background: #3A3A3A !important;
  }

  /* 导航栏 */
  .nav-bar {
    background: #1A1A1A;
  }

  /* 列表项 */
  .list-item {
    background: #1E1E1E;
    border-bottom-color: #2C2C2C;
  }

  /* 底部安全区 */
  .safe-bottom {
    background: #121212;
  }

  /* 页面级别背景覆盖 */
  .learning-list,
  .nav-grid,
  .formula-grid,
  .meridian-grid {
    background: transparent;
    box-shadow: none;
  }
}
</style>
