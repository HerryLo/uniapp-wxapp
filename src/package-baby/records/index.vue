<template>
  <view class="records-page">
    <view class="kind-tabs">
      <view
        v-for="item in kinds"
        :key="item.key"
        class="kind-tab"
        :class="{ active: kind === item.key }"
        @click="kind = item.key"
      >{{ item.label }}</view>
    </view>

    <view class="stat-grid">
      <view class="stat-card">
        <text class="stat-value">{{ summary.milkCount }}</text>
        <text class="stat-label">喝奶次数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ (summary.sleepMinutes / 60).toFixed(1) }}</text>
        <text class="stat-label">睡眠小时</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ summary.diaperCount }}</text>
        <text class="stat-label">排便次数</text>
      </view>
    </view>

    <view class="card list-card">
      <view class="list-head">
        <text class="list-title">今天 · {{ currentLabel }}</text>
        <view class="add-btn" @click="openForm">+ 添加</view>
      </view>

      <view v-if="!list.length" class="empty-tip">今天还没有记录</view>

      <view v-for="item in list" :key="item.id" class="record-item">
        <view class="record-body">
          <template v-if="kind === 'milk'">
            <view class="record-main">{{ item.time.slice(11) }} · {{ item.type }}</view>
            <view class="record-sub">
              {{ item.amount == null ? '奶量未记录' : `${item.amount} ml` }}
            </view>
          </template>
          <template v-else-if="kind === 'sleep'">
            <view class="record-main">{{ item.start.slice(11) }} – {{ item.end.slice(11) }}</view>
            <view class="record-sub">
              {{ formatDuration(durationMinutes(item.start, item.end)) }}
            </view>
          </template>
          <template v-else>
            <view class="record-main">{{ item.time.slice(11) }} · {{ item.type }}</view>
            <view class="record-sub">颜色：{{ item.color }}</view>
          </template>
        </view>
        <text class="record-delete" @click="remove(item.id)">删除</text>
      </view>
    </view>

    <Disclaimer text="记录仅用于家庭照顾参考，不构成医疗建议。如宝宝出现异常症状，请及时就医。" />
    <AdBanner />

    <RecordForm
      :visible="formOpen"
      :kind="kind"
      :date="today"
      :error="formError"
      @close="closeForm"
      @submit="submitForm"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import RecordForm from '../../components/baby/RecordForm.vue'
import {
  addRecord,
  loadDay,
  removeRecord,
  summarizeDay,
  sortRecords,
} from '../../utils/baby/records.js'
import { durationMinutes, formatDuration, todayKey } from '../../utils/baby/date.js'

const kinds = [
  { key: 'milk', label: '喝奶' },
  { key: 'sleep', label: '睡眠' },
  { key: 'diaper', label: '排便' },
]

const today = ref(todayKey())
const day = ref(loadDay(today.value))
const kind = ref('milk')
const formOpen = ref(false)
const formError = ref('')

const summary = computed(() => summarizeDay(day.value))
const list = computed(() => sortRecords(day.value[kind.value] || [], kind.value))
const currentLabel = computed(
  () => kinds.find((item) => item.key === kind.value)?.label || ''
)

function refresh() {
  today.value = todayKey()
  day.value = loadDay(today.value)
}

function openForm() {
  formError.value = ''
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  formError.value = ''
}

function submitForm(payload) {
  const res = addRecord(kind.value, payload)
  if (!res.ok) {
    formError.value = res.error
    return
  }
  formOpen.value = false
  formError.value = ''
  refresh()
  uni.showToast({ title: '已记录', icon: 'none' })
}

function remove(id) {
  uni.showModal({
    title: '删除记录',
    content: '删除后不可恢复，确定删除这条记录吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeRecord(kind.value, id, today.value)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      refresh()
    },
  })
}

onLoad((options) => {
  if (options && kinds.some((item) => item.key === options.type)) {
    kind.value = options.type
    openForm()
  }
})

onShow(refresh)
</script>

<style scoped>
.records-page {
  padding: 24rpx 32rpx 64rpx;
}
.kind-tabs {
  display: flex;
  padding: 8rpx;
  background: #FFF1F3;
  border-radius: 24rpx;
}
.kind-tab {
  flex: 1;
  padding: 16rpx 0;
  text-align: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.kind-tab.active {
  background: #FFFFFF;
  color: var(--primary-strong);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 143, 163, 0.18);
}
.stat-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}
.stat-card {
  width: calc(33.33% - 10rpx);
  padding: 24rpx 8rpx;
  background: var(--surface);
  border-radius: 24rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.1);
}
.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--primary-strong);
}
.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.list-card {
  margin-top: 24rpx;
}
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.list-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.add-btn {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: var(--primary-strong);
  color: #FFFFFF;
  font-size: 26rpx;
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
.empty-tip {
  margin-top: 48rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-secondary);
}
</style>
