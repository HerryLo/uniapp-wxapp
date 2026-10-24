import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadGrowth,
  upsertGrowth,
  removeGrowth,
  chartPoints,
  latestGrowth,
  validateGrowth,
} from '../src/utils/baby/growth.js'
import { GROWTH_KEY } from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baby growth', () => {
  it('validates date, height and weight', () => {
    expect(validateGrowth({ date: '2026-02-30', height: '70', weight: '8' })).toBe('请选择测量日期')
    expect(validateGrowth({ date: '2026-10-24', height: '', weight: '8' })).toBe('请输入身高')
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '' })).toBe('请输入体重')
    expect(validateGrowth({ date: '2026-10-24', height: '10', weight: '8' })).toContain('20–200')
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '0.1' })).toContain('0.5–100')
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '8' })).toBe('')
  })

  it('inserts records in date order and updates the same date', () => {
    const first = upsertGrowth([], { date: '2026-10-01', height: '70', weight: '8' }, 1)
    expect(first.ok).toBe(true)
    const second = upsertGrowth(first.list, { date: '2026-09-01', height: '68', weight: '7.5' }, 2)
    expect(second.list.map((item) => item.date)).toEqual(['2026-09-01', '2026-10-01'])

    const updated = upsertGrowth(second.list, { date: '2026-10-01', height: '72', weight: '8.4' }, 3)
    expect(updated.list).toHaveLength(2)
    expect(updated.list.find((item) => item.date === '2026-10-01').height).toBe(72)
    expect(loadGrowth()).toHaveLength(2)
  })

  it('builds chart points and latest record', () => {
    const list = [
      { id: 'a', date: '2026-10-01', height: 70, weight: 8, createdAt: 1 },
      { id: 'b', date: '2026-09-01', height: 68, weight: 7.5, createdAt: 2 },
    ]
    expect(chartPoints(list, 'height')).toEqual([
      { date: '2026-09-01', value: 68 },
      { date: '2026-10-01', value: 70 },
    ])
    expect(latestGrowth(list).date).toBe('2026-10-01')
    expect(latestGrowth([])).toBe(null)
  })

  it('removes records', () => {
    const added = upsertGrowth([], { date: '2026-10-01', height: '70', weight: '8' }, 1)
    const removed = removeGrowth(added.list, added.list[0].id)
    expect(removed.ok).toBe(true)
    expect(loadGrowth()).toHaveLength(0)
  })

  it('filters corrupt stored records', () => {
    store[GROWTH_KEY] = JSON.stringify([
      { id: 'ok', date: '2026-10-01', height: 70, weight: 8 },
      { id: 'bad', date: 'x', height: 70, weight: 8 },
      null,
    ])
    expect(loadGrowth()).toHaveLength(1)
  })
})
