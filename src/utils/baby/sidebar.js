export const SIDEBAR_ITEMS = [
  { key: 'home', label: '首页', url: '/pages/baby/index' },
  { key: 'milk', label: '喝奶', url: '/package-baby/records/milk' },
  { key: 'sleep', label: '睡眠', url: '/package-baby/records/sleep' },
  { key: 'diaper', label: '排便', url: '/package-baby/records/diaper' },
  { key: 'food', label: '辅食', url: '/package-baby/records/food' },
  { key: 'medicine', label: '用药', url: '/package-baby/records/medicine' },
  { key: 'health', label: '疫苗', url: '/package-baby/health/index' },
  { key: 'growth', label: '生长', url: '/package-baby/growth/index' },
  { key: 'journal', label: '手记', url: '/package-baby/journal/index' },
  { key: 'mom', label: '妈妈', url: '/package-baby/mom/index' },
  { key: 'travel', label: '旅行', url: '/package-baby/travel/index' },
  { key: 'settings', label: '设置', url: '/package-baby/settings/index' },
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
