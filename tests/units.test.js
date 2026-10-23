import { describe, it, expect } from 'vitest'
import { UNIT_GROUPS, convertUnit, formatUnitValue } from '../src/utils/units.js'

describe('units', () => {
  it('exposes five groups', () => {
    expect(Object.keys(UNIT_GROUPS)).toEqual(['length', 'weight', 'temperature', 'storage', 'area'])
  })

  it('converts length and weight', () => {
    expect(convertUnit('length', 1, 'km', 'm')).toBeCloseTo(1000)
    expect(convertUnit('length', 1, 'm', 'cm')).toBeCloseTo(100)
    expect(convertUnit('weight', 1, 'kg', 'jin')).toBeCloseTo(2)
  })

  it('converts temperature', () => {
    expect(convertUnit('temperature', 100, 'c', 'f')).toBeCloseTo(212)
    expect(convertUnit('temperature', 0, 'c', 'k')).toBeCloseTo(273.15)
    expect(convertUnit('temperature', 32, 'f', 'c')).toBeCloseTo(0)
  })

  it('converts storage and area', () => {
    expect(convertUnit('storage', 1, 'gb', 'mb')).toBe(1024)
    expect(convertUnit('area', 1, 'hectare', 'm2')).toBe(10000)
  })

  it('returns null for unknown units', () => {
    expect(convertUnit('length', 1, 'x', 'm')).toBe(null)
  })

  it('formats values to six decimals without trailing zeros', () => {
    expect(formatUnitValue(666.6666666666666)).toBe('666.666667')
    expect(formatUnitValue(1.5)).toBe('1.5')
    expect(formatUnitValue(0.0000004)).toBe('0')
  })
})
