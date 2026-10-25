import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ageInfo,
  durationMinutes,
  formatDateTime,
  formatDuration,
  formatMonthAge,
  isFutureDate,
  parseLocalDate,
  parseLocalDateTime,
} from '../src/utils/baby/date.js'
import {
  addRecord,
  loadDay,
  loadRecentMilkSummary,
  removeRecord,
  summarizeDay,
  validateMilk,
} from '../src/utils/baby/records.js'
import {
  chartPoints,
  loadGrowth,
  removeGrowth,
  upsertGrowth,
  validateGrowth,
} from '../src/utils/baby/growth.js'
import {
  createBuiltinVaccines,
  addCustomVaccine,
  groupVaccines,
  loadVaccines,
  nextVaccine,
  removeCustomVaccine,
  setVaccineDone,
  vaccineStatus,
} from '../src/utils/baby/vaccines.js'
import {
  addMilestone,
  addNote,
  loadMilestones,
  loadNotes,
  removeMilestone,
  setMood,
} from '../src/utils/baby/journal.js'
import { loadProfile, saveProfile, validateProfile } from '../src/utils/baby/profile.js'
import {
  MAX_IMPORT_BYTES,
  exportFileName,
  listRecordMonths,
  validateImportPayload,
} from '../src/utils/baby/backup.js'
import { readStorage, writeStorage } from '../src/utils/storage.js'
import {
  GROWTH_KEY,
  MILESTONES_KEY,
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

function tomorrowKey() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const pad = (value) => String(value).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

describe('date boundaries', () => {
  it('accepts only real calendar dates including leap day', () => {
    expect(parseLocalDate('2024-02-29')).toBeInstanceOf(Date)
    expect(parseLocalDate('2023-02-29')).toBe(null)
    expect(parseLocalDate('2026-04-31')).toBe(null)
    expect(parseLocalDate('2026-00-10')).toBe(null)
    expect(parseLocalDate('2026-13-01')).toBe(null)
    expect(parseLocalDate('0000-01-01')).toBe(null)
  })

  it('accepts 00:00 and 23:59 but rejects rolled-over times', () => {
    expect(parseLocalDateTime('2026-10-24 00:00')).toBeInstanceOf(Date)
    expect(parseLocalDateTime('2026-10-24 23:59')).toBeInstanceOf(Date)
    expect(parseLocalDateTime('2026-10-24 24:00')).toBe(null)
    expect(parseLocalDateTime('2026-10-24 08:60')).toBe(null)
    expect(parseLocalDateTime('2024-02-29 01:00')).toBeInstanceOf(Date)
    expect(parseLocalDateTime('2023-02-29 01:00')).toBe(null)
  })

  it('pads formatted values', () => {
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02 03:04')
  })

  it('handles duration and month-age boundaries', () => {
    expect(durationMinutes('2026-10-24 08:00', '2026-10-24 08:00')).toBe(0)
    expect(durationMinutes('2026-10-24 09:00', '2026-10-24 08:00')).toBe(0)
    expect(durationMinutes('2026-12-31 23:30', '2027-01-01 00:30')).toBe(60)
    expect(formatDuration(0)).toBe('0 分钟')
    expect(formatDuration(59)).toBe('59 分钟')
    expect(formatDuration(60)).toBe('1 小时')
    expect(formatDuration(61)).toBe('1 小时 1 分钟')
    expect(formatDuration(-5)).toBe('0 分钟')
    expect(formatDuration(Infinity)).toBe('0 分钟')
    expect(formatMonthAge(11)).toBe('11 月龄')
    expect(formatMonthAge(12)).toBe('1 岁')
    expect(formatMonthAge(13)).toBe('1 岁 1 个月')
    expect(formatMonthAge(24)).toBe('2 岁')
    expect(formatMonthAge(-1)).toBe('未设置')
    expect(formatMonthAge(12.5)).toBe('未设置')
  })

  it('computes age at month boundaries', () => {
    const now = new Date(2026, 9, 24)
    expect(ageInfo('2026-10-24', now)).toMatchObject({ totalMonths: 0, text: '0 个月' })
    expect(ageInfo('2025-11-24', now)).toMatchObject({ totalMonths: 11, text: '11 个月' })
    expect(ageInfo('2025-10-24', now)).toMatchObject({ totalMonths: 12, text: '1 岁 0 个月' })
    expect(ageInfo('2024-11-24', now)).toMatchObject({ totalMonths: 23, text: '1 岁 11 个月' })
    expect(ageInfo('2024-10-24', now)).toMatchObject({ totalMonths: 24, text: '2 岁 0 个月' })
    expect(ageInfo('2026-10-25', now)).toBe(null)
  })

  it('compares future dates by calendar day', () => {
    const now = new Date(2026, 9, 24, 23, 59)
    expect(isFutureDate('2026-10-24', now)).toBe(false)
    expect(isFutureDate('2026-10-25', now)).toBe(true)
    expect(isFutureDate('2026-10-23', now)).toBe(false)
  })
})

describe('record boundaries', () => {
  it('accepts zero milk amount and treats blank amount as unset', () => {
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '0' })).toBe('')
    const zero = addRecord(
      'milk',
      { time: '2026-10-24 08:00', type: '母乳', amount: '0' },
      1
    )
    expect(zero.record.amount).toBe(0)

    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '   ' })).toBe('')
    const blank = addRecord(
      'milk',
      { time: '2026-10-24 09:00', type: '母乳', amount: '   ' },
      2
    )
    expect(blank.record.amount).toBe(null)
    expect(summarizeDay(loadDay('2026-10-24'))).toMatchObject({
      milkCount: 2,
      milkAmount: 0,
    })
  })

  it('rejects negative and decimal milk amounts', () => {
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '-1' })).toContain(
      '奶量'
    )
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '1.5' })).toContain(
      '奶量'
    )
  })

  it('handles sleep boundaries across month and year', () => {
    const added = addRecord(
      'sleep',
      { start: '2026-12-31 23:00', end: '2027-01-01 01:00' },
      1
    )
    expect(added.ok).toBe(true)
    expect(added.date).toBe('2026-12-31')
    expect(loadDay('2026-12-31').sleep).toHaveLength(1)
    expect(loadDay('2027-01-01').sleep).toHaveLength(0)
    expect(summarizeDay(loadDay('2026-12-31')).sleepMinutes).toBe(120)
  })

  it('rejects equal or reversed sleep times', () => {
    expect(
      addRecord('sleep', { start: '2026-10-24 08:00', end: '2026-10-24 08:00' }).error
    ).toContain('晚于')
    expect(
      addRecord('sleep', { start: '2026-10-24 09:00', end: '2026-10-24 08:00' }).error
    ).toContain('晚于')
  })

  it('rejects invalid removal arguments and invalid day lookups', () => {
    expect(removeRecord('milk', 'id', undefined)).toEqual({
      ok: false,
      error: '参数错误',
    })
    expect(loadDay('bad')).toEqual({ milk: [], sleep: [], diaper: [] })
  })

  it('builds a seven-day window across a year boundary', () => {
    addRecord('milk', { time: '2026-12-31 08:00', type: '配方奶', amount: '90' }, 1)
    const summary = loadRecentMilkSummary(7, new Date(2027, 0, 1))
    expect(summary.map((item) => item.date)).toEqual([
      '2026-12-26',
      '2026-12-27',
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
    ])
    expect(summary.find((item) => item.date === '2026-12-31')).toMatchObject({
      milkAmount: 90,
      hasMilkAmount: true,
    })
    expect(loadRecentMilkSummary(1, new Date(2027, 0, 1))).toHaveLength(1)
  })
})

