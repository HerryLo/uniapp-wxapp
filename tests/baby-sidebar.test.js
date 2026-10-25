import { describe, it, expect, beforeEach } from 'vitest'
import {
  SIDEBAR_ITEMS,
  loadSidebarCollapsed,
  loadSidebarPosition,
  saveSidebarCollapsed,
  saveSidebarPosition,
} from '../src/utils/baby/sidebar.js'

beforeEach(() => {
  saveSidebarCollapsed(false)
  saveSidebarPosition(null, null)
})

describe('baby sidebar', () => {
  it('ships the eight entries in order', () => {
    expect(SIDEBAR_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'milk',
      'sleep',
      'diaper',
      'health',
      'growth',
      'journal',
      'settings',
    ])
    expect(SIDEBAR_ITEMS.map((item) => item.label)).toEqual([
      '首页',
      '喝奶',
      '睡眠',
      '排便',
      '疫苗',
      '生长',
      '手记',
      '设置',
    ])
    expect(SIDEBAR_ITEMS[0].url).toBe('/pages/baby/index')
    expect(SIDEBAR_ITEMS[1].url).toBe('/package-baby/records/index?type=milk')
    expect(SIDEBAR_ITEMS[4].url).toBe('/package-baby/health/index')
  })

  it('uses unique sidebar labels', () => {
    const labels = SIDEBAR_ITEMS.map((item) => item.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('defaults to expanded and toggles in memory', () => {
    expect(loadSidebarCollapsed()).toBe(false)
    expect(saveSidebarCollapsed(true)).toBe(true)
    expect(loadSidebarCollapsed()).toBe(true)
    expect(saveSidebarCollapsed(false)).toBe(true)
    expect(loadSidebarCollapsed()).toBe(false)
  })

  it('remembers the floating icon position in memory', () => {
    expect(loadSidebarPosition()).toBe(null)
    expect(saveSidebarPosition(20, 300)).toBe(true)
    expect(loadSidebarPosition()).toEqual({ left: 20, top: 300 })
    saveSidebarPosition(null, null)
    expect(loadSidebarPosition()).toBe(null)
  })
})
