<template>
  <view class="panel">
    <view class="panel-title">JSON 格式化</view>
    <view class="panel-desc">格式化、压缩与校验，支持不超过 100,000 字符的内容</view>

    <view class="card">
      <view class="label">输入</view>
      <textarea class="textarea" v-model="input" maxlength="-1" placeholder="粘贴 JSON 内容" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="run('format')">格式化</view>
        <view class="btn btn-ghost" @click="run('minify')">压缩</view>
      </view>
      <view class="btn-row">
        <view class="btn btn-ghost" @click="run('validate')">校验</view>
      </view>

      <view v-if="error" class="error">{{ error }}</view>
      <view v-else-if="message" class="empty-tip">{{ message }}</view>

      <view class="label">结果</view>
      <textarea class="textarea" :value="result" disabled placeholder="结果显示在这里" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="clearAll">清空</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { formatJson, minifyJson, validateJson } from '../../utils/json.js'
import { copyText } from '../../utils/clipboard.js'

const LIMIT = 100000
const input = ref('')
const result = ref('')
const error = ref('')
const message = ref('')

function run(action) {
  error.value = ''
  message.value = ''
  if (input.value.length > LIMIT) {
    result.value = ''
    error.value = '输入过长（上限 100,000 字符）'
    return
  }
  if (action === 'validate') {
    result.value = ''
    const checked = validateJson(input.value)
    if (checked.error) error.value = checked.error
    else message.value = 'JSON 格式正确'
    return
  }
  const output = action === 'format' ? formatJson(input.value) : minifyJson(input.value)
  if (output.error) {
    result.value = ''
    error.value = output.error
    return
  }
  result.value = output.text
}

function copyResult() {
  if (!result.value) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  copyText(result.value)
}

function clearAll() {
  input.value = ''
  result.value = ''
  error.value = ''
  message.value = ''
}
</script>
