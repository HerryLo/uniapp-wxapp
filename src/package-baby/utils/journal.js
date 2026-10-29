import { readStorage, writeStorage } from '../../utils/storage.js'
import {
  MILESTONES_KEY,
  MOODS_KEY,
  NOTES_KEY,
} from '../../utils/baby/keys.js'
import { parseLocalDate } from '../../utils/baby/date.js'

export const MOODS = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'calm', emoji: '😌', label: '平静' },
  { key: 'fussy', emoji: '😫', label: '烦躁' },
  { key: 'sleepy', emoji: '😴', label: '困倦' },
  { key: 'excited', emoji: '🤩', label: '兴奋' },
]

const MOOD_KEYS = MOODS.map((item) => item.key)

function makeId(now) {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadMilestones() {
  const raw = readStorage(MILESTONES_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        parseLocalDate(item.date)
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      title: item.title,
      note: typeof item.note === 'string' ? item.note : '',
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

export function addMilestone(input, now = Date.now()) {
  if (!parseLocalDate(input.date)) return { ok: false, error: '请选择日期' }
  const title = String(input.title || '').trim()
  if (!title) return { ok: false, error: '请输入标题' }
  if (title.length > 40) return { ok: false, error: '标题最多 40 个字' }
  const note = String(input.note || '').trim()
  if (note.length > 200) return { ok: false, error: '备注最多 200 个字' }
  const list = [
    { id: makeId(now), date: input.date, title, note, createdAt: now },
    ...loadMilestones(),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  if (!writeStorage(MILESTONES_KEY, list)) return { ok: false, error: '保存失败' }
  return { ok: true, list }
}

export function removeMilestone(id) {
  const list = loadMilestones().filter((item) => item.id !== id)
  if (!writeStorage(MILESTONES_KEY, list)) return { ok: false, error: '删除失败' }
  return { ok: true, list }
}

export function updateMilestone(id, input) {
  const entries = loadMilestones()
  if (!entries.some((item) => item.id === id)) {
    return { ok: false, error: '记录不存在' }
  }
  const title = String(input.title || '').trim()
  if (!title) return { ok: false, error: '请输入标题' }
  if (title.length > 40) return { ok: false, error: '标题最多 40 个字' }
  const note = String(input.note || '').trim()
  if (note.length > 200) return { ok: false, error: '备注最多 200 个字' }
  const list = entries.map((item) => (item.id === id ? { ...item, title, note } : item))
  if (!writeStorage(MILESTONES_KEY, list)) return { ok: false, error: '保存失败' }
  return { ok: true, list }
}

export function loadMoods() {
  const raw = readStorage(MOODS_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result = {}
  for (const [date, mood] of Object.entries(raw)) {
    if (parseLocalDate(date) && MOOD_KEYS.includes(mood)) result[date] = mood
  }
  return result
}

export function setMood(date, moodKey) {
  if (!parseLocalDate(date)) return { ok: false, error: '日期无效' }
  if (!MOOD_KEYS.includes(moodKey)) return { ok: false, error: '请选择心情' }
  const moods = { ...loadMoods(), [date]: moodKey }
  if (!writeStorage(MOODS_KEY, moods)) return { ok: false, error: '保存失败' }
  return { ok: true, moods }
}

export function loadNotes() {
  const raw = readStorage(NOTES_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.content === 'string' &&
        parseLocalDate(item.date)
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      content: item.content,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

export function addNote(input, now = Date.now()) {
  if (!parseLocalDate(input.date)) return { ok: false, error: '请选择日期' }
  const content = String(input.content || '').trim()
  if (!content) return { ok: false, error: '请输入内容' }
  if (content.length > 500) return { ok: false, error: '内容最多 500 个字' }
  const list = [
    { id: makeId(now), date: input.date, content, createdAt: now },
    ...loadNotes(),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  if (!writeStorage(NOTES_KEY, list)) return { ok: false, error: '保存失败' }
  return { ok: true, list }
}

export function removeNote(id) {
  const list = loadNotes().filter((item) => item.id !== id)
  if (!writeStorage(NOTES_KEY, list)) return { ok: false, error: '删除失败' }
  return { ok: true, list }
}

export function updateNote(id, input) {
  const entries = loadNotes()
  if (!entries.some((item) => item.id === id)) {
    return { ok: false, error: '记录不存在' }
  }
  const content = String(input.content || '').trim()
  if (!content) return { ok: false, error: '请输入内容' }
  if (content.length > 500) return { ok: false, error: '内容最多 500 个字' }
  const list = entries.map((item) => (item.id === id ? { ...item, content } : item))
  if (!writeStorage(NOTES_KEY, list)) return { ok: false, error: '保存失败' }
  return { ok: true, list }
}
