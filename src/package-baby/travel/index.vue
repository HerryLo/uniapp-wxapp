<template>
  <BabyPage active="travel">
    <view class="travel-page">
      <view class="card">
        <view class="card-title">✈️ 记录一次旅行</view>
        <view class="label">开始日期</view>
        <picker mode="date" :value="form.startDate" @change="form.startDate = $event.detail.value">
          <view class="picker-field">
            <text>{{ form.startDate }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
        <view class="label">结束日期</view>
        <picker mode="date" :value="form.endDate" @change="form.endDate = $event.detail.value">
          <view class="picker-field">
            <text>{{ form.endDate }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
        <view class="label">地点（手动输入）</view>
        <input class="input" v-model="form.place" maxlength="30" placeholder="例如 杭州" />
        <view class="label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="form.note"
          maxlength="200"
          placeholder="记录行程或想记住的事"
        />
        <view v-if="error" class="error">{{ error }}</view>
        <view class="btn btn-primary save-btn" @click="save">添加旅行</view>
      </view>

      <view class="card">
        <view class="card-title">🧳 旅行记录</view>
        <view v-if="!list.length" class="empty-tip">还没有旅行记录 🌱</view>
        <view v-for="item in list" :key="item.id" class="travel-item">
          <view class="travel-head">
            <text class="travel-date">{{ item.startDate }} – {{ item.endDate }}</text>
            <text class="travel-delete" @click="remove(item.id)">删除</text>
          </view>
          <view class="travel-place">{{ item.place }}</view>
          <view v-if="item.note" class="travel-note">{{ item.note }}</view>
        </view>
      </view>
    </view>
  </BabyPage>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../components/baby/BabyPage.vue'
import { todayKey } from '../../utils/baby/date.js'
import { addTravel, loadTravels, removeTravel } from '../utils/travel.js'

const list = ref([])
const error = ref('')
const form = ref(emptyForm())

function emptyForm() {
  const today = todayKey()
  return { startDate: today, endDate: today, place: '', note: '' }
}

function refresh() {
  list.value = loadTravels()
}

function save() {
  const res = addTravel(form.value)
  if (!res.ok) {
    error.value = res.error
    return
  }
  error.value = ''
  list.value = res.list
  form.value = emptyForm()
  uni.showToast({ title: '已添加', icon: 'none' })
}

function remove(id) {
  uni.showModal({
    title: '删除旅行记录',
    content: '删除后不可恢复，确定删除这条旅行记录吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeTravel(id)
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
.travel-page {
  padding: 24rpx 32rpx 64rpx;
}
.save-btn {
  width: 100%;
  margin-top: 32rpx;
}
.travel-item {
  margin-top: 12rpx;
  padding: 20rpx;
  background: var(--cream);
  border-radius: 24rpx;
}
.travel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.travel-date {
  font-size: 26rpx;
  color: var(--text-secondary);
}
.travel-delete {
  font-size: 22rpx;
  color: var(--danger);
}
.travel-place {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.travel-note {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
