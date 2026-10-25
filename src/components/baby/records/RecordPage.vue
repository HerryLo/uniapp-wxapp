<template>
  <BabyPage :active="kind">
    <view class="record-page">
      <view class="record-switch">
        <view
          v-for="item in RECORD_SWITCH_ITEMS"
          :key="item.key"
          class="record-switch-item"
          :class="{ active: item.key === kind }"
          @click="switchKind(item)"
        >{{ item.label }}</view>
      </view>

      <view class="card">
        <view class="record-head">
          <text class="record-title">{{ emoji }} {{ title }}</text>
          <view class="add-btn" @click="openForm">+ 添加</view>
        </view>
        <slot name="stats" :summary="summary" :day="day" :list="list" :today="today" />
        <RecordList
          :kind="kind"
          :list="list"
          :empty-text="emptyText"
          @remove="remove"
        />
      </view>

      <slot name="extra" :refresh="refresh" />

      <RecordForm
        :visible="formOpen"
        :kind="kind"
        :date="today"
        :error="formError"
        @close="closeForm"
        @submit="submitForm"
      />
    </view>
  </BabyPage>
</template>

<script setup>
import { onMounted } from 'vue'
import BabyPage from '../../baby/BabyPage.vue'
import RecordForm from '../../baby/RecordForm.vue'
import RecordList from './RecordList.vue'
import { useDayRecords } from '../../../composables/useDayRecords.js'

const props = defineProps({
  kind: { type: String, required: true },
  emoji: { type: String, default: '' },
  title: { type: String, required: true },
  emptyText: { type: String, default: '今天还没有记录' },
})

const emit = defineEmits(['change'])

const RECORD_SWITCH_ITEMS = [
  { key: 'milk', label: '🍼 喝奶', url: '/package-baby/records/milk' },
  { key: 'sleep', label: '😴 睡眠', url: '/package-baby/records/sleep' },
  { key: 'diaper', label: '💧 排便', url: '/package-baby/records/diaper' },
  { key: 'food', label: '🍚 辅食', url: '/package-baby/records/food' },
]

function switchKind(item) {
  if (item.key === props.kind) return
  uni.redirectTo({ url: item.url })
}

const {
  today,
  day,
  list,
  summary,
  formOpen,
  formError,
  refresh,
  openForm,
  closeForm,
  submitForm,
  remove,
} = useDayRecords(props.kind, { onChange: () => emit('change') })

onMounted(refresh)
</script>

<style scoped>
.record-page {
  padding: 24rpx 32rpx 64rpx;
}
.record-switch {
  display: flex;
  padding: 8rpx;
  background: #FFF1F3;
  border-radius: 999rpx;
}
.record-switch-item {
  flex: 1;
  padding: 14rpx 0;
  text-align: center;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
  transition: background 0.12s ease, color 0.12s ease;
}
.record-switch-item.active {
  background: #FFFFFF;
  color: var(--primary-strong);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 143, 163, 0.18);
}
.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.record-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.add-btn {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  color: #FFFFFF;
  font-size: 26rpx;
  box-shadow: 0 6rpx 16rpx rgba(232, 111, 135, 0.22);
}
</style>
