import { readStorage, writeStorage } from '../storage.js'
import { GROWTH_KEY } from './keys.js'
import { parseLocalDate } from './date.js'

function makeId(now) {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`
}

export function validateGrowth(input) {
  if (!parseLocalDate(input.date)) return '请选择测量日期'
  if (input.height === '' || input.height == null) return '请输入身高'
  if (input.weight === '' || input.weight == null) return '请输入体重'
  const height = Number(input.height)
  const weight = Number(input.weight)
  if (!Number.isFinite(height) || height < 20 || height > 200) {
    return '身高需在 20–200 cm'
  }
  if (!Number.isFinite(weight) || weight < 0.5 || weight > 100) {
    return '体重需在 0.5–100 kg'
  }
  return ''
}

export function loadGrowth() {
  const raw = readStorage(GROWTH_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        parseLocalDate(item.date) &&
        Number.isFinite(item.height) &&
        Number.isFinite(item.weight)
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      height: item.height,
      weight: item.weight,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function saveGrowth(list) {
  return writeStorage(GROWTH_KEY, list)
}

export function upsertGrowth(list, input, now = Date.now()) {
  const error = validateGrowth(input)
  if (error) return { ok: false, error }
  const height = Number(input.height)
  const weight = Number(input.weight)
  const exists = list.some((item) => item.date === input.date)
  const next = exists
    ? list.map((item) =>
        item.date === input.date ? { ...item, height, weight } : item
      )
    : [...list, { id: makeId(now), date: input.date, height, weight, createdAt: now }]
  next.sort((a, b) => a.date.localeCompare(b.date))
  if (!saveGrowth(next)) return { ok: false, error: '保存失败' }
  return { ok: true, list: next }
}

export function removeGrowth(list, id) {
  const next = list.filter((item) => item.id !== id)
  if (next.length === list.length) return { ok: true, list: next }
  if (!saveGrowth(next)) return { ok: false, error: '删除失败' }
  return { ok: true, list: next }
}

export function chartPoints(list, key) {
  return [...list]
    .filter((item) => Number.isFinite(item[key]))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({ date: item.date, value: item[key] }))
}

export function latestGrowth(list) {
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
  return sorted[sorted.length - 1]
}
