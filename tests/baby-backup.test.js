import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MAX_IMPORT_BYTES,
  buildExportPayload,
  validateImportPayload,
  backupCurrent,
  restoreData,
  clearBabyData,
  exportFileName,
} from '../src/utils/baby/backup.js'
import {
  BACKUP_KEY,
  GROWTH_KEY,
  META_KEY,
  MILESTONES_KEY,
  MOODS_KEY,
  NOTES_KEY,
  PROFILE_KEY,
  VACCINES_KEY,
  recordsKey,
} from '../src/utils/baby/keys.js'

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
    },
  })
  store[GROWTH_KEY] = JSON.stringify([
    { id: 'g1', date: '2026-10-01', height: 75, weight: 9.5, createdAt: 1 },
  ])
  store[VACCINES_KEY] = JSON.stringify([
    {
      id: 'v1',
      name: '乙肝疫苗（第1剂）',
      month: 0,
      type: '一类',
      done: true,
      date: '2025-01-02',
      builtin: true,
    },
  ])
  store[MILESTONES_KEY] = JSON.stringify([
    { id: 'ms1', date: '2026-06-01', title: '第一次翻身', note: '', createdAt: 1 },
  ])
  store[MOODS_KEY] = JSON.stringify({ '2026-10-24': 'happy' })
  store[NOTES_KEY] = JSON.stringify([
    { id: 'n1', date: '2026-10-24', content: '今天很乖', createdAt: 1 },
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
    expect(payload.data.vaccines).toHaveLength(1)
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
