<template>
  <view v-if="visible && record" class="detail-mask" @click="$emit('close')">
    <view class="detail-sheet" @click.stop>
      <view class="detail-head">
        <text class="detail-title">💧 排便详情</text>
        <text class="detail-close" @click="$emit('close')">✕</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">时间</text>
        <text class="detail-value">{{ record.time }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">类型</text>
        <text class="detail-value">{{ record.type }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">颜色</text>
        <text class="detail-value">{{ record.color }}</text>
      </view>
      <view v-if="record.shape" class="detail-row">
        <text class="detail-label">形状</text>
        <text class="detail-value">{{ record.shape }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">备注</text>
        <text class="detail-value note">{{ record.note || '无' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  record: { type: Object, default: null },
})

defineEmits(['close'])
</script>

<style scoped>
.detail-mask {
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
.detail-sheet {
  width: 100%;
  padding: 32rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 48rpx 48rpx 0 0;
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.detail-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.detail-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.detail-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  width: 120rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.detail-value {
  flex: 1;
  font-size: 28rpx;
  color: var(--text);
  word-break: break-all;
}
.detail-value.note {
  white-space: pre-wrap;
}
</style>
