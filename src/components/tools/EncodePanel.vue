<template>
  <view class="panel">
    <view class="panel-title">Base64 / URL 编码</view>
    <view class="panel-desc">支持中文内容，编解码仅在本机完成</view>

    <view class="card">
      <view class="chip-row">
        <view class="chip" :class="{ active: mode === 'base64' }" @click="switchMode('base64')">Base64</view>
        <view class="chip" :class="{ active: mode === 'url' }" @click="switchMode('url')">URL</view>
      </view>

      <view class="label">输入</view>
      <textarea class="textarea" v-model="input" maxlength="-1" placeholder="请输入要处理的内容" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="run('encode')">编码</view>
        <view class="btn btn-ghost" @click="run('decode')">解码</view>
      </view>

      <view class="label">结果</view>
      <textarea class="textarea" :value="result" disabled placeholder="结果显示在这里" />

      <view v-if="error" class="error">{{ error }}</view>

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="clearAll">清空</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { base64Encode, base64Decode, urlEncode, urlDecode } from '../../utils/encode.js'

const mode = ref('base64')
const input = ref('')
const result = ref('')
const error = ref('')

function switchMode(next) {
  mode.value = next
  result.value = ''
  error.value = ''
}

function run(action) {
  error.value = ''
  if (!input.value) {
    result.value = ''
    error.value = '请输入内容'
    return
  }
  if (action === 'encode') {
    result.value = mode.value === 'base64' ? base64Encode(input.value) : urlEncode(input.value)
    return
  }
  const decoded = mode.value === 'base64' ? base64Decode(input.value) : urlDecode(input.value)
  if (decoded.error) {
    result.value = ''
    error.value = decoded.error
    return
  }
  result.value = decoded.text
}

function copyResult() {
  if (!result.value) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: result.value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

function clearAll() {
  input.value = ''
  result.value = ''
  error.value = ''
}
</script>
