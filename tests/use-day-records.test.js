import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDayRecords } from '../src/composables/useDayRecords.js'
import { formatDateTime } from '../src/utils/baby/date.js'

let store
let toast
let modal

beforeEach(() => {
  store = {}
  toast = vi.fn()
  modal = vi.fn((options) => options.success({ confirm: true }))
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
    showToast: toast,
    showModal: modal,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function todayTime() {
  return `${formatDateTime(new Date()).slice(0, 10)} 08:00`
}

describe('useDayRecords', () => {
  it('loads, adds and removes records for the current day', () => {
    const records = useDayRecords('milk')
    expect(records.list.value).toHaveLength(0)

    expect(
      records.submitForm({ time: todayTime(), type: '母乳', amount: '120' })
    ).toBe(true)
    expect(records.list.value).toHaveLength(1)
    expect(records.summary.value.milkCount).toBe(1)

    records.remove(records.list.value[0].id)
    expect(modal).toHaveBeenCalled()
    expect(records.list.value).toHaveLength(0)
  })

  it('keeps the form open and exposes errors when validation fails', () => {
    const records = useDayRecords('milk')
    records.openForm()
    expect(
      records.submitForm({ time: '', type: '母乳', amount: '' })
    ).toBe(false)
    expect(records.formOpen.value).toBe(true)
    expect(records.formError.value).toContain('时间')

    records.closeForm()
    expect(records.formOpen.value).toBe(false)
    expect(records.formError.value).toBe('')
  })

  it('calls onChange after refresh and successful mutations', () => {
    const onChange = vi.fn()
    const records = useDayRecords('sleep', { onChange })
    records.refresh()
    expect(onChange).toHaveBeenCalledTimes(1)

    const today = formatDateTime(new Date()).slice(0, 10)
    records.submitForm({
      start: `${today} 09:00`,
      end: `${today} 10:00`,
    })
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
