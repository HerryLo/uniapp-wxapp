import { describe, it, expect } from 'vitest'
import {
  toCents,
  toBasisPoints,
  validateAmount,
  validateRate,
  calcVat,
  formatCents,
  formatVatText,
} from '../src/utils/vat.js'

describe('vat', () => {
  it('parses amounts to cents with rounding', () => {
    expect(toCents('100')).toBe(10000)
    expect(toCents('100.5')).toBe(10050)
    expect(toCents('100.005')).toBe(10001)
    expect(toCents('0')).toBe(0)
    expect(toCents('abc')).toBe(null)
    expect(toCents('-1')).toBe(null)
  })

  it('parses rates to basis points', () => {
    expect(toBasisPoints('13')).toBe(1300)
    expect(toBasisPoints('0.5')).toBe(50)
    expect(toBasisPoints('100')).toBe(10000)
    expect(toBasisPoints('100.01')).toBe(null)
  })

  it('validates amounts and rates', () => {
    expect(validateAmount('')).toEqual({ error: '请输入金额' })
    expect(validateAmount('0')).toEqual({ error: '金额必须大于 0' })
    expect(validateAmount('100')).toEqual({ cents: 10000 })
    expect(validateRate('')).toEqual({ error: '请输入税率' })
    expect(validateRate('101')).toEqual({ error: '请输入 0–100 的税率' })
    expect(validateRate('13')).toEqual({ bp: 1300 })
  })

  it('calculates excluded to included', () => {
    expect(calcVat(10000, 1300, 'excluded')).toEqual({ netCents: 10000, taxCents: 1300, grossCents: 11300 })
    expect(calcVat(10000, 0, 'excluded')).toEqual({ netCents: 10000, taxCents: 0, grossCents: 10000 })
  })

  it('calculates included to excluded', () => {
    expect(calcVat(11300, 1300, 'included')).toEqual({ netCents: 10000, taxCents: 1300, grossCents: 11300 })
    expect(calcVat(10001, 1300, 'included')).toEqual({ netCents: 8850, taxCents: 1151, grossCents: 10001 })
  })

  it('formats cents and result text', () => {
    expect(formatCents(11300)).toBe('113.00')
    expect(formatCents(5)).toBe('0.05')
    expect(formatVatText({ net: '100.00', tax: '13.00', gross: '113.00' }))
      .toBe('不含税金额：100.00\n税额：13.00\n价税合计：113.00')
  })
})
