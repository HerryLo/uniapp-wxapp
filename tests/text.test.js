import { describe, it, expect } from 'vitest'
import {
  dedupeLines,
  toUpperCaseText,
  toLowerCaseText,
  toTitleCaseText,
  countText,
} from '../src/utils/text.js'

describe('text', () => {
  it('dedupes lines preserving first occurrence order', () => {
    expect(dedupeLines('a\nb\na')).toBe('a\nb')
    expect(dedupeLines('a\n\nb\n')).toBe('a\nb')
  })

  it('can ignore case and trim', () => {
    expect(dedupeLines('A\na', { ignoreCase: true })).toBe('A')
    expect(dedupeLines(' a \na', { trim: true })).toBe('a')
    expect(dedupeLines(' a \na')).toBe(' a \na')
  })

  it('converts case', () => {
    expect(toUpperCaseText('Abc')).toBe('ABC')
    expect(toLowerCaseText('AbC')).toBe('abc')
    expect(toTitleCaseText('HELLO world')).toBe('Hello World')
    expect(toTitleCaseText("don't stop")).toBe("Don't Stop")
    expect(toTitleCaseText('你好 hello')).toBe('你好 Hello')
  })

  it('counts lines and characters without newlines', () => {
    expect(countText('')).toEqual({ lines: 0, chars: 0 })
    expect(countText('a\nb')).toEqual({ lines: 2, chars: 2 })
    expect(countText('ab\r\ncd')).toEqual({ lines: 2, chars: 4 })
  })
})