describe('growth boundaries', () => {
  it('accepts inclusive height and weight limits', () => {
    expect(validateGrowth({ date: '2026-10-24', height: '20', weight: '0.5' })).toBe('')
    expect(validateGrowth({ date: '2026-10-24', height: '200', weight: '100' })).toBe('')
  })

  it('rejects values just outside the limits', () => {
    expect(validateGrowth({ date: '2026-10-24', height: '19.9', weight: '8' })).toContain(
      '20–200'
    )
    expect(validateGrowth({ date: '2026-10-24', height: '200.1', weight: '8' })).toContain(
      '20–200'
    )
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '0.4' })).toContain(
      '0.5–100'
    )
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '100.1' })).toContain(
      '0.5–100'
    )
  })

  it('stores decimal values as numbers and keeps createdAt on update', () => {
    const first = upsertGrowth(
      [],
      { date: '2026-10-01', height: '70.5', weight: '8.25' },
      1000
    )
    expect(first.list[0]).toMatchObject({ height: 70.5, weight: 8.25, createdAt: 1000 })
    const updated = upsertGrowth(
      first.list,
      { date: '2026-10-01', height: '71', weight: '8.5' },
      2000
    )
    expect(updated.list).toHaveLength(1)
    expect(updated.list[0]).toMatchObject({ height: 71, weight: 8.5, createdAt: 1000 })
  })

  it('handles unknown removals and non-numeric chart values', () => {
    const added = upsertGrowth([], { date: '2026-10-01', height: '70', weight: '8' }, 1)
    const result = removeGrowth(added.list, 'missing')
    expect(result.ok).toBe(true)
    expect(result.list).toHaveLength(1)
    expect(
      chartPoints(
        [
          { date: '2026-10-01', height: 70, weight: 8 },
          { date: '2026-10-02', height: 'x', weight: 8 },
        ],
        'height'
      )
    ).toEqual([{ date: '2026-10-01', value: 70 }])
  })
})

