<script lang="ts">
import { getTabName } from '@/utils/platform'
export default {
  onShareAppMessage() {
    const name = getTabName('diagnosis')
    return { title: `${name} - 六经辨证辅助分析`, path: '/pages/diagnosis/index' }
  },
  onShareTimeline() {
    const name = getTabName('diagnosis')
    return { title: `${name} - 六经辨证辅助分析` }
  }
}
</script>

<template>
  <view class="container" :class="[themeClass, hasChat ? 'has-chat' : '']">
    <!-- 品牌头图：空闲态为完整头图，会话态收成细条 -->
    <view class="hero" :class="{ compact: hasChat }">
      <view class="hero-deco deco-a"></view>
      <view class="hero-deco deco-b"></view>
      <text class="hero-watermark">問</text>

      <view class="hero-top">
        <view class="hero-title-wrap">
          <text class="hero-title">{{ diagnosisName }}</text>
          <text class="hero-sub">{{ hasChat ? '继续追问，AI 会结合上文分析' : '六经辨证 · 中医辅助分析' }}</text>
        </view>
        <view class="coin-badge" v-if="isLoggedIn" @tap="goToRecharge">
          <text class="coin-icon">币</text>
          <text class="coin-count">{{ coinBalance.balance }}</text>
        </view>
      </view>

      <view class="hero-bottom">
        <view class="quota-chip" :class="{ warn: isLoggedIn && coinBalance.free_remaining <= 0 }">
          <text class="quota-dot"></text>
          <text>{{ quotaText }}</text>
        </view>
        <view v-if="hasChat" class="new-chat" @tap="clearConversation">新问诊</view>
        <text v-else class="hero-note">结果仅供学习参考</text>
      </view>
    </view>

    <!-- 未登录 / 登录已过期：不强制跳转，仍可浏览 -->
    <view class="login-banner" v-if="!isLoggedIn" @tap="promptLogin()">
      <view class="login-banner-main">
        <text class="login-banner-title">{{ sessionExpired ? '登录状态已过期' : '未登录' }}</text>
        <text class="login-banner-desc">登录后可问诊：每日 1 次免费，问诊记录自动保存</text>
      </view>
      <view class="login-banner-btn">去登录</view>
    </view>

    <!-- 未打卡：签到领奖励（会话态收为紧凑样式） -->
    <view
      v-if="isLoggedIn && signStatus && !signStatus.is_signed"
      class="checkin-card"
      :class="{ compact: hasChat }"
      @tap="handleSignIn"
    >
      <view class="checkin-seal">签</view>
      <view class="checkin-main">
        <view class="checkin-title-row">
          <text class="checkin-title">今日签到</text>
          <text class="checkin-reward">+{{ signStatus.coins_per_day }} 古币</text>
        </view>
        <text class="checkin-desc">{{ checkinDesc }}</text>
        <view class="checkin-week" v-if="!hasChat && weekDays.length > 0">
          <view
            v-for="(d, i) in weekDays"
            :key="i"
            class="week-day"
            :class="{ signed: d.signed, today: isToday(d.date) }"
          >
            <view class="week-dot"><text v-if="d.signed">✓</text></view>
            <text class="week-label">{{ getDayLabel(d.date) }}</text>
          </view>
        </view>
      </view>
      <view class="checkin-btn" :class="{ loading: signingIn }">{{ signingIn ? '签到中' : '签到' }}</view>
    </view>

    <!-- 已打卡：仅空闲态保留一条细条，强化"明天再来" -->
    <view v-if="isLoggedIn && signStatus && signStatus.is_signed && !hasChat" class="signed-strip">
      <view class="signed-icon">✓</view>
      <text class="signed-text">今日已签到 · 连续 {{ signStatus.streak }} 天</text>
      <text class="signed-next">明日 +{{ signStatus.coins_per_day }}</text>
    </view>

    <!-- 对话与结果 -->
    <view class="chat" v-if="hasChat">
      <view v-for="(msg, idx) in conversation" :key="idx" class="msg" :class="msg.role">
        <view v-if="msg.role === 'user'" class="bubble-user">
          <text>{{ msg.content }}</text>
        </view>

        <view v-else class="answer-card">
          <view class="answer-head">
            <view class="answer-avatar">岐</view>
            <view class="answer-head-main">
              <text class="answer-title">{{ idx === 1 ? '辨证结论' : '追问解答' }}</text>
              <text class="answer-meta">
                {{ idx === 1 ? ('基于六经辨证 · ' + msg.result.source) : '结合上文与本次追问继续分析' }}
              </text>
            </view>
          </view>

          <!-- 结论：整幅主视觉 -->
          <view class="verdict" v-if="msg.result.meridian">
            <text class="verdict-label">六 经 归 属</text>
            <text class="verdict-name">{{ msg.result.meridian }}</text>
            <view class="verdict-meta" v-if="msg.result.formulas.length || msg.result.acupoints.length">
              <text v-if="msg.result.formulas.length">方剂 {{ msg.result.formulas.length }}</text>
              <text class="verdict-dot" v-if="msg.result.formulas.length && msg.result.acupoints.length">·</text>
              <text v-if="msg.result.acupoints.length">穴位 {{ msg.result.acupoints.length }}</text>
            </view>
          </view>

          <!-- 推荐方剂 -->
          <view class="section-block" v-if="msg.result.formulas.length">
            <view class="sec-head">
              <view class="sec-mark">方</view>
              <text class="sec-title">推荐方剂</text>
              <view class="sec-rule"></view>
              <text class="sec-count">{{ msg.result.formulas.length }}</text>
            </view>
            <view class="chip-list">
              <view
                v-for="formula in msg.result.formulas"
                :key="formula"
                class="chip chip-formula"
                @tap="goToFormula(formula)"
              >
                <text class="chip-text">{{ formula }}</text>
                <text class="chip-arrow">›</text>
              </view>
            </view>
          </view>

          <!-- 推荐穴位 -->
          <view class="section-block" v-if="msg.result.acupoints.length">
            <view class="sec-head">
              <view class="sec-mark green">穴</view>
              <text class="sec-title">推荐穴位</text>
              <view class="sec-rule"></view>
              <text class="sec-count">{{ msg.result.acupoints.length }}</text>
            </view>
            <view class="chip-list">
              <view
                v-for="point in msg.result.acupoints"
                :key="point"
                class="chip chip-acupoint"
                @tap="goToAcupoint(point)"
              >
                <text class="chip-text">{{ point }}</text>
                <text class="chip-arrow">›</text>
              </view>
            </view>
          </view>

          <!-- 穴位操作（按摩 / 针灸） -->
          <view class="section-block" v-if="msg.result.methods">
            <view class="sec-head">
              <view class="sec-mark green">法</view>
              <text class="sec-title">穴位操作</text>
              <view class="sec-rule"></view>
              <text class="sec-count">按 · 针 · 灸</text>
            </view>
            <view class="prose methods">
              <markdown-view :content="msg.result.methods" :size="27" />
            </view>
          </view>

          <!-- 相关医案 -->
          <view class="section-block" v-if="msg.result.cases && msg.result.cases.length">
            <view class="sec-head">
              <view class="sec-mark gold">案</view>
              <text class="sec-title">相关医案</text>
              <view class="sec-rule"></view>
              <text class="sec-count">{{ msg.result.cases.length }}</text>
            </view>
            <view class="chip-list">
              <view
                v-for="c in msg.result.cases"
                :key="c.id"
                class="chip chip-case"
                @tap="goToCase(c.id)"
              >
                <text class="chip-text">{{ c.disease }}</text>
                <text class="chip-arrow">›</text>
              </view>
            </view>
          </view>

          <!-- 辨证分析 -->
          <view class="section-block">
            <view class="sec-head">
              <view class="sec-mark">析</view>
              <text class="sec-title">辨证分析</text>
              <view class="sec-rule"></view>
            </view>
            <view class="prose">
              <markdown-view
                :content="idx === 1 ? msg.result.analysis : msg.content"
                :size="30"
              />
            </view>
            <view class="mention-row" v-if="msg.result.mentions && msg.result.mentions.length">
              <text class="mention-label">文中涉及</text>
              <view class="mention-chips">
                <text
                  v-for="m in msg.result.mentions"
                  :key="m.kind + '-' + m.name"
                  class="mention-chip"
                  :class="'is-' + m.kind"
                  :data-kind="m.kind"
                  :data-name="m.name"
                  @tap="goToMention"
                >{{ m.name }}</text>
              </view>
            </view>
          </view>

          <!-- 注意事项 -->
          <view class="section-block" v-if="msg.result.advice">
            <view class="sec-head">
              <view class="sec-mark gold">注</view>
              <text class="sec-title">注意事项</text>
              <view class="sec-rule"></view>
            </view>
            <view class="advice">
              <markdown-view :content="msg.result.advice" :size="27" />
            </view>
          </view>

          <view class="answer-foot">
            <text class="foot-text">内容由 AI 生成，仅供学习参考，不替代医师诊断</text>
          </view>
        </view>
      </view>

      <!-- AI 思考态：整幅卡片 + 真实进度 -->
      <view class="answer-card thinking" v-if="loading">
        <view class="answer-head">
          <view class="answer-avatar pulse">岐</view>
          <view class="answer-head-main">
            <text class="answer-title">正在辨证</text>
            <text class="answer-meta">{{ aiStatus || 'AI 正在结合症状分析…' }}</text>
          </view>
        </view>
        <view class="thinking-bar">
          <view class="thinking-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <view class="thinking-dots">
          <text></text><text></text><text></text>
        </view>
      </view>
    </view>

    <!-- 空闲态：完整的症状录入卡 -->
    <view class="compose-card" v-if="!hasChat">
      <view class="compose-head">
        <text class="compose-title">描述症状</text>
        <text class="compose-count">{{ symptoms.length }}/500</text>
      </view>
      <textarea
        class="compose-input"
        v-model="symptoms"
        placeholder="请详细描述症状，例如：发热、恶寒、头痛、无汗、口渴…"
        placeholder-class="compose-placeholder"
        :maxlength="500"
      />
      <view class="quick-wrap">
        <view class="quick-head">
          <text class="quick-title">常见症状 · 点击添加</text>
          <text class="quick-tip">描述越具体越准确</text>
        </view>
        <view class="quick-tags">
          <view v-for="tag in quickSymptoms" :key="tag" class="quick-tag" @tap="addSymptom(tag)">
            {{ tag }}
          </view>
        </view>
      </view>
      <text class="cost-hint" :class="{ warn: costWarn }">{{ costHint }}</text>
      <view class="submit-btn" :class="{ disabled: !symptoms || loading, running: loading }" @tap="analyzeSymptoms">
        <view v-if="loading" class="submit-progress" :style="{ width: progress + '%' }"></view>
        <view v-if="loading" class="submit-flow"></view>
        <text class="submit-text">{{ loading ? (aiStatus || '分析中…') : '开始辨证' }}</text>
        <text v-if="loading" class="submit-percent">{{ Math.round(progress) }}%</text>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="disclaimer" v-if="!hasChat">
      <text class="disclaimer-text">温馨提示：本功能仅供参考学习，不替代专业医疗诊断。如有不适，请咨询执业医师。</text>
    </view>

    <!-- 会话态：底部单行追问栏 -->
    <view class="composer" v-if="hasChat">
      <view class="composer-inner">
        <input
          class="composer-input"
          v-model="symptoms"
          :placeholder="loading ? 'AI 分析中，请稍候…' : '继续追问，例如：服药后症状有变化…'"
          placeholder-class="compose-placeholder"
          confirm-type="send"
          :disabled="loading"
          :cursor-spacing="24"
          :maxlength="500"
          @confirm="analyzeSymptoms"
        />
        <view class="composer-send" :class="{ disabled: !symptoms || loading, running: loading }" @tap="analyzeSymptoms">
          <text>{{ loading ? '分析中' : '发送' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import api from '@/utils/api'
import { authState, goToLogin as navigateToLogin } from '@/utils/auth'
import { useTheme } from "@/utils/theme"
import { getBalance, useFree, consumeCoins, getSignInStatus, signIn } from '@/utils/pay'
import type { CoinBalance, SignInStatus } from '@/utils/pay'
import MarkdownView from '@/components/MarkdownView.vue'
import { buildAcupointMethods, findRelatedCases, findMentions } from '@/utils/entity-link'
import type { RelatedCase } from '@/utils/entity-link'

const { themeClass } = useTheme()
const symptoms = ref('')
const loading = ref(false)
const progress = ref(0)
const aiStatus = ref('')

const isLoggedIn = computed(() => authState.loggedIn)
const sessionExpired = computed(() => authState.expired)
const diagnosisName = computed(() => getTabName('diagnosis'))

// 对话消息：结构化结果统一归一化，保证模板里的数组/字符串类型永远正确
interface NormalizedResult {
  meridian: string
  formulas: string[]
  acupoints: string[]
  analysis: string
  advice: string
  /** 穴位操作（针刺 / 艾灸 / 按摩），AI 未返回时用本地穴位数据兜底 */
  methods: string
  /** 与结果方剂 / 穴位相关的本地医案 */
  cases: RelatedCase[]
  mentions: Array<{ kind: 'formula' | 'acupoint'; name: string }>
  source: string
}

const conversation = ref<{ role: 'user' | 'assistant'; content: string; result: NormalizedResult }[]>([])

// 任何非字符串输入转成可渲染文本，避免 Markdown 组件拿到对象/数组后崩溃
function toText(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join('\n')
  if (typeof v === 'object') return ''
  return String(v)
}

// 清洗单个条目：去掉括号补充说明，过滤"合穴/原穴/胃之募穴"等属性词
function cleanListItem(raw: any, kind: 'formula' | 'acupoint'): string {
  let s = toText(raw).trim()
  if (!s) return ''
  s = s.replace(/[（(].*$/, '').trim()
  s = s.replace(/^[\s*`#>\-]+/, '').replace(/[、，,。.;；:：]+$/, '').trim()
  if (kind === 'acupoint') {
    if (/^(合|原|经|络|郄|募|俞|下合|五输|八会|交会|背俞|腹募)?穴$/.test(s)) return ''
    if (/之.+穴$/.test(s)) return ''
    if (s.length < 2 || s.length > 5) return ''
  }
  if (kind === 'formula') {
    if (!/(汤|丸|散|膏|丹|饮)$/.test(s)) return ''
    // 症状描述（如"默默不欲饮"）虽以"饮"结尾，但不是方名
    if (/(不欲|默默|苦满|喜呕|寒热|口渴|心烦|发热|恶寒|汗出|小便|胸胁)/.test(s)) return ''
  }
  return s
}

// 方剂/穴位兼容数组、逗号分隔字符串、关联对象三种返回形态
function toStringList(v: any, kind: 'formula' | 'acupoint'): string[] {
  let raws: string[] = []
  if (Array.isArray(v)) {
    raws = v.map(item => toText(item))
  } else if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    const parts = s.split(/[、,，;；\n]/).map(x => x.trim()).filter(Boolean)
    raws = parts.length > 1 ? parts : [s]
  } else if (v && typeof v === 'object') {
    raws = Object.keys(v).map(k => toText((v as any)[k]))
  }
  const out: string[] = []
  for (let i = 0; i < raws.length; i++) {
    const cleaned = cleanListItem(raws[i], kind)
    if (cleaned && out.indexOf(cleaned) === -1) out.push(cleaned)
  }
  return out
}

// 从 AI 原文中抽出某一节，避免"结构化字段 + 全文"重复展示
function extractSection(text: string, names: string[]): string {
  if (!text) return ''
  for (let i = 0; i < names.length; i++) {
    const re = new RegExp('【\\s*' + names[i] + '\\s*】([\\s\\S]*?)(?=【|$)')
    const m = text.match(re)
    if (m && m[1] && m[1].trim()) return m[1].trim()
  }
  return ''
}

function normalizeResult(data: any): NormalizedResult {
  const raw = toText(data && data.raw_response) || toText(data && data.analysis)
  const formulas = toStringList(data && data.suggested_formulas, 'formula')
  const acupoints = toStringList(data && data.suggested_acupoints, 'acupoint')
  const aiMethods = toText(data && data.acupoint_methods).trim()
  return {
    meridian: toText(data && data.meridian),
    formulas,
    acupoints,
    analysis: extractSection(raw, ['辨证分析', '分析']) || raw,
    advice: toText(data && data.advice),
    // 优先用 AI 给出的操作（含按摩），没有则按本地穴位库补齐针刺 / 艾灸
    methods: aiMethods || buildAcupointMethods(acupoints),
    cases: findRelatedCases(formulas, acupoints),
    // 正文里点到的方剂 / 穴位：正文保持纯文本，跳转交给下方标签行
    mentions: findMentions([raw, aiMethods, toText(data && data.advice)].filter(Boolean).join('\n')),
    source: toText(data && data.source) || '中医知识库'
  }
}

// 是否已进入会话（首次问诊后），决定整页布局形态
const hasChat = computed(() => conversation.value.length > 0)

const pageVisible = ref(false)
let loginPrompting = false
let skipNextAutoPrompt = false
let lastAutoPromptAt = 0
const AUTO_PROMPT_INTERVAL = 30 * 1000

const coinBalance = ref<CoinBalance>({
  balance: 0, total_recharged: 0, total_consumed: 0, free_remaining: 1, free_used: 0
})

// 签到状态
const signStatus = ref<SignInStatus | null>(null)
const signingIn = ref(false)

// 一周签到日历：无条件保证是数组
const weekDays = computed(() => {
  const list = signStatus.value && (signStatus.value as any).week_days
  return Array.isArray(list) ? list : []
})

onShow(() => {
  pageVisible.value = true
  const meridian = uni.getStorageSync('diagnosis_meridian')
  if (meridian) {
    uni.removeStorageSync('diagnosis_meridian')
    symptoms.value = meridian + '证'
  }

  if (isLoggedIn.value) {
    skipNextAutoPrompt = false
    loadCoinBalance()
    loadSignStatus()
    return
  }

  if (skipNextAutoPrompt) {
    skipNextAutoPrompt = false
  } else {
    promptLogin(true)
  }
})

onHide(() => { pageVisible.value = false })

onUnload(() => {
  stopRamp()
  stopSlowHint()
})

watch(() => authState.loggedIn, (logged) => {
  if (logged) {
    skipNextAutoPrompt = false
    loadCoinBalance()
    loadSignStatus()
    return
  }
  coinBalance.value = { balance: 0, total_recharged: 0, total_consumed: 0, free_remaining: 1, free_used: 0 }
  signStatus.value = null
  if (pageVisible.value) promptLogin()
})

function promptLogin(auto = false) {
  if (isLoggedIn.value || loginPrompting) return
  if (auto) {
    const now = Date.now()
    if (now - lastAutoPromptAt < AUTO_PROMPT_INTERVAL) return
    lastAutoPromptAt = now
  }
  loginPrompting = true
  uni.showModal({
    title: authState.expired ? '登录已过期' : '需要登录',
    content: authState.expired
      ? `登录状态已过期，重新登录后即可继续使用${diagnosisName.value}，问诊记录会自动保存。`
      : `${diagnosisName.value}需要记录问诊并扣减古币，请先登录后使用。每日 1 次免费，签到可再领古币。`,
    confirmText: '去登录',
    cancelText: '先浏览',
    success: (res: any) => {
      loginPrompting = false
      if (res.confirm) goToLogin()
    },
    fail: () => { loginPrompting = false }
  })
}

function goToLogin() {
  skipNextAutoPrompt = true
  navigateToLogin('back')
}

async function loadCoinBalance() {
  try {
    coinBalance.value = await getBalance()
  } catch {}
}

async function loadSignStatus() {
  if (!isLoggedIn.value) { signStatus.value = null; return }
  try {
    const data = await getSignInStatus()
    signStatus.value = data && typeof data === 'object' ? data : null
  } catch {
    signStatus.value = null
  }
}

// 签到：一次点击直接完成，不做二次弹窗
async function handleSignIn() {
  if (!isLoggedIn.value) { promptLogin(); return }
  if (signingIn.value || signStatus.value?.is_signed) return
  signingIn.value = true
  try {
    const r = await signIn()
    if (r.success) {
      uni.showToast({ title: `签到成功 +${r.coins} 古币`, icon: 'success' })
      try { uni.vibrateShort({ type: 'light', fail: () => {} } as any) } catch {}
      await Promise.all([loadSignStatus(), loadCoinBalance()])
    }
  } finally {
    signingIn.value = false
  }
}

const quickSymptoms = [
  '发热', '恶寒', '头痛', '无汗', '有汗', '口渴',
  '呕吐', '腹痛', '腹泻', '便秘', '咳嗽', '失眠',
  '心悸', '眩晕', '腰痛', '水肿'
]

const quotaText = computed(() => {
  if (!isLoggedIn.value) return '登录后每日 1 次免费'
  const free = coinBalance.value.free_remaining
  return free > 0 ? `今日免费 ${free} 次` : `免费已用完 · 1 古币/次`
})

const costHint = computed(() => {
  if (!isLoggedIn.value) return '登录后可问诊 · 每日 1 次免费'
  const b = coinBalance.value
  if (b.free_remaining > 0) return '本次使用今日免费次数，不扣古币'
  if (b.balance > 0) return `本次将消耗 1 古币 · 当前余额 ${b.balance}`
  return '免费次数已用完且余额不足，请先签到或充值'
})

const costWarn = computed(() => isLoggedIn.value && coinBalance.value.free_remaining <= 0 && coinBalance.value.balance <= 0)

const checkinDesc = computed(() => {
  const s = signStatus.value
  if (!s) return ''
  if (coinBalance.value.free_remaining <= 0) {
    return `免费次数已用完，签到得 ${s.coins_per_day} 古币，可继续问诊`
  }
  return s.streak > 1
    ? `连续签到第 ${s.streak} 天，今日再领 ${s.coins_per_day} 古币`
    : `每天签到领 ${s.coins_per_day} 古币，可抵扣问诊次数`
})

function getDayLabel(dateStr: string): string {
  const dayMap: Record<string, string> = { 'Mon': '一', 'Tue': '二', 'Wed': '三', 'Thu': '四', 'Fri': '五', 'Sat': '六', 'Sun': '日' }
  const date = new Date(dateStr)
  const dayEn = date.toLocaleDateString('en-US', { weekday: 'short' })
  return dayMap[dayEn] || dateStr.slice(-2)
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return dateStr === `${y}-${m}-${d}`
}

function addSymptom(tag: string) {
  symptoms.value = symptoms.value ? symptoms.value + '，' + tag : tag
}

function clearConversation() {
  if (!hasChat.value) return
  uni.showModal({
    title: '开始新的问诊',
    content: '当前对话将被清空，是否继续？',
    confirmText: '清空',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) return
      conversation.value = []
      symptoms.value = ''
      aiStatus.value = ''
      progress.value = 0
    }
  })
}

let rampTimer: ReturnType<typeof setInterval> | null = null
let slowTimer: ReturnType<typeof setTimeout> | null = null

function stopRamp() {
  if (rampTimer) { clearInterval(rampTimer); rampTimer = null }
}

function stopSlowHint() {
  if (slowTimer) { clearTimeout(slowTimer); slowTimer = null }
}

// 进度推进：越接近目标步长越小，视觉上持续前进而不是卡住
function startRamp(target: number, interval = 900) {
  stopRamp()
  rampTimer = setInterval(() => {
    const cur = progress.value
    if (cur >= target) { stopRamp(); return }
    const remain = target - cur
    const step = remain > 45 ? 2 : remain > 25 ? 1.2 : remain > 12 ? 0.7 : 0.35
    progress.value = Math.min(target, Math.round((cur + step) * 10) / 10)
  }, interval)
}

// 模型生成偏慢时的安抚文案
function startSlowHint() {
  stopSlowHint()
  slowTimer = setTimeout(() => {
    if (loading.value) aiStatus.value = '模型生成较慢，仍在处理，请稍候…'
  }, 15000)
}

function scrollToBottom() {
  nextTick(() => {
    setTimeout(() => {
      try {
        const wxApi = (globalThis as any).wx
        if (wxApi && typeof wxApi.pageScrollTo === 'function') {
          wxApi.pageScrollTo({ scrollTop: 100000, duration: 200, fail: () => {} })
        } else {
          uni.pageScrollTo({ scrollTop: 100000, duration: 200, fail: () => {} } as any)
        }
      } catch {}
    }, 80)
  })
}

async function analyzeSymptoms() {
  if (!isLoggedIn.value) { promptLogin(); return }
  const question = symptoms.value.trim()
  if (!question) {
    uni.showToast({ title: '请先描述症状', icon: 'none' })
    return
  }
  if (loading.value) return

  // 首次问诊扣费；继续追问不扣费
  let isFreeUse = false
  if (conversation.value.length === 0) {
    try {
      await loadCoinBalance()
      if (coinBalance.value.free_remaining > 0) {
        isFreeUse = true
      } else if (coinBalance.value.balance <= 0) {
        uni.showModal({
          title: '次数不足',
          content: '今日免费次数已用完，古币余额不足。签到可领古币，充值可继续使用。',
          confirmText: '去签到',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) handleSignIn()
          }
        })
        return
      } else {
        const confirmRes = await new Promise<boolean>((resolve) => {
          uni.showModal({
            title: '提示',
            content: '今日免费次数已用完，本次问诊将消耗1古币。当前余额：' + coinBalance.value.balance + '古币',
            confirmText: '继续',
            cancelText: '取消',
            success: (res) => resolve(!!res.confirm)
          })
        })
        if (!confirmRes) return
      }
    } catch {}
  }

  const snapshot = question
  symptoms.value = ''
  loading.value = true
  progress.value = 5
  aiStatus.value = '正在连接 AI…'
  startRamp(10, 400)
  startSlowHint()
  scrollToBottom()

  try {
    const params: any = { symptoms: snapshot }
    if (conversation.value.length > 0) {
      params.history = JSON.stringify(conversation.value.map(m => ({ role: m.role, content: m.content })))
    }

    const res = await api.streamRequest('ai', 'consult', params, (evt) => {
      if (evt.type === 'start') {
        // AI 已受理：从 10% 缓慢推进到 80%，期间保持循环动画
        aiStatus.value = 'AI 已受理，正在辨证…'
        startRamp(80, 900)
      } else if (evt.type === 'progress') {
        if (evt.status === 'switching') {
          aiStatus.value = '当前模型响应受限，正在切换备用模型…'
        } else {
          aiStatus.value = 'AI 正在生成分析…'
          if (typeof evt.percent === 'number') {
            progress.value = Math.max(progress.value, Math.min(92, evt.percent))
          }
        }
      } else if (evt.type === 'done') {
        stopRamp()
        stopSlowHint()
        aiStatus.value = ''
        progress.value = 100
      }
    }, 'POST')

    if (res && res.code === 1 && res.data) {
      stopRamp()
      stopSlowHint()
      progress.value = 100
      aiStatus.value = ''

      const content = toText(res.data.raw_response) || toText(res.data.analysis)
      const normalized = normalizeResult(res.data)
      conversation.value.push({ role: 'user', content: snapshot, result: normalizeResult(null) })
      conversation.value.push({ role: 'assistant', content, result: normalized })

      if (conversation.value.length === 2) {
        if (isFreeUse) {
          await useFree()
        } else {
          await consumeCoins(1, 'AI问诊')
        }
        await loadCoinBalance()
      }

      if (api.isLoggedIn()) {
        // 学习记录是旁路请求，失败不应影响问诊结果展示
        Promise.resolve(api.recordLearning('diagnosis', 0, '问诊: ' + snapshot.substring(0, 30))).catch(() => {})
      }

      scrollToBottom()
    } else {
      stopRamp()
      stopSlowHint()
      progress.value = 0
      aiStatus.value = ''
      symptoms.value = snapshot
      uni.showToast({ title: (res && res.msg) || '分析失败，请重试', icon: 'none' })
    }
  } catch (e) {
    stopRamp()
    stopSlowHint()
    progress.value = 0
    aiStatus.value = ''
    symptoms.value = snapshot
    console.error('AI问诊失败', e)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  } finally {
    stopRamp()
    stopSlowHint()
    loading.value = false
  }
}

function goToFormula(name: string) {
  uni.navigateTo({ url: `/pages/formulas/detail?name=${encodeURIComponent(name)}` })
}

function goToAcupoint(name: string) {
  uni.navigateTo({ url: `/pages/acupuncture/detail?name=${encodeURIComponent(name)}` })
}

function goToMention(e: any) {
  const ds = (e && e.currentTarget && e.currentTarget.dataset) || {}
  const name = ds.name ? String(ds.name) : ''
  if (!name) return
  if (ds.kind === 'formula') goToFormula(name)
  else goToAcupoint(name)
}

function goToCase(id: number | string) {
  if (!id) return
  uni.navigateTo({ url: `/pages/cases/detail?id=${id}` })
}

function goToRecharge() {
  uni.navigateTo({ url: '/pages/recharge/index' })
}
</script>

<style lang="scss" scoped>
/* ---------- 设计令牌（亮/暗两套） ---------- */
.container {
  --bg: #F5F0E8;
  --card: #FFFFFF;
  --soft: #FAFAF7;
  --text: #2C2C2C;
  --text-2: #444444;
  --muted: #999999;
  --line: #EFE7DA;
  --line-strong: #E8E0D4;
  --primary: #8B2500;
  --primary-2: #A63A1E;
  --gold: #B8860B;
  --green: #2D5F4A;

  min-height: 100vh;
  background: var(--bg);
  padding: 24rpx 24rpx 60rpx;
  box-sizing: border-box;
}

.container.has-chat {
  padding-bottom: 220rpx;
}

.container.is-dark {
  --bg: #121212;
  --card: #1E1E1E;
  --soft: #262626;
  --text: #EDEDED;
  --text-2: #C9C9C9;
  --muted: #8A8A8A;
  --line: #2C2C2C;
  --line-strong: #3A3A3A;
}

/* ---------- 品牌头图 ---------- */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 20rpx;
  padding: 34rpx 32rpx 26rpx;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 62%, #B4512F 100%);
  box-shadow: 0 10rpx 30rpx rgba(139, 37, 0, 0.18);
}

.hero.compact {
  padding: 24rpx 28rpx 20rpx;
  box-shadow: 0 6rpx 18rpx rgba(139, 37, 0, 0.16);
}

.hero-deco {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.deco-a {
  width: 260rpx;
  height: 260rpx;
  right: -90rpx;
  top: -110rpx;
}

.deco-b {
  width: 180rpx;
  height: 180rpx;
  right: 60rpx;
  bottom: -120rpx;
}

.hero-watermark {
  position: absolute;
  right: 8rpx;
  bottom: -76rpx;
  font-size: 220rpx;
  font-weight: 700;
  line-height: 1;
  color: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.hero-top {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.hero-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
}

.hero.compact .hero-title {
  font-size: 34rpx;
}

.hero-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.4;
}

.coin-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.16);
  border: 1rpx solid rgba(255, 255, 255, 0.24);
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
}

.coin-badge:active { opacity: 0.8; }

.coin-icon {
  width: 30rpx;
  height: 30rpx;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #fff;
  font-weight: 700;
}

.coin-count {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}

.hero-bottom {
  position: relative;
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.hero.compact .hero-bottom { margin-top: 14rpx; }

.quota-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.15);
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.92);
}

.quota-chip.warn {
  background: rgba(0, 0, 0, 0.22);
  color: #FFE0B2;
}

.quota-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #FFD37A;
}

.quota-chip.warn .quota-dot { background: #FF9F43; }

.hero-note {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.55);
}

.new-chat {
  flex-shrink: 0;
  padding: 8rpx 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #fff;
}

.new-chat:active { background: rgba(255, 255, 255, 0.15); }

/* ---------- 未登录提示 ---------- */
.login-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(184, 134, 11, 0.12);
  border: 1rpx solid rgba(184, 134, 11, 0.35);
  border-radius: 14rpx;
  padding: 20rpx 24rpx;
  margin-top: 20rpx;
}

.login-banner-main { flex: 1; min-width: 0; }

.login-banner-title {
  display: block;
  font-size: 27rpx;
  font-weight: 600;
  color: var(--brown-ink);
  margin-bottom: 4rpx;
}

.login-banner-desc {
  display: block;
  font-size: 22rpx;
  color: #A0722A;
  line-height: 1.5;
}

.login-banner-btn {
  flex-shrink: 0;
  padding: 12rpx 26rpx;
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: #fff;
  font-size: 24rpx;
  font-weight: 500;
  border-radius: 999rpx;
}

.login-banner-btn:active { opacity: 0.85; }

/* ---------- 签到卡 ---------- */
.checkin-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 20rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-card));
  border: 1rpx solid rgba(184, 134, 11, 0.3);
  box-shadow: 0 4rpx 16rpx rgba(184, 134, 11, 0.08);
}

.checkin-card:active { opacity: 0.96; }

.checkin-card.compact {
  padding: 20rpx 24rpx;
  margin-top: 16rpx;
}

.checkin-seal {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, var(--accent), var(--accent));
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.35);
}

.checkin-card.compact .checkin-seal {
  width: 52rpx;
  height: 52rpx;
  font-size: 24rpx;
  border-radius: 12rpx;
}

.checkin-main { flex: 1; min-width: 0; }

.checkin-title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.checkin-title {
  font-size: 29rpx;
  font-weight: 600;
  color: #5A3A12;
}

.checkin-reward {
  font-size: 21rpx;
  font-weight: 600;
  color: #8A6A2A;
  background: rgba(184, 134, 11, 0.16);
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
}

.checkin-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9A7B46;
  line-height: 1.5;
}

.checkin-week {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.week-dot {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1rpx solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #fff;
  box-sizing: border-box;
}

.week-day.signed .week-dot {
  background: linear-gradient(135deg, var(--accent), var(--accent));
  border-color: transparent;
}

.week-day.today .week-dot {
  box-shadow: 0 0 0 4rpx rgba(184, 134, 11, 0.25);
}

.week-label {
  font-size: 18rpx;
  color: #A08A62;
}

.checkin-btn {
  flex-shrink: 0;
  min-width: 112rpx;
  height: 64rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--accent), var(--accent));
  color: #fff;
  font-size: 25rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(184, 134, 11, 0.25);
}

.checkin-btn:active { transform: scale(0.97); opacity: 0.92; }

.checkin-btn.loading { opacity: 0.75; }

.checkin-card.compact .checkin-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 已签到细条 ---------- */
.signed-strip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
  padding: 18rpx 24rpx;
  background: var(--card);
  border: 1rpx solid var(--line);
  border-left: 6rpx solid var(--green);
  border-radius: 14rpx;
}

.signed-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: rgba(45, 95, 74, 0.12);
  color: var(--green);
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signed-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--text-2);
}

.signed-next {
  font-size: 22rpx;
  color: var(--gold);
}

/* ---------- 对话 ---------- */
.chat {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.msg { display: flex; }

.msg.user { justify-content: flex-end; }

.bubble-user {
  max-width: 82%;
  padding: 20rpx 26rpx;
  background: rgba(139, 37, 0, 0.07);
  border: 1rpx solid rgba(139, 37, 0, 0.1);
  border-radius: 20rpx 20rpx 6rpx 20rpx;
  font-size: 28rpx;
  color: #4A2B1E;
  line-height: 1.65;
  word-break: break-all;
}

.answer-card {
  position: relative;
  width: 100%;
  padding: 30rpx 28rpx 22rpx;
  background: var(--card);
  border-radius: 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.answer-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, var(--brand), var(--accent));
}

.answer-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.answer-avatar {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 10rpx rgba(139, 37, 0, 0.25);
}

.answer-avatar.pulse { animation: avatar-breathe 1.6s ease-in-out infinite; }

@keyframes avatar-breathe {
  0%, 100% { box-shadow: 0 4rpx 10rpx rgba(139, 37, 0, 0.25); }
  50% { box-shadow: 0 4rpx 22rpx rgba(139, 37, 0, 0.45); }
}

.answer-head-main { flex: 1; min-width: 0; }

.answer-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 1rpx;
}

.answer-meta {
  display: block;
  margin-top: 2rpx;
  font-size: 21rpx;
  color: var(--muted);
  line-height: 1.4;
}

/* 结论主视觉 */
.verdict {
  position: relative;
  overflow: hidden;
  margin-top: 22rpx;
  padding: 26rpx 28rpx 24rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, rgba(139, 37, 0, 0.07), var(--accent-soft));
  border: 1rpx solid rgba(139, 37, 0, 0.14);
}

.verdict::after {
  content: '';
  position: absolute;
  right: -56rpx;
  top: -56rpx;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(184, 134, 11, 0.08);
}

.verdict-label {
  display: block;
  font-size: 21rpx;
  color: #A0722A;
  letter-spacing: 6rpx;
}

.verdict-name {
  display: block;
  margin-top: 8rpx;
  font-size: 54rpx;
  font-weight: 800;
  color: #7A2100;
  line-height: 1.25;
  letter-spacing: 2rpx;
}

.verdict-meta {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #8A6A2A;
}

.verdict-dot {
  margin: 0 10rpx;
  color: #C9A96A;
}

/* 结果分区 */
.section-block { margin-top: 34rpx; }

.sec-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.sec-mark {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  background: rgba(139, 37, 0, 0.1);
  color: var(--primary);
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sec-mark.green {
  background: var(--jade-soft);
  color: var(--green);
}

.sec-mark.gold {
  background: rgba(184, 134, 11, 0.14);
  color: #8A6A2A;
}

.sec-title {
  flex-shrink: 0;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 1rpx;
}

.sec-rule {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, var(--line-strong), rgba(0, 0, 0, 0));
}

.sec-count {
  flex-shrink: 0;
  font-size: 21rpx;
  color: var(--muted);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 18rpx;
}

.chip {
  flex: 1;
  min-width: 44%;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  padding: 0 24rpx;
  border-radius: 14rpx;
  box-sizing: border-box;
}

.chip:active { opacity: 0.85; }

.chip-text {
  font-size: 28rpx;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-arrow {
  font-size: 30rpx;
  color: var(--text-muted);
  line-height: 1;
}

.chip-formula {
  background: rgba(139, 37, 0, 0.06);
  border: 1rpx solid rgba(139, 37, 0, 0.12);
  color: var(--brand-ink);
}

.chip-acupoint {
  background: rgba(45, 95, 74, 0.07);
  border: 1rpx solid rgba(45, 95, 74, 0.14);
  color: var(--jade-ink);
}

.chip-case {
  background: rgba(184, 134, 11, 0.08);
  border: 1rpx solid rgba(184, 134, 11, 0.18);
  color: var(--accent-ink);
}

/* 文中涉及：正文里点到的方剂 / 穴位，点标签进详情 */
.mention-row {
  margin-top: 20rpx;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
}

.mention-label {
  font-size: 22rpx;
  color: var(--text-muted);
  letter-spacing: 2rpx;
  margin-right: 16rpx;
}

.mention-chips {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
}

.mention-chip {
  font-size: 24rpx;
  line-height: 1.7;
  padding: 0 14rpx;
  margin: 0 12rpx 10rpx 0;
  border-radius: 6rpx;
  background: rgba(139, 37, 0, 0.07);
  color: var(--brand-ink);
}

.mention-chip.is-acupoint {
  background: rgba(45, 95, 74, 0.09);
  color: var(--jade-ink);
}

/* 穴位操作：保留 markdown 列表的行距 */
.methods {
  font-size: 27rpx;
  line-height: 1.85;
}

.prose {
  margin-top: 16rpx;
  font-size: 30rpx;
  color: var(--text-2);
  line-height: 1.9;
}

.advice {
  margin-top: 18rpx;
  padding: 22rpx 24rpx;
  background: rgba(184, 134, 11, 0.08);
  border-left: 6rpx solid var(--gold);
  border-radius: 10rpx;
}

.answer-foot {
  margin-top: 20rpx;
  text-align: center;
}

.foot-text {
  font-size: 20rpx;
  color: var(--muted);
}

/* 思考态 */
.thinking-bar {
  margin-top: 22rpx;
  height: 6rpx;
  background: var(--soft);
  border-radius: 3rpx;
  overflow: hidden;
}

.thinking-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-light), var(--accent));
  transition: width 0.4s ease;
}

.thinking-dots {
  display: flex;
  justify-content: center;
  gap: 10rpx;
  margin-top: 18rpx;
}

.thinking-dots text {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.3;
  animation: dot-blink 1.2s ease-in-out infinite;
}

.thinking-dots text:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots text:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-blink {
  0%, 100% { opacity: 0.25; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-4rpx); }
}

/* ---------- 空闲态录入卡 ---------- */
.compose-card {
  margin-top: 20rpx;
  padding: 28rpx;
  background: var(--card);
  border-radius: 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.05);
}

.compose-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.compose-title {
  position: relative;
  padding-left: 18rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text);
}

.compose-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 28rpx;
  border-radius: 3rpx;
  background: linear-gradient(180deg, var(--brand), var(--accent));
}

.compose-count {
  font-size: 21rpx;
  color: var(--muted);
}

.compose-input {
  width: 100%;
  height: 190rpx;
  padding: 20rpx;
  box-sizing: border-box;
  background: var(--soft);
  border: 1rpx solid var(--line-strong);
  border-radius: 14rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--text);
}

.compose-placeholder {
  color: #B5AC9E;
  font-size: 26rpx;
}

.quick-wrap { margin-top: 22rpx; }

.quick-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.quick-title {
  font-size: 24rpx;
  color: var(--muted);
}

.quick-tip {
  font-size: 20rpx;
  color: var(--muted);
  opacity: 0.8;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.quick-tag {
  padding: 12rpx 22rpx;
  background: var(--soft);
  border: 1rpx solid var(--line-strong);
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.quick-tag:active {
  background: rgba(139, 37, 0, 0.1);
  color: var(--primary);
  border-color: rgba(139, 37, 0, 0.25);
}

.cost-hint {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: var(--muted);
}

.cost-hint.warn { color: #C04520; }

.submit-btn {
  position: relative;
  height: 92rpx;
  margin-top: 12rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  box-shadow: 0 10rpx 24rpx rgba(139, 37, 0, 0.2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:active:not(.disabled) { opacity: 0.92; }

.submit-btn.disabled {
  background: var(--border);
  box-shadow: none;
}

.submit-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--brand-light), var(--brand));
  transition: width 0.4s ease;
}

/* 进度条上的流光，提示"仍在推进" */
.submit-flow {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(100deg, rgba(255, 255, 255, 0) 25%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 75%);
  background-size: 200% 100%;
  animation: submit-flow 1.6s linear infinite;
}

@keyframes submit-flow {
  0% { background-position: 140% 0; }
  100% { background-position: -60% 0; }
}

.submit-percent {
  position: absolute;
  right: 24rpx;
  z-index: 1;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.85);
}

.submit-text {
  position: relative;
  z-index: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.submit-btn.disabled .submit-text { color: #9A9488; }

/* ---------- 底部追问栏 ---------- */
.composer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--window-bottom, 0px);
  z-index: 30;
  padding: 14rpx 24rpx;
  background: var(--card);
  border-top: 1rpx solid var(--line);
  box-shadow: 0 -6rpx 20rpx rgba(0, 0, 0, 0.04);
}

.composer-inner {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.composer-input {
  flex: 1;
  height: 76rpx;
  padding: 0 28rpx;
  box-sizing: border-box;
  background: var(--soft);
  border: 1rpx solid var(--line-strong);
  border-radius: 999rpx;
  font-size: 27rpx;
  color: var(--text);
}

.composer-send {
  flex-shrink: 0;
  min-width: 128rpx;
  height: 76rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 14rpx rgba(139, 37, 0, 0.22);
}

.composer-send:active:not(.disabled) { opacity: 0.9; }

.composer-send.running {
  animation: send-breathe 1.4s ease-in-out infinite;
}

@keyframes send-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

.composer-send.disabled {
  background: var(--border);
  color: var(--text-muted);
  box-shadow: none;
}

/* ---------- 免责声明 ---------- */
.disclaimer {
  margin-top: 28rpx;
  padding: 20rpx;
  background: rgba(255, 248, 220, 0.85);
  border-left: 4rpx solid #DAA520;
  border-radius: 10rpx;
}

.disclaimer-text {
  font-size: 21rpx;
  color: var(--brown-ink);
  line-height: 1.65;
}

/* ---------- 暗色微调 ---------- */
.container.is-dark {
  .checkin-card {
    background: linear-gradient(135deg, #2A2318, #241E14);
    border-color: rgba(184, 134, 11, 0.35);
  }

  .checkin-title { color: #E6C98A; }
  .checkin-desc { color: #B79A63; }
  .checkin-week .week-dot { background: #3A3226; border-color: #4A3F2E; }
  .week-label { color: #8F7C5B; }

  .bubble-user {
    background: rgba(192, 69, 32, 0.15);
    border-color: rgba(192, 69, 32, 0.3);
    color: #E8D9CE;
  }

  .verdict {
    background: linear-gradient(135deg, rgba(192, 69, 32, 0.12), var(--accent-soft));
    border-color: rgba(192, 69, 32, 0.25);
  }

  .verdict-name { color: #E8A07A; }
  .verdict-label { color: #C89A6A; }
  .verdict-meta { color: #C9A97A; }

  .advice { background: rgba(184, 134, 11, 0.12); }

  .sec-rule { background: linear-gradient(90deg, #3A3A3A, rgba(0, 0, 0, 0)); }

  .quick-tag { color: #C0C0C0; }
  .cost-hint.warn { color: #E07A55; }

  .submit-btn.disabled { background: #3A3A3A; }
  .submit-btn.disabled .submit-text { color: #8A8A8A; }

  .composer-send.disabled { background: #3A3A3A; color: #8A8A8A; }

  .disclaimer {
    background: var(--accent-soft);
    border-left-color: #B8860B;
  }

  .disclaimer-text { color: #C9A97A; }

  .chip-arrow { color: rgba(255, 255, 255, 0.3); }
}
</style>
