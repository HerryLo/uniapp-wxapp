<template>
  <RecordPage
    kind="food"
    emoji="🍚"
    title="辅食"
    empty-text="今天还没有辅食记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">辅食次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value">{{ abnormalCount(list) }}</text>
          <text class="record-stat-label">异常反应</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'

function abnormalCount(list) {
  return list.filter((item) => item.reaction === '异常').length
}
</script>