describe('vaccine boundaries', () => {
  it('accepts 0 and 216 months but rejects outside values', () => {
    expect(addCustomVaccine([], { name: 'a', type: '一类', month: '0' }).ok).toBe(true)
    expect(addCustomVaccine([], { name: 'a', type: '一类', month: '216' }).ok).toBe(true)
    expect(addCustomVaccine([], { name: 'a', type: '一类', month: '217' }).ok).toBe(false)
    expect(addCustomVaccine([], { name: 'a', type: '一类', month: '-1' }).ok).toBe(false)
    expect(addCustomVaccine([], { name: 'a', type: '一类', month: '1.5' }).ok).toBe(false)
  })

  it('bounds the custom vaccine name length', () => {
    expect(
      addCustomVaccine([], { name: 'a'.repeat(30), type: '一类', month: '' }).ok
    ).toBe(true)
    expect(
      addCustomVaccine([], { name: 'a'.repeat(31), type: '一类', month: '' }).error
    ).toBe('名称最多 30 个字')
  })

  it('computes status on the exact reference month', () => {
    expect(vaccineStatus({ done: false, month: 6 }, 5)).toMatchObject({ key: 'due' })
    expect(vaccineStatus({ done: false, month: 6 }, 6)).toMatchObject({ key: 'due' })
    expect(vaccineStatus({ done: false, month: 6 }, 7)).toMatchObject({ key: 'overdue' })
    expect(vaccineStatus({ done: true, month: null }, null)).toMatchObject({ key: 'done' })
  })

  it('keeps an existing date when marking done without a date', () => {
    const list = [
      { id: 'a', name: 'A', month: 0, type: '一类', done: true, date: '2026-10-20' },
    ]
    expect(setVaccineDone(list, 'a', true)[0].date).toBe('2026-10-20')
    expect(setVaccineDone(list, 'a', false)[0]).toMatchObject({ done: false, date: '' })
  })

  it('prefers type one when months tie and puts null months last', () => {
    const list = [
      { id: 'a', name: 'A', month: 6, type: '二类', done: false },
      { id: 'b', name: 'B', month: 6, type: '一类', done: false },
      { id: 'c', name: 'C', month: null, type: '一类', done: false },
    ]
    expect(nextVaccine(list, 5).id).toBe('b')
    expect(groupVaccines(list)[0].items[groupVaccines(list)[0].items.length - 1].month).toBe(
      null
    )
  })

  it('restores builtin vaccines when stored data is empty', () => {
    store[VACCINES_KEY] = '[]'
    const list = loadVaccines()
    expect(list).toHaveLength(29)
    expect(list.every((item) => item.builtin)).toBe(true)
  })

  it('keeps stored done state when filling missing builtins', () => {
    const builtins = createBuiltinVaccines()
    builtins[0] = { ...builtins[0], done: true, date: '2026-01-01' }
    store[VACCINES_KEY] = JSON.stringify([builtins[0]])
    const list = loadVaccines()
    expect(list).toHaveLength(29)
    expect(list.find((item) => item.id === builtins[0].id)).toMatchObject({
      done: true,
      date: '2026-01-01',
    })
  })

  it('rejects unknown and builtin removals', () => {
    expect(removeCustomVaccine([], 'missing').ok).toBe(false)
    const builtins = createBuiltinVaccines()
    expect(removeCustomVaccine(builtins, builtins[0].id).ok).toBe(false)
  })
})

