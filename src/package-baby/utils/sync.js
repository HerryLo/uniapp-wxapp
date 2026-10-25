import {
  buildExportPayload,
  restoreData,
  validateImportPayload,
} from './backup.js'

export const SYNC_SNAPSHOT_KIND = 'toolbox-baby-sync'
export const SYNC_SCHEMA_VERSION = 1

export function createSyncSnapshot(now = new Date()) {
  return {
    kind: SYNC_SNAPSHOT_KIND,
    schemaVersion: SYNC_SCHEMA_VERSION,
    snapshot: buildExportPayload(now),
  }
}

export function applySyncSnapshot(payload, now = new Date()) {
  if (payload && payload.kind) {
    if (payload.kind !== SYNC_SNAPSHOT_KIND) {
      return { ok: false, error: '不是宝宝同步快照' }
    }
    if (payload.schemaVersion !== SYNC_SCHEMA_VERSION) {
      return { ok: false, error: '同步快照版本不支持' }
    }
  }
  const snapshot = payload && payload.snapshot ? payload.snapshot : payload
  const check = validateImportPayload(snapshot)
  if (!check.ok) return check
  return restoreData(check.payload.data, now)
}
