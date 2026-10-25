<template>
  <BabyPage active="growth">
    <view class="growth-page">
      <view class="card form-card">
      <view class="card-title">记录身高体重</view>
      <view class="label">测量日期</view>
      <picker mode="date" :value="form.date" @change="form.date = $event.detail.value">
        <view class="picker-field">
          <text>{{ form.date }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="form-row">
        <view class="form-col">
          <view class="label">身高（cm）</view>
          <input class="input" type="digit" v-model="form.height" placeholder="例如 72.5" />
        </view>
        <view class="form-col">
          <view class="label">体重（kg）</view>
          <input class="input" type="digit" v-model="form.weight" placeholder="例如 8.6" />
        </view>
      </view>
      <view v-if="error" class="error">{{ error }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="save">
          {{ isUpdate ? '更新记录' : '添加记录' }}
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">身高曲线（cm）</view>
      <LineChart v-if="heightPoints.length" :points="heightPoints" unit="cm" />
      <view v-else class="empty-tip">暂无数据</view>
    </view>

    <view class="card">
      <view class="card-title">体重曲线（kg）</view>
      <LineChart v-if="weightPoints.length" :points="weightPoints" unit="kg" />
      <view v-else class="empty-tip">暂无数据</view>
    </view>

    <view class="card">
      <view class="card-title">历史记录</view>
      <view v-if="!history.length" class="empty-tip">还没有生长记录</view>
      <view v-for="item in history" :key="item.id" class="history-item">
        <view>
          <view class="history-date">{{ item.date }}</view>
          <view class="history-value">{{ item.height }} cm · {{ item.weight }} kg</view>
        </view>
        <text class="history-delete" @click="remove(item.id)">删除</text>
      </view>
    </view>

      <Disclaimer text="生长数据仅记录用户输入，不提供发育评估。如对宝宝生长有疑问，请咨询儿科医生。" />
    </view>
  </BabyPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../components/baby/BabyPage.vue'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import LineChart from '../../components/baby/LineChart.vue'
import {
  chartPoints,
  loadGrowth,
  removeGrowth,
  upsertGrowth,
} from '../../utils/baby/growth.js'
import { todayKey } from '../../utils/baby/date.js'

const list = ref([])
const error = ref('')
const form = ref({ date: todayKey(), height: '', weight: '' })

const heightPoints = computed(() => chartPoints(list.value, 'height'))
const weightPoints = computed(() => chartPoints(list.value, 'weight'))
const history = computed(() =>
  [...list.value].sort((a, b) => b.date.localeCompare(a.date))
)
const isUpdate = computed(() =>
  list.value.some((item) => item.date === form.value.date)
)

function refresh() {
  list.value = loadGrowth()
}

function save() {
  const res = upsertGrowth(list.value, form.value)
  if (!res.ok) {
    error.value = res.error
    return
  }
  list.value = res.list
  error.value = ''
  form.value = { date: todayKey(), height: '', weight: '' }
  uni.showToast({ title: '已保存', icon: 'none' })
}

function remove(id) {
  uni.showModal({
    title: '删除生长记录',
    content: '删除后不可恢复，确定删除吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeGrowth(list.value, id)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      list.value = result.list
    },
  })
}

onShow(refresh)
</script>

<style scoped>
.growth-page {
  padding: 24rpx 32rpx 64rpx;
}
.form-card {
  margin-top: 0;
}
.form-row {
  display: flex;
  justify-content: space-between;
}
.form-col {
  width: 48%;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.history-item:last-child {
  border-bottom: none;
}
.history-date {
  font-size: 28rpx;
  color: var(--text);
}
.history-value {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.history-delete {
  padding-left: 24rpx;
  font-size: 24rpx;
  color: var(--danger);
}
</style>
