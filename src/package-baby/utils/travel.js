import { readStorage, writeStorage } from '../../utils/storage.js'
import { TRAVEL_KEY } from '../../utils/baby/keys.js'
import { parseLocalDate } from '../../utils/baby/date.js'

function makeId(now) {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`
}

function normalize(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  if (typeof item.id !== 'string') return null
  if (!parseLocalDate(item.startDate) || !parseLocalDate(item.endDate)) return null
  if (item.endDate < item.startDate) return null
  const place = typeof item.place === 'string' ? item.place.trim() : ''
  if (!place) return null
  return {
    id: item.id,
    startDate: item.startDate,
    endDate: item.endDate,
    place: place.slice(0, 30),
    note: typeof item.note === 'string' ? item.note.slice(0, 200) : '',
    createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
  }
}

export function loadTravels() {
  const raw = readStorage(TRAVEL_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalize)
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.startDate.localeCompare(a.startDate) || b.createdAt - a.createdAt
    )
}

function validate(input) {
  if (!parseLocalDate(input.startDate)) return '请选择开始日期'
  if (!parseLocalDate(input.endDate)) return '请选择结束日期'
  if (input.endDate < input.startDate) return '结束日期不能早于开始日期'
  const place = String(input.place || '').trim()
  if (!place) return '请输入地点'
  if (place.length > 30) return '地点最多 30 个字'
  if (String(input.note || '').trim().length > 200) return '备注最多 200 个字'
  return ''
}

export function addTravel(input, now = Date.now()) {
  const error = validate(input)
  if (error) return { ok: false, error }
  const travel = {
    id: makeId(now),
    startDate: input.startDate,
    endDate: input.endDate,
    place: String(input.place).trim(),
    note: String(input.note || '').trim(),
    createdAt: now,
  }
  const list = [travel, ...loadTravels()].sort(
    (a, b) => b.startDate.localeCompare(a.startDate) || b.createdAt - a.createdAt
  )
  if (!writeStorage(TRAVEL_KEY, list)) return { ok: false, error: '保存失败' }
  return { ok: true, travel, list }
}

export function removeTravel(id) {
  const list = loadTravels()
  const next = list.filter((item) => item.id !== id)
  if (next.length === list.length) return { ok: true, list }
  if (!writeStorage(TRAVEL_KEY, next)) return { ok: false, error: '删除失败' }
  return { ok: true, list: next }
}
