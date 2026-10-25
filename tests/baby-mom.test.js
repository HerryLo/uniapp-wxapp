import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MOODS,
  loadMomEntries,
  saveMomEntry,
  removeMomEntry,
} from '../src/utils/baby/mom.js'
import { MOM_KEY } from '../src/utils/baby/keys.js'

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

describe('mom entries', () => {
  it('ships five moods and saves one entry per day', () => {
    expect(MOODS).toHaveLength(5)
    const first = saveMomEntry(
      {
        date: '2025-01-02',
        sleepHours: '6.5',
        mood: 'calm',
        condition: ' 腰酸 ',
        note: ' 还行 ',
      },
      1000
    )
    expect(first.ok).toBe(true)
    expect(loadMomEntries()[0]).toMatchObject({
      date: '2025-01-02',
      sleepHours: 6.5,
      mood: 'calm',
      condition: '腰酸',
      note: '还行',
      createdAt: 1000,
      updatedAt: 1000,
    })

    const second = saveMomEntry(
      { date: '2025-01-02', sleepHours: '', mood: 'happy', condition: '', note: '' },
      2000
    )
    expect(second.entries).toHaveLength(1)
    expect(loadMomEntries()[0]).toMatchObject({
      sleepHours: null,
      mood: 'happy',
      createdAt: 1000,
      updatedAt: 2000,
    })
  })

  it('validates date, mood, sleep hours and text lengths', () => {
    expect(saveMomEntry({ date: 'x', mood: 'calm' }).error).toBe('请选择日期')
    expect(saveMomEntry({ date: '2999-01-01', mood: 'calm' }).error).toBe('日期不能晚于今天')
    expect(saveMomEntry({ date: '2025-01-02', mood: 'x' }).error).toBe('请选择心情')
    expect(
      saveMomEntry({ date: '2025-01-02', mood: 'calm', sleepHours: '25' }).error
    ).toContain('0–24')
    expect(
      saveMomEntry({
        date: '2025-01-02',
        mood: 'calm',
        condition: 'x'.repeat(51),
      }).error
    ).toBe('身体状态最多 50 个字')
    expect(
      saveMomEntry({ date: '2025-01-02', mood: 'calm', note: 'x'.repeat(201) }).error
    ).toBe('备注最多 200 个字')
  })

  it('sorts entries and removes by date', () => {
    saveMomEntry({ date: '2025-01-01', mood: 'calm' }, 1)
    saveMomEntry({ date: '2025-01-03', mood: 'happy' }, 2)
    expect(loadMomEntries().map((item) => item.date)).toEqual([
      '2025-01-03',
      '2025-01-01',
    ])
    const removed = removeMomEntry('2025-01-01')
    expect(removed.ok).toBe(true)
    expect(loadMomEntries()).toHaveLength(1)
  })

  it('filters corrupt stored entries', () => {
    store[MOM_KEY] = JSON.stringify([
      { date: '2025-01-02', mood: 'happy', sleepHours: 7 },
      { date: 'bad', mood: 'happy' },
      { date: '2025-01-03', mood: 'unknown' },
      null,
    ])
    expect(loadMomEntries()).toHaveLength(1)
  })
})
