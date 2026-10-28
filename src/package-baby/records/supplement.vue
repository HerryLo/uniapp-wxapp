<template>
  <RecordPage
    kind="supplement"
    emoji="🌿"
    title="补剂"
    empty-text="今天还没有补剂记录，点“添加”记一笔吧 🐣"
    :show-switch="false"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">补剂次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value is-text">{{ latestName(list) }}</text>
          <text class="record-stat-label">最近补剂</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../components/records/RecordPage.vue'
import { useBabyShare } from '../../utils/share.js'

useBabyShare('宝宝补剂记录', '/package-baby/records/supplement')

function latestName(list) {
  return list.length ? list[0].name : '暂无'
}
</script>
