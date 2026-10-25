<template>
  <RecordPage
    kind="sleep"
    emoji="😴"
    title="睡眠"
    empty-text="今天还没有睡眠记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ summary, list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">睡眠次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value time">{{ formatDuration(summary.sleepMinutes) }}</text>
          <text class="record-stat-label">总时长</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'
import { formatDuration } from '../../utils/baby/date.js'
</script>

<style scoped>
.record-stat-value.time {
  font-size: 26rpx;
}
</style>
