<template>
  <view class="todo-page">
    <view class="card add-card">
      <view class="add-row">
        <input
          class="input"
          v-model="newTitle"
          maxlength="60"
          confirm-type="done"
          placeholder="添加待办..."
          @confirm="add"
        />
        <view class="add-btn" @click="add">添加</view>
      </view>
    </view>

    <view class="chip-row filters">
      <view
        v-for="item in filters"
        :key="item.key"
        class="chip"
        :class="{ active: filter === item.key }"
        @click="filter = item.key"
      >{{ item.label }}（{{ counts[item.key] }}）</view>
    </view>

    <view v-if="!visibleTodos.length" class="empty-state">暂无待办</view>

    <TodoItem
      v-for="item in visibleTodos"
      :key="item.id"
      :todo="item"
      :editing="editingId === item.id"
      :now="now"
      @toggle="toggle"
      @edit="startEdit"
      @save="saveEdit"
      @cancel="editingId = ''"
      @more="showMore"
    />

    <view class="note">
      <view>日历事件写入后无法由小程序删除或更新，修改或删除待办不会同步系统日历，旧事件需手动删除。</view>
      <view>提醒依赖用户授权系统日历，请到系统设置中开启日历权限。</view>
      <view>H5 端不支持日历提醒。</view>
      <view>数据仅保存在本机，清理小程序缓存或卸载后会丢失。</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import TodoItem from '../../components/tools/TodoItem.vue'
import {
  createTodo,
  sortTodos,
  filterTodos,
  activeCount,
  toggleTodo,
  loadTodos,
  saveTodos,
  updateTabBadge,
  needsCalendarSync,
  markCalendarSynced,
} from '../../utils/todo.js'
import { addTodoToCalendar } from '../../utils/calendar.js'

const filters = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'done', label: '已完成' },
]

const todos = ref(loadTodos())
const newTitle = ref('')
const filter = ref('all')
const editingId = ref('')
const now = ref(Date.now())
let clockTimer = null

function startClock() {
  stopClock()
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 60000)
}

function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
}

const counts = computed(() => {
  const active = activeCount(todos.value)
  return { all: todos.value.length, active, done: todos.value.length - active }
})

const visibleTodos = computed(() => filterTodos(sortTodos(todos.value), filter.value))

function persist() {
  const saved = saveTodos(todos.value)
  updateTabBadge(activeCount(todos.value))
  if (!saved) uni.showToast({ title: '保存失败', icon: 'none' })
}

function add() {
  const title = newTitle.value.trim()
  if (!title) {
    uni.showToast({ title: '请输入待办内容', icon: 'none' })
    return
  }
  todos.value = [...todos.value, createTodo(title)]
  newTitle.value = ''
  persist()
}

function toggle(id) {
  todos.value = toggleTodo(todos.value, id)
  persist()
}

function startEdit(id) {
  editingId.value = id
}

function saveEdit(payload) {
  const previous = todos.value.find((item) => item.id === payload.id)
  const remind = payload.dueAt ? payload.remind : false
  todos.value = todos.value.map((item) => {
    if (item.id !== payload.id) return item
    return {
      ...item,
      title: payload.title,
      dueAt: payload.dueAt,
      remind,
      calendarSyncedAt: remind ? item.calendarSyncedAt : null,
    }
  })
  editingId.value = ''
  persist()
  if (needsCalendarSync(previous, { remind, dueAt: payload.dueAt })) {
    addTodoToCalendar({ title: payload.title, dueAt: payload.dueAt })
      .then(() => {
        todos.value = markCalendarSynced(todos.value, payload.id)
        persist()
        uni.showToast({ title: '已添加到手机日历', icon: 'none' })
      })
      .catch(() => uni.showToast({ title: '添加日历失败，请检查日历权限', icon: 'none' }))
  }
}

function showMore(id) {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return
  uni.showActionSheet({
    itemList: ['删除'],
    success: () => {
      uni.showModal({
        title: '删除待办',
        content: `确定删除「${todo.title}」吗？`,
        success: (res) => {
          if (!res.confirm) return
          todos.value = todos.value.filter((item) => item.id !== id)
          persist()
        },
      })
    },
  })
}

onShow(() => {
  now.value = Date.now()
  updateTabBadge(activeCount(todos.value))
  startClock()
})

onHide(stopClock)
onUnmounted(stopClock)
</script>

<style scoped>
.todo-page {
  padding: 32rpx 32rpx 64rpx;
}

.add-card {
  margin-top: 0;
}

.add-row {
  display: flex;
  align-items: center;
}

.add-row .input {
  flex: 1;
}

.add-btn {
  width: 140rpx;
  height: 80rpx;
  margin-left: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: var(--primary);
  color: #FFFFFF;
  font-size: 28rpx;
}

.filters {
  margin-top: 24rpx;
}

.empty-state {
  margin-top: 96rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.note {
  margin-top: 48rpx;
  font-size: 22rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
