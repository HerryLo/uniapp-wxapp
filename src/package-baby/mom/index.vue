<template>
  <BabyPage active="mom">
    <view class="mom-page">
      <view class="card">
        <view class="card-title">👩 记录今日状态</view>
        <view class="label">日期</view>
        <picker mode="date" :value="form.date" @change="form.date = $event.detail.value">
          <view class="picker-field">
            <text>{{ form.date }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
        <view class="label">睡眠时长（小时，可选）</view>
        <input class="input" type="digit" v-model="form.sleepHours" placeholder="例如 6.5" />
        <view class="label">心情</view>
        <view class="chip-row">
          <view
            v-for="item in MOODS"
            :key="item.key"
            class="chip"
            :class="{ active: form.mood === item.key }"
            @click="form.mood = item.key"
          >{{ item.emoji }} {{ item.label }}</view>
        </view>
        <view class="label">身体状态（可选）</view>
        <input class="input" v-model="form.condition" maxlength="50" placeholder="例如 腰酸、恢复中" />
        <view class="label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="form.note"
          maxlength="200"
          placeholder="想记点什么"
        />
        <view v-if="error" class="error">{{ error }}</view>
        <view class="btn btn-primary save-btn" @click="save">
          {{ isEditing ? '更新记录' : '保存记录' }}
        </view>
      </view>

      <view class="card">
        <view class="card-title">📝 历史记录</view>
        <view v-if="!entries.length" class="empty-tip">还没有妈妈记录 🌱</view>
        <view
          v-for="item in entries"
          :key="item.date"
          class="entry-item"
          @click="openEntry(item)"
        >
          <view class="entry-main">
            <text class="entry-date">{{ item.date }}</text>
            <text class="entry-mood">{{ moodOf(item.mood) }}</text>
          </view>
          <view class="entry-meta">{{ detailOf(item) }}</view>
          <text class="entry-delete" @click.stop="remove(item.date)">删除</text>
        </view>
      </view>

      <EditSheet
        :visible="edit.visible"
        title="编辑妈妈记录"
        @close="closeEdit"
        @save="saveEdit"
      >
        <view class="label">日期</view>
        <view class="readonly-field">{{ edit.date }}</view>
        <view class="label">睡眠时长（小时，可选）</view>
        <input class="input" type="digit" v-model="edit.sleepHours" />
        <view class="label">心情</view>
        <view class="chip-row">
          <view
            v-for="item in MOODS"
            :key="item.key"
            class="chip"
            :class="{ active: edit.mood === item.key }"
            @click="edit.mood = item.key"
          >{{ item.emoji }} {{ item.label }}</view>
        </view>
        <view class="label">身体状态（可选）</view>
        <input class="input" v-model="edit.condition" maxlength="50" />
        <view class="label">备注（可选）</view>
        <textarea class="textarea" v-model="edit.note" maxlength="200" />
        <view v-if="edit.error" class="error">{{ edit.error }}</view>
      </EditSheet>
    </view>
  </BabyPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../components/baby/BabyPage.vue'
import EditSheet from '../components/EditSheet.vue'
import { todayKey } from '../../utils/baby/date.js'
import {
  MOODS,
  loadMomEntries,
  removeMomEntry,
  saveMomEntry,
} from '../utils/mom.js'
import { useBabyShare } from '../../utils/share.js'

useBabyShare('妈妈记录', '/package-baby/mom/index')

const entries = ref([])
const error = ref('')
const form = ref(emptyForm())
const edit = ref({
  visible: false,
  date: '',
  sleepHours: '',
  mood: 'calm',
  condition: '',
  note: '',
  error: '',
})

function emptyForm() {
  return { date: todayKey(), sleepHours: '', mood: 'calm', condition: '', note: '' }
}

const isEditing = computed(() =>
  entries.value.some((item) => item.date === form.value.date)
)

function moodOf(key) {
  const mood = MOODS.find((item) => item.key === key)
  return mood ? `${mood.emoji} ${mood.label}` : ''
}

function detailOf(item) {
  const parts = []
  if (item.sleepHours != null) parts.push(`睡眠 ${item.sleepHours} 小时`)
  if (item.condition) parts.push(item.condition)
  return parts.join(' · ') || '未填写其他状态'
}

function openEntry(item) {
  edit.value = {
    visible: true,
    date: item.date,
    sleepHours: item.sleepHours == null ? '' : String(item.sleepHours),
    mood: item.mood,
    condition: item.condition,
    note: item.note,
    error: '',
  }
}

function closeEdit() {
  edit.value = { ...edit.value, visible: false, error: '' }
}

function saveEdit() {
  const { date, sleepHours, mood, condition, note } = edit.value
  const res = saveMomEntry({ date, sleepHours, mood, condition, note })
  if (!res.ok) {
    edit.value = { ...edit.value, error: res.error }
    return
  }
  entries.value = res.entries
  closeEdit()
}

function refresh() {
  entries.value = loadMomEntries()
}

function save() {
  const res = saveMomEntry(form.value)
  if (!res.ok) {
    error.value = res.error
    return
  }
  error.value = ''
  entries.value = res.entries
  uni.showToast({ title: '已保存', icon: 'none' })
}

function remove(date) {
  uni.showModal({
    title: '删除妈妈记录',
    content: '删除后不可恢复，确定删除这一天的记录吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeMomEntry(date)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      entries.value = result.entries
      if (form.value.date === date) form.value = emptyForm()
    },
  })
}

onShow(refresh)
</script>

<style scoped>
.mom-page {
  padding: 24rpx 32rpx 64rpx;
}
.save-btn {
  width: 100%;
  margin-top: 32rpx;
}
.entry-item {
  position: relative;
  margin-top: 12rpx;
  padding: 20rpx;
  background: var(--cream);
  border-radius: 24rpx;
}
.entry-main {
  display: flex;
  align-items: center;
}
.entry-date {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text);
}
.entry-mood {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: var(--primary-strong);
}
.entry-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.entry-delete {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.entry-item:active {
  opacity: 0.7;
}
.readonly-field {
  height: 80rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 28rpx;
  font-size: 30rpx;
  color: var(--text-secondary);
}
</style>
