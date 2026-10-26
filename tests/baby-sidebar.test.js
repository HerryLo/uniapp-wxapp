import { describe, it, expect, beforeEach } from 'vitest'
import {
  SIDEBAR_ITEMS,
  loadSidebarCollapsed,
  loadSidebarPosition,
  onSidebarCollapsedChange,
  onSidebarPositionChange,
  saveSidebarCollapsed,
  saveSidebarPosition,
} from '../src/utils/baby/sidebar.js'

beforeEach(() => {
  saveSidebarCollapsed(false)
  saveSidebarPosition(null, null)
})

describe('baby sidebar', () => {
  it('ships the twelve entries in order', () => {
    expect(SIDEBAR_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'milk',
      'sleep',
      'diaper',
      'food',
      'supplement',
      'medicine',
      'health',
      'growth',
      'journal',
      'mom',
      'travel',
    ])
    expect(SIDEBAR_ITEMS.map((item) => item.label)).toEqual([
      '首页',
      '喝奶',
      '睡眠',
      '排便',
      '辅食',
      '补剂',
      '用药',
      '疫苗',
      '生长',
      '手记',
      '妈妈',
      '旅行',
    ])
    expect(SIDEBAR_ITEMS[0].url).toBe('/pages/baby/index')
    expect(SIDEBAR_ITEMS[1].url).toBe('/package-baby/records/milk')
    expect(SIDEBAR_ITEMS[4].url).toBe('/package-baby/records/food')
    expect(SIDEBAR_ITEMS[5].url).toBe('/package-baby/records/supplement')
    expect(SIDEBAR_ITEMS[6].url).toBe('/package-baby/records/medicine')
    expect(SIDEBAR_ITEMS[7].url).toBe('/package-baby/health/index')
    expect(SIDEBAR_ITEMS[10].url).toBe('/package-baby/mom/index')
    expect(SIDEBAR_ITEMS[11].url).toBe('/package-baby/travel/index')
    expect(
      SIDEBAR_ITEMS.every((item) => typeof item.icon === 'string' && item.icon)
    ).toBe(true)
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

  it('notifies subscribers when the collapse state changes', () => {
    const seen = []
    const unsubscribe = onSidebarCollapsedChange((value) => seen.push(value))
    saveSidebarCollapsed(true)
    saveSidebarCollapsed(true)
    saveSidebarCollapsed(false)
    unsubscribe()
    saveSidebarCollapsed(true)
    expect(seen).toEqual([true, false])
    saveSidebarCollapsed(false)
  })

  it('notifies subscribers when the floating position changes', () => {
    const seen = []
    const unsubscribe = onSidebarPositionChange((value) => seen.push(value))
    saveSidebarPosition(20, 300)
    saveSidebarPosition(null, null)
    unsubscribe()
    saveSidebarPosition(1, 2)
    expect(seen).toEqual([{ left: 20, top: 300 }, null])
    saveSidebarPosition(null, null)
  })
})
