import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { addTravel, loadTravels, removeTravel } from '../src/package-baby/utils/travel.js'
import { TRAVEL_KEY } from '../src/utils/baby/keys.js'

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

describe('travel records', () => {
  it('adds travels and sorts by start date descending', () => {
    const first = addTravel(
      { startDate: '2025-01-01', endDate: '2025-01-03', place: ' 杭州 ', note: '西湖' },
      1
    )
    expect(first.ok).toBe(true)
    expect(first.travel).toMatchObject({ place: '杭州', note: '西湖' })
    addTravel(
      { startDate: '2025-02-01', endDate: '2025-02-02', place: '苏州', note: '' },
      2
    )
    expect(loadTravels().map((item) => item.startDate)).toEqual([
      '2025-02-01',
      '2025-01-01',
    ])
  })

  it('validates dates and place', () => {
    expect(addTravel({ startDate: '', endDate: '2025-01-01', place: '杭州' }).error).toBe(
      '请选择开始日期'
    )
    expect(
      addTravel({ startDate: '2025-01-01', endDate: '', place: '杭州' }).error
    ).toBe('请选择结束日期')
    expect(
      addTravel({ startDate: '2025-01-03', endDate: '2025-01-01', place: '杭州' }).error
    ).toBe('结束日期不能早于开始日期')
    expect(
      addTravel({ startDate: '2025-01-01', endDate: '2025-01-02', place: ' ' }).error
    ).toBe('请输入地点')
    expect(
      addTravel({
        startDate: '2025-01-01',
        endDate: '2025-01-02',
        place: 'x'.repeat(31),
      }).error
    ).toBe('地点最多 30 个字')
  })

  it('removes travels', () => {
    const added = addTravel(
      { startDate: '2025-01-01', endDate: '2025-01-02', place: '杭州' },
      1
    )
    expect(removeTravel(added.travel.id).ok).toBe(true)
    expect(loadTravels()).toHaveLength(0)
  })

  it('filters corrupt stored records', () => {
    store[TRAVEL_KEY] = JSON.stringify([
      { id: 'ok', startDate: '2025-01-01', endDate: '2025-01-02', place: '杭州' },
      { id: 'bad', startDate: 'x', endDate: '2025-01-02', place: '杭州' },
      { id: 'bad2', startDate: '2025-01-03', endDate: '2025-01-02', place: '杭州' },
      null,
    ])
    expect(loadTravels()).toHaveLength(1)
  })
})
