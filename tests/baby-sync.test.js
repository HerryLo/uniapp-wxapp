import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SYNC_SCHEMA_VERSION,
  SYNC_SNAPSHOT_KIND,
  applySyncSnapshot,
  createSyncSnapshot,
} from '../src/package-baby/utils/sync.js'
import {
  MOM_KEY,
  PROFILE_KEY,
  TRAVEL_KEY,
  recordsKey,
} from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
    getStorageInfoSync: () => ({ keys: Object.keys(store) }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function seed() {
  store[PROFILE_KEY] = JSON.stringify({
    name: '小满',
    birthDate: '2025-01-02',
    gender: 'girl',
    createdAt: 1,
    updatedAt: 1,
  })
  store[recordsKey('2026-10')] = JSON.stringify({
    '2026-10-24': {
      milk: [{ id: 'm1', time: '2026-10-24 08:00', type: '母乳', amount: null, createdAt: 1 }],
      sleep: [],
      diaper: [],
      food: [],
      medicine: [],
      supplement: [
        {
          id: 'sup1',
          time: '2026-10-24 12:00',
          name: '维生素D',
          amount: '1 滴',
          note: '',
          createdAt: 1,
        },
      ],
    },
  })
  store[MOM_KEY] = JSON.stringify([
    {
      date: '2026-10-24',
      sleepHours: 6.5,
      mood: 'calm',
      condition: '',
      note: '',
      createdAt: 1,
      updatedAt: 1,
    },
  ])
  store[TRAVEL_KEY] = JSON.stringify([
    {
      id: 't1',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      place: '杭州',
      note: '',
      createdAt: 1,
    },
  ])
}

describe('sync snapshot', () => {
  it('wraps the export payload in a versioned snapshot', () => {
    seed()
    const payload = createSyncSnapshot(new Date(2026, 9, 24, 10, 5))
    expect(payload.kind).toBe(SYNC_SNAPSHOT_KIND)
    expect(payload.schemaVersion).toBe(SYNC_SCHEMA_VERSION)
    expect(payload.snapshot.app).toBe('toolbox-baby')
    expect(payload.snapshot.data.profile.name).toBe('小满')
    expect(payload.snapshot.data.records['2026-10']).toBeTruthy()
    expect(
      payload.snapshot.data.records['2026-10']['2026-10-24'].supplement
    ).toHaveLength(1)
    expect(payload.snapshot.data.mom).toHaveLength(1)
    expect(payload.snapshot.data.travel).toHaveLength(1)
  })

  it('restores a snapshot and accepts the raw export payload', () => {
    seed()
    const payload = createSyncSnapshot(new Date(2026, 9, 24, 10, 5))
    store = {}

    expect(applySyncSnapshot(payload, new Date(2026, 9, 25, 9, 0)).ok).toBe(true)
    expect(JSON.parse(store[PROFILE_KEY]).name).toBe('小满')
    expect(store[recordsKey('2026-10')]).toBeTruthy()
    expect(JSON.parse(store[MOM_KEY])[0].mood).toBe('calm')
    expect(JSON.parse(store[TRAVEL_KEY])[0].place).toBe('杭州')

    store = {}
    expect(applySyncSnapshot(payload.snapshot).ok).toBe(true)
    expect(JSON.parse(store[PROFILE_KEY]).name).toBe('小满')
  })

  it('rejects unknown kinds, versions and invalid snapshots', () => {
    expect(applySyncSnapshot({ kind: 'x', schemaVersion: 1 }).error).toBe(
      '不是宝宝同步快照'
    )
    expect(
      applySyncSnapshot({ kind: SYNC_SNAPSHOT_KIND, schemaVersion: 2 }).error
    ).toBe('同步快照版本不支持')
    expect(applySyncSnapshot({ kind: SYNC_SNAPSHOT_KIND, schemaVersion: 1 }).ok).toBe(
      false
    )
  })
})
