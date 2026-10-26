import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  MAX_AVATAR_CHARS,
  chooseAvatarImage,
  isValidAvatar,
} from '../src/utils/baby/avatar.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baby avatar validation', () => {
  it('accepts empty values and supported data urls', () => {
    expect(MAX_AVATAR_CHARS).toBe(300 * 1024)
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
    expect(isValidAvatar('   ')).toBe(false)
  })

  it('accepts the exact size limit and rejects one character more', () => {
    const prefix = 'data:image/jpeg;base64,'
    const exact = prefix + 'a'.repeat(MAX_AVATAR_CHARS - prefix.length)
    expect(exact.length).toBe(MAX_AVATAR_CHARS)
    expect(isValidAvatar(exact)).toBe(true)
    expect(isValidAvatar(`${exact}a`)).toBe(false)
  })
})

describe('chooseAvatarImage', () => {
  it('reports no selection when tempFilePaths is empty', async () => {
    vi.stubGlobal('uni', {
      chooseImage: (opts) => opts.success({ tempFilePaths: [] }),
    })
    await expect(chooseAvatarImage()).resolves.toEqual({
      ok: false,
      error: '未选择图片',
    })
  })

  it('reports no selection when chooseImage fails', async () => {
    vi.stubGlobal('uni', {
      chooseImage: (opts) => opts.fail({ errMsg: 'chooseImage:fail cancel' }),
    })
    await expect(chooseAvatarImage()).resolves.toEqual({
      ok: false,
      error: '未选择图片',
    })
  })

  it('reads the selected image as a data url', async () => {
    vi.stubGlobal('uni', {
      chooseImage: (opts) =>
        opts.success({ tempFilePaths: ['/tmp/a.jpg'] }),
    })
    vi.stubGlobal('wx', {
      getFileSystemManager: () => ({
        readFileSync: () => 'abc',
      }),
    })
    await expect(chooseAvatarImage()).resolves.toEqual({
      ok: true,
      dataUrl: 'data:image/jpeg;base64,abc',
    })
  })

  it('reports an oversized image after both compression attempts', async () => {
    vi.stubGlobal('uni', {
      chooseImage: (opts) =>
        opts.success({ tempFilePaths: ['/tmp/a.jpg'] }),
    })
    vi.stubGlobal('wx', {
      getFileSystemManager: () => ({
        readFileSync: () => 'a'.repeat(MAX_AVATAR_CHARS),
      }),
    })
    await expect(chooseAvatarImage()).resolves.toEqual({
      ok: false,
      error: '图片过大，请换一张',
    })
  })

  it('reports a processing failure when reading the file throws', async () => {
    vi.stubGlobal('uni', {
      chooseImage: (opts) =>
        opts.success({ tempFilePaths: ['/tmp/a.jpg'] }),
    })
    vi.stubGlobal('wx', {
      getFileSystemManager: () => ({
        readFileSync: () => {
          throw new Error('read fail')
        },
      }),
    })
    await expect(chooseAvatarImage()).resolves.toEqual({
      ok: false,
      error: '图片处理失败，请重试',
    })
  })
})
