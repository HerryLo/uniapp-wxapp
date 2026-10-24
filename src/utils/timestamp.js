function pad(value) {
  return String(value).padStart(2, '0')
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

export function formatDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatTimeValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
