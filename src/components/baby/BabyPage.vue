<template>
  <view class="baby-shell">
    <view class="baby-content" :class="{ collapsed }">
      <slot />
    </view>
    <BabySidebar :active="active" :collapsed="collapsed" @toggle="toggle" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BabySidebar from './BabySidebar.vue'
import {
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from '../../utils/baby/sidebar.js'

defineProps({
  active: { type: String, default: '' },
})

const collapsed = ref(loadSidebarCollapsed())

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
