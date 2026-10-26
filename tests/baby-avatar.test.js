import { describe, it, expect } from 'vitest'
import { MAX_AVATAR_CHARS, isValidAvatar } from '../src/utils/baby/avatar.js'

describe('baby avatar validation', () => {
  it('accepts empty values and supported data urls', () => {
    expect(isValidAvatar('')).toBe(true)
    expect(isValidAvatar(null)).toBe(true)
    expect(isValidAvatar(undefined)).toBe(true)
    expect(isValidAvatar('data:image/jpeg;base64,abc')).toBe(true)
    expect(isValidAvatar('data:image/png;base64,abc')).toBe(true)
    expect(isValidAvatar('data:image/webp;base64,abc')).toBe(true)
  })

  it('rejects unsupported formats and non-strings', () => {
    expect(isValidAvatar('https://example.com/a.jpg')).toBe(false)
    expect(isValidAvatar('data:image/gif;base64,abc')).toBe(false)
    expect(isValidAvatar({})).toBe(false)
  })

  it('accepts the exact size limit and rejects one character more', () => {
    const prefix = 'data:image/jpeg;base64,'
    const exact = prefix + 'a'.repeat(MAX_AVATAR_CHARS - prefix.length)
    expect(exact.length).toBe(MAX_AVATAR_CHARS)
    expect(isValidAvatar(exact)).toBe(true)
    expect(isValidAvatar(`${exact}a`)).toBe(false)
  })
})
