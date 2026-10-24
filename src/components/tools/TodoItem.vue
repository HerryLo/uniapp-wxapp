<template>
  <view class="todo-item">
    <view v-if="!editing" class="todo-main" @click="$emit('edit', todo.id)">
      <view class="checkbox" :class="{ checked: todo.done }" @click.stop="$emit('toggle', todo.id)">
        <text v-if="todo.done" class="check-mark">✓</text>
      </view>
      <view class="todo-content">
        <view class="todo-title" :class="{ done: todo.done }">{{ todo.title }}</view>
        <view v-if="dueLabel" class="todo-due" :class="{ overdue }">{{ dueLabel }}</view>
      </view>
      <view class="more" @click.stop="$emit('more', todo.id)">⋯</view>
    </view>

    <view v-else class="edit-box">
      <input class="input" v-model="draftTitle" maxlength="60" placeholder="待办内容" />
      <view class="label">截止时间（可选）</view>
      <view class="edit-row">
        <picker mode="date" :value="draftDate" @change="draftDate = $event.detail.value">
          <view class="picker-field">
            <text>{{ draftDate || '选择日期' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
        <picker mode="time" :value="draftTime" @change="draftTime = $event.detail.value">
          <view class="picker-field">
            <text>{{ draftTime || '选择时间' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view v-if="draftDate || draftTime" class="clear-due" @click="clearDue">清除截止时间</view>
      <view v-if="showRemind" class="switch-row">
        <text class="switch-label">日历提醒</text>
        <switch :checked="draftRemind" color="#4361EE" @change="draftRemind = $event.detail.value" />
      </view>
      <view v-else class="empty-tip">仅微信小程序支持日历提醒</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="save">保存</view>
        <view class="btn btn-ghost" @click="$emit('cancel')">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatDueLabel, isOverdue } from '../../utils/todo.js'
import { dateToTimestamp, formatDateValue, formatTimeValue } from '../../utils/timestamp.js'
import { canAddCalendar } from '../../utils/calendar.js'

const props = defineProps({
  todo: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  now: { type: Number, default: () => Date.now() },
})

const emit = defineEmits(['toggle', 'edit', 'save', 'cancel', 'more'])

const showRemind = canAddCalendar()
const draftTitle = ref('')
const draftDate = ref('')
const draftTime = ref('')
const draftRemind = ref(false)

const dueLabel = computed(() => formatDueLabel(props.todo.dueAt, props.now))
const overdue = computed(() => isOverdue(props.todo, props.now))

watch(
  () => props.editing,
  (editing) => {
    if (!editing) return
    draftTitle.value = props.todo.title
    if (props.todo.dueAt) {
      const date = new Date(props.todo.dueAt)
      draftDate.value = formatDateValue(date)
      draftTime.value = formatTimeValue(date)
    } else {
      draftDate.value = ''
      draftTime.value = ''
    }
    draftRemind.value = !!props.todo.remind
  },
  { immediate: true },
)

function clearDue() {
  draftDate.value = ''
  draftTime.value = ''
  draftRemind.value = false
}

function save() {
  const title = draftTitle.value.trim()
  if (!title) {
    uni.showToast({ title: '请输入待办内容', icon: 'none' })
    return
  }
  let dueAt = null
  if (draftDate.value || draftTime.value) {
    if (!draftDate.value || !draftTime.value) {
      uni.showToast({ title: '请选择完整的日期和时间', icon: 'none' })
      return
    }
    const converted = dateToTimestamp(draftDate.value, draftTime.value)
    if (converted.error) {
      uni.showToast({ title: converted.error, icon: 'none' })
      return
    }
    dueAt = converted.milliseconds
  }
  emit('save', {
    id: props.todo.id,
    title,
    dueAt,
    remind: dueAt ? draftRemind.value : false,
  })
}
</script>

<style scoped>
.todo-item {
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
  background: var(--surface);
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.06);
}

.todo-main {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.check-mark {
  color: #FFFFFF;
  font-size: 24rpx;
  line-height: 1;
}

.todo-content {
  flex: 1;
  margin-left: 20rpx;
}

.todo-title {
  font-size: 28rpx;
  color: var(--text);
  word-break: break-all;
}

.todo-title.done {
  color: var(--text-secondary);
  text-decoration: line-through;
}

.todo-due {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.todo-due.overdue {
  color: var(--danger);
}

.more {
  padding: 8rpx 0 8rpx 24rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}

.edit-row {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.edit-row picker {
  width: 48%;
}

.clear-due {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--primary);
}
</style>
