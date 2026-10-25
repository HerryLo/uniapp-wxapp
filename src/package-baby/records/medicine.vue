<template>
  <RecordPage
    kind="medicine"
    emoji="💊"
    title="用药"
    empty-text="今天还没有用药记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">用药次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value is-text">{{ latestName(list) }}</text>
          <text class="record-stat-label">最近药品</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'

function latestName(list) {
  return list.length ? list[0].name : '暂无'
}
</script>
