<template>
  <view class="baby-sidebar" :class="{ collapsed }">
    <view class="sidebar-list">
      <view
        v-for="item in SIDEBAR_ITEMS"
        :key="item.key"
        class="sidebar-item"
        :class="{ active: item.key === active }"
        @click="go(item)"
      >
        <text v-if="collapsed" class="sidebar-emoji">{{ item.emoji }}</text>
        <text v-else class="sidebar-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="sidebar-toggle" @click="$emit('toggle')">
      <text class="sidebar-toggle-text">{{ collapsed ? '›' : '‹' }}</text>
      <text v-if="!collapsed" class="sidebar-toggle-label">收起</text>
    </view>
  </view>
</template>

<script setup>
import { SIDEBAR_ITEMS } from '../../utils/baby/sidebar.js'

const props = defineProps({
  active: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
})

defineEmits(['toggle'])

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
</script>

<style scoped>
.baby-sidebar {
  position: fixed;
  top: var(--window-top, 0);
  bottom: var(--window-bottom, 0);
  left: 0;
  z-index: 220;
  width: 160rpx;
  display: flex;
  flex-direction: column;
  padding: 16rpx 12rpx calc(16rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-right: 1rpx solid var(--border);
  transition: width 0.2s ease;
}
.baby-sidebar.collapsed {
  width: 64rpx;
  padding-left: 8rpx;
  padding-right: 8rpx;
}
.sidebar-list {
  flex: 1;
  overflow-y: auto;
}
.sidebar-item {
  display: flex;
  align-items: center;
  height: 80rpx;
  margin-bottom: 8rpx;
  padding: 0 16rpx;
  border-radius: 20rpx;
  color: var(--text-secondary);
}
.baby-sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: 0;
}
.sidebar-item.active {
  background: var(--primary-soft);
  color: var(--primary-strong);
  font-weight: 600;
  box-shadow: inset 6rpx 0 0 var(--primary-strong);
}
.sidebar-emoji {
  font-size: 30rpx;
}
.sidebar-label {
  font-size: 24rpx;
}
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid var(--border);
  color: var(--text-secondary);
}
.sidebar-toggle-text {
  font-size: 30rpx;
}
.sidebar-toggle-label {
  margin-left: 8rpx;
  font-size: 22rpx;
}
</style>
