import { readStorage, writeStorage, removeStorage } from '../storage.js'
import {
  BACKUP_KEY,
  GROWTH_KEY,
  META_KEY,
  MILESTONES_KEY,
  MOODS_KEY,
  NOTES_KEY,
  PROFILE_KEY,
  RECORDS_PREFIX,
  VACCINES_KEY,
  isBabyKey,
  recordsKey,
} from './keys.js'
import { formatDateTime } from './date.js'
import { loadProfile } from './profile.js'
import { loadGrowth } from './growth.js'
import { loadVaccines } from './vaccines.js'
import { loadMilestones, loadMoods, loadNotes } from './journal.js'

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024

function utf8ByteLength(value) {
  let bytes = 0
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code < 0x80) {
      bytes += 1
    } else if (code < 0x800) {
      bytes += 2
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4
        i += 1
      } else {
        bytes += 3
      }
    } else {
      bytes += 3
    }
  }
  return bytes
}

export function listRecordMonths() {
  try {
    const info = uni.getStorageInfoSync()
    const keys = info && Array.isArray(info.keys) ? info.keys : []
    return keys
      .filter((key) => typeof key === 'string' && key.startsWith(RECORDS_PREFIX))
      .map((key) => key.slice(RECORDS_PREFIX.length))
      .filter((month) => /^\d{4}-\d{2}$/.test(month))
      .sort()
  } catch (e) {
    return []
  }
}

export function buildExportPayload(now = new Date()) {
  const records = {}
  for (const month of listRecordMonths()) {
    const value = readStorage(recordsKey(month), null)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      records[month] = value
    }
  }
  return {
    app: 'toolbox-baby',
    schemaVersion: 1,
    exportedAt: formatDateTime(now),
    data: {
      profile: loadProfile(),
      records,
      growth: loadGrowth(),
      vaccines: loadVaccines(),
      milestones: loadMilestones(),
      moods: loadMoods(),
      notes: loadNotes(),
    },
  }
}

export function validateImportPayload(raw) {
  let payload = raw
  if (typeof raw === 'string') {
    if (utf8ByteLength(raw) > MAX_IMPORT_BYTES) {
      return { ok: false, error: '文件超过 2MB 限制' }
    }
    try {
      payload = JSON.parse(raw)
    } catch (e) {
      return { ok: false, error: '文件不是有效的 JSON' }
    }
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: '备份格式不正确' }
  }
  if (payload.app !== 'toolbox-baby') {
    return { ok: false, error: '不是宝宝记录备份文件' }
  }
  if (payload.schemaVersion !== 1) {
    return { ok: false, error: '备份版本不支持' }
  }
  const data = payload.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: '备份数据缺失' }
  }
  if (
    data.profile != null &&
    (typeof data.profile !== 'object' || Array.isArray(data.profile))
  ) {
    return { ok: false, error: '宝宝资料格式不正确' }
  }
  if (!data.records || typeof data.records !== 'object' || Array.isArray(data.records)) {
    return { ok: false, error: '日常记录格式不正确' }
  }
  for (const key of ['growth', 'vaccines', 'milestones', 'notes']) {
    if (!Array.isArray(data[key])) return { ok: false, error: '备份字段不完整' }
  }
  if (!data.moods || typeof data.moods !== 'object' || Array.isArray(data.moods)) {
    return { ok: false, error: '心情记录格式不正确' }
  }
  return { ok: true, payload }
}

export function backupCurrent(now = new Date()) {
  return writeStorage(BACKUP_KEY, buildExportPayload(now))
}

function clearExceptBackup() {
  try {
    const info = uni.getStorageInfoSync()
    const keys = info && Array.isArray(info.keys) ? info.keys : []
    for (const key of keys) {
      if (isBabyKey(key) && key !== BACKUP_KEY) removeStorage(key)
    }
  } catch (e) {
    for (const key of [
      PROFILE_KEY,
      GROWTH_KEY,
      VACCINES_KEY,
      MILESTONES_KEY,
      MOODS_KEY,
      NOTES_KEY,
      META_KEY,
    ]) {
      removeStorage(key)
    }
  }
}

export function restoreData(data, now = new Date()) {
  if (!backupCurrent(now)) {
    return { ok: false, error: '备份当前数据失败，已取消导入' }
  }
  clearExceptBackup()
  const writes = []
  if (data.profile) writes.push(writeStorage(PROFILE_KEY, data.profile))
  if (Array.isArray(data.growth)) writes.push(writeStorage(GROWTH_KEY, data.growth))
  if (Array.isArray(data.vaccines)) writes.push(writeStorage(VACCINES_KEY, data.vaccines))
  if (Array.isArray(data.milestones)) {
    writes.push(writeStorage(MILESTONES_KEY, data.milestones))
  }
  if (Array.isArray(data.notes)) writes.push(writeStorage(NOTES_KEY, data.notes))
  if (data.moods) writes.push(writeStorage(MOODS_KEY, data.moods))
  for (const [month, value] of Object.entries(data.records || {})) {
    if (/^\d{4}-\d{2}$/.test(month)) {
      writes.push(writeStorage(recordsKey(month), value))
    }
  }
  writes.push(writeStorage(META_KEY, { schemaVersion: 1 }))
  if (writes.some((ok) => !ok)) {
    return { ok: false, error: '部分数据写入失败，可重新导入' }
  }
  return { ok: true }
}

export function clearBabyData() {
  try {
    const info = uni.getStorageInfoSync()
    const keys = info && Array.isArray(info.keys) ? info.keys : []
    return keys
      .filter((key) => isBabyKey(key))
      .reduce((ok, key) => removeStorage(key) && ok, true)
  } catch (e) {
    return false
  }
}

export function exportFileName(now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `baby-record-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`
}
