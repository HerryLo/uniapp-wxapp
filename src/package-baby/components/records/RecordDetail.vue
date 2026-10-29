<template>
  <view v-if="visible && record" class="detail-mask" @click="$emit('close')">
    <view class="detail-sheet" @click.stop>
      <view class="detail-head">
        <text class="detail-title">{{ title }}</text>
        <text class="detail-close" @click="$emit('close')">✕</text>
      </view>
      <view v-for="row in rows" :key="row.label" class="detail-row">
        <text class="detail-label">{{ row.label }}</text>
        <text class="detail-value" :class="{ note: row.label === '备注' }">
          {{ row.value }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  kind: { type: String, default: 'diaper' },
  record: { type: Object, default: null },
})

defineEmits(['close'])

const TITLES = {
  diaper: '💧 排便详情',
  food: '🍚 辅食详情',
  medicine: '💊 用药详情',
  supplement: '🌿 补剂详情',
}

const title = computed(() => TITLES[props.kind] || '记录详情')

const rows = computed(() => {
  const record = props.record
  if (!record) return []

  if (props.kind === 'diaper') {
    const list = [
      { label: '时间', value: record.time },
      { label: '类型', value: record.type },
      { label: '颜色', value: record.color },
    ]
    if (record.shape) list.push({ label: '形状', value: record.shape })
    list.push({ label: '备注', value: record.note || '无' })
    return list
  }

  if (props.kind === 'food') {
    return [
      { label: '时间', value: record.time },
      { label: '食物名称', value: record.name },
      { label: '份量', value: record.amount || '未记录' },
      { label: '进食反应', value: record.reaction || '未记录' },
      { label: '备注', value: record.note || '无' },
    ]
  }

  return [
    { label: '时间', value: record.time },
    { label: props.kind === 'medicine' ? '药品名称' : '补剂名称', value: record.name },
    { label: '用量', value: record.amount || '未记录' },
    { label: '备注', value: record.note || '无' },
  ]
})
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
  width: 150rpx;
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