describe('journal boundaries', () => {
  it('accepts exact title and note lengths and rejects one more', () => {
    expect(
      addMilestone({ date: '2026-10-24', title: 'a'.repeat(40), note: 'x'.repeat(200) }).ok
    ).toBe(true)
    expect(addMilestone({ date: '2026-10-24', title: 'a'.repeat(41), note: '' }).error).toBe(
      '标题最多 40 个字'
    )
    expect(
      addMilestone({ date: '2026-10-24', title: 'a', note: 'x'.repeat(201) }).error
    ).toBe('备注最多 200 个字')
  })

  it('accepts exact note content length and rejects one more', () => {
    expect(addNote({ date: '2026-10-24', content: 'x'.repeat(500) }).ok).toBe(true)
    expect(addNote({ date: '2026-10-24', content: 'x'.repeat(501) }).error).toBe(
      '内容最多 500 个字'
    )
  })

  it('rejects whitespace-only text and impossible dates', () => {
    expect(addMilestone({ date: '2026-10-24', title: '   ', note: '' }).error).toBe(
      '请输入标题'
    )
    expect(addNote({ date: '2026-10-24', content: '   ' }).error).toBe('请输入内容')
    expect(addMilestone({ date: '2026-02-29', title: 'a', note: '' }).error).toBe('请选择日期')
  })

  it('handles invalid moods and unknown removals', () => {
    expect(setMood('2026-02-29', 'happy').ok).toBe(false)
    expect(setMood('2026-10-24', 'unknown').ok).toBe(false)
    store[MILESTONES_KEY] = JSON.stringify([
      { id: 'a', date: '2026-10-24', title: 'ok', note: '', createdAt: 1 },
    ])
    expect(removeMilestone('missing').ok).toBe(true)
    expect(loadMilestones()).toHaveLength(1)
    store[NOTES_KEY] = JSON.stringify([
      { id: 'n', date: '2026-10-24', content: 'ok', createdAt: 1 },
    ])
    expect(loadNotes()).toHaveLength(1)
  })
})

describe('profile boundaries', () => {
  it('accepts a 20-character name and rejects 21', () => {
    expect(validateProfile({ name: 'a'.repeat(20), birthDate: '2025-01-01' })).toBe('')
    expect(validateProfile({ name: 'a'.repeat(21), birthDate: '2025-01-01' })).toBe(
      '昵称最多 20 个字'
    )
  })

  it('accepts today as birth date and rejects tomorrow', () => {
    const now = new Date()
    const pad = (value) => String(value).padStart(2, '0')
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    expect(validateProfile({ name: '宝宝', birthDate: today })).toBe('')
    expect(validateProfile({ name: '宝宝', birthDate: tomorrowKey() })).toBe(
      '出生日期不能晚于今天'
    )
  })

  it('truncates overlong stored names and normalizes gender', () => {
    store[PROFILE_KEY] = JSON.stringify({
      name: 'a'.repeat(25),
      birthDate: '',
      gender: 'other',
    })
    const profile = loadProfile()
    expect(profile.name).toHaveLength(20)
    expect(profile.gender).toBe('boy')
  })

  it('keeps createdAt on subsequent saves', () => {
    saveProfile({ name: '宝宝', birthDate: '2025-01-01', gender: 'girl' }, 1000)
    saveProfile({ name: '小满', birthDate: '2025-01-02', gender: 'girl' }, 2000)
    expect(loadProfile()).toMatchObject({ createdAt: 1000, updatedAt: 2000 })
  })
})

describe('backup and storage boundaries', () => {
  it('checks the import size before parsing and rejects one byte over', () => {
    expect(validateImportPayload('x'.repeat(MAX_IMPORT_BYTES)).error).toBe(
      '文件不是有效的 JSON'
    )
    expect(validateImportPayload('x'.repeat(MAX_IMPORT_BYTES + 1)).error).toBe(
      '文件超过 2MB 限制'
    )
  })

  it('rejects unsupported schema versions and wrong field types', () => {
    const base = {
      app: 'toolbox-baby',
      schemaVersion: 1,
      data: { profile: null, records: {}, growth: [], vaccines: [], milestones: [], moods: {}, notes: [] },
    }
    expect(validateImportPayload({ ...base, schemaVersion: 0 }).error).toBe('备份版本不支持')
    expect(validateImportPayload({ ...base, schemaVersion: 2 }).error).toBe('备份版本不支持')
    expect(
      validateImportPayload({ ...base, data: { ...base.data, records: [] } }).error
    ).toBe('日常记录格式不正确')
    expect(
      validateImportPayload({ ...base, data: { ...base.data, moods: [] } }).error
    ).toBe('心情记录格式不正确')
    expect(
      validateImportPayload({ ...base, data: { ...base.data, notes: null } }).error
    ).toBe('备份字段不完整')
  })

  it('ignores record keys that are not real months', () => {
    store[recordsKey('2026-10')] = '{}'
    store[recordsKey('2026-13')] = '{}'
    store[recordsKey('bad')] = '{}'
    expect(listRecordMonths()).toEqual(['2026-10'])
  })

  it('pads export file names', () => {
    expect(exportFileName(new Date(2026, 0, 2, 3, 4))).toBe(
      'baby-record-20260102-0304.json'
    )
  })

  it('handles circular writes and raw non-string storage', () => {
    const circular = {}
    circular.self = circular
    expect(writeStorage('circular', circular)).toBe(false)
    store.raw = { a: 1 }
    expect(readStorage('raw', null)).toEqual({ a: 1 })
    store.nullish = 'null'
    expect(readStorage('nullish', 'fallback')).toBe(null)
  })
})
