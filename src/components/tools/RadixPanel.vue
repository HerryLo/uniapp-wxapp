<template>
  <view class="panel">
    <view class="panel-title">进制转换</view>
    <view class="panel-desc">支持 2–36 进制、负数与超大整数，暂不支持小数</view>

    <view class="card">
      <view class="label">数值</view>
      <input class="input" v-model="input" placeholder="请输入整数" />

      <view class="label">源进制</view>
      <picker mode="selector" :range="baseOptions" :value="baseIndex" @change="baseIndex = Number($event.detail.value)">
        <view class="picker-field">
          <text>{{ baseOptions[baseIndex] }} 进制</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>

      <view v-if="state.error" class="error">{{ state.error }}</view>
      <view v-else-if="state.empty" class="empty-tip">输入数值后自动转换</view>
      <view v-else class="result-box">
        <view v-for="row in rows" :key="row.label" class="result-row">
          <text class="result-label">{{ row.label }}</text>
          <view class="value-copy">
            <text class="result-value">{{ row.value }}</text>
            <text class="copy-link" @click="copyValue(row.value)">复制</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { convertRadix } from '../../utils/radix.js'
import { copyText } from '../../utils/clipboard.js'

const baseOptions = Array.from({ length: 35 }, (_, index) => String(index + 2))
const input = ref('')
const baseIndex = ref(8)

const state = computed(() => {
  if (!input.value.trim()) return { empty: true }
  return convertRadix(input.value, baseIndex.value + 2)
})

const rows = computed(() => {
  if (state.value.empty || state.value.error) return []
  return [
    { label: '二进制', value: state.value.bin },
    { label: '八进制', value: state.value.oct },
    { label: '十进制', value: state.value.dec },
    { label: '十六进制', value: state.value.hex },
  ]
})

function copyValue(value) {
  copyText(value)
}
</script>
