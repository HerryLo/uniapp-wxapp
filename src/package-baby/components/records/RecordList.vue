<template>
  <view class="record-list">
    <view v-if="!list.length" class="empty-tip">{{ emptyText }}</view>
    <view v-for="item in list" :key="item.id" class="record-item">
      <view class="record-body">
        <template v-if="kind === 'milk'">
          <view class="record-main">🍼 {{ item.time.slice(11) }} · {{ item.type }}</view>
          <view class="record-sub">
            {{ item.amount == null ? '奶量未记录' : `${item.amount} ml` }}
          </view>
        </template>
        <template v-else-if="kind === 'sleep'">
          <view class="record-main">😴 {{ item.start.slice(11) }} – {{ item.end.slice(11) }}</view>
          <view class="record-sub">
            {{ formatDuration(durationMinutes(item.start, item.end)) }}
          </view>
        </template>
        <template v-else-if="kind === 'diaper'">
          <view class="record-main">💧 {{ item.time.slice(11) }} · {{ item.type }}</view>
          <view class="record-sub">颜色：{{ item.color }}</view>
        </template>
        <template v-else-if="kind === 'food'">
          <view class="record-main">🍚 {{ item.time.slice(11) }} · {{ item.name }}</view>
          <view class="record-sub">{{ foodDetail(item) }}</view>
        </template>
        <template v-else>
          <view class="record-main">
            {{ kind === 'supplement' ? '🌿' : '💊' }} {{ item.time.slice(11) }} · {{ item.name }}
          </view>
          <view class="record-sub">
            {{ [item.amount, item.note].filter(Boolean).join(' · ') || '用量未记录' }}
          </view>
        </template>
      </view>
      <text class="record-delete" @click="$emit('remove', item.id)">删除</text>
    </view>
  </view>
</template>

<script setup>
import { durationMinutes, formatDuration } from '../../../utils/baby/date.js'

defineProps({
  kind: { type: String, required: true },
  list: { type: Array, default: () => [] },
  emptyText: { type: String, default: '今天还没有记录' },
})

defineEmits(['remove'])

function foodDetail(item) {
  const parts = []
  if (item.amount) parts.push(item.amount)
  parts.push(`反应：${item.reaction || '未记录'}`)
  if (item.note) parts.push(item.note)
  return parts.join(' · ')
}
</script>

<style scoped>
.record-list {
  margin-top: 8rpx;
}
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.record-item:last-child {
  border-bottom: none;
}
.record-main {
  font-size: 30rpx;
  color: var(--text);
}
.record-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.record-delete {
  padding-left: 24rpx;
  font-size: 24rpx;
  color: var(--danger);
}
</style>
