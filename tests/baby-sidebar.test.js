import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SIDEBAR_ITEMS,
  SIDEBAR_STATE_KEY,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from '../src/utils/baby/sidebar.js'
import { isBabyKey } from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
    showToast: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
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
      '成长',
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

  it('uses a UI key outside the baby data prefix', () => {
    expect(SIDEBAR_STATE_KEY).toBe('ui.baby-sidebar.v1')
    expect(isBabyKey(SIDEBAR_STATE_KEY)).toBe(false)
  })

  it('defaults to expanded and persists the collapsed state', () => {
    expect(loadSidebarCollapsed()).toBe(false)
    expect(saveSidebarCollapsed(true)).toBe(true)
    expect(loadSidebarCollapsed()).toBe(true)
    expect(saveSidebarCollapsed(false)).toBe(true)
    expect(loadSidebarCollapsed()).toBe(false)
  })

  it('falls back to expanded when stored state is corrupt', () => {
    store[SIDEBAR_STATE_KEY] = '{oops'
    expect(loadSidebarCollapsed()).toBe(false)
    store[SIDEBAR_STATE_KEY] = 'true'
    expect(loadSidebarCollapsed()).toBe(false)
  })
})
