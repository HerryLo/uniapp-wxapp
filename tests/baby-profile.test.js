import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadProfile,
  saveAvatar,
  saveProfile,
  validateProfile,
} from '../src/utils/baby/profile.js'
import { MAX_AVATAR_CHARS } from '../src/utils/baby/avatar.js'
import { PROFILE_KEY } from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baby profile', () => {
  it('returns defaults when missing or corrupt', () => {
    expect(loadProfile()).toMatchObject({ name: '宝宝', birthDate: '', gender: 'boy' })
    store[PROFILE_KEY] = '{oops'
    expect(loadProfile().name).toBe('宝宝')
  })

  it('validates name, date and future dates', () => {
    expect(validateProfile({ name: '', birthDate: '2026-01-01' })).toBe('请输入宝宝昵称')
    expect(validateProfile({ name: '宝宝', birthDate: '' })).toBe('请选择出生日期')
    expect(validateProfile({ name: '宝宝', birthDate: '2026-02-30' })).toBe('出生日期格式不正确')
    expect(validateProfile({ name: '宝宝', birthDate: '2999-01-01' })).toBe('出生日期不能晚于今天')
    expect(validateProfile({ name: '宝宝', birthDate: '2026-01-01' })).toBe('')
  })

  it('saves and reloads profile', () => {
    const res = saveProfile({ name: ' 小满 ', birthDate: '2025-01-02', gender: 'girl' }, 1000)
    expect(res.ok).toBe(true)
    expect(loadProfile()).toMatchObject({
      name: '小满',
      birthDate: '2025-01-02',
      gender: 'girl',
      createdAt: 1000,
      updatedAt: 1000,
    })
  })

  it('reports write failure', () => {
    uni.setStorageSync = () => { throw new Error('fail') }
    expect(saveProfile({ name: '宝宝', birthDate: '2025-01-01' })).toEqual({
      ok: false,
      error: '保存失败',
    })
  })

  it('saves and preserves avatar', () => {
    const avatar = 'data:image/jpeg;base64,abc'
    const res = saveProfile(
      { name: '宝宝', birthDate: '2025-01-01', gender: 'boy', avatar },
      1000
    )
    expect(res.ok).toBe(true)
    expect(loadProfile().avatar).toBe(avatar)

    saveProfile({ name: '宝宝', birthDate: '2025-01-01', gender: 'boy' }, 2000)
    expect(loadProfile().avatar).toBe(avatar)
  })

  it('validates avatar format and size', () => {
    expect(
      validateProfile({
        name: '宝宝',
        birthDate: '2025-01-01',
        avatar: 'https://example.com/a.jpg',
      })
    ).toBe('头像格式不正确')
    expect(
      validateProfile({
        name: '宝宝',
        birthDate: '2025-01-01',
        avatar: `data:image/jpeg;base64,${'a'.repeat(MAX_AVATAR_CHARS)}`,
      })
    ).toBe('头像图片过大，请换一张')
    expect(
      validateProfile({
        name: '宝宝',
        birthDate: '2025-01-01',
        avatar: 'data:image/jpeg;base64,abc',
      })
    ).toBe('')
  })

  it('falls back to an empty avatar when the stored value is invalid', () => {
    store[PROFILE_KEY] = JSON.stringify({
      name: '宝宝',
      birthDate: '',
      gender: 'boy',
      avatar: 'bad',
    })
    expect(loadProfile().avatar).toBe('')
  })

  it('updates only the avatar without requiring other fields', () => {
    saveProfile(
      {
        name: '小满',
        birthDate: '2025-01-01',
        gender: 'girl',
        avatar: '',
      },
      1000
    )
    const res = saveAvatar('data:image/png;base64,abc', 2000)
    expect(res.ok).toBe(true)
    expect(loadProfile()).toMatchObject({
      name: '小满',
      avatar: 'data:image/png;base64,abc',
      createdAt: 1000,
      updatedAt: 2000,
    })
  })
})
