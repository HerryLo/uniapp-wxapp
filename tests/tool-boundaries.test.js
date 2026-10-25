import { describe, it, expect } from 'vitest'
import {
  calcVat,
  formatCents,
  toBasisPoints,
  toCents,
  validateAmount,
  validateRate,
} from '../src/utils/vat.js'
import { convertUnit, formatUnitValue } from '../src/utils/units.js'
import { convertRadix, parseRadix } from '../src/utils/radix.js'
import { countText, dedupeLines, toTitleCaseText } from '../src/utils/text.js'

describe('vat boundaries', () => {
  it('rounds half a cent and rejects sub-cent values', () => {
    expect(toCents('0.004')).toBe(0)
    expect(toCents('0.005')).toBe(1)
    expect(toCents('100.')).toBe(10000)
    expect(toCents('0')).toBe(0)
  })

  it('accepts the exact maximum amount and rejects one cent more', () => {
    expect(validateAmount('1000000000')).toEqual({ cents: 100000000000 })
    expect(validateAmount('1000000000.01')).toEqual({ error: '金额过大' })
  })

  it('accepts rates from 0 to 100', () => {
    expect(validateRate('0')).toEqual({ bp: 0 })
    expect(validateRate('100')).toEqual({ bp: 10000 })
    expect(toBasisPoints('100.01')).toBe(null)
    expect(validateRate('100.01')).toEqual({ error: '请输入 0–100 的税率' })
  })

  it('handles 0% and 100% calculations', () => {
    expect(calcVat(10000, 0, 'included')).toEqual({
      netCents: 10000,
      taxCents: 0,
      grossCents: 10000,
    })
    expect(calcVat(10000, 10000, 'included')).toEqual({
      netCents: 5000,
      taxCents: 5000,
      grossCents: 10000,
    })
    expect(formatCents(1)).toBe('0.01')
  })
})

describe('unit boundaries', () => {
  it('converts absolute zero and negative temperatures', () => {
    expect(convertUnit('temperature', -273.15, 'c', 'k')).toBeCloseTo(0)
    expect(convertUnit('temperature', -40, 'c', 'f')).toBeCloseTo(-40)
  })

  it('returns the same value for identical units', () => {
    expect(convertUnit('length', 12.34, 'm', 'm')).toBeCloseTo(12.34)
  })

  it('handles unknown groups and non-finite formatting', () => {
    expect(convertUnit('unknown', 1, 'a', 'b')).toBe(null)
    expect(formatUnitValue(Infinity)).toBe('')
    expect(formatUnitValue(NaN)).toBe('')
    expect(formatUnitValue(-0)).toBe('0')
  })
})

describe('radix boundaries', () => {
  it('accepts base 2 and base 36 limits', () => {
    expect(convertRadix('10', 2).dec).toBe('2')
    expect(convertRadix('z', 36).dec).toBe('35')
    expect(convertRadix('+10', 2).dec).toBe('2')
  })

  it('accepts 512 characters and rejects 513', () => {
    expect(parseRadix('1'.repeat(512), 2).value).toBeTypeOf('bigint')
    expect(parseRadix('1'.repeat(513), 2)).toEqual({ error: '输入过长' })
  })

  it('rejects a sign without digits', () => {
    expect(parseRadix('-', 10)).toEqual({ error: '请输入数值' })
    expect(parseRadix('+', 10)).toEqual({ error: '请输入数值' })
  })
})

describe('text boundaries', () => {
  it('counts empty and newline-only text', () => {
    expect(countText('')).toEqual({ lines: 0, chars: 0 })
    expect(countText('\n')).toEqual({ lines: 2, chars: 0 })
    expect(countText('\r')).toEqual({ lines: 1, chars: 0 })
  })

  it('dedupes CRLF input and skips whitespace-only lines', () => {
    expect(dedupeLines('a\r\nb\r\na')).toBe('a\nb')
    expect(dedupeLines('a\n   \nb')).toBe('a\nb')
    expect(dedupeLines(' A \na', { ignoreCase: true, trim: true })).toBe('A')
  })

  it('title-cases words after multiple spaces', () => {
    expect(toTitleCaseText('  hello   world ')).toBe('  Hello   World ')
  })
})
