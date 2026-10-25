import { readStorage, writeStorage } from '../../utils/storage.js'
import { MOM_KEY } from '../../utils/baby/keys.js'
import { isFutureDate, parseLocalDate } from '../../utils/baby/date.js'

export const MOODS = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'calm', emoji: '😌', label: '平静' },
  { key: 'tired', emoji: '😪', label: '疲惫' },
  { key: 'anxious', emoji: '😟', label: '焦虑' },
  { key: 'low', emoji: '😔', label: '低落' },
]

const MOOD_KEYS = MOODS.map((item) => item.key)

function normalize(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  if (!parseLocalDate(item.date)) return null
  if (!MOOD_KEYS.includes(item.mood)) return null
  const sleepHours = item.sleepHours == null ? null : Number(item.sleepHours)
  if (
    sleepHours != null &&
    (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24)
  ) {
    return null
  }
  return {
    date: item.date,
    sleepHours,
    mood: item.mood,
    condition: typeof item.condition === 'string' ? item.condition.slice(0, 50) : '',
    note: typeof item.note === 'string' ? item.note.slice(0, 200) : '',
    createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
    updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : 0,
  }
}

export function loadMomEntries() {
  const raw = readStorage(MOM_KEY, [])
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw
    .map(normalize)
    .filter((item) => {
      if (!item || seen.has(item.date)) return false
      seen.add(item.date)
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function validate(input) {
  if (!parseLocalDate(input.date)) return '请选择日期'
  if (isFutureDate(input.date)) return '日期不能晚于今天'
  if (!MOOD_KEYS.includes(input.mood)) return '请选择心情'
  if (input.sleepHours !== '' && input.sleepHours != null) {
    const sleepHours = Number(input.sleepHours)
    if (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) {
      return '睡眠时长需在 0–24 小时'
    }
  }
  if (String(input.condition || '').trim().length > 50) {
    return '身体状态最多 50 个字'
  }
  if (String(input.note || '').trim().length > 200) {
    return '备注最多 200 个字'
  }
  return ''
}

export function saveMomEntry(input, now = Date.now()) {
  const error = validate(input)
  if (error) return { ok: false, error }
  const entries = loadMomEntries()
  const existing = entries.find((item) => item.date === input.date)
  const entry = {
    date: input.date,
    sleepHours:
      input.sleepHours === '' || input.sleepHours == null
        ? null
        : Number(input.sleepHours),
    mood: input.mood,
    condition: String(input.condition || '').trim(),
    note: String(input.note || '').trim(),
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }
  const next = [entry, ...entries.filter((item) => item.date !== input.date)].sort(
    (a, b) => b.date.localeCompare(a.date)
  )
  if (!writeStorage(MOM_KEY, next)) return { ok: false, error: '保存失败' }
  return { ok: true, entry, entries: next }
}

export function removeMomEntry(date) {
  const entries = loadMomEntries()
  const next = entries.filter((item) => item.date !== date)
  if (next.length === entries.length) return { ok: true, entries }
  if (!writeStorage(MOM_KEY, next)) return { ok: false, error: '删除失败' }
  return { ok: true, entries: next }
}
