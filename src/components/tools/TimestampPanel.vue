<template>
  <view class="panel">
    <view class="panel-title">时间戳转换</view>
    <view class="panel-desc">时间戳与日期时间双向转换，使用本机时区</view>

    <view class="card">
      <view class="chip-row">
        <view class="chip" :class="{ active: mode === 'toDate' }" @click="mode = 'toDate'">时间戳 → 日期时间</view>
        <view class="chip" :class="{ active: mode === 'toTs' }" @click="mode = 'toTs'">日期时间 → 时间戳</view>
      </view>

      <template v-if="mode === 'toDate'">
        <view class="label">时间戳</view>
        <input class="input" type="number" v-model="tsInput" placeholder="请输入时间戳" />

        <view class="label">单位</view>
        <view class="chip-row">
          <view class="chip" :class="{ active: unit === 's' }" @click="unit = 's'">秒</view>
          <view class="chip" :class="{ active: unit === 'ms' }" @click="unit = 'ms'">毫秒</view>
        </view>

        <view class="chip-row">
          <view class="chip" @click="fillNow">使用当前时间</view>
        </view>

        <view v-if="dateState.error" class="error">{{ dateState.error }}</view>
        <view v-else-if="dateState.empty" class="empty-tip">输入时间戳后自动转换</view>
        <view v-else class="result-box">
          <view class="result-row">
            <text class="result-label">本地时间</text>
            <view class="value-copy">
              <text class="result-value">{{ dateState.local }}</text>
              <text class="copy-link" @click="copyValue(dateState.local)">复制</text>
            </view>
          </view>
          <view class="result-row">
            <text class="result-label">UTC</text>
            <view class="value-copy">
              <text class="result-value">{{ dateState.utc }}</text>
              <text class="copy-link" @click="copyValue(dateState.utc)">复制</text>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="label">日期</view>
        <picker mode="date" :value="dateValue" @change="dateValue = $event.detail.value">
          <view class="picker-field">
            <text>{{ dateValue }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>

        <view class="label">时间</view>
        <picker mode="time" :value="timeValue" @change="timeValue = $event.detail.value">
          <view class="picker-field">
            <text>{{ timeValue }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>

        <view class="chip-row">
          <view class="chip" @click="fillNow">使用当前时间</view>
        </view>

        <view v-if="tsState.error" class="error">{{ tsState.error }}</view>
        <view v-else class="result-box">
          <view class="result-row">
            <text class="result-label">秒级时间戳</text>
            <view class="value-copy">
              <text class="result-value">{{ tsState.seconds }}</text>
              <text class="copy-link" @click="copyValue(tsState.seconds)">复制</text>
            </view>
          </view>
          <view class="result-row">
            <text class="result-label">毫秒时间戳</text>
            <view class="value-copy">
              <text class="result-value">{{ tsState.milliseconds }}</text>
              <text class="copy-link" @click="copyValue(tsState.milliseconds)">复制</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  timestampToDate,
  dateToTimestamp,
  nowTimestamp,
  formatDateValue,
  formatTimeValue,
} from '../../utils/timestamp.js'
import { copyText } from '../../utils/clipboard.js'

const mode = ref('toDate')
const unit = ref('s')
const tsInput = ref('')
const now = new Date()
const dateValue = ref(formatDateValue(now))
const timeValue = ref(formatTimeValue(now))

const dateState = computed(() => {
  if (!tsInput.value.trim()) return { empty: true }
  return timestampToDate(tsInput.value, unit.value)
})

const tsState = computed(() => dateToTimestamp(dateValue.value, timeValue.value))

function fillNow() {
  const current = new Date()
  if (mode.value === 'toDate') {
    tsInput.value = String(nowTimestamp(unit.value))
  } else {
    dateValue.value = formatDateValue(current)
    timeValue.value = formatTimeValue(current)
  }
}

function copyValue(value) {
  copyText(value)
}
</script>

<style scoped>
.result-row {
  align-items: flex-start;
}
</style>
