import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MAX_IMPORT_BYTES,
  buildExportPayload,
  validateImportPayload,
  backupCurrent,
  restoreData,
  clearBabyData,
  exportFileName,
} from '../src/package-baby/utils/backup.js'
import {
  BACKUP_KEY,
  GROWTH_KEY,
  META_KEY,
  MILESTONES_KEY,
  MOODS_KEY,
  MOM_KEY,
  NOTES_KEY,
  PROFILE_KEY,
  TRAVEL_KEY,
  VACCINES_KEY,
  recordsKey,
} from '../src/utils/baby/keys.js'
import { createBuiltinVaccines } from '../src/utils/baby/vaccines.js'
import { loadMomEntries } from '../src/package-baby/utils/mom.js'
import { loadTravels } from '../src/package-baby/utils/travel.js'
import { loadDay } from '../src/utils/baby/records.js'

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

function seed() {
  store[PROFILE_KEY] = JSON.stringify({
    name: '小满',
    birthDate: '2025-01-02',
    gender: 'girl',
    createdAt: 1,
    updatedAt: 1,
  })
  store[recordsKey('2026-10')] = JSON.stringify({
    '2026-10-24': {
      milk: [{ id: 'm1', time: '2026-10-24 08:00', type: '母乳', amount: null, createdAt: 1 }],
      sleep: [],
      diaper: [],
      food: [
        {
          id: 'f1',
          time: '2026-10-24 10:00',
          name: '米糊',
          amount: '半碗',
          reaction: '喜欢',
          note: '',
          createdAt: 1,
        },
      ],
      medicine: [
        {
          id: 'med1',
          time: '2026-10-24 11:00',
          name: '维生素',
          amount: '5 滴',
          note: '',
          createdAt: 1,
        },
      ],
    },
  })
  store[GROWTH_KEY] = JSON.stringify([
    { id: 'g1', date: '2026-10-01', height: 75, weight: 9.5, createdAt: 1 },
  ])
  const vaccines = createBuiltinVaccines()
  vaccines[0] = { ...vaccines[0], done: true, date: '2025-01-02' }
  store[VACCINES_KEY] = JSON.stringify(vaccines)
  store[MILESTONES_KEY] = JSON.stringify([
    { id: 'ms1', date: '2026-06-01', title: '第一次翻身', note: '', createdAt: 1 },
  ])
  store[MOODS_KEY] = JSON.stringify({ '2026-10-24': 'happy' })
  store[NOTES_KEY] = JSON.stringify([
    { id: 'n1', date: '2026-10-24', content: '今天很乖', createdAt: 1 },
  ])
  store[MOM_KEY] = JSON.stringify([
    {
      date: '2026-10-24',
      sleepHours: 6.5,
      mood: 'calm',
      condition: '腰酸',
      note: '',
      createdAt: 1,
      updatedAt: 1,
    },
  ])
  store[TRAVEL_KEY] = JSON.stringify([
    {
      id: 't1',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      place: '杭州',
      note: '西湖',
      createdAt: 1,
    },
  ])
}

