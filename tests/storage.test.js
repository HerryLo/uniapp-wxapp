import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readStorage, writeStorage, removeStorage } from '../src/utils/storage.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: vi.fn((key) => (key in store ? store[key] : '')),
    setStorageSync: vi.fn((key, value) => { store[key] = value }),
    removeStorageSync: vi.fn((key) => { delete store[key] }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('storage', () => {
  it('returns fallback when key is missing', () => {
    expect(readStorage('missing', { a: 1 })).toEqual({ a: 1 })
  })

  it('round-trips objects through JSON', () => {
    writeStorage('key', { a: 1, b: [2] })
    expect(readStorage('key', null)).toEqual({ a: 1, b: [2] })
  })

  it('returns fallback when stored value is invalid JSON', () => {
    store.bad = '{oops'
    expect(readStorage('bad', [])).toEqual([])
  })

  it('removes a key', () => {
    writeStorage('key', 1)
    removeStorage('key')
    expect(readStorage('key', null)).toBe(null)
  })

  it('returns fallback when getStorageSync throws', () => {
    uni.getStorageSync = vi.fn(() => { throw new Error('fail') })
    expect(() => readStorage('k', 'fb')).not.toThrow()
    expect(readStorage('k', 'fb')).toBe('fb')
  })

  it('returns false when setStorageSync throws', () => {
    uni.setStorageSync = vi.fn(() => { throw new Error('fail') })
    expect(writeStorage('k', 1)).toBe(false)
  })

  it('returns false when removeStorageSync throws', () => {
    uni.removeStorageSync = vi.fn(() => { throw new Error('fail') })
    expect(removeStorage('k')).toBe(false)
  })

  it('returns true on successful writes and removes', () => {
    expect(writeStorage('k', 1)).toBe(true)
    expect(removeStorage('k')).toBe(true)
  })

  it('shows one warning when stored JSON is corrupt', async () => {
    vi.resetModules()
    const { readStorage: freshRead } = await import('../src/utils/storage.js')
    const showToast = vi.fn()
    uni.showToast = showToast
    store.bad = '{oops'
    expect(freshRead('bad', [])).toEqual([])
    expect(freshRead('bad', [])).toEqual([])
    expect(showToast).toHaveBeenCalledTimes(1)
  })
})
