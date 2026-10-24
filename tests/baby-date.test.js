import { describe, it, expect } from 'vitest'
import {
  todayKey,
  formatDateTime,
  monthKey,
  parseLocalDate,
  parseLocalDateTime,
  ageInfo,
  durationMinutes,
  formatDuration,
  formatMonthAge,
  isFutureDate,
} from '../src/utils/baby/date.js'
import { recordsKey, isBabyKey } from '../src/utils/baby/keys.js'

describe('baby date helpers', () => {
  it('formats local dates without UTC shift', () => {
    const late = new Date(2026, 9, 24, 23, 30)
    const early = new Date(2026, 9, 24, 0, 30)
    expect(todayKey(late)).toBe('2026-10-24')
    expect(todayKey(early)).toBe('2026-10-24')
    expect(formatDateTime(late)).toBe('2026-10-24 23:30')
    expect(monthKey(late)).toBe('2026-10')
    expect(monthKey('2026-10-24 08:00')).toBe('2026-10')
  })

  it('parses valid local dates and rejects impossible dates', () => {
    expect(parseLocalDate('2026-02-28')).toBeInstanceOf(Date)
    expect(parseLocalDate('2026-02-30')).toBe(null)
    expect(parseLocalDate('2026-2-3')).toBe(null)
    expect(parseLocalDateTime('2026-10-24 08:05').getMinutes()).toBe(5)
    expect(parseLocalDateTime('2026-10-24T08:05')).toBe(null)
  })

  it('computes age in months and ignores day difference', () => {
    const now = new Date(2026, 9, 24)
    expect(ageInfo('2025-10-24', now)).toMatchObject({
      years: 1,
      months: 0,
      totalMonths: 12,
      text: '1 岁 0 个月',
    })
    expect(ageInfo('2026-08-25', now)).toMatchObject({ totalMonths: 2, text: '2 个月' })
    expect(ageInfo('2026-10-25', now)).toBe(null)
    expect(ageInfo('', now)).toBe(null)
  })

  it('computes and formats durations', () => {
    expect(durationMinutes('2026-10-24 23:00', '2026-10-25 01:30')).toBe(150)
    expect(durationMinutes('bad', '2026-10-25 01:30')).toBe(0)
    expect(formatDuration(150)).toBe('2 小时 30 分钟')
    expect(formatDuration(120)).toBe('2 小时')
    expect(formatDuration(45)).toBe('45 分钟')
  })

  it('formats month ages', () => {
    expect(formatMonthAge(0)).toBe('出生时')
    expect(formatMonthAge(6)).toBe('6 月龄')
    expect(formatMonthAge(18)).toBe('1 岁 6 个月')
    expect(formatMonthAge(48)).toBe('4 岁')
    expect(formatMonthAge(null)).toBe('未设置')
  })

  it('detects future dates', () => {
    const now = new Date(2026, 9, 24, 12, 0)
    expect(isFutureDate('2026-10-25', now)).toBe(true)
    expect(isFutureDate('2026-10-24', now)).toBe(false)
    expect(isFutureDate('', now)).toBe(false)
  })

  it('builds record keys and prefixes', () => {
    expect(recordsKey('2026-10')).toBe('baby.records.v1.2026-10')
    expect(isBabyKey('baby.growth.v1')).toBe(true)
    expect(isBabyKey('tools.todos.v1')).toBe(false)
  })
})