describe('baby backup', () => {
  it('builds a complete export payload', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    expect(payload).toMatchObject({
      app: 'toolbox-baby',
      schemaVersion: 1,
      exportedAt: '2026-10-24 10:05',
    })
    expect(payload.data.profile.name).toBe('小满')
    expect(payload.data.records['2026-10']).toBeTruthy()
    expect(payload.data.growth).toHaveLength(1)
    expect(payload.data.vaccines).toHaveLength(29)
    expect(payload.data.vaccines.find((item) => item.done)).toMatchObject({
      id: 'builtin-hep-b-1',
      done: true,
      date: '2025-01-02',
    })
    expect(payload.data.milestones).toHaveLength(1)
    expect(payload.data.moods['2026-10-24']).toBe('happy')
    expect(payload.data.notes).toHaveLength(1)
  })

  it('validates import payloads', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    expect(validateImportPayload(JSON.stringify(payload)).ok).toBe(true)
    expect(validateImportPayload('{oops')).toEqual({
      ok: false,
      error: '文件不是有效的 JSON',
    })
    expect(validateImportPayload({ app: 'x', schemaVersion: 1, data: {} }).error).toBe(
      '不是宝宝记录备份文件'
    )
    expect(validateImportPayload({ ...payload, schemaVersion: 2 }).error).toBe(
      '备份版本不支持'
    )
    expect(
      validateImportPayload({ ...payload, data: { ...payload.data, growth: null } }).ok
    ).toBe(false)
    expect(validateImportPayload('x'.repeat(MAX_IMPORT_BYTES + 1)).error).toBe(
      '文件超过 2MB 限制'
    )
  })

  it('enforces the import limit by UTF-8 byte size', () => {
    const raw = '宝'.repeat(Math.ceil(MAX_IMPORT_BYTES / 3))
    expect(raw.length).toBeLessThanOrEqual(MAX_IMPORT_BYTES)
    expect(validateImportPayload(raw)).toEqual({
      ok: false,
      error: '文件超过 2MB 限制',
    })
  })

  it('backs up current data before restoring and replaces baby data only', () => {
    seed()
    store[recordsKey('2026-09')] = JSON.stringify({
      '2026-09-01': { milk: [], sleep: [], diaper: [] },
    })
    const imported = {
      profile: {
        name: '新宝宝',
        birthDate: '2026-01-01',
        gender: 'boy',
        createdAt: 2,
        updatedAt: 2,
      },
      records: {
        '2026-11': { '2026-11-01': { milk: [], sleep: [], diaper: [] } },
      },
      growth: [],
      vaccines: [],
      milestones: [],
      moods: {},
      notes: [],
    }
    const res = restoreData(imported, new Date(2026, 9, 25, 9, 0))
    expect(res.ok).toBe(true)
    const backup = JSON.parse(store[BACKUP_KEY])
    expect(backup.data.profile.name).toBe('小满')
    expect(JSON.parse(store[PROFILE_KEY]).name).toBe('新宝宝')
    expect(store[recordsKey('2026-10')]).toBeUndefined()
    expect(store[recordsKey('2026-09')]).toBeUndefined()
    expect(store[recordsKey('2026-11')]).toBeTruthy()
    expect(JSON.parse(store[META_KEY])).toEqual({ schemaVersion: 1 })
  })

  it('does not restore when the backup write fails', () => {
    seed()
    const originalSet = uni.setStorageSync
    uni.setStorageSync = (key, value) => {
      if (key === BACKUP_KEY) throw new Error('fail')
      originalSet(key, value)
    }
    const res = restoreData({ profile: null, records: {}, growth: [], vaccines: [], milestones: [], moods: {}, notes: [] })
    expect(res).toEqual({ ok: false, error: '备份当前数据失败，已取消导入' })
    expect(JSON.parse(store[PROFILE_KEY]).name).toBe('小满')
  })

  it('exports and restores mom and travel data', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    expect(payload.data.mom).toHaveLength(1)
    expect(payload.data.travel).toHaveLength(1)

    const imported = {
      profile: null,
      records: {},
      growth: [],
      vaccines: [],
      milestones: [],
      moods: {},
      notes: [],
      mom: [
        {
          date: '2026-01-01',
          sleepHours: 8,
          mood: 'happy',
          condition: '',
          note: '',
          createdAt: 2,
          updatedAt: 2,
        },
      ],
      travel: [
        {
          id: 't2',
          startDate: '2026-02-01',
          endDate: '2026-02-02',
          place: '苏州',
          note: '',
          createdAt: 2,
        },
      ],
    }
    const res = restoreData(imported, new Date(2026, 9, 25, 9, 0))
    expect(res.ok).toBe(true)
    expect(loadMomEntries()[0].mood).toBe('happy')
    expect(loadTravels()[0].place).toBe('苏州')
  })

  it('round-trips food and medicine records', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    const day = payload.data.records['2026-10']['2026-10-24']
    expect(day.food).toHaveLength(1)
    expect(day.medicine).toHaveLength(1)

    const res = restoreData(payload.data, new Date(2026, 9, 25, 9, 0))
    expect(res.ok).toBe(true)
    expect(loadDay('2026-10-24').food).toHaveLength(1)
    expect(loadDay('2026-10-24').medicine).toHaveLength(1)
  })

  it('removes record months when storage info fails during cleanup', () => {
    seed()
    let calls = 0
    uni.getStorageInfoSync = () => {
      calls += 1
      if (calls > 1) throw new Error('fail')
      return { keys: Object.keys(store) }
    }
    const res = restoreData({
      profile: null,
      records: {},
      growth: [],
      vaccines: [],
      milestones: [],
      moods: {},
      notes: [],
    })
    expect(res.ok).toBe(true)
    expect(store[recordsKey('2026-10')]).toBeUndefined()
  })

  it('accepts old backups without mom and travel fields', () => {
    const payload = {
      app: 'toolbox-baby',
      schemaVersion: 1,
      exportedAt: '2026-10-24 10:05',
      data: {
        profile: null,
        records: {},
        growth: [],
        vaccines: [],
        milestones: [],
        moods: {},
        notes: [],
      },
    }
    expect(validateImportPayload(payload).ok).toBe(true)
  })

  it('clears all baby data and keeps tools data', () => {
    seed()
    backupCurrent()
    store['tools.todos.v1'] = '[]'
    expect(clearBabyData()).toBe(true)
    expect(store[BACKUP_KEY]).toBeUndefined()
    expect(store[PROFILE_KEY]).toBeUndefined()
    expect(store[recordsKey('2026-10')]).toBeUndefined()
    expect(store['tools.todos.v1']).toBe('[]')
  })

  it('builds the export file name', () => {
    expect(exportFileName(new Date(2026, 9, 24, 10, 5))).toBe(
      'baby-record-20261024-1005.json'
    )
  })
})
