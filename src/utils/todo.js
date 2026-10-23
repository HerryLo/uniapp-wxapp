import { readStorage, writeStorage } from './storage.js'

export const TODOS_KEY = 'tools.todos.v1'

export function createTodo(title, dueAt = null, now = Date.now()) {
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(title).trim(),
    done: false,
    dueAt,
    remind: false,
    createdAt: now,
    completedAt: null,
  }
}

export function sortTodos(list) {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (!a.done) {
      if (a.dueAt == null && b.dueAt == null) return b.createdAt - a.createdAt
      if (a.dueAt == null) return 1
      if (b.dueAt == null) return -1
      return a.dueAt - b.dueAt
    }
    return (b.completedAt || 0) - (a.completedAt || 0)
  })
}

export function filterTodos(list, filter) {
  if (filter === 'active') return list.filter((t) => !t.done)
  if (filter === 'done') return list.filter((t) => t.done)
  return list
}

export function activeCount(list) {
  return list.filter((t) => !t.done).length
}

export function toggleTodo(list, id, now = Date.now()) {
  return list.map((t) => {
    if (t.id !== id) return t
    const done = !t.done
    return { ...t, done, completedAt: done ? now : null }
  })
}

export function loadTodos() {
  const list = readStorage(TODOS_KEY, [])
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
    .map((item) => ({
      id: item.id,
      title: item.title,
      done: !!item.done,
      dueAt: typeof item.dueAt === 'number' ? item.dueAt : null,
      remind: !!item.remind,
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      completedAt: typeof item.completedAt === 'number' ? item.completedAt : null,
    }))
}

export function saveTodos(list) {
  return writeStorage(TODOS_KEY, list)
}

export function updateTabBadge(count) {
  if (count > 0) {
    uni.setTabBarBadge({ index: 1, text: String(count) })
  } else {
    uni.removeTabBarBadge({ index: 1 })
  }
}

export function formatDueLabel(dueAt, now = Date.now()) {
  if (!dueAt) return ''
  const d = new Date(dueAt)
  const n = new Date(now)
  const pad = (value) => String(value).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const sameDay =
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  const tomorrow = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1)
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  if (sameDay) return `今天 ${time}`
  if (isTomorrow) return `明天 ${time}`
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`
}

export function isOverdue(todo, now = Date.now()) {
  return !todo.done && todo.dueAt != null && todo.dueAt < now
}
