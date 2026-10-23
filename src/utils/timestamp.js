function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatLocal(ms) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatUtc(ms) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

export function timestampToDate(input, unit) {
  const s = String(input).trim()
  if (!/^-?\d+$/.test(s)) return { error: '请输入整数时间戳' }
  const n = Number(s)
  if (!Number.isSafeInteger(n)) return { error: '时间戳超出范围' }
  const ms = unit === 'ms' ? n : n * 1000
  const local = formatLocal(ms)
  if (!local) return { error: '时间戳超出范围' }
  return { local, utc: formatUtc(ms) }
}

export function dateToTimestamp(dateStr, timeStr) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr))
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(timeStr))
  if (!dateMatch || !timeMatch) return { error: '请选择日期和时间' }
  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] || 0)
  if (hour > 23 || minute > 59 || second > 59) return { error: '时间无效' }
  const d = new Date(year, month - 1, day, hour, minute, second)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { error: '日期无效' }
  }
  const ms = d.getTime()
  return { seconds: Math.floor(ms / 1000), milliseconds: ms }
}

export function nowTimestamp(unit) {
  return unit === 'ms' ? Date.now() : Math.floor(Date.now() / 1000)
}

export function formatDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatTimeValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
