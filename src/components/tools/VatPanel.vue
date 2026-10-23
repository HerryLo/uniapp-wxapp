<template>
  <view class="panel">
    <view class="panel-title">增值税计算</view>
    <view class="panel-desc">输入金额并选择税率，自动换算含税与不含税金额</view>

    <view class="card">
      <view class="chip-row">
        <view class="chip" :class="{ active: mode === 'excluded' }" @click="mode = 'excluded'">不含税 → 含税</view>
        <view class="chip" :class="{ active: mode === 'included' }" @click="mode = 'included'">含税 → 不含税</view>
      </view>

      <view class="label">{{ mode === 'excluded' ? '不含税金额' : '含税金额' }}</view>
      <input class="input" type="digit" v-model="amount" placeholder="请输入金额" />

      <view class="label">税率</view>
      <view class="chip-row">
        <view
          v-for="rateItem in RATE_PRESETS"
          :key="rateItem"
          class="chip"
          :class="{ active: rateMode === 'preset' && rate === rateItem }"
          @click="pickPreset(rateItem)"
        >{{ rateItem }}%</view>
        <view class="chip" :class="{ active: rateMode === 'custom' }" @click="rateMode = 'custom'">自定义</view>
      </view>
      <input
        v-if="rateMode === 'custom'"
        class="input"
        type="digit"
        v-model="customRate"
        placeholder="请输入税率（0–100）"
      />

      <view v-if="state.error" class="error">{{ state.error }}</view>
      <view v-else-if="state.empty" class="empty-tip">输入金额后自动计算</view>
      <view v-else class="result-box">
        <view class="result-row">
          <text class="result-label">不含税金额</text>
          <text class="result-value">{{ state.net }}</text>
        </view>
        <view class="result-row">
          <text class="result-label">税额</text>
          <text class="result-value">{{ state.tax }}</text>
        </view>
        <view class="result-row">
          <text class="result-label">价税合计</text>
          <text class="result-value">{{ state.gross }}</text>
        </view>
      </view>

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="reset">清空</view>
      </view>
    </view>

    <view class="disclaimer">计算结果仅供参考，不构成税务建议</view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  RATE_PRESETS,
  validateAmount,
  validateRate,
  calcVat,
  formatCents,
  formatVatText,
} from '../../utils/vat.js'
import { readStorage, writeStorage } from '../../utils/storage.js'

const PREFS_KEY = 'tools.vat.prefs'
const amount = ref('')
const mode = ref('excluded')
const rate = ref(13)
const rateMode = ref('preset')
const customRate = ref('')

const state = computed(() => {
  if (!amount.value.trim()) return { empty: true }
  const amountCheck = validateAmount(amount.value)
  if (amountCheck.error) return { error: amountCheck.error }
  let bp
  if (rateMode.value === 'custom') {
    if (!customRate.value.trim()) return { error: '请输入税率' }
    const rateCheck = validateRate(customRate.value)
    if (rateCheck.error) return { error: rateCheck.error }
    bp = rateCheck.bp
  } else {
    bp = rate.value * 100
  }
  const result = calcVat(amountCheck.cents, bp, mode.value)
  return {
    net: formatCents(result.netCents),
    tax: formatCents(result.taxCents),
    gross: formatCents(result.grossCents),
  }
})

function pickPreset(value) {
  rateMode.value = 'preset'
  rate.value = value
}

function copyResult() {
  if (state.value.empty || state.value.error) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: formatVatText({
      net: state.value.net,
      tax: state.value.tax,
      gross: state.value.gross,
    }),
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

function reset() {
  amount.value = ''
}

onMounted(() => {
  const prefs = readStorage(PREFS_KEY, null)
  if (!prefs) return
  if (prefs.mode === 'included' || prefs.mode === 'excluded') mode.value = prefs.mode
  if (typeof prefs.rate === 'number' && RATE_PRESETS.includes(prefs.rate)) rate.value = prefs.rate
  if (prefs.rateMode === 'custom') rateMode.value = 'custom'
  if (typeof prefs.customRate === 'string') customRate.value = prefs.customRate
})

watch([mode, rate, rateMode, customRate], () => {
  writeStorage(PREFS_KEY, {
    mode: mode.value,
    rate: rate.value,
    rateMode: rateMode.value,
    customRate: customRate.value,
  })
})
</script>
