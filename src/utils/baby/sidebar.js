import { readStorage, writeStorage } from '../storage.js'

export const SIDEBAR_STATE_KEY = 'ui.baby-sidebar.v1'

export const SIDEBAR_ITEMS = [
  {
    key: 'home',
    label: '首页',
    emoji: '🏠',
    url: '/pages/baby/index',
  },
  {
    key: 'milk',
    label: '喝奶',
    emoji: '🍼',
    url: '/package-baby/records/index?type=milk',
  },
  {
    key: 'sleep',
    label: '睡眠',
    emoji: '😴',
    url: '/package-baby/records/index?type=sleep',
  },
  {
    key: 'diaper',
    label: '排便',
    emoji: '💧',
    url: '/package-baby/records/index?type=diaper',
  },
  {
    key: 'health',
    label: '疫苗',
    emoji: '💉',
    url: '/package-baby/health/index',
  },
  {
    key: 'growth',
    label: '生长',
    emoji: '📈',
    url: '/package-baby/growth/index',
  },
  {
    key: 'journal',
    label: '成长',
    emoji: '📖',
    url: '/package-baby/journal/index',
  },
  {
    key: 'settings',
    label: '设置',
    emoji: '⚙️',
    url: '/package-baby/settings/index',
  },
]

export function loadSidebarCollapsed() {
  const raw = readStorage(SIDEBAR_STATE_KEY, null)
  return !!(raw && typeof raw === 'object' && raw.collapsed === true)
}

export function saveSidebarCollapsed(collapsed) {
  return writeStorage(SIDEBAR_STATE_KEY, { collapsed: !!collapsed })
}
