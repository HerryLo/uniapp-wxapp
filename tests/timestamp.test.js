import { describe, it, expect } from 'vitest'
import {
  formatLocal,
  formatUtc,
  timestampToDate,
  dateToTimestamp,
  nowTimestamp,
  formatDateValue,
  formatTimeValue,
} from '../src/utils/timestamp.js'

describe('timestamp', () => {
  it('formats local and UTC time', () => {
    const localMs = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(formatLocal(localMs)).toBe('2026-01-02 03:04:05')
    expect(formatUtc(Date.UTC(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02 03:04:05 UTC')
  })

  it('converts seconds and milliseconds timestamps', () => {
    const ms = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(timestampToDate(String(Math.floor(ms / 1000)), 's').local).toBe('2026-01-02 03:04:05')
    expect(timestampToDate(String(ms), 'ms').local).toBe('2026-01-02 03:04:05')
  })

  it('rejects invalid timestamps', () => {
    expect(timestampToDate('abc', 's')).toEqual({ error: '请输入整数时间戳' })
    expect(timestampToDate('99999999999999999999', 'ms').error).toBe('时间戳超出范围')
  })

  it('converts date and time to timestamps', () => {
    const ms = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(dateToTimestamp('2026-01-02', '03:04:05')).toEqual({
      seconds: Math.floor(ms / 1000),
      milliseconds: ms,
    })
  })

  it('rejects invalid dates and times', () => {
    expect(dateToTimestamp('2026-02-30', '10:00')).toEqual({ error: '日期无效' })
    expect(dateToTimestamp('2026-02-01', '25:00')).toEqual({ error: '时间无效' })
  })

  it('formats picker values and current timestamp', () => {
    const d = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDateValue(d)).toBe('2026-01-02')
    expect(formatTimeValue(d)).toBe('03:04')
    expect(Number.isInteger(nowTimestamp('s'))).toBe(true)
    expect(nowTimestamp('ms')).toBeGreaterThan(0)
  })
})
