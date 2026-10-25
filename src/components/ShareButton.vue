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
  padding: 12rpx 32rpx;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  color: #FFFFFF;
  font-size: 26rpx;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 8rpx 20rpx rgba(232, 111, 135, 0.22);
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.share-btn::after {
  border: none;
}
.share-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}
</style>
