<template>
  <!-- #ifdef MP-WEIXIN -->
  <button class="share-btn" open-type="share">{{ displayLabel }}</button>
  <!-- #endif -->
  <!-- #ifdef H5 -->
  <button class="share-btn" @click="copyLink">{{ displayLabel }}</button>
  <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
})

const displayLabel = computed(() => props.label || '分享给朋友')

function copyLink() {
  // #ifdef H5
  uni.setClipboardData({
    data: window.location.href,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'none' })
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' })
    },
  })
  // #endif
}
</script>

<style scoped>
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 12rpx 28rpx;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 26rpx;
  line-height: 1.4;
  white-space: nowrap;
}
.share-btn::after {
  border: none;
}
</style>
