import { readStorage, writeStorage } from '../storage.js'
import { VACCINES_KEY } from './keys.js'
import { VACCINE_PLAN } from '../../data/vaccinePlan.js'

export const VACCINE_TYPES = ['一类', '二类']

function makeId(now) {
  return `custom-${now}-${Math.random().toString(36).slice(2, 8)}`
}

export function createBuiltinVaccines() {
  return VACCINE_PLAN.map((item) => ({
    id: `builtin-${item.key}`,
    name: item.name,
    month: item.month,
    type: item.type,
    done: false,
    date: '',
    skipped: false,
    builtin: true,
  }))
}

function normalize(item) {
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') return null
  if (!VACCINE_TYPES.includes(item.type)) return null
  const month = item.month == null ? null : Number(item.month)
  if (month != null && (!Number.isInteger(month) || month < 0)) return null
  return {
    id: item.id,
    name: item.name,
    month,
    type: item.type,
    done: !!item.done,
    date: typeof item.date === 'string' ? item.date : '',
    skipped: !!item.skipped,
    builtin: !!item.builtin,
  }
}

export function loadVaccines() {
  const raw = readStorage(VACCINES_KEY, null)
  const builtins = createBuiltinVaccines()
  if (!Array.isArray(raw)) {
    writeStorage(VACCINES_KEY, builtins)
    return builtins
  }
  const list = raw.map(normalize).filter(Boolean)
  const ids = new Set(list.map((item) => item.id))
  const missing = builtins.filter((item) => !ids.has(item.id))
  if (!missing.length) return list
  const next = [...list, ...missing]
  writeStorage(VACCINES_KEY, next)
  return next
}

export function saveVaccines(list) {
  return writeStorage(VACCINES_KEY, list)
}

export function setVaccineDone(list, id, done, date = '') {
  return list.map((item) => {
    if (item.id !== id) return item
    if (!done) return { ...item, done: false, date: '', skipped: false }
    return { ...item, done: true, date: date || item.date, skipped: false }
  })
}

export function setVaccineSkipped(list, id, skipped) {
  return list.map((item) => {
    if (item.id !== id) return item
    if (!skipped) return { ...item, skipped: false }
    return { ...item, done: false, date: '', skipped: true }
  })
}

export function addCustomVaccine(list, input, now = Date.now()) {
  const name = String(input.name || '').trim()
  if (!name) return { ok: false, error: '请输入疫苗名称' }
  if (name.length > 30) return { ok: false, error: '名称最多 30 个字' }
  if (!VACCINE_TYPES.includes(input.type)) return { ok: false, error: '请选择疫苗类型' }
  let month = null
  if (input.month !== '' && input.month != null) {
    month = Number(input.month)
    if (!Number.isInteger(month) || month < 0 || month > 216) {
      return { ok: false, error: '参考月龄需为 0–216 的整数' }
    }
  }
  const vaccine = {
    id: makeId(now),
    name,
    month,
    type: input.type,
    done: false,
    date: '',
    skipped: false,
    builtin: false,
  }
  return { ok: true, list: [...list, vaccine], vaccine }
}

export function removeCustomVaccine(list, id) {
  const target = list.find((item) => item.id === id)
  if (!target) return { ok: false, error: '疫苗不存在' }
  if (target.builtin) return { ok: false, error: '内置参考项不可删除' }
  return { ok: true, list: list.filter((item) => item.id !== id) }
}

export function vaccineStatus(vaccine, totalMonths) {
  if (vaccine.skipped) return { key: 'skipped', label: '暂不接种' }
  if (vaccine.done) return { key: 'done', label: '已接种' }
  if (vaccine.month == null || totalMonths == null) {
    return { key: 'pending', label: '未接种' }
  }
  if (totalMonths <= vaccine.month) return { key: 'due', label: '待接种' }
  return { key: 'overdue', label: '已超过参考月龄' }
}

export function nextVaccine(list, totalMonths, options = {}) {
  if (totalMonths == null) return null
  const type = options.type || null
  const candidates = list.filter(
    (item) =>
      !item.done &&
      !item.skipped &&
      item.month != null &&
      (!type || item.type === type)
  )
  if (!candidates.length) return null
  candidates.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month
    if (a.type !== b.type) return a.type === '一类' ? -1 : 1
    return a.name.localeCompare(b.name, 'zh')
  })
  return candidates[0]
}

export function groupVaccines(list) {
  const sortItems = (items) =>
    [...items].sort((a, b) => {
      if (a.month == null && b.month == null) return a.name.localeCompare(b.name, 'zh')
      if (a.month == null) return 1
      if (b.month == null) return -1
      if (a.month !== b.month) return a.month - b.month
      return a.name.localeCompare(b.name, 'zh')
    })
  return VACCINE_TYPES
    .map((type) => ({ type, items: sortItems(list.filter((item) => item.type === type)) }))
    .filter((group) => group.items.length > 0)
}
