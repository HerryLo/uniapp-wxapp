<template>
  <view v-if="visible" class="sheet-mask" @click="$emit('close')">
    <view class="sheet" @click.stop>
      <view class="sheet-head">
        <text class="sheet-title">{{ title }}</text>
        <text class="sheet-close" @click="$emit('close')">✕</text>
      </view>
      <view class="sheet-body">
        <slot />
      </view>
      <view class="sheet-footer">
        <view class="btn btn-primary sheet-save" @click="$emit('save')">{{ saveText }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '编辑' },
  saveText: { type: String, default: '保存' },
})

defineEmits(['close', 'save'])
</script>

<style scoped>
.sheet-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(74, 74, 74, 0.45);
}
.sheet {
  width: 100%;
  max-height: 86vh;
  overflow-y: auto;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 48rpx 48rpx 0 0;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.sheet-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.sheet-footer {
  margin-top: 32rpx;
}
.sheet-save {
  width: 100%;
}
</style>
