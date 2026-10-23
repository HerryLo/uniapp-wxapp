import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  TODOS_KEY,
  createTodo,
  sortTodos,
  filterTodos,
  activeCount,
  toggleTodo,
  loadTodos,
  saveTodos,
  updateTabBadge,
  formatDueLabel,
  isOverdue,
} from '../src/utils/todo.js'

const makeList = () => [
  { id: '1', title: 'a', done: false, dueAt: 3000, remind: false, createdAt: 1, completedAt: null },
  { id: '2', title: 'b', done: false, dueAt: null, remind: false, createdAt: 2, completedAt: null },
  { id: '3', title: 'c', done: false, dueAt: 1000, remind: false, createdAt: 3, completedAt: null },
  { id: '4', title: 'd', done: true, dueAt: null, remind: false, createdAt: 4, completedAt: 100 },
  { id: '5', title: 'e', done: true, dueAt: null, remind: false, createdAt: 5, completedAt: 200 },
]

describe('todo', () => {
  it('sorts unfinished by due time and finished by completion time', () => {
    expect(sortTodos(makeList()).map((t) => t.id)).toEqual(['3', '1', '2', '5', '4'])
  })

  it('filters and counts', () => {
    expect(filterTodos(makeList(), 'active').map((t) => t.id)).toEqual(['1', '2', '3'])
    expect(filterTodos(makeList(), 'done').map((t) => t.id)).toEqual(['4', '5'])
    expect(filterTodos(makeList(), 'all')).toHaveLength(5)
    expect(activeCount(makeList())).toBe(3)
  })

  it('creates and toggles todos', () => {
    const todo = createTodo('  写计划  ', null, 1000)
    expect(todo.title).toBe('写计划')
    expect(todo.id.startsWith('1000-')).toBe(true)
    expect(todo.done).toBe(false)

    const toggled = toggleTodo(makeList(), '1', 9999)
    expect(toggled.find((t) => t.id === '1')).toMatchObject({ done: true, completedAt: 9999 })
    expect(toggleTodo(toggled, '1', 10000).find((t) => t.id === '1').completedAt).toBe(null)
  })

  it('formats due labels and overdue state', () => {
    const now = new Date(2026, 0, 2, 10, 0).getTime()
    expect(formatDueLabel(new Date(2026, 0, 2, 18, 30).getTime(), now)).toBe('今天 18:30')
    expect(formatDueLabel(new Date(2026, 0, 3, 9, 5).getTime(), now)).toBe('明天 09:05')
    expect(formatDueLabel(new Date(2026, 0, 5, 8, 0).getTime(), now)).toBe('01-05 08:00')
    expect(formatDueLabel(null, now)).toBe('')
    expect(isOverdue({ done: false, dueAt: now - 1 }, now)).toBe(true)
    expect(isOverdue({ done: true, dueAt: now - 1 }, now)).toBe(false)
    expect(isOverdue({ done: false, dueAt: null }, now)).toBe(false)
  })
})

describe('todo storage and badge', () => {
  const store = {}

  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]
    vi.stubGlobal('uni', {
      getStorageSync: vi.fn((key) => (key in store ? store[key] : '')),
      setStorageSync: vi.fn((key, value) => { store[key] = value }),
      setTabBarBadge: vi.fn(),
      removeTabBarBadge: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips todos and filters corrupt entries', () => {
    saveTodos([createTodo('a', null, 1)])
    expect(loadTodos()).toHaveLength(1)

    store[TODOS_KEY] = JSON.stringify([{ id: 'x' }, null, { id: 'y', title: 'ok' }])
    expect(loadTodos()).toEqual([
      {
        id: 'y',
        title: 'ok',
        done: false,
        dueAt: null,
        remind: false,
        createdAt: expect.any(Number),
        completedAt: null,
      },
    ])
  })

  it('updates the tab badge', () => {
    updateTabBadge(2)
    expect(uni.setTabBarBadge).toHaveBeenCalledWith({ index: 1, text: '2' })
    updateTabBadge(0)
    expect(uni.removeTabBarBadge).toHaveBeenCalledWith({ index: 1 })
  })
})
