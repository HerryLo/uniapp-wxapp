<template>
  <BabyPage active="journal">
    <view class="journal-page">
      <view class="card form-card">
      <view class="card-title">🌟 成长里程碑</view>
      <view class="label">日期</view>
      <picker
        mode="date"
        :value="milestoneForm.date"
        @change="milestoneForm.date = $event.detail.value"
      >
        <view class="picker-field">
          <text>{{ milestoneForm.date }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="label">标题</view>
      <input
        class="input"
        v-model="milestoneForm.title"
        maxlength="40"
        placeholder="例如：第一次翻身"
      />
      <view class="label">备注（可选）</view>
      <textarea
        class="textarea"
        v-model="milestoneForm.note"
        maxlength="200"
        placeholder="记录当时的情景"
      />
      <view v-if="milestoneError" class="error">{{ milestoneError }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="saveMilestone">添加里程碑</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">📖 里程碑时间线</view>
      <view v-if="!milestones.length" class="empty-tip">还没有里程碑记录 🌱</view>
      <view
        v-for="item in milestones"
        :key="item.id"
        class="timeline-item"
        @click="openMilestoneEdit(item)"
      >
        <view class="timeline-date">{{ item.date }}</view>
        <view class="timeline-title">{{ item.title }}</view>
        <view v-if="item.note" class="timeline-note">{{ shortText(item.note) }}</view>
        <text class="timeline-delete" @click.stop="removeMilestoneItem(item.id)">删除</text>
      </view>
    </view>

    <view class="card">
      <view class="ref-toggle" @click="refOpen = !refOpen">
        <text>参考里程碑</text>
        <text class="ref-arrow">{{ refOpen ? '收起' : '展开' }}</text>
      </view>
      <view v-if="refOpen" class="ref-body">
        <view
          v-for="item in REFERENCE_MILESTONES"
          :key="`${item.month}-${item.text}`"
          class="ref-item"
        >
          <text class="ref-month">{{ formatMonthAge(item.month) }}</text>
          <text class="ref-text">{{ item.text }}</text>
        </view>
        <view class="ref-note">{{ REFERENCE_MILESTONE_NOTE }}</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">💭 今天的心情</view>
      <view class="mood-row">
        <view
          v-for="mood in MOODS"
          :key="mood.key"
          class="mood-item"
          :class="{ active: moods[today] === mood.key }"
          @click="chooseMood(mood.key)"
        >
          <text class="mood-emoji">{{ mood.emoji }}</text>
          <text class="mood-label">{{ mood.label }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">✏️ 育儿心得</view>
      <view class="label">日期</view>
      <picker mode="date" :value="noteForm.date" @change="noteForm.date = $event.detail.value">
        <view class="picker-field">
          <text>{{ noteForm.date }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="label">内容</view>
      <textarea
        class="textarea"
        v-model="noteForm.content"
        maxlength="500"
        placeholder="记录今天的心得或想对宝宝说的话"
      />
      <view v-if="noteError" class="error">{{ noteError }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="saveNote">添加心得</view>
      </view>
      <view v-if="!notes.length" class="empty-tip">还没有心得记录 🌱</view>
      <view v-for="item in notes" :key="item.id" class="note-item" @click="openNoteEdit(item)">
        <view class="note-head">
          <text class="note-date">{{ item.date }}</text>
          <text class="note-delete" @click.stop="removeNoteItem(item.id)">删除</text>
        </view>
        <view class="note-content">{{ shortText(item.content) }}</view>
      </view>
    </view>

    <EditSheet
      :visible="milestoneEdit.visible"
      title="编辑里程碑"
      @close="closeMilestoneEdit"
      @save="saveMilestoneEdit"
    >
      <view class="label">日期</view>
      <view class="readonly-field">{{ milestoneEdit.date }}</view>
      <view class="label">标题</view>
      <input class="input" v-model="milestoneEdit.title" maxlength="40" />
      <view class="label">备注（可选）</view>
      <textarea class="textarea" v-model="milestoneEdit.note" maxlength="200" />
      <view v-if="milestoneEdit.error" class="error">{{ milestoneEdit.error }}</view>
    </EditSheet>

    <EditSheet
      :visible="noteEdit.visible"
      title="编辑心得"
      @close="closeNoteEdit"
      @save="saveNoteEdit"
    >
      <view class="label">日期</view>
      <view class="readonly-field">{{ noteEdit.date }}</view>
      <view class="label">内容</view>
      <textarea class="textarea" v-model="noteEdit.content" maxlength="500" />
      <view v-if="noteEdit.error" class="error">{{ noteEdit.error }}</view>
    </EditSheet>

    </view>
  </BabyPage>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../components/baby/BabyPage.vue'
import EditSheet from '../components/EditSheet.vue'
import {
  REFERENCE_MILESTONES,
  REFERENCE_MILESTONE_NOTE,
} from '../data/referenceMilestones.js'
import { formatMonthAge, todayKey } from '../../utils/baby/date.js'
import {
  MOODS,
  addMilestone,
  addNote,
  loadMilestones,
  loadMoods,
  loadNotes,
  removeMilestone,
  removeNote,
  setMood,
  updateMilestone,
  updateNote,
} from '../utils/journal.js'
import { useBabyShare } from '../../utils/share.js'

useBabyShare('宝宝成长手记', '/package-baby/journal/index')

const today = ref(todayKey())
const milestones = ref([])
const moods = ref({})
const notes = ref([])
const refOpen = ref(false)
const milestoneError = ref('')
const noteError = ref('')
const milestoneForm = ref({ date: todayKey(), title: '', note: '' })
const noteForm = ref({ date: todayKey(), content: '' })
const milestoneEdit = ref({
  visible: false,
  id: '',
  date: '',
  title: '',
  note: '',
  error: '',
})
const noteEdit = ref({ visible: false, id: '', date: '', content: '', error: '' })

function refresh() {
  today.value = todayKey()
  milestones.value = loadMilestones()
  moods.value = loadMoods()
  notes.value = loadNotes()
}

function saveMilestone() {
  const res = addMilestone(milestoneForm.value)
  if (!res.ok) {
    milestoneError.value = res.error
    return
  }
  milestones.value = res.list
  milestoneError.value = ''
  milestoneForm.value = { date: todayKey(), title: '', note: '' }
}

function removeMilestoneItem(id) {
  uni.showModal({
    title: '删除里程碑',
    content: '删除后不可恢复，确定删除吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeMilestone(id)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      milestones.value = result.list
    },
  })
}

function chooseMood(key) {
  const res = setMood(today.value, key)
  if (!res.ok) {
    uni.showToast({ title: res.error, icon: 'none' })
    return
  }
  moods.value = res.moods
}

function saveNote() {
  const res = addNote(noteForm.value)
  if (!res.ok) {
    noteError.value = res.error
    return
  }
  notes.value = res.list
  noteError.value = ''
  noteForm.value = { date: todayKey(), content: '' }
}

function removeNoteItem(id) {
  uni.showModal({
    title: '删除心得',
    content: '删除后不可恢复，确定删除吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeNote(id)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      notes.value = result.list
    },
  })
}

function shortText(text, max = 30) {
  const value = String(text || '')
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function openMilestoneEdit(item) {
  milestoneEdit.value = {
    visible: true,
    id: item.id,
    date: item.date,
    title: item.title,
    note: item.note,
    error: '',
  }
}

function closeMilestoneEdit() {
  milestoneEdit.value = { ...milestoneEdit.value, visible: false, error: '' }
}

function saveMilestoneEdit() {
  const { id, title, note } = milestoneEdit.value
  const res = updateMilestone(id, { title, note })
  if (!res.ok) {
    milestoneEdit.value = { ...milestoneEdit.value, error: res.error }
    return
  }
  milestones.value = res.list
  closeMilestoneEdit()
}

function openNoteEdit(item) {
  noteEdit.value = {
    visible: true,
    id: item.id,
    date: item.date,
    content: item.content,
    error: '',
  }
}

function closeNoteEdit() {
  noteEdit.value = { ...noteEdit.value, visible: false, error: '' }
}

function saveNoteEdit() {
  const { id, content } = noteEdit.value
  const res = updateNote(id, { content })
  if (!res.ok) {
    noteEdit.value = { ...noteEdit.value, error: res.error }
    return
  }
  notes.value = res.list
  closeNoteEdit()
}

onShow(refresh)
</script>

<style scoped>
.journal-page {
  padding: 24rpx 32rpx 64rpx;
}
.form-card {
  margin-top: 0;
}
.timeline-item {
  position: relative;
  padding: 24rpx 0 24rpx 28rpx;
  border-left: 4rpx solid var(--primary-soft);
}
.timeline-item:active,
.note-item:active {
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
.timeline-date {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.timeline-title {
  margin-top: 6rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.timeline-note {
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.timeline-delete {
  display: inline-block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.ref-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.ref-arrow {
  font-size: 24rpx;
  font-weight: 400;
  color: var(--primary-strong);
}
.ref-body {
  margin-top: 20rpx;
}
.ref-item {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.ref-month {
  width: 150rpx;
  font-size: 24rpx;
  color: var(--primary-strong);
}
.ref-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text);
}
.ref-note {
  margin-top: 16rpx;
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
.mood-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
}
.mood-item {
  width: calc(20% - 8rpx);
  padding: 16rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  background: var(--cream);
}
.mood-item.active {
  background: var(--primary-soft);
  border-color: var(--primary-strong);
}
.mood-emoji {
  font-size: 40rpx;
}
.mood-label {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}
.note-item {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--border);
}
.note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.note-date {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.note-delete {
  font-size: 22rpx;
  color: var(--danger);
}
.note-content {
  margin-top: 10rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
}
</style>
