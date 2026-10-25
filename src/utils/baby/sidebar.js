export const SIDEBAR_ITEMS = [
  { key: 'home', label: '首页', icon: '🏠', url: '/pages/baby/index' },
  { key: 'milk', label: '喝奶', icon: '🍼', url: '/package-baby/records/milk' },
  { key: 'sleep', label: '睡眠', icon: '😴', url: '/package-baby/records/sleep' },
  { key: 'diaper', label: '排便', icon: '💧', url: '/package-baby/records/diaper' },
  { key: 'food', label: '辅食', icon: '🍚', url: '/package-baby/records/food' },
  { key: 'medicine', label: '用药', icon: '💊', url: '/package-baby/records/medicine' },
  { key: 'health', label: '疫苗', icon: '💉', url: '/package-baby/health/index' },
  { key: 'growth', label: '生长', icon: '📈', url: '/package-baby/growth/index' },
  { key: 'journal', label: '手记', icon: '📖', url: '/package-baby/journal/index' },
  { key: 'mom', label: '妈妈', icon: '👩', url: '/package-baby/mom/index' },
  { key: 'travel', label: '旅行', icon: '🧳', url: '/package-baby/travel/index' },
  { key: 'settings', label: '设置', icon: '⚙️', url: '/package-baby/settings/index' },
]

let sidebarCollapsed = false
let sidebarPosition = null

export function loadSidebarCollapsed() {
  return sidebarCollapsed
}

export function saveSidebarCollapsed(collapsed) {
  sidebarCollapsed = !!collapsed
  return true
}

export function loadSidebarPosition() {
  return sidebarPosition
}

export function saveSidebarPosition(left, top) {
  sidebarPosition =
    left == null || top == null ? null : { left: Number(left), top: Number(top) }
  return true
}
