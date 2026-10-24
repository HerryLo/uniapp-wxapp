import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  addRecord,
  loadDay,
  removeRecord,
  summarizeDay,
  sortRecords,
  validateMilk,
  validateSleep,
  validateDiaper,
} from '../src/utils/baby/records.js'

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

describe('baby records', () => {
  it('validates inputs', () => {
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '' })).toBe('')
    expect(validateMilk({ time: '', type: '母乳' })).toContain('时间')
    expect(validateMilk({ time: '2026-10-24 08:00', type: '水', amount: '' })).toContain('类型')
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '-1' })).toContain('奶量')
    expect(validateSleep({ start: '2026-10-24 23:00', end: '2026-10-25 01:00' })).toBe('')
    expect(validateSleep({ start: '2026-10-24 23:00', end: '2026-10-24 22:00' })).toContain('晚于')
    expect(validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常' })).toBe('')
  })

  it('adds, groups and summarizes a day', () => {
    expect(addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' }, 1).ok).toBe(true)
    expect(addRecord('milk', { time: '2026-10-24 12:00', type: '配方奶', amount: '120' }, 2).ok).toBe(true)
    expect(addRecord('diaper', { time: '2026-10-24 09:00', type: '小便', color: '正常' }, 3).ok).toBe(true)
    expect(addRecord('sleep', { start: '2026-10-24 23:00', end: '2026-10-25 01:30' }, 4).ok).toBe(true)

    const day = loadDay('2026-10-24')
    expect(day.milk).toHaveLength(2)
    expect(day.diaper).toHaveLength(1)
    expect(day.sleep).toHaveLength(1)
    expect(summarizeDay(day)).toEqual({
      milkCount: 2,
      milkAmount: 120,
      sleepMinutes: 150,
      diaperCount: 1,
    })
    expect(loadDay('2026-10-25').sleep).toHaveLength(0)
  })

  it('sorts by time descending', () => {
    addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' }, 1)
    addRecord('milk', { time: '2026-10-24 12:00', type: '母乳', amount: '' }, 2)
    expect(sortRecords(loadDay('2026-10-24').milk, 'milk').map((item) => item.time)).toEqual([
      '2026-10-24 12:00',
      '2026-10-24 08:00',
    ])
  })

  it('removes a record and drops empty days', () => {
    const added = addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '绿色' }, 1)
    expect(removeRecord('diaper', added.record.id, '2026-10-24').ok).toBe(true)
    expect(loadDay('2026-10-24').diaper).toHaveLength(0)
  })

  it('reports storage failure', () => {
    uni.setStorageSync = () => { throw new Error('fail') }
    expect(
      addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' })
    ).toEqual({ ok: false, error: '保存失败' })
  })
})
