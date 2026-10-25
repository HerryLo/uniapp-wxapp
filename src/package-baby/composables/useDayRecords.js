import { computed, ref } from 'vue'
import {
  addRecord,
  loadDay,
  removeRecord,
  summarizeDay,
  sortRecords,
} from '../../utils/baby/records.js'
import { todayKey } from '../../utils/baby/date.js'

export function useDayRecords(kind, options = {}) {
  const onChange =
    typeof options.onChange === 'function' ? options.onChange : null

  const today = ref(todayKey())
  const day = ref(loadDay(today.value))
  const formOpen = ref(false)
  const formError = ref('')

  const summary = computed(() => summarizeDay(day.value))
  const list = computed(() => sortRecords(day.value[kind] || [], kind))

  function refresh() {
    today.value = todayKey()
    day.value = loadDay(today.value)
    if (onChange) onChange()
  }

  function openForm() {
    formError.value = ''
    formOpen.value = true
  }

  function closeForm() {
    formOpen.value = false
    formError.value = ''
  }

  function submitForm(payload) {
    const res = addRecord(kind, payload)
    if (!res.ok) {
      formError.value = res.error
      return false
    }
    formOpen.value = false
    formError.value = ''
    refresh()
    uni.showToast({ title: '已记录', icon: 'none' })
    return true
  }

  function remove(id) {
    uni.showModal({
      title: '删除记录',
      content: '删除后不可恢复，确定删除这条记录吗？',
      success: (res) => {
        if (!res.confirm) return
        const result = removeRecord(kind, id, today.value)
        if (!result.ok) {
          uni.showToast({ title: result.error || '删除失败', icon: 'none' })
          return
        }
        refresh()
      },
    })
  }

  return {
    today,
    day,
    list,
    summary,
    formOpen,
    formError,
    refresh,
    openForm,
    closeForm,
    submitForm,
    remove,
  }
}
