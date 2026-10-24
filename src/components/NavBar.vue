<template>
  <view class="nav-placeholder" :style="{ height: totalHeight + 'px' }"></view>
  <view class="nav-bar" :style="{ height: totalHeight + 'px', paddingTop: statusBarHeight + 'px' }">
    <view class="nav-inner" :style="{ height: navBarHeight + 'px' }">
      <text class="nav-title">{{ title }}</text>
      <view
        v-if="showToolMenu"
        class="nav-action"
        :style="{ right: rightOffset + 'px' }"
        @click="$emit('open-tools')"
      >
        <view class="grid-icon">
          <view class="grid-cell"></view>
          <view class="grid-cell"></view>
          <view class="grid-cell"></view>
          <view class="grid-cell"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  title: { type: String, default: '' },
  showToolMenu: { type: Boolean, default: false },
})
defineEmits(['open-tools'])

const metrics = (() => {
  const info = uni.getSystemInfoSync()
  let statusBarHeight = 0
  let navBarHeight = 44
  let rightOffset = 16
  // #ifdef MP-WEIXIN
  statusBarHeight = info.statusBarHeight || 0
  try {
    const menu = wx.getMenuButtonBoundingClientRect()
    navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height
    rightOffset = info.windowWidth - menu.left + 8
  } catch (e) {
    navBarHeight = 44
    rightOffset = 16
  }
  // #endif
  return { statusBarHeight, navBarHeight, rightOffset }
})()

const statusBarHeight = computed(() => metrics.statusBarHeight)
const navBarHeight = computed(() => metrics.navBarHeight)
const rightOffset = computed(() => metrics.rightOffset)
const totalHeight = computed(() => metrics.statusBarHeight + metrics.navBarHeight)
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-sizing: border-box;
  background: var(--surface);
  border-bottom: 1rpx solid var(--border);
}

.nav-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text);
}

.nav-action {
  position: absolute;
  top: 50%;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
}

.grid-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-content: space-between;
}

.grid-cell {
  width: 15rpx;
  height: 15rpx;
  border-radius: 3rpx;
  background: var(--text);
}
</style>
