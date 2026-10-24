function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey(now = new Date()) {
  return formatDate(now)
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function monthKey(value) {
  if (typeof value === 'string') return value.slice(0, 7)
  if (value instanceof Date) return formatDate(value).slice(0, 7)
  return ''
}

export function parseLocalDate(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function parseLocalDateTime(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const date = new Date(year, month - 1, day, hour, minute)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null
  }
  return date
}

export function isFutureDate(value, now = new Date()) {
  const date = parseLocalDate(value)
  if (!date) return false
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return date.getTime() > today.getTime()
}

export function ageInfo(birthDate, now = new Date()) {
  const birth = parseLocalDate(birthDate)
  if (!birth) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (birth.getTime() > today.getTime()) return null
  const totalMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth())
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const text = years > 0 ? `${years} 岁 ${months} 个月` : `${totalMonths} 个月`
  return { years, months, totalMonths, text }
}

export function durationMinutes(start, end) {
  const from = parseLocalDateTime(start)
  const to = parseLocalDateTime(end)
  if (!from || !to) return 0
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000))
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0))
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (hours && rest) return `${hours} 小时 ${rest} 分钟`
  if (hours) return `${hours} 小时`
  return `${rest} 分钟`
}

export function formatMonthAge(month) {
  if (month == null || !Number.isFinite(Number(month))) return '未设置'
  const value = Number(month)
  if (value === 0) return '出生时'
  if (value < 12) return `${value} 月龄`
  const years = Math.floor(value / 12)
  const rest = value % 12
  return rest ? `${years} 岁 ${rest} 个月` : `${years} 岁`
}
