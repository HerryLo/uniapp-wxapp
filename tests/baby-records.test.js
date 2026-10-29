import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  FOOD_REACTIONS,
  addRecord,
  loadDay,
  loadRecentDays,
  loadRecentMilkSummary,
  milkChartPoints,
  removeRecord,
  summarizeDay,
  summarizeRecentDay,
  sortRecords,
  syncRecordMonthIndex,
  validateFood,
  validateMedicine,
  validateMilk,
  validateSleep,
  validateDiaper,
  validateSupplement,
} from '../src/utils/baby/records.js'
import { RECORDS_INDEX_KEY, recordsKey } from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
    getStorageInfoSync: () => ({ keys: Object.keys(store) }),
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
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常', shape: '糊状' })
    ).toBe('')
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
    const added = addRecord(
      'diaper',
      { time: '2026-10-24 09:00', type: '大便', color: '绿色', shape: '糊状' },
      1
    )
    expect(removeRecord('diaper', added.record.id, '2026-10-24').ok).toBe(true)
    expect(loadDay('2026-10-24').diaper).toHaveLength(0)
  })

  it('reports storage failure', () => {
    uni.setStorageSync = () => { throw new Error('fail') }
    expect(
      addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' })
    ).toEqual({ ok: false, error: '保存失败' })
  })

  it('summarizes the recent seven days across month boundaries', () => {
    addRecord('milk', { time: '2026-09-28 08:00', type: '配方奶', amount: '100' }, 1)
    addRecord('milk', { time: '2026-09-28 12:00', type: '母乳', amount: '' }, 2)
    addRecord('milk', { time: '2026-10-01 09:00', type: '配方奶', amount: '120' }, 3)

    const summary = loadRecentMilkSummary(7, new Date(2026, 9, 1))
    expect(summary).toHaveLength(7)
    expect(summary.map((item) => item.date)).toEqual([
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ])
    expect(summary.find((item) => item.date === '2026-09-28')).toMatchObject({
      milkCount: 2,
      milkAmount: 100,
      hasMilkAmount: true,
    })
    expect(summary.find((item) => item.date === '2026-10-01')).toMatchObject({
      milkCount: 1,
      milkAmount: 120,
      hasMilkAmount: true,
    })
    expect(milkChartPoints(summary)).toEqual([
      { date: '2026-09-28', value: 100 },
      { date: '2026-10-01', value: 120 },
    ])
  })

  it('marks days without recorded amounts and filters chart points', () => {
    addRecord('milk', { time: '2026-10-01 08:00', type: '母乳', amount: '' }, 1)

    const summary = loadRecentMilkSummary(7, new Date(2026, 9, 1))
    expect(summary.find((item) => item.date === '2026-10-01')).toMatchObject({
      milkCount: 1,
      milkAmount: 0,
      hasMilkAmount: false,
    })
    expect(milkChartPoints(summary)).toEqual([])
  })

  it('returns an empty seven-day window when there is no data', () => {
    const summary = loadRecentMilkSummary(7, new Date(2026, 9, 1))
    expect(summary).toHaveLength(7)
    expect(
      summary.every(
        (item) => item.milkCount === 0 && item.milkAmount === 0 && !item.hasMilkAmount
      )
    ).toBe(true)
    expect(milkChartPoints(summary)).toEqual([])
  })

  it('validates food and medicine inputs', () => {
    expect(FOOD_REACTIONS).toEqual(['喜欢', '一般', '拒绝', '异常'])
    expect(
      validateFood({
        time: '2026-10-24 08:00',
        name: ' 米糊 ',
        amount: '',
        reaction: '喜欢',
        note: '',
      })
    ).toBe('')
    expect(validateFood({ time: '', name: '米糊', reaction: '喜欢' })).toContain('时间')
    expect(
      validateFood({ time: '2026-10-24 08:00', name: '', reaction: '喜欢' })
    ).toContain('食物名称')
    expect(
      validateFood({ time: '2026-10-24 08:00', name: '米糊', reaction: '好吃' })
    ).toContain('反应')
    expect(validateMedicine({ time: '2026-10-24 08:00', name: '药', amount: '', note: '' })).toBe('')
    expect(
      validateMedicine({ time: '2026-10-24 08:00', name: '', amount: '' })
    ).toContain('药品名称')
  })

  it('adds and removes food and medicine records', () => {
    const food = addRecord(
      'food',
      {
        time: '2026-10-24 08:00',
        name: ' 米糊 ',
        amount: '半碗',
        reaction: '喜欢',
        note: '吃完',
      },
      1
    )
    expect(food.ok).toBe(true)
    expect(food.record).toMatchObject({
      name: '米糊',
      amount: '半碗',
      reaction: '喜欢',
      note: '吃完',
    })

    const medicine = addRecord(
      'medicine',
      { time: '2026-10-24 09:00', name: '维生素', amount: '5 滴', note: '' },
      2
    )
    expect(medicine.ok).toBe(true)

    const day = loadDay('2026-10-24')
    expect(day.food).toHaveLength(1)
    expect(day.medicine).toHaveLength(1)
    expect(day.milk).toHaveLength(0)

    expect(removeRecord('food', food.record.id, '2026-10-24').ok).toBe(true)
    expect(loadDay('2026-10-24').food).toHaveLength(0)
  })

  it('tracks record months in the index', () => {
    const sep = addRecord('milk', { time: '2026-09-30 08:00', type: '母乳', amount: '' }, 1)
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual(['2026-09'])

    const oct = addRecord('milk', { time: '2026-10-01 08:00', type: '母乳', amount: '' }, 2)
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual(['2026-09', '2026-10'])

    expect(removeRecord('milk', oct.record.id, '2026-10-01').ok).toBe(true)
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual(['2026-09'])

    expect(removeRecord('milk', sep.record.id, '2026-09-30').ok).toBe(true)
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual([])
  })

  it('rebuilds the month index from storage and survives storage info failure', () => {
    store[recordsKey('2026-11')] = JSON.stringify({ '2026-11-01': {} })
    expect(syncRecordMonthIndex()).toEqual(['2026-11'])
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual(['2026-11'])

    uni.getStorageInfoSync = () => { throw new Error('fail') }
    expect(syncRecordMonthIndex()).toEqual(['2026-11'])
  })

  it('keeps old record data without food and medicine arrays working', () => {
    store['baby.records.v1.2026-10'] = JSON.stringify({
      '2026-10-24': {
        milk: [
          { id: 'm', time: '2026-10-24 08:00', type: '母乳', amount: null, createdAt: 1 },
        ],
        sleep: [],
        diaper: [],
      },
    })
    const day = loadDay('2026-10-24')
    expect(day.milk).toHaveLength(1)
    expect(day.food).toEqual([])
    expect(day.medicine).toEqual([])
    expect(day.supplement).toEqual([])
  })

  it('validates supplement inputs', () => {
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: ' 维生素D ',
        amount: '',
        note: '',
      })
    ).toBe('')
    expect(validateSupplement({ time: '', name: '维生素D' })).toContain('时间')
    expect(validateSupplement({ time: '2026-10-24 08:00', name: '' })).toContain(
      '补剂名称'
    )
    expect(
      validateSupplement({ time: '2026-10-24 08:00', name: 'x'.repeat(31) })
    ).toContain('补剂名称')
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: '维生素D',
        amount: 'x'.repeat(21),
      })
    ).toContain('用量')
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: '维生素D',
        note: 'x'.repeat(201),
      })
    ).toContain('备注')
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: 'x'.repeat(30),
        amount: 'x'.repeat(20),
        note: 'x'.repeat(200),
      })
    ).toBe('')
    expect(
      validateSupplement({ time: '2026-10-24 08:00', name: '   ' })
    ).toContain('补剂名称')
  })

  it('stores supplement records separately from medicine', () => {
    const medicine = addRecord(
      'medicine',
      { time: '2026-10-24 09:00', name: '退烧药', amount: '', note: '' },
      1
    )
    const supplement = addRecord(
      'supplement',
      { time: '2026-10-24 10:00', name: ' 维生素D ', amount: '1 滴', note: '' },
      2
    )
    expect(medicine.ok).toBe(true)
    expect(supplement.ok).toBe(true)
    expect(supplement.record.name).toBe('维生素D')

    const day = loadDay('2026-10-24')
    expect(day.medicine).toHaveLength(1)
    expect(day.supplement).toHaveLength(1)

    expect(
      removeRecord('supplement', supplement.record.id, '2026-10-24').ok
    ).toBe(true)
    expect(loadDay('2026-10-24').supplement).toHaveLength(0)
    expect(loadDay('2026-10-24').medicine).toHaveLength(1)
  })

  it('drops the day when the last record of any kind is removed', () => {
    const medicine = addRecord(
      'medicine',
      { time: '2026-10-24 09:00', name: '退烧药', amount: '', note: '' },
      1
    )
    expect(removeRecord('medicine', medicine.record.id, '2026-10-24').ok).toBe(true)
    expect(JSON.parse(store[recordsKey('2026-10')])).toEqual({})
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual([])
  })

  it('summarizes recent days for every record kind', () => {
    addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '100' }, 1)
    addRecord('milk', { time: '2026-10-24 12:00', type: '配方奶', amount: '120' }, 2)
    addRecord('sleep', { start: '2026-10-24 23:00', end: '2026-10-25 01:30' }, 3)
    addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '正常', shape: '糊状' }, 4)
    addRecord('diaper', { time: '2026-10-24 11:00', type: '小便', color: '正常' }, 5)
    addRecord(
      'food',
      { time: '2026-10-24 10:00', name: '米糊', amount: '', reaction: '喜欢', note: '' },
      6
    )
    addRecord(
      'food',
      { time: '2026-10-24 15:00', name: '蛋黄', amount: '', reaction: '异常', note: '' },
      7
    )
    addRecord('supplement', { time: '2026-10-24 08:00', name: '维生素D', amount: '', note: '' }, 8)
    addRecord('supplement', { time: '2026-10-24 09:00', name: '维生素D', amount: '', note: '' }, 9)
    addRecord('supplement', { time: '2026-10-24 10:00', name: '钙', amount: '', note: '' }, 10)
    addRecord('medicine', { time: '2026-10-24 08:00', name: '退烧药', amount: '', note: '' }, 11)
    addRecord('medicine', { time: '2026-10-24 09:00', name: '益生菌', amount: '', note: '' }, 12)
    addRecord('medicine', { time: '2026-10-24 10:00', name: '止咳药', amount: '', note: '' }, 13)

    const day = loadDay('2026-10-24')
    expect(summarizeRecentDay('milk', day)).toMatchObject({
      count: 2,
      hasData: true,
      text: '220 ml · 2 次',
    })
    expect(summarizeRecentDay('sleep', day).text).toBe('2 小时 30 分钟 · 1 次')
    expect(summarizeRecentDay('diaper', day)).toMatchObject({ count: 2, text: '2 次' })
    expect(summarizeRecentDay('food', day).text).toBe('2 次 · 异常 1 次')
    expect(summarizeRecentDay('supplement', day).text).toBe('钙、维生素D · 3 次')
    expect(summarizeRecentDay('medicine', day).text).toBe('止咳药、益生菌 等 · 3 次')
  })

  it('marks milk days without amounts and empty kinds', () => {
    addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' }, 1)
    const day = loadDay('2026-10-24')
    expect(summarizeRecentDay('milk', day)).toMatchObject({
      count: 1,
      text: '1 次 · 未记录奶量',
    })

    const empty = loadDay('2026-10-25')
    for (const kind of ['milk', 'sleep', 'diaper', 'food', 'medicine', 'supplement']) {
      expect(summarizeRecentDay(kind, empty)).toEqual({
        count: 0,
        hasData: false,
        text: '未记录',
      })
    }
  })

  it('loads recent days with full day data and summaries', () => {
    addRecord('milk', { time: '2026-09-28 08:00', type: '配方奶', amount: '100' }, 1)
    addRecord('milk', { time: '2026-09-28 12:00', type: '母乳', amount: '' }, 2)
    addRecord('milk', { time: '2026-10-01 09:00', type: '配方奶', amount: '120' }, 3)

    const recent = loadRecentDays(7, new Date(2026, 9, 1))
    expect(recent.map((item) => item.date)).toEqual([
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ])

    const sep28 = recent.find((item) => item.date === '2026-09-28')
    expect(sep28.day.milk).toHaveLength(2)
    expect(sep28.summary).toMatchObject({ milkCount: 2, milkAmount: 100 })

    const oct01 = recent.find((item) => item.date === '2026-10-01')
    expect(oct01.summary.milkAmount).toBe(120)
    expect(recent[0].day.milk).toEqual([])
  })

  it('validates diaper shape and note', () => {
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '小便', color: '正常', shape: '水样' })
    ).toBe('')
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常', shape: '糊状' })
    ).toBe('')
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常' })
    ).toBe('请选择排便形状')
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常', shape: '很干' })
    ).toBe('请选择排便形状')
    expect(
      validateDiaper({
        time: '2026-10-24 08:00',
        type: '大便',
        color: '正常',
        shape: '糊状',
        note: 'x'.repeat(201),
      })
    ).toBe('备注最多 200 个字')
  })

  it('stores diaper shape and note, ignoring shape for urine', () => {
    const stool = addRecord(
      'diaper',
      {
        time: '2026-10-24 09:00',
        type: '大便',
        color: '正常',
        shape: '成形',
        note: '  有点干  ',
      },
      1
    )
    expect(stool.ok).toBe(true)
    expect(stool.record).toMatchObject({ shape: '成形', note: '有点干' })

    const urine = addRecord(
      'diaper',
      { time: '2026-10-24 10:00', type: '小便', color: '正常', shape: '水样', note: '' },
      2
    )
    expect(urine.ok).toBe(true)
    expect(urine.record.shape).toBe('')
    expect(urine.record.note).toBe('')
  })

  it('loads legacy diaper records without shape or note', () => {
    store[recordsKey('2026-10')] = JSON.stringify({
      '2026-10-24': {
        diaper: [
          { id: 'old-1', time: '2026-10-24 09:00', type: '大便', color: '正常', createdAt: 1 },
        ],
      },
    })
    const day = loadDay('2026-10-24')
    expect(day.diaper).toHaveLength(1)
    expect(summarizeRecentDay('diaper', day).text).toBe('1 次')
  })
})
