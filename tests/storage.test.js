import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getStorageDriver,
  onStorageChange,
  readStorage,
  removeStorage,
  setStorageDriver,
  storageKeys,
  writeStorage,
} from '../src/utils/storage.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: vi.fn((key) => (key in store ? store[key] : '')),
    setStorageSync: vi.fn((key, value) => { store[key] = value }),
    removeStorageSync: vi.fn((key) => { delete store[key] }),
    getStorageInfoSync: vi.fn(() => ({ keys: Object.keys(store) })),
  })
})

afterEach(() => {
  setStorageDriver(null)
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

  it('delegates to a custom storage driver', () => {
    const memory = new Map()
    setStorageDriver({
      get: (key) => (memory.has(key) ? memory.get(key) : ''),
      set: (key, value) => { memory.set(key, value) },
      remove: (key) => { memory.delete(key) },
      keys: () => [...memory.keys()],
    })
    expect(getStorageDriver()).not.toBe(null)

    expect(writeStorage('k', { a: 1 })).toBe(true)
    expect(readStorage('k', null)).toEqual({ a: 1 })
    expect(storageKeys()).toEqual(['k'])
    expect(removeStorage('k')).toBe(true)
    expect(readStorage('k', 'fb')).toBe('fb')
  })

  it('validates custom storage drivers', () => {
    expect(() => setStorageDriver({ get() {} })).toThrow('storage driver is missing set()')
  })

  it('emits change events and supports unsubscribe', () => {
    const events = []
    const off = onStorageChange((event) => events.push(event))
    writeStorage('a', 1)
    removeStorage('a')
    expect(events).toEqual([
      { type: 'write', key: 'a' },
      { type: 'remove', key: 'a' },
    ])
    off()
    writeStorage('b', 2)
    expect(events).toHaveLength(2)
  })

  it('does not emit a change event when writing fails', () => {
    const events = []
    const off = onStorageChange((event) => events.push(event))
    uni.setStorageSync = () => { throw new Error('fail') }
    expect(writeStorage('a', 1)).toBe(false)
    expect(events).toHaveLength(0)
    off()
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
