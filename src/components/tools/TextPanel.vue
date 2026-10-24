<template>
  <view class="panel">
    <view class="panel-title">文本处理</view>
    <view class="panel-desc">按行去重、大小写转换，所有处理仅在本机完成</view>

    <view class="card">
      <view class="label">原文</view>
      <textarea class="textarea" v-model="input" maxlength="-1" placeholder="粘贴或输入文本" />
      <view v-if="truncated" class="error">原文超过 100,000 字符，仅处理前 100,000 字符</view>
      <view class="stats">
        <text>行数 {{ inputStats.lines }}</text>
        <text>字符数 {{ inputStats.chars }}</text>
        <text>结果行数 {{ resultStats.lines }}</text>
      </view>

      <view class="switch-row">
        <text class="switch-label">去重时忽略大小写</text>
        <switch :checked="ignoreCase" color="#4361EE" @change="ignoreCase = $event.detail.value" />
      </view>
      <view class="switch-row">
        <text class="switch-label">去重时忽略首尾空白</text>
        <switch :checked="trimLines" color="#4361EE" @change="trimLines = $event.detail.value" />
      </view>

      <view class="chip-row">
        <view class="chip" @click="runDedupe">去重</view>
        <view class="chip" @click="runCase('upper')">全大写</view>
        <view class="chip" @click="runCase('lower')">全小写</view>
        <view class="chip" @click="runCase('title')">首字母大写</view>
      </view>

      <view class="label">结果</view>
      <textarea class="textarea" :value="result" disabled placeholder="处理结果将显示在这里" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="useResult">替换原文</view>
      </view>
      <view class="btn-row">
        <view class="btn btn-ghost" @click="clearAll">清空</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  dedupeLines,
  toUpperCaseText,
  toLowerCaseText,
  toTitleCaseText,
  countText,
} from '../../utils/text.js'
import { copyText } from '../../utils/clipboard.js'

const LIMIT = 100000
const input = ref('')
const result = ref('')
const ignoreCase = ref(false)
const trimLines = ref(false)

const truncated = computed(() => input.value.length > LIMIT)
const safeInput = computed(() => input.value.slice(0, LIMIT))
const inputStats = computed(() => countText(safeInput.value))
const resultStats = computed(() => countText(result.value))

function runDedupe() {
  result.value = dedupeLines(safeInput.value, {
    ignoreCase: ignoreCase.value,
    trim: trimLines.value,
  })
}

function runCase(type) {
  const text = safeInput.value
  if (type === 'upper') result.value = toUpperCaseText(text)
  else if (type === 'lower') result.value = toLowerCaseText(text)
  else result.value = toTitleCaseText(text)
}

function copyResult() {
  if (!result.value) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  copyText(result.value)
}

function useResult() {
  if (!result.value) return
  if (truncated.value) {
    uni.showModal({
      title: '替换原文',
      content: '原文超过 100,000 字符，替换将丢失超出部分，是否继续？',
      success: (res) => {
        if (!res.confirm) return
        input.value = result.value
        result.value = ''
      },
    })
    return
  }
  input.value = result.value
  result.value = ''
}

function clearAll() {
  input.value = ''
  result.value = ''
}
</script>
