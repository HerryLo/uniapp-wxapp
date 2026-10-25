import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MOODS,
  loadMilestones,
  addMilestone,
  removeMilestone,
  loadMoods,
  setMood,
  loadNotes,
  addNote,
  removeNote,
} from '../src/package-baby/utils/journal.js'
import {
  REFERENCE_MILESTONES,
  REFERENCE_MILESTONE_NOTE,
} from '../src/package-baby/data/referenceMilestones.js'
import { MILESTONES_KEY, MOODS_KEY, NOTES_KEY } from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baby journal', () => {
  it('adds and removes milestones', () => {
    const res = addMilestone({ date: '2026-10-24', title: ' 第一次走路 ', note: '阳台' }, 1000)
    expect(res.ok).toBe(true)
    expect(loadMilestones()[0]).toMatchObject({
      date: '2026-10-24',
      title: '第一次走路',
      note: '阳台',
    })
    const removed = removeMilestone(res.list[0].id)
    expect(removed.ok).toBe(true)
    expect(loadMilestones()).toHaveLength(0)
  })

  it('validates milestone fields', () => {
    expect(addMilestone({ date: 'x', title: 'a', note: '' }).error).toBe('请选择日期')
    expect(addMilestone({ date: '2026-10-24', title: '', note: '' }).error).toBe('请输入标题')
    expect(addMilestone({ date: '2026-10-24', title: 'a'.repeat(41), note: '' }).error).toBe(
      '标题最多 40 个字'
    )
    expect(addMilestone({ date: '2026-10-24', title: 'a', note: 'x'.repeat(201) }).error).toBe(
      '备注最多 200 个字'
    )
  })

  it('sets and overwrites a daily mood', () => {
    expect(setMood('2026-10-24', 'happy').ok).toBe(true)
    const res = setMood('2026-10-24', 'calm')
    expect(res.moods['2026-10-24']).toBe('calm')
    expect(loadMoods()['2026-10-24']).toBe('calm')
    expect(setMood('2026-10-24', 'unknown').ok).toBe(false)
    expect(MOODS).toHaveLength(5)
  })

  it('adds and removes notes', () => {
    const res = addNote({ date: '2026-10-24', content: ' 今天很乖 ' }, 1000)
    expect(res.ok).toBe(true)
    expect(loadNotes()[0].content).toBe('今天很乖')
    const removed = removeNote(res.list[0].id)
    expect(removed.ok).toBe(true)
    expect(loadNotes()).toHaveLength(0)
  })

  it('filters corrupt journal data', () => {
    store[MILESTONES_KEY] = JSON.stringify([
      { id: 'a', date: 'x', title: 'a' },
      { id: 'b', date: '2026-10-24', title: 'ok' },
    ])
    store[MOODS_KEY] = JSON.stringify({
      '2026-10-24': 'happy',
      bad: 'happy',
      '2026-10-25': 'unknown',
    })
    store[NOTES_KEY] = JSON.stringify([
      { id: 'n', date: '2026-10-24', content: 'ok' },
      null,
    ])
    expect(loadMilestones()).toHaveLength(1)
    expect(loadMoods()).toEqual({ '2026-10-24': 'happy' })
    expect(loadNotes()).toHaveLength(1)
  })

  it('ships reference milestones with a non-diagnostic note', () => {
    expect(REFERENCE_MILESTONES.length).toBeGreaterThan(0)
    expect(REFERENCE_MILESTONE_NOTE).toContain('不构成发育评估')
  })
})
