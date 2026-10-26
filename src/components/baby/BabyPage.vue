<template>
  <view class="baby-shell">
    <view class="baby-content" :class="{ collapsed }">
      <slot />
    </view>
    <BabySidebar :active="active" :collapsed="collapsed" @toggle="toggle" />
  </view>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BabySidebar from './BabySidebar.vue'
import {
  loadSidebarCollapsed,
  onSidebarCollapsedChange,
  saveSidebarCollapsed,
} from '../../utils/baby/sidebar.js'

defineProps({
  active: { type: String, default: '' },
})

const collapsed = ref(loadSidebarCollapsed())

// 主包标签页在切到分包页面时不会销毁，需订阅状态变化才能同步收起/展开
let unsubscribe = null

onMounted(() => {
  unsubscribe = onSidebarCollapsedChange((value) => {
    collapsed.value = value
  })
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})

function toggle() {
  collapsed.value = !collapsed.value
  saveSidebarCollapsed(collapsed.value)
}
</script>

<style scoped>
.baby-shell {
  min-height: 100vh;
}
.baby-content {
  margin-left: 120rpx;
  transition: margin-left 0.2s ease;
}
.baby-content.collapsed {
  margin-left: 0;
}
</style>
