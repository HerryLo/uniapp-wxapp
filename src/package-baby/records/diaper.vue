<template>
  <RecordPage
    kind="diaper"
    emoji="💧"
    title="排便"
    empty-text="今天还没有排便记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">排便次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value is-text">{{ latestText(list) }}</text>
          <text class="record-stat-label">最近一次</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'

function latestText(list) {
  if (!list.length) return '暂无'
  return `${list[0].type} · ${list[0].color}`
}
</script>
