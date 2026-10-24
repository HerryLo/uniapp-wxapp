import { readStorage, writeStorage } from '../storage.js'
import { PROFILE_KEY } from './keys.js'
import { isFutureDate, parseLocalDate } from './date.js'

const DEFAULT_PROFILE = {
  name: '宝宝',
  birthDate: '',
  gender: 'boy',
  createdAt: null,
  updatedAt: null,
}

export function loadProfile() {
  const raw = readStorage(PROFILE_KEY, null)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_PROFILE }
  }
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  return {
    name: name ? name.slice(0, 20) : DEFAULT_PROFILE.name,
    birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : '',
    gender: raw.gender === 'girl' ? 'girl' : 'boy',
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : null,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : null,
  }
}

export function validateProfile(input) {
  const name = String(input.name || '').trim()
  if (!name) return '请输入宝宝昵称'
  if (name.length > 20) return '昵称最多 20 个字'
  if (!input.birthDate) return '请选择出生日期'
  if (!parseLocalDate(input.birthDate)) return '出生日期格式不正确'
  if (isFutureDate(input.birthDate)) return '出生日期不能晚于今天'
  return ''
}

export function saveProfile(input, now = Date.now()) {
  const error = validateProfile(input)
  if (error) return { ok: false, error }
  const previous = loadProfile()
  const profile = {
    name: String(input.name).trim(),
    birthDate: input.birthDate,
    gender: input.gender === 'girl' ? 'girl' : 'boy',
    createdAt: previous.createdAt || now,
    updatedAt: now,
  }
  if (!writeStorage(PROFILE_KEY, profile)) return { ok: false, error: '保存失败' }
  return { ok: true, profile }
}
