import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  VACCINE_TYPES,
  createBuiltinVaccines,
  loadVaccines,
  setVaccineDone,
  addCustomVaccine,
  removeCustomVaccine,
  vaccineStatus,
  nextVaccine,
  groupVaccines,
} from '../src/utils/baby/vaccines.js'
import { VACCINE_PLAN, VACCINE_SOURCE } from '../src/data/vaccinePlan.js'
import { VACCINES_KEY } from '../src/utils/baby/keys.js'

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

describe('baby vaccines', () => {
  it('ships both vaccine types and initializes storage', () => {
    expect(VACCINE_PLAN).toHaveLength(29)
    expect(VACCINE_TYPES).toEqual(['一类', '二类'])
    const builtins = createBuiltinVaccines()
    expect(builtins).toHaveLength(29)
    expect(builtins.some((item) => item.type === '一类')).toBe(true)
    expect(builtins.some((item) => item.type === '二类')).toBe(true)
    expect(builtins.every((item) => item.builtin)).toBe(true)

    expect(loadVaccines()).toHaveLength(29)
    expect(store[VACCINES_KEY]).toBeTruthy()
  })

  it('documents the reference source and safety note', () => {
    expect(VACCINE_SOURCE.note).toContain('自费自愿')
    expect(VACCINE_SOURCE.note).toContain('请咨询接种门诊')
  })

  it('computes status from age', () => {
    expect(vaccineStatus({ done: true, month: 0 }, 5).label).toBe('已接种')
    expect(vaccineStatus({ done: false, month: 6 }, 6)).toMatchObject({ key: 'due', label: '待接种' })
    expect(vaccineStatus({ done: false, month: 6 }, 7)).toMatchObject({
      key: 'overdue',
      label: '已超过参考月龄',
    })
    expect(vaccineStatus({ done: false, month: null }, 7).label).toBe('未接种')
    expect(vaccineStatus({ done: false, month: 6 }, null).label).toBe('未接种')
  })

  it('finds the next unfinished vaccine', () => {
    const list = [
      { id: 'a', name: 'A', month: 6, type: '二类', done: false },
      { id: 'b', name: 'B', month: 3, type: '一类', done: false },
      { id: 'c', name: 'C', month: 2, type: '一类', done: true },
    ]
    expect(nextVaccine(list, 4).id).toBe('b')
    expect(nextVaccine(list, null)).toBe(null)
    expect(
      nextVaccine(
        [
          { ...list[0], done: true },
          { ...list[1], done: true },
        ],
        4
      )
    ).toBe(null)
  })

  it('adds and removes custom vaccines only', () => {
    const res = addCustomVaccine([], { name: ' 自费疫苗 ', type: '二类', month: '12' }, 1000)
    expect(res.ok).toBe(true)
    expect(res.list[0]).toMatchObject({
      name: '自费疫苗',
      type: '二类',
      month: 12,
      builtin: false,
      done: false,
      date: '',
    })
    expect(addCustomVaccine([], { name: '', type: '二类', month: '' }).error).toBe('请输入疫苗名称')
    expect(addCustomVaccine([], { name: 'x', type: '三类', month: '' }).error).toBe(
      '请选择疫苗类型'
    )
    expect(addCustomVaccine([], { name: 'x', type: '二类', month: '217' }).error).toContain(
      '0–216'
    )

    expect(removeCustomVaccine(res.list, res.list[0].id).list).toHaveLength(0)
    const builtins = createBuiltinVaccines()
    expect(removeCustomVaccine(builtins, builtins[0].id).ok).toBe(false)
  })

  it('toggles done state and groups by type', () => {
    const list = createBuiltinVaccines()
    const target = list[0]
    const done = setVaccineDone(list, target.id, true, '2026-10-24')
    expect(done.find((item) => item.id === target.id)).toMatchObject({
      done: true,
      date: '2026-10-24',
    })
    const undone = setVaccineDone(done, target.id, false)
    expect(undone.find((item) => item.id === target.id)).toMatchObject({ done: false, date: '' })

    const groups = groupVaccines(list)
    expect(groups.map((group) => group.type)).toEqual(['一类', '二类'])
    expect(groups[0].items.every((item) => item.type === '一类')).toBe(true)
    expect(groups[0].items[0].month).toBe(0)
  })
})
