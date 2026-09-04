/**
 * 虚拟支付服务 - 代币系统
 */
import api from './api'

// 微信小程序 wx API 声明
declare const wx: any

// 支付配置
const PAY_CONFIG = {
  OFFER_ID: '1450637393',
  MODE: 'short_series_goods',
  CURRENCY: 'CNY',
  ENV: 0
}

// 充值套餐
export interface CoinPackage {
  product_id: string
  coins: number
  price: number // 单位：分
  name: string
}

// 代币余额
export interface CoinBalance {
  balance: number
  total_recharged: number
  total_consumed: number
  free_remaining: number
  free_used: number
}

// 支付payData
export interface PayData {
  signData: string
  mode: string
  paySig: string
  signature: string
}

// 检查iOS微信版本是否支持虚拟支付
export function checkIosVersion(): boolean {
  const device = uni.getDeviceInfo()
  if (device.platform !== 'ios') return true
  const appInfo = uni.getAppBaseInfo()
  const cur = appInfo.version.split('.').map(Number)
  const base = [8, 0, 68]
  for (let i = 0; i < 3; i++) {
    if ((cur[i] || 0) > base[i]) return true
    if ((cur[i] || 0) < base[i]) break
  }
  uni.showModal({
    title: '提示',
    content: '请将微信更新至最新版后再进行支付',
    showCancel: false
  })
  return false
}

// 获取代币余额
export async function getBalance(): Promise<CoinBalance> {
  const res = await api.request('pay', 'balance')
  if (res.code === 1) {
    return res.data
  }
  return { balance: 0, total_recharged: 0, total_consumed: 0, free_remaining: 1, free_used: 0 }
}

// 获取充值套餐列表
export async function getProducts(): Promise<CoinPackage[]> {
  const res = await api.request('pay', 'products')
  if (res.code === 1) {
    return res.data
  }
  return []
}

// 创建支付订单并拉起支付
export async function createOrderAndPay(productId: string): Promise<boolean> {
  if (!checkIosVersion()) return false

  // 检测是否支持虚拟支付（开发者工具中不可用）
  if (typeof wx.requestVirtualPayment !== 'function') {
    uni.showModal({
      title: '提示',
      content: '虚拟支付需要在真机上体验，请使用预览或真机调试模式。',
      showCancel: false
    })
    return false
  }

  try {
    // 0. 先刷新 session_key（确保 signature 有效）
    try {
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({ provider: 'weixin', success: resolve, fail: reject })
      })
      if (loginRes.code) {
        await api.request('pay', 'refresh_session', { code: loginRes.code }, 'POST')
      }
    } catch (e) {
      // 静默失败，继续尝试支付
    }

    // 1. 请求服务端下单
    const res = await api.request('pay', 'create_order', { product_id: productId }, 'POST')
    if (res.code !== 1) {
      uni.showToast({ title: res.msg || '下单失败', icon: 'none' })
      return false
    }

    const { payData, outTradeNo } = res.data

    // 2. 拉起微信虚拟支付
    try {
      const payResult: any = await new Promise((resolve, reject) => {
        wx.requestVirtualPayment({
          signData: payData.signData,
          mode: payData.mode,
          paySig: payData.paySig,
          signature: payData.signature,
          success: (res: any) => resolve(res),
          fail: (err: any) => reject(err)
        })
      })
      uni.showToast({ title: '支付成功', icon: 'success' })
      setTimeout(() => { confirmOrder(outTradeNo).then(() => true) }, 2000)
      return true
    } catch (payErr: any) {
      const msg = payErr?.errMsg || payErr?.message || ''
      if (msg.includes('cancel')) {
        uni.showToast({ title: '已取消支付', icon: 'none' })
      } else {
        uni.showToast({ title: '支付失败', icon: 'none' })
      }
      return false
    }
  } catch (e) {
    uni.showToast({ title: '支付异常，请重试', icon: 'none' })
    return false
  }
}

// 确认订单（查询订单状态，兜底发货）
async function confirmOrder(outTradeNo: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await api.request('pay', 'query_order', { out_trade_no: outTradeNo }, 'POST')
      if (res.code === 1 && res.data?.status >= 2) {
        return // 已发货
      }
    } catch {}
    // 等2秒重试
    await new Promise(r => setTimeout(r, 2000))
  }
}

// 使用免费次数
export async function useFree(): Promise<boolean> {
  const res = await api.request('pay', 'use_free', {}, 'POST')
  return res.code === 1
}

// 消费代币
export async function consumeCoins(amount: number, description: string): Promise<{ success: boolean; balance: number }> {
  const res = await api.request('pay', 'consume', { amount, description }, 'POST')
  if (res.code === 1) {
    return { success: true, balance: res.data.balance }
  }
  return { success: false, balance: 0 }
}

// 获取交易记录
export async function getTransactions(page = 1, limit = 20) {
  return api.request('pay', 'transactions', { page, limit })
}

// 签到状态接口
export interface SignInStatus {
  is_signed: boolean
  streak: number
  coins_per_day: number
  week_days: Array<{ date: string; day: string; signed: boolean }>
}

// 获取签到状态
export async function getSignInStatus(): Promise<SignInStatus> {
  const res = await api.request('pay', 'sign_status')
  if (res.code === 1) {
    return res.data
  }
  return { is_signed: false, streak: 1, coins_per_day: 3, week_days: [] }
}

// 执行签到
export async function signIn(): Promise<{ success: boolean; coins: number; streak: number; balance: number }> {
  const res = await api.request('pay', 'sign_in', {}, 'POST')
  if (res.code === 1) {
    return { success: true, ...res.data }
  }
  uni.showToast({ title: res.msg || '签到失败', icon: 'none' })
  return { success: false, coins: 0, streak: 0, balance: 0 }
}

export default {
  checkIosVersion,
  getBalance,
  getProducts,
  createOrderAndPay,
  useFree,
  consumeCoins,
  getTransactions,
  getSignInStatus,
  signIn,
  PAY_CONFIG
}
