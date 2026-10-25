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
    label: '手记',
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

let sidebarCollapsed = false

export function loadSidebarCollapsed() {
  return sidebarCollapsed
}

export function saveSidebarCollapsed(collapsed) {
  sidebarCollapsed = !!collapsed
  return true
}
