<template>
  <view>
    <view v-if="!collapsed" class="baby-sidebar">
      <view class="sidebar-list">
        <view
          v-for="item in SIDEBAR_ITEMS"
          :key="item.key"
          class="sidebar-item"
          :class="{ active: item.key === active }"
          @click="go(item)"
        >
          <text class="sidebar-icon">{{ item.icon }}</text>
        <text class="sidebar-label">{{ item.label }}</text>
        </view>
      </view>

      <view class="sidebar-toggle" @click="$emit('toggle')">
        <text class="sidebar-toggle-text">«</text>
        <text class="sidebar-toggle-label">收起</text>
      </view>
    </view>

    <view
      v-else
      class="sidebar-float"
      :style="{ left: `${floatLeft}px`, top: `${floatTop}px` }"
      @click="onClick"
      @touchstart="onTouchStart"
      @touchmove.stop.prevent="onTouchMove"
      @touchend="onTouchEnd"
    >
      <text class="sidebar-float-icon">☰</text>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  SIDEBAR_ITEMS,
  loadSidebarPosition,
  saveSidebarPosition,
} from '../../utils/baby/sidebar.js'

const props = defineProps({
  active: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])

const floatLeft = ref(16)
const floatTop = ref(120)
const windowWidth = ref(375)
const windowHeight = ref(667)

let startX = 0
let startY = 0
let originLeft = 0
let originTop = 0
let moved = false

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function clampPosition() {
  floatLeft.value = clamp(floatLeft.value, 8, windowWidth.value - 56)
  floatTop.value = clamp(floatTop.value, 8, windowHeight.value - 56)
}

onMounted(() => {
  const info = uni.getSystemInfoSync()
  windowWidth.value = info.windowWidth || 375
  windowHeight.value = info.windowHeight || 667
  const saved = loadSidebarPosition()
  floatLeft.value = saved ? saved.left : 16
  floatTop.value = saved ? saved.top : windowHeight.value - 120
  clampPosition()
})

function isSubpackagePage() {
  if (typeof getCurrentPages !== 'function') return false
  const pages = getCurrentPages()
  const current = pages && pages[pages.length - 1]
  return !!(
    current &&
    typeof current.route === 'string' &&
    current.route.startsWith('package-baby/')
  )
}

function go(item) {
  if (item.key === props.active) return
  if (item.key === 'home') {
    uni.switchTab({ url: item.url })
    return
  }
  if (isSubpackagePage()) {
    uni.redirectTo({ url: item.url })
    return
  }
  uni.navigateTo({ url: item.url })
}

function onTouchStart(event) {
  const touch = event.touches && event.touches[0]
  if (!touch) return
  startX = touch.clientX
  startY = touch.clientY
  originLeft = floatLeft.value
  originTop = floatTop.value
  moved = false
}

function onTouchMove(event) {
  const touch = event.touches && event.touches[0]
  if (!touch) return
  const deltaX = touch.clientX - startX
  const deltaY = touch.clientY - startY
  if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) moved = true
  floatLeft.value = originLeft + deltaX
  floatTop.value = originTop + deltaY
  clampPosition()
}

function onTouchEnd() {
  if (moved) saveSidebarPosition(floatLeft.value, floatTop.value)
}

function onClick() {
  if (moved) {
    moved = false
    return
  }
  emit('toggle')
}
</script>

<style scoped>
.baby-sidebar {
  position: fixed;
  top: var(--window-top, 0);
  bottom: var(--window-bottom, 0);
  left: 0;
  z-index: 220;
  width: 120rpx;
  min-height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
  display: flex;
  flex-direction: column;
  padding: 16rpx 12rpx calc(8rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #FFE4E1 0%, #FFF3F5 60%, #FFF9F5 100%);
  border-right: 2rpx solid #FFD6DE;
  box-shadow: 8rpx 0 28rpx rgba(255, 143, 163, 0.12);
}
.sidebar-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-bottom: 8rpx;
}
.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  margin-bottom: 6rpx;
  padding: 8rpx 4rpx;
  border-radius: 20rpx;
  color: var(--text-secondary);
  text-align: center;
}
.sidebar-item.active {
  background: #FFFFFF;
  color: var(--primary-strong);
  font-weight: 600;
  box-shadow: inset 6rpx 0 0 var(--primary-strong);
}
.sidebar-icon {
  font-size: 40rpx;
  line-height: 1;
}
.sidebar-label {
  width: 100%;
  margin-top: 4rpx;
  font-size: 20rpx;
  line-height: 1.2;
  text-align: center;
}
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid var(--border);
  color: var(--primary-strong);
}
.sidebar-toggle-text {
  font-size: 32rpx;
  font-weight: 600;
}
.sidebar-toggle-label {
  margin-left: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.sidebar-float {
  position: fixed;
  z-index: 240;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-strong);
  color: #FFFFFF;
  box-shadow: 0 6rpx 20rpx rgba(232, 111, 135, 0.35);
}
.sidebar-float-icon {
  font-size: 26px;
  line-height: 1;
}
</style>
