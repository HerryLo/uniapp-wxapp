import { describe, it, expect } from 'vitest'
import { parseRadix, convertRadix } from '../src/utils/radix.js'

describe('radix', () => {
  it('converts standard bases', () => {
    expect(convertRadix('255', 10)).toEqual({
      bin: '11111111',
      oct: '377',
      dec: '255',
      hex: 'FF',
    })
    expect(convertRadix('FF', 16)).toEqual({
      bin: '11111111',
      oct: '377',
      dec: '255',
      hex: 'FF',
    })
  })

  it('supports custom bases, negatives and big integers', () => {
    expect(convertRadix('z', 36).dec).toBe('35')
    expect(convertRadix('-10', 10).bin).toBe('-1010')
    expect(convertRadix('123456789012345678901234567890', 10).hex)
      .toBe('18EE90FF6C373E0EE4E3F0AD2')
  })

  it('rejects invalid input', () => {
    expect(convertRadix('2', 2)).toEqual({ error: '输入包含非 2 进制字符' })
    expect(convertRadix('1.5', 10)).toEqual({ error: '暂不支持小数' })
    expect(convertRadix('', 10)).toEqual({ error: '请输入数值' })
    expect(parseRadix('g', 16)).toEqual({ error: '输入包含非 16 进制字符' })
  })
})
