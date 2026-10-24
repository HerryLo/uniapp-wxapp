import { describe, it, expect } from 'vitest'
import { dateToTimestamp, formatDateValue, formatTimeValue } from '../src/utils/timestamp.js'

describe('timestamp helpers', () => {
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

  it('formats picker values', () => {
    const d = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDateValue(d)).toBe('2026-01-02')
    expect(formatTimeValue(d)).toBe('03:04')
  })
})
