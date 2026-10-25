import { readStorage, writeStorage } from '../storage.js'
import { recordsKey } from './keys.js'
import { durationMinutes, formatDate, monthKey, parseLocalDateTime } from './date.js'

const KINDS = ['milk', 'sleep', 'diaper']
const MILK_TYPES = ['母乳', '配方奶', '混合']
const DIAPER_TYPES = ['大便', '小便', '都有']
const DIAPER_COLORS = ['正常', '绿色', '黑色', '白色', '带血']

function makeId(now) {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyDay() {
  return { milk: [], sleep: [], diaper: [] }
}

function sanitize(list, timeField) {
  if (!Array.isArray(list)) return []
  return list.filter(
    (item) => item && typeof item.id === 'string' && typeof item[timeField] === 'string'
  )
}

function normalizeDay(entry) {
  const source = entry && typeof entry === 'object' ? entry : {}
  return {
    milk: sanitize(source.milk, 'time'),
    sleep: sanitize(source.sleep, 'start'),
    diaper: sanitize(source.diaper, 'time'),
  }
}

export function validateMilk(input) {
  if (!parseLocalDateTime(input.time)) return '请选择喝奶时间'
  if (!MILK_TYPES.includes(input.type)) return '请选择喝奶类型'
  const amountText = String(input.amount == null ? '' : input.amount).trim()
  if (amountText !== '') {
    const amount = Number(amountText)
    if (!Number.isInteger(amount) || amount < 0) return '奶量需为非负整数'
  }
  return ''
}

export function validateSleep(input) {
  const start = parseLocalDateTime(input.start)
  const end = parseLocalDateTime(input.end)
  if (!start) return '请选择开始时间'
  if (!end) return '请选择结束时间'
  if (end.getTime() <= start.getTime()) return '结束时间必须晚于开始时间'
  return ''
}

export function validateDiaper(input) {
  if (!parseLocalDateTime(input.time)) return '请选择排便时间'
  if (!DIAPER_TYPES.includes(input.type)) return '请选择排便类型'
  if (!DIAPER_COLORS.includes(input.color)) return '请选择颜色'
  return ''
}

function validateRecord(kind, input) {
  if (kind === 'milk') return validateMilk(input)
  if (kind === 'sleep') return validateSleep(input)
  if (kind === 'diaper') return validateDiaper(input)
  return '未知记录类型'
}

function makeRecord(kind, input, now) {
  if (kind === 'milk') {
    const amountText = String(input.amount == null ? '' : input.amount).trim()
    return {
      id: makeId(now),
      time: input.time,
      type: input.type,
      amount: amountText === '' ? null : Number(amountText),
      createdAt: now,
    }
  }
  if (kind === 'sleep') {
    return { id: makeId(now), start: input.start, end: input.end, createdAt: now }
  }
  return {
    id: makeId(now),
    time: input.time,
    type: input.type,
    color: input.color,
    createdAt: now,
  }
}

export function recordDate(kind, record) {
  const value = kind === 'sleep' ? record.start : record.time
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

export function loadMonth(month) {
  const raw = readStorage(recordsKey(month), {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result = {}
  for (const [day, entry] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    result[day] = normalizeDay(entry)
  }
  return result
}

export function loadDay(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return emptyDay()
  const month = loadMonth(monthKey(dateStr))
  return normalizeDay(month[dateStr])
}

export function addRecord(kind, input, now = Date.now()) {
  if (!KINDS.includes(kind)) return { ok: false, error: '未知记录类型' }
  const error = validateRecord(kind, input)
  if (error) return { ok: false, error }
  const record = makeRecord(kind, input, now)
  const dateStr = recordDate(kind, record)
  const month = monthKey(dateStr)
  const data = loadMonth(month)
  const day = data[dateStr] || emptyDay()
  day[kind] = [record, ...day[kind]]
  data[dateStr] = day
  if (!writeStorage(recordsKey(month), data)) return { ok: false, error: '保存失败' }
  return { ok: true, record, date: dateStr }
}

export function removeRecord(kind, id, dateStr) {
  if (!KINDS.includes(kind) || typeof dateStr !== 'string') {
    return { ok: false, error: '参数错误' }
  }
  const month = monthKey(dateStr)
  const data = loadMonth(month)
  const day = data[dateStr]
  if (!day) return { ok: true }
  const next = day[kind].filter((item) => item.id !== id)
  if (next.length === day[kind].length) return { ok: true }
  const nextDay = { ...day, [kind]: next }
  if (!nextDay.milk.length && !nextDay.sleep.length && !nextDay.diaper.length) {
    delete data[dateStr]
  } else {
    data[dateStr] = nextDay
  }
  return writeStorage(recordsKey(month), data)
    ? { ok: true }
    : { ok: false, error: '删除失败' }
}

export function summarizeDay(day) {
  const source = normalizeDay(day)
  const milkAmount = source.milk.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0
  )
  const sleepMinutes = source.sleep.reduce(
    (sum, item) => sum + durationMinutes(item.start, item.end),
    0
  )
  return {
    milkCount: source.milk.length,
    milkAmount,
    sleepMinutes,
    diaperCount: source.diaper.length,
  }
}

export function sortRecords(list, kind) {
  const field = kind === 'sleep' ? 'start' : 'time'
  return [...list].sort((a, b) =>
    String(b[field] || '').localeCompare(String(a[field] || ''))
  )
}

export function loadRecentMilkSummary(days = 7, now = new Date()) {
  const count = Math.max(1, Math.floor(Number(days) || 0))
  const result = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const dateStr = formatDate(date)
    const day = loadDay(dateStr)
    const summary = summarizeDay(day)
    result.push({
      date: dateStr,
      milkCount: summary.milkCount,
      milkAmount: summary.milkAmount,
      hasMilkAmount: day.milk.some(
        (item) => typeof item.amount === 'number' && Number.isFinite(item.amount)
      ),
    })
  }
  return result
}

export function milkChartPoints(summary) {
  if (!Array.isArray(summary)) return []
  return summary
    .filter((item) => item && item.hasMilkAmount)
    .map((item) => ({ date: item.date, value: item.milkAmount }))
}
