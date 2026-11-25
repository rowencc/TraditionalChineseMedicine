<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { initTheme, isDark } from '@/utils/theme'
import { getAppName, getPlatform } from '@/utils/platform'
import api from '@/utils/api'
import { initAuth, authState } from '@/utils/auth'

const isMp = getPlatform().startsWith('mp-')

// 上次会话校验时间，避免启动/切前台时重复请求
let lastValidateAt = 0
const VALIDATE_INTERVAL = 60 * 1000

onLaunch(() => {
  initTheme()
  // 恢复登录态：本地 token 已过期则直接静默登出（不跳转登录页，浏览功能不受影响）
  initAuth()
  loadSiteConfig()
  if (isMp) updateTabBarStyle()
  refreshSession()
})

// 从后台回到前台时补一次校验：长时间未使用导致 token 过期的情况
onShow(() => {
  if (!authState.loggedIn) return
  refreshSession()
})

function refreshSession() {
  const now = Date.now()
  if (now - lastValidateAt < VALIDATE_INTERVAL) return
  lastValidateAt = now
  // 失败时保留本地登录态（离线可用）；只有明确 401 / 本地过期才登出
  api.validateSession().catch(() => {})
}

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

/* ========== 主题变量 ========== */
page,
.container {
  --bg-base: #F5F0E8;
  --bg-card: #FFFFFF;
  --bg-elevated: #FAFAF7;
  --bg-quote: #FFF8DC;
  --border: #E8E0D4;
  --border-light: #F0EBE3;
  --text-primary: #2C2C2C;
  --text-secondary: #666666;
  --text-muted: #999999;
  --brand: #8B2500;
  --brand-light: #A63A1E;
  --brand-ink: #8B2500;
  --jade: #2D5F4A;
  --jade-ink: #2D5F4A;
  --accent: #B8860B;
  --accent-ink: #8B6914;
  --brown-ink: #8B4513;
  --brand-soft: rgba(139, 37, 0, 0.08);
  --jade-soft: rgba(45, 95, 74, 0.08);
  --accent-soft: rgba(184, 134, 11, 0.10);
}

/* ========== 暗色主题 ========== */
page.is-dark {
  background-color: #14110E;
}

.is-dark {
  --bg-base: #14110E;
  --bg-card: #1D1916;
  --bg-elevated: #262119;
  --bg-quote: #26200F;
  --border: #35302A;
  --border-light: #2A2521;
  --text-primary: #EFE7DA;
  --text-secondary: #BCB1A2;
  --text-muted: #8C8377;
  --brand: #B3441D;
  --brand-light: #C95A2E;
  --brand-ink: #E8835C;
  --jade: #2F6B53;
  --jade-ink: #6FB79B;
  --accent: #C89A3C;
  --accent-ink: #DDB25A;
  --brown-ink: #C08D5F;
  --brand-soft: rgba(232, 131, 92, 0.14);
  --jade-soft: rgba(111, 183, 155, 0.14);
  --accent-soft: rgba(221, 178, 90, 0.16);

  background: var(--bg-base);
  color: var(--text-primary);

  /* 卡片容器 */
  .card,
  .section,
  .menu-section,
  .progress-section,
  .record-card,
  .learning-item,
  .table-card,
  .info-card,
  .content-card,
  .intro-card,
  .flow-card,
  .note-card,
  .meridian-section,
  .modal,
  .list-item {
    background: var(--bg-card);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.28);
  }

  .container {
    background: var(--bg-base);
  }

  /* 头部与渐变块 */
  .header,
  .hero-section,
  .user-bar,
  .user-card,
  .search-section {
    background: linear-gradient(135deg, #2A1206, #1B0D05);
  }

  .section-title,
  .modal-title,
  .menu-text,
  .name,
  .nickname,
  .case-title {
    color: var(--text-primary);
  }

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
  .stat-label,
  .subtitle,
  .desc {
    color: var(--text-secondary);
  }

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
    color: var(--text-muted);
  }

  /* 输入与选择 */
  .search-wrap,
  .form-input,
  .symptom-input,
  .filter-item,
  .quick-tag,
  .tag,
  .avatar-btn {
    background: var(--bg-elevated);
    border-color: var(--border);
    color: var(--text-secondary);
  }

  .quick-tag:active,
  .filter-item.active {
    background: rgba(232, 131, 92, 0.16);
    color: var(--brand-ink);
  }

  .formula-tag,
  .highlight,
  .stat-num,
  .progress-num {
    color: var(--brand-ink);
  }

  .formula-tag {
    background: rgba(232, 131, 92, 0.14);
  }

  .tag.nature {
    background: rgba(192, 141, 95, 0.16);
    color: var(--brown-ink);
  }

  .tag.taste {
    background: rgba(111, 183, 155, 0.14);
    color: var(--jade-ink);
  }

  .meridian-tag {
    background: rgba(232, 131, 92, 0.14);
    color: #E88A8A;
  }

  /* 分隔与边框 */
  .menu-item,
  .list-item,
  .table td {
    border-bottom-color: var(--border-light);
  }

  hr,
  .divider,
  .border-top,
  .border-bottom {
    border-color: var(--border-light);
  }

  .table .th-cell,
  .table th {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border-bottom-color: var(--border);
  }

  /* 提示块 */
  .disclaimer,
  .advice {
    background: #241D10;
    border-left-color: var(--accent);
  }

  .disclaimer-text {
    color: var(--accent-ink);
  }

  .caution {
    border-left-color: #D2685C;
  }

  /* 按钮 */
  .submit-btn,
  .btn-confirm,
  .progress-fill {
    background: linear-gradient(135deg, #B3441D, #D2603A);
  }

  .btn-logout {
    background: transparent;
    border-color: #C0554A;
    color: #E08A7A;
  }

  .modal-overlay {
    background: rgba(0, 0, 0, 0.72);
  }

  /* 图片与占位 */
  .point-image,
  .clinical-notes,
  .diagram-placeholder,
  .edit-avatar-placeholder {
    background: var(--bg-elevated);
    color: var(--text-muted);
  }

  .avatar {
    background: rgba(255, 255, 255, 0.08);
  }

  .meridian-result {
    background: linear-gradient(135deg, #3A1206, #4C1A08);
  }

  .safe-bottom {
    background: var(--bg-base);
  }

  .nav-icon {
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.35);
  }

  /* Switch 组件 */
  switch .wx-switch-input {
    background: #3A3A3A !important;
  }
}
</style>
