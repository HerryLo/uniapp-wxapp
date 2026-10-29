<template>
  <view class="card">
    <view class="card-title">{{ heading }}</view>
    <view class="history-list">
      <view v-for="item in rows" :key="item.date" class="history-item">
        <view
          class="history-row"
          :class="{
            expandable: canExpand(item),
            empty: !item.info.hasData,
            open: expandedDate === item.date,
          }"
          @click="toggle(item)"
        >
          <text class="history-date">{{ item.date === today ? '今天' : item.date.slice(5) }}</text>
          <view class="history-text">{{ item.info.text }}</view>
          <text v-if="canExpand(item)" class="history-arrow">
            {{ expandedDate === item.date ? '▴' : '▾' }}
          </text>
        </view>
        <view v-if="canExpand(item) && expandedDate === item.date" class="history-detail">
          <RecordList :kind="kind" :list="sortedList(item)" readonly />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import RecordList from './RecordList.vue'
import { sortRecords, summarizeRecentDay } from '../../../utils/baby/records.js'

const props = defineProps({
  kind: { type: String, required: true },
  days: { type: Array, default: () => [] },
  today: { type: String, default: '' },
})

const HEADINGS = {
  milk: '🍼 最近 7 天奶量',
  sleep: '😴 最近 7 天睡眠',
  diaper: '💧 最近 7 天排便',
  food: '🍚 最近 7 天辅食',
  medicine: '💊 最近 7 天用药',
  supplement: '🌿 最近 7 天补剂',
}

const heading = computed(() => HEADINGS[props.kind] || '最近 7 天')
const expandedDate = ref('')

const rows = computed(() =>
  [...props.days]
    .reverse()
    .map((entry) => ({
      ...entry,
      info: summarizeRecentDay(props.kind, entry.day),
    }))
)

function canExpand(item) {
  return item.info.hasData && item.date !== props.today
}

function toggle(item) {
  if (!canExpand(item)) return
  expandedDate.value = expandedDate.value === item.date ? '' : item.date
}

function sortedList(item) {
  return sortRecords(item.day[props.kind] || [], props.kind)
}

function collapseIfMissing() {
  if (!expandedDate.value) return
  const target = props.days.find((entry) => entry.date === expandedDate.value)
  if (!target || !summarizeRecentDay(props.kind, target.day).hasData) {
    expandedDate.value = ''
  }
}

watch(() => props.days, collapseIfMissing)
watch(() => props.kind, () => {
  expandedDate.value = ''
})
</script>

<style scoped>
.history-list {
  margin-top: 8rpx;
}
.history-item {
  border-bottom: 1rpx solid var(--border);
}
.history-item:last-child {
  border-bottom: none;
}
.history-row {
  display: flex;
  align-items: center;
  min-height: 64rpx;
  padding: 20rpx 0;
}
.history-row.expandable:active {
  opacity: 0.7;
}
.history-date {
  width: 110rpx;
  font-size: 26rpx;
  color: var(--text);
}
.history-text {
  flex: 1;
  overflow: hidden;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--primary-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-row.empty .history-text {
  font-weight: 400;
  color: var(--text-secondary);
}
.history-arrow {
  width: 48rpx;
  text-align: right;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.history-detail {
  padding: 0 0 16rpx 110rpx;
}
</style>
