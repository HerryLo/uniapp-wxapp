# 宝宝记录与工具箱双 Tab 改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除待办功能，把小程序改为「工具 / 宝宝」双 Tab，并在本地存储上实现宝宝资料、日常记录、生长曲线、疫苗参考、成长手记和数据导出/恢复。

**Architecture:** 纯逻辑放在 `src/utils/baby/`，每个模块只负责一类数据并通过 `src/utils/storage.js` 读写本地存储；宝宝首页留在主包，五个子页面放在 `package-baby` 分包；全局改用粉色主题，宝宝模块广告只出现在宝宝首页和日常记录页（工具页保留现有广告位）。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vite 5 + Vitest 1.6，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 数据只保存在本机，不登录、不上云、不申请定位权限、不发起网络请求。
- 所有日期/时间使用本地时间字符串（`YYYY-MM-DD`、`YYYY-MM-DD HH:mm`），禁止用 `toISOString()` 取日期。
- 健康内容只做记录与参考：不出现诊断、治疗、处方、剂量推荐；二类疫苗必须标注「自费自愿」并提示「请咨询接种门诊」，不得使用「推荐」措辞。
- 疫苗参考预置一类与二类，来源标注为《国家免疫规划疫苗儿童免疫程序及说明（2021年版）》，整理日期 2026-10-24。
- 宝宝模块内广告只放在宝宝首页和日常记录页底部；工具页保留现有广告位；生长曲线、疫苗参考、成长手记、设置页不放广告。
- 全局粉色主题：主色 `#FF8FA3`、白字按钮用深一档 `#E86F87`、浅粉 `#FFB6C1`、背景 `#FFF9F5`、卡片 `#FFFFFF`、正文 `#4A4A4A`、辅助文字 `#888888`、边框 `#FFE4E1`、强调色 `#B5E4CA` / `#FFD93D`；卡片圆角 40rpx，按钮/输入 24rpx。
- 存储 key 必须使用设计文档中的 `baby.*` 命名；清空数据只删 `baby.*`，不得删除 `tools.*`；旧 `tools.todos.v1` 数据保留不自动删除。
- 所有删除操作使用 `uni.showModal` 二次确认；导入上限 2MB，覆盖前先写 `baby.backup.v1`。
- 主包保留 `pages/tools/index`、`pages/baby/index`、`pages/about/about`；宝宝子页面全部在 `package-baby`。
- 每个任务结束后运行相关测试；纯逻辑任务必须先看到测试失败再实现。
- 提交步骤仅在用户明确授权提交后执行；未授权时保留工作区改动，不要自行 commit/push。

---

### Task 1: 宝宝数据 key、本地日期与存储容错

**Files:**
- Create: `src/utils/baby/keys.js`
- Create: `src/utils/baby/date.js`
- Test: `tests/baby-date.test.js`
- Modify: `src/utils/storage.js`
- Modify: `tests/storage.test.js`

**Interfaces:**
- `readStorage(key, fallback)` 保持现有签名；JSON 解析失败时回退并最多提示一次「部分本地数据损坏，已跳过」。
- Produces:
  - `BABY_PREFIX`, `PROFILE_KEY`, `GROWTH_KEY`, `VACCINES_KEY`, `MILESTONES_KEY`, `MOODS_KEY`, `NOTES_KEY`, `META_KEY`, `BACKUP_KEY`, `RECORDS_PREFIX`
  - `recordsKey(month: string): string`
  - `isBabyKey(key: unknown): boolean`
  - `formatDate(date: Date): string`
  - `todayKey(now?: Date): string`
  - `formatDateTime(date: Date): string`
  - `monthKey(value: string | Date): string`
  - `parseLocalDate(value: unknown): Date | null`
  - `parseLocalDateTime(value: unknown): Date | null`
  - `isFutureDate(value: string, now?: Date): boolean`
  - `ageInfo(birthDate: string, now?: Date): { years, months, totalMonths, text } | null`
  - `durationMinutes(start: string, end: string): number`
  - `formatDuration(minutes: number): string`
  - `formatMonthAge(month: number | null): string`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-date.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  todayKey,
  formatDateTime,
  monthKey,
  parseLocalDate,
  parseLocalDateTime,
  ageInfo,
  durationMinutes,
  formatDuration,
  formatMonthAge,
  isFutureDate,
} from '../src/utils/baby/date.js'
import { recordsKey, isBabyKey } from '../src/utils/baby/keys.js'

describe('baby date helpers', () => {
  it('formats local dates without UTC shift', () => {
    const late = new Date(2026, 9, 24, 23, 30)
    const early = new Date(2026, 9, 24, 0, 30)
    expect(todayKey(late)).toBe('2026-10-24')
    expect(todayKey(early)).toBe('2026-10-24')
    expect(formatDateTime(late)).toBe('2026-10-24 23:30')
    expect(monthKey(late)).toBe('2026-10')
    expect(monthKey('2026-10-24 08:00')).toBe('2026-10')
  })

  it('parses valid local dates and rejects impossible dates', () => {
    expect(parseLocalDate('2026-02-28')).toBeInstanceOf(Date)
    expect(parseLocalDate('2026-02-30')).toBe(null)
    expect(parseLocalDate('2026-2-3')).toBe(null)
    expect(parseLocalDateTime('2026-10-24 08:05').getMinutes()).toBe(5)
    expect(parseLocalDateTime('2026-10-24T08:05')).toBe(null)
  })

  it('computes age in months and ignores day difference', () => {
    const now = new Date(2026, 9, 24)
    expect(ageInfo('2025-10-24', now)).toMatchObject({
      years: 1,
      months: 0,
      totalMonths: 12,
      text: '1 岁 0 个月',
    })
    expect(ageInfo('2026-08-25', now)).toMatchObject({ totalMonths: 2, text: '2 个月' })
    expect(ageInfo('2026-10-25', now)).toBe(null)
    expect(ageInfo('', now)).toBe(null)
  })

  it('computes and formats durations', () => {
    expect(durationMinutes('2026-10-24 23:00', '2026-10-25 01:30')).toBe(150)
    expect(durationMinutes('bad', '2026-10-25 01:30')).toBe(0)
    expect(formatDuration(150)).toBe('2 小时 30 分钟')
    expect(formatDuration(120)).toBe('2 小时')
    expect(formatDuration(45)).toBe('45 分钟')
  })

  it('formats month ages', () => {
    expect(formatMonthAge(0)).toBe('出生时')
    expect(formatMonthAge(6)).toBe('6 月龄')
    expect(formatMonthAge(18)).toBe('1 岁 6 个月')
    expect(formatMonthAge(48)).toBe('4 岁')
    expect(formatMonthAge(null)).toBe('未设置')
  })

  it('detects future dates', () => {
    const now = new Date(2026, 9, 24, 12, 0)
    expect(isFutureDate('2026-10-25', now)).toBe(true)
    expect(isFutureDate('2026-10-24', now)).toBe(false)
    expect(isFutureDate('', now)).toBe(false)
  })

  it('builds record keys and prefixes', () => {
    expect(recordsKey('2026-10')).toBe('baby.records.v1.2026-10')
    expect(isBabyKey('baby.growth.v1')).toBe(true)
    expect(isBabyKey('tools.todos.v1')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-date.test.js`

Expected: FAIL, because `src/utils/baby/date.js` and `src/utils/baby/keys.js` do not exist.

- [ ] **Step 3: Implement the keys module**

Create `src/utils/baby/keys.js`:

```js
export const BABY_PREFIX = 'baby.'
export const PROFILE_KEY = 'baby.profile.v1'
export const GROWTH_KEY = 'baby.growth.v1'
export const VACCINES_KEY = 'baby.vaccines.v1'
export const MILESTONES_KEY = 'baby.milestones.v1'
export const MOODS_KEY = 'baby.moods.v1'
export const NOTES_KEY = 'baby.notes.v1'
export const META_KEY = 'baby.meta.v1'
export const BACKUP_KEY = 'baby.backup.v1'
export const RECORDS_PREFIX = 'baby.records.v1.'

export function recordsKey(month) {
  return `${RECORDS_PREFIX}${month}`
}

export function isBabyKey(key) {
  return typeof key === 'string' && key.startsWith(BABY_PREFIX)
}
```

- [ ] **Step 4: Implement the date module**

Create `src/utils/baby/date.js`:

```js
function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey(now = new Date()) {
  return formatDate(now)
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function monthKey(value) {
  if (typeof value === 'string') return value.slice(0, 7)
  if (value instanceof Date) return formatDate(value).slice(0, 7)
  return ''
}

export function parseLocalDate(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function parseLocalDateTime(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const date = new Date(year, month - 1, day, hour, minute)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null
  }
  return date
}

export function isFutureDate(value, now = new Date()) {
  const date = parseLocalDate(value)
  if (!date) return false
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return date.getTime() > today.getTime()
}

export function ageInfo(birthDate, now = new Date()) {
  const birth = parseLocalDate(birthDate)
  if (!birth) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (birth.getTime() > today.getTime()) return null
  const totalMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth())
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const text = years > 0 ? `${years} 岁 ${months} 个月` : `${totalMonths} 个月`
  return { years, months, totalMonths, text }
}

export function durationMinutes(start, end) {
  const from = parseLocalDateTime(start)
  const to = parseLocalDateTime(end)
  if (!from || !to) return 0
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000))
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0))
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (hours && rest) return `${hours} 小时 ${rest} 分钟`
  if (hours) return `${hours} 小时`
  return `${rest} 分钟`
}

export function formatMonthAge(month) {
  if (month == null || !Number.isFinite(Number(month))) return '未设置'
  const value = Number(month)
  if (value === 0) return '出生时'
  if (value < 12) return `${value} 月龄`
  const years = Math.floor(value / 12)
  const rest = value % 12
  return rest ? `${years} 岁 ${rest} 个月` : `${years} 岁`
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/baby-date.test.js`

Expected: PASS, 7 tests.

- [ ] **Step 6: Add a one-time corruption warning to storage**

Replace the entire contents of `src/utils/storage.js` with:

```js
let warned = false

function warnCorruptOnce() {
  if (warned) return
  warned = true
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title: '部分本地数据损坏，已跳过', icon: 'none' })
  }
}

export function readStorage(key, fallback) {
  try {
    const raw = uni.getStorageSync(key)
    if (raw === '' || raw === null || raw === undefined) return fallback
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    warnCorruptOnce()
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

export function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}
```

Append this test inside the existing `describe('storage', ...)` block in `tests/storage.test.js`:

```js
  it('shows one warning when stored JSON is corrupt', async () => {
    vi.resetModules()
    const { readStorage: freshRead } = await import('../src/utils/storage.js')
    const showToast = vi.fn()
    uni.showToast = showToast
    store.bad = '{oops'
    expect(freshRead('bad', [])).toEqual([])
    expect(freshRead('bad', [])).toEqual([])
    expect(showToast).toHaveBeenCalledTimes(1)
  })
```

Run:

```bash
npx vitest run tests/storage.test.js tests/baby-date.test.js
```

Expected: PASS, storage tests including the new one plus the 7 date tests.

- [ ] **Step 7: Commit**

```bash
git add src/utils/baby/keys.js src/utils/baby/date.js src/utils/storage.js tests/baby-date.test.js tests/storage.test.js
git commit -m "feat: add baby storage keys, local date helpers and corruption warning"
```

---

### Task 2: 宝宝资料存储

**Files:**
- Create: `src/utils/baby/profile.js`
- Test: `tests/baby-profile.test.js`

**Interfaces:**
- Consumes: `PROFILE_KEY` from Task 1; `readStorage`, `writeStorage`; `isFutureDate`.
- Produces:
  - `loadProfile(): { name, birthDate, gender, createdAt, updatedAt }`
  - `validateProfile(input: { name, birthDate }): string`（返回空字符串表示合法）
  - `saveProfile(input: { name, birthDate, gender }, now?: number): { ok: boolean, error?: string, profile?: object }`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-profile.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadProfile, saveProfile, validateProfile } from '../src/utils/baby/profile.js'
import { PROFILE_KEY } from '../src/utils/baby/keys.js'

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

describe('baby profile', () => {
  it('returns defaults when missing or corrupt', () => {
    expect(loadProfile()).toMatchObject({ name: '宝宝', birthDate: '', gender: 'boy' })
    store[PROFILE_KEY] = '{oops'
    expect(loadProfile().name).toBe('宝宝')
  })

  it('validates name, date and future dates', () => {
    expect(validateProfile({ name: '', birthDate: '2026-01-01' })).toBe('请输入宝宝昵称')
    expect(validateProfile({ name: '宝宝', birthDate: '' })).toBe('请选择出生日期')
    expect(validateProfile({ name: '宝宝', birthDate: '2026-02-30' })).toBe('出生日期格式不正确')
    expect(validateProfile({ name: '宝宝', birthDate: '2999-01-01' })).toBe('出生日期不能晚于今天')
    expect(validateProfile({ name: '宝宝', birthDate: '2026-01-01' })).toBe('')
  })

  it('saves and reloads profile', () => {
    const res = saveProfile({ name: ' 小满 ', birthDate: '2025-01-02', gender: 'girl' }, 1000)
    expect(res.ok).toBe(true)
    expect(loadProfile()).toMatchObject({
      name: '小满',
      birthDate: '2025-01-02',
      gender: 'girl',
      createdAt: 1000,
      updatedAt: 1000,
    })
  })

  it('reports write failure', () => {
    uni.setStorageSync = () => { throw new Error('fail') }
    expect(saveProfile({ name: '宝宝', birthDate: '2025-01-01' })).toEqual({
      ok: false,
      error: '保存失败',
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-profile.test.js`

Expected: FAIL, because `src/utils/baby/profile.js` does not exist.

- [ ] **Step 3: Implement the profile module**

Create `src/utils/baby/profile.js`:

```js
import { readStorage, writeStorage } from '../storage.js'
import { PROFILE_KEY } from './keys.js'
import { isFutureDate, parseLocalDate } from './date.js'

const DEFAULT_PROFILE = {
  name: '宝宝',
  birthDate: '',
  gender: 'boy',
  createdAt: null,
  updatedAt: null,
}

export function loadProfile() {
  const raw = readStorage(PROFILE_KEY, null)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_PROFILE }
  }
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  return {
    name: name ? name.slice(0, 20) : DEFAULT_PROFILE.name,
    birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : '',
    gender: raw.gender === 'girl' ? 'girl' : 'boy',
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : null,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : null,
  }
}

export function validateProfile(input) {
  const name = String(input.name || '').trim()
  if (!name) return '请输入宝宝昵称'
  if (name.length > 20) return '昵称最多 20 个字'
  if (!input.birthDate) return '请选择出生日期'
  if (!parseLocalDate(input.birthDate)) return '出生日期格式不正确'
  if (isFutureDate(input.birthDate)) return '出生日期不能晚于今天'
  return ''
}

export function saveProfile(input, now = Date.now()) {
  const error = validateProfile(input)
  if (error) return { ok: false, error }
  const previous = loadProfile()
  const profile = {
    name: String(input.name).trim(),
    birthDate: input.birthDate,
    gender: input.gender === 'girl' ? 'girl' : 'boy',
    createdAt: previous.createdAt || now,
    updatedAt: now,
  }
  if (!writeStorage(PROFILE_KEY, profile)) return { ok: false, error: '保存失败' }
  return { ok: true, profile }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/baby-profile.test.js`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/baby/profile.js tests/baby-profile.test.js
git commit -m "feat: add baby profile storage"
```

---

### Task 3: 日常记录（喝奶 / 睡眠 / 排便）

**Files:**
- Create: `src/utils/baby/records.js`
- Test: `tests/baby-records.test.js`

**Interfaces:**
- Consumes: `recordsKey`, `monthKey`, `parseLocalDateTime`, `durationMinutes`, `readStorage`, `writeStorage`.
- Produces:
  - `validateMilk(input)`, `validateSleep(input)`, `validateDiaper(input)`（返回空字符串表示合法）
  - `addRecord(kind: 'milk'|'sleep'|'diaper', input, now?: number): { ok, error?, record?, date? }`
  - `loadDay(dateStr: string): { milk: [], sleep: [], diaper: [] }`
  - `summarizeDay(day): { milkCount, milkAmount, sleepMinutes, diaperCount }`
  - `sortRecords(list, kind): Array`
  - `removeRecord(kind, id: string, dateStr: string): { ok, error? }`
  - `recordDate(kind, record): string`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-records.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  addRecord,
  loadDay,
  removeRecord,
  summarizeDay,
  sortRecords,
  validateMilk,
  validateSleep,
  validateDiaper,
} from '../src/utils/baby/records.js'

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

describe('baby records', () => {
  it('validates inputs', () => {
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '' })).toBe('')
    expect(validateMilk({ time: '', type: '母乳' })).toContain('时间')
    expect(validateMilk({ time: '2026-10-24 08:00', type: '水', amount: '' })).toContain('类型')
    expect(validateMilk({ time: '2026-10-24 08:00', type: '母乳', amount: '-1' })).toContain('奶量')
    expect(validateSleep({ start: '2026-10-24 23:00', end: '2026-10-25 01:00' })).toBe('')
    expect(validateSleep({ start: '2026-10-24 23:00', end: '2026-10-24 22:00' })).toContain('晚于')
    expect(validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常' })).toBe('')
  })

  it('adds, groups and summarizes a day', () => {
    expect(addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' }, 1).ok).toBe(true)
    expect(addRecord('milk', { time: '2026-10-24 12:00', type: '配方奶', amount: '120' }, 2).ok).toBe(true)
    expect(addRecord('diaper', { time: '2026-10-24 09:00', type: '小便', color: '正常' }, 3).ok).toBe(true)
    expect(addRecord('sleep', { start: '2026-10-24 23:00', end: '2026-10-25 01:30' }, 4).ok).toBe(true)

    const day = loadDay('2026-10-24')
    expect(day.milk).toHaveLength(2)
    expect(day.diaper).toHaveLength(1)
    expect(day.sleep).toHaveLength(1)
    expect(summarizeDay(day)).toEqual({
      milkCount: 2,
      milkAmount: 120,
      sleepMinutes: 150,
      diaperCount: 1,
    })
    expect(loadDay('2026-10-25').sleep).toHaveLength(0)
  })

  it('sorts by time descending', () => {
    addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' }, 1)
    addRecord('milk', { time: '2026-10-24 12:00', type: '母乳', amount: '' }, 2)
    expect(sortRecords(loadDay('2026-10-24').milk, 'milk').map((item) => item.time)).toEqual([
      '2026-10-24 12:00',
      '2026-10-24 08:00',
    ])
  })

  it('removes a record and drops empty days', () => {
    const added = addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '绿色' }, 1)
    expect(removeRecord('diaper', added.record.id, '2026-10-24').ok).toBe(true)
    expect(loadDay('2026-10-24').diaper).toHaveLength(0)
  })

  it('reports storage failure', () => {
    uni.setStorageSync = () => { throw new Error('fail') }
    expect(
      addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' })
    ).toEqual({ ok: false, error: '保存失败' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-records.test.js`

Expected: FAIL, because `src/utils/baby/records.js` does not exist.

- [ ] **Step 3: Implement the records module**

Create `src/utils/baby/records.js`:

```js
import { readStorage, writeStorage } from '../storage.js'
import { recordsKey } from './keys.js'
import { durationMinutes, monthKey, parseLocalDateTime } from './date.js'

const KINDS = ['milk', 'sleep', 'diaper']
const MILK_TYPES = ['母乳', '配方奶', '混合']
const DIAPER_TYPES = ['大便', '小便', '都有']
const DIAPER_COLORS = ['正常', '绿色', '黑色', '白色', '带血']

function makeId(now) {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyDay() {
  return { milk: [], sleep: [], diaper: [] }
}

function sanitize(list, timeField) {
  if (!Array.isArray(list)) return []
  return list.filter(
    (item) => item && typeof item.id === 'string' && typeof item[timeField] === 'string'
  )
}

function normalizeDay(entry) {
  const source = entry && typeof entry === 'object' ? entry : {}
  return {
    milk: sanitize(source.milk, 'time'),
    sleep: sanitize(source.sleep, 'start'),
    diaper: sanitize(source.diaper, 'time'),
  }
}

export function validateMilk(input) {
  if (!parseLocalDateTime(input.time)) return '请选择喝奶时间'
  if (!MILK_TYPES.includes(input.type)) return '请选择喝奶类型'
  if (input.amount !== '' && input.amount != null) {
    const amount = Number(input.amount)
    if (!Number.isInteger(amount) || amount < 0) return '奶量需为非负整数'
  }
  return ''
}

export function validateSleep(input) {
  const start = parseLocalDateTime(input.start)
  const end = parseLocalDateTime(input.end)
  if (!start) return '请选择开始时间'
  if (!end) return '请选择结束时间'
  if (end.getTime() <= start.getTime()) return '结束时间必须晚于开始时间'
  return ''
}

export function validateDiaper(input) {
  if (!parseLocalDateTime(input.time)) return '请选择排便时间'
  if (!DIAPER_TYPES.includes(input.type)) return '请选择排便类型'
  if (!DIAPER_COLORS.includes(input.color)) return '请选择颜色'
  return ''
}

function validateRecord(kind, input) {
  if (kind === 'milk') return validateMilk(input)
  if (kind === 'sleep') return validateSleep(input)
  if (kind === 'diaper') return validateDiaper(input)
  return '未知记录类型'
}

function makeRecord(kind, input, now) {
  if (kind === 'milk') {
    return {
      id: makeId(now),
      time: input.time,
      type: input.type,
      amount: input.amount === '' || input.amount == null ? null : Number(input.amount),
      createdAt: now,
    }
  }
  if (kind === 'sleep') {
    return { id: makeId(now), start: input.start, end: input.end, createdAt: now }
  }
  return {
    id: makeId(now),
    time: input.time,
    type: input.type,
    color: input.color,
    createdAt: now,
  }
}

export function recordDate(kind, record) {
  const value = kind === 'sleep' ? record.start : record.time
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

export function loadMonth(month) {
  const raw = readStorage(recordsKey(month), {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result = {}
  for (const [day, entry] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    result[day] = normalizeDay(entry)
  }
  return result
}

export function loadDay(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return emptyDay()
  const month = loadMonth(monthKey(dateStr))
  return normalizeDay(month[dateStr])
}

export function addRecord(kind, input, now = Date.now()) {
  if (!KINDS.includes(kind)) return { ok: false, error: '未知记录类型' }
  const error = validateRecord(kind, input)
  if (error) return { ok: false, error }
  const record = makeRecord(kind, input, now)
  const dateStr = recordDate(kind, record)
  const month = monthKey(dateStr)
  const data = loadMonth(month)
  const day = data[dateStr] || emptyDay()
  day[kind] = [record, ...day[kind]]
  data[dateStr] = day
  if (!writeStorage(recordsKey(month), data)) return { ok: false, error: '保存失败' }
  return { ok: true, record, date: dateStr }
}

export function removeRecord(kind, id, dateStr) {
  if (!KINDS.includes(kind) || typeof dateStr !== 'string') {
    return { ok: false, error: '参数错误' }
  }
  const month = monthKey(dateStr)
  const data = loadMonth(month)
  const day = data[dateStr]
  if (!day) return { ok: true }
  const next = day[kind].filter((item) => item.id !== id)
  if (next.length === day[kind].length) return { ok: true }
  const nextDay = { ...day, [kind]: next }
  if (!nextDay.milk.length && !nextDay.sleep.length && !nextDay.diaper.length) {
    delete data[dateStr]
  } else {
    data[dateStr] = nextDay
  }
  return writeStorage(recordsKey(month), data)
    ? { ok: true }
    : { ok: false, error: '删除失败' }
}

export function summarizeDay(day) {
  const source = normalizeDay(day)
  const milkAmount = source.milk.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0
  )
  const sleepMinutes = source.sleep.reduce(
    (sum, item) => sum + durationMinutes(item.start, item.end),
    0
  )
  return {
    milkCount: source.milk.length,
    milkAmount,
    sleepMinutes,
    diaperCount: source.diaper.length,
  }
}

export function sortRecords(list, kind) {
  const field = kind === 'sleep' ? 'start' : 'time'
  return [...list].sort((a, b) =>
    String(b[field] || '').localeCompare(String(a[field] || ''))
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/baby-records.test.js`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/baby/records.js tests/baby-records.test.js
git commit -m "feat: add baby daily record storage"
```

---

### Task 4: 生长曲线数据

**Files:**
- Create: `src/utils/baby/growth.js`
- Test: `tests/baby-growth.test.js`

**Interfaces:**
- Consumes: `GROWTH_KEY`, `parseLocalDate`, `readStorage`, `writeStorage`.
- Produces:
  - `validateGrowth(input): string`
  - `loadGrowth(): Array`
  - `saveGrowth(list): boolean`
  - `upsertGrowth(list, input, now?: number): { ok, error?, list? }`
  - `removeGrowth(list, id): { ok, error?, list? }`
  - `chartPoints(list, key: 'height'|'weight'): Array<{ date, value }>`
  - `latestGrowth(list): object | null`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-growth.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadGrowth,
  upsertGrowth,
  removeGrowth,
  chartPoints,
  latestGrowth,
  validateGrowth,
} from '../src/utils/baby/growth.js'
import { GROWTH_KEY } from '../src/utils/baby/keys.js'

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

describe('baby growth', () => {
  it('validates date, height and weight', () => {
    expect(validateGrowth({ date: '2026-02-30', height: '70', weight: '8' })).toBe('请选择测量日期')
    expect(validateGrowth({ date: '2026-10-24', height: '', weight: '8' })).toBe('请输入身高')
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '' })).toBe('请输入体重')
    expect(validateGrowth({ date: '2026-10-24', height: '10', weight: '8' })).toContain('20–200')
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '0.1' })).toContain('0.5–100')
    expect(validateGrowth({ date: '2026-10-24', height: '70', weight: '8' })).toBe('')
  })

  it('inserts records in date order and updates the same date', () => {
    const first = upsertGrowth([], { date: '2026-10-01', height: '70', weight: '8' }, 1)
    expect(first.ok).toBe(true)
    const second = upsertGrowth(first.list, { date: '2026-09-01', height: '68', weight: '7.5' }, 2)
    expect(second.list.map((item) => item.date)).toEqual(['2026-09-01', '2026-10-01'])

    const updated = upsertGrowth(second.list, { date: '2026-10-01', height: '72', weight: '8.4' }, 3)
    expect(updated.list).toHaveLength(2)
    expect(updated.list.find((item) => item.date === '2026-10-01').height).toBe(72)
    expect(loadGrowth()).toHaveLength(2)
  })

  it('builds chart points and latest record', () => {
    const list = [
      { id: 'a', date: '2026-10-01', height: 70, weight: 8, createdAt: 1 },
      { id: 'b', date: '2026-09-01', height: 68, weight: 7.5, createdAt: 2 },
    ]
    expect(chartPoints(list, 'height')).toEqual([
      { date: '2026-09-01', value: 68 },
      { date: '2026-10-01', value: 70 },
    ])
    expect(latestGrowth(list).date).toBe('2026-10-01')
    expect(latestGrowth([])).toBe(null)
  })

  it('removes records', () => {
    const added = upsertGrowth([], { date: '2026-10-01', height: '70', weight: '8' }, 1)
    const removed = removeGrowth(added.list, added.list[0].id)
    expect(removed.ok).toBe(true)
    expect(loadGrowth()).toHaveLength(0)
  })

  it('filters corrupt stored records', () => {
    store[GROWTH_KEY] = JSON.stringify([
      { id: 'ok', date: '2026-10-01', height: 70, weight: 8 },
      { id: 'bad', date: 'x', height: 70, weight: 8 },
      null,
    ])
    expect(loadGrowth()).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-growth.test.js`

Expected: FAIL, because `src/utils/baby/growth.js` does not exist.

- [ ] **Step 3: Implement the growth module**

Create `src/utils/baby/growth.js`:

```js
import { readStorage, writeStorage } from '../storage.js'
import { GROWTH_KEY } from './keys.js'
import { parseLocalDate } from './date.js'

function makeId(now) {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`
}

export function validateGrowth(input) {
  if (!parseLocalDate(input.date)) return '请选择测量日期'
  if (input.height === '' || input.height == null) return '请输入身高'
  if (input.weight === '' || input.weight == null) return '请输入体重'
  const height = Number(input.height)
  const weight = Number(input.weight)
  if (!Number.isFinite(height) || height < 20 || height > 200) {
    return '身高需在 20–200 cm'
  }
  if (!Number.isFinite(weight) || weight < 0.5 || weight > 100) {
    return '体重需在 0.5–100 kg'
  }
  return ''
}

export function loadGrowth() {
  const raw = readStorage(GROWTH_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        parseLocalDate(item.date) &&
        Number.isFinite(item.height) &&
        Number.isFinite(item.weight)
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      height: item.height,
      weight: item.weight,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function saveGrowth(list) {
  return writeStorage(GROWTH_KEY, list)
}

export function upsertGrowth(list, input, now = Date.now()) {
  const error = validateGrowth(input)
  if (error) return { ok: false, error }
  const height = Number(input.height)
  const weight = Number(input.weight)
  const exists = list.some((item) => item.date === input.date)
  const next = exists
    ? list.map((item) =>
        item.date === input.date ? { ...item, height, weight } : item
      )
    : [...list, { id: makeId(now), date: input.date, height, weight, createdAt: now }]
  next.sort((a, b) => a.date.localeCompare(b.date))
  if (!saveGrowth(next)) return { ok: false, error: '保存失败' }
  return { ok: true, list: next }
}

export function removeGrowth(list, id) {
  const next = list.filter((item) => item.id !== id)
  if (next.length === list.length) return { ok: true, list: next }
  if (!saveGrowth(next)) return { ok: false, error: '删除失败' }
  return { ok: true, list: next }
}

export function chartPoints(list, key) {
  return [...list]
    .filter((item) => Number.isFinite(item[key]))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({ date: item.date, value: item[key] }))
}

export function latestGrowth(list) {
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
  return sorted[sorted.length - 1]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/baby-growth.test.js`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/baby/growth.js tests/baby-growth.test.js
git commit -m "feat: add baby growth data helpers"
```

### Task 5: 疫苗参考数据与状态逻辑

**Files:**
- Create: `src/data/vaccinePlan.js`
- Create: `src/utils/baby/vaccines.js`
- Test: `tests/baby-vaccines.test.js`

**Interfaces:**
- Consumes: `VACCINES_KEY`, `readStorage`, `writeStorage`.
- Produces:
  - `VACCINE_PLAN`（`src/data/vaccinePlan.js`，29 项）
  - `VACCINE_SOURCE`（来源、说明、整理日期）
  - `VACCINE_TYPES`、`createBuiltinVaccines()`
  - `loadVaccines()`、`saveVaccines(list)`
  - `setVaccineDone(list, id, done, date?)`
  - `addCustomVaccine(list, { name, type, month }, now?)` → `{ ok, error?, list?, vaccine? }`
  - `removeCustomVaccine(list, id)` → `{ ok, error?, list? }`
  - `vaccineStatus(vaccine, totalMonths)` → `{ key, label }`
  - `nextVaccine(list, totalMonths)` → 疫苗或 `null`
  - `groupVaccines(list)` → `[{ type: '一类'|'二类', items: [] }]`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-vaccines.test.js`:

```js
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
import { VACCINE_PLAN } from '../src/data/vaccinePlan.js'
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-vaccines.test.js`

Expected: FAIL, because `src/data/vaccinePlan.js` and `src/utils/baby/vaccines.js` do not exist.

- [ ] **Step 3: Create the vaccine reference data**

Create `src/data/vaccinePlan.js`:

```js
export const VACCINE_SOURCE = {
  title: '《国家免疫规划疫苗儿童免疫程序及说明（2021年版）》',
  note: '一类为免疫规划参考；二类为常见自费自愿疫苗示例，不构成推荐。各地供应、程序和价格不同，请咨询接种门诊并以当地安排为准。',
  updatedAt: '2026-10-24',
}

export const VACCINE_PLAN = [
  { key: 'hep-b-1', name: '乙肝疫苗（第1剂）', month: 0, type: '一类' },
  { key: 'hep-b-2', name: '乙肝疫苗（第2剂）', month: 1, type: '一类' },
  { key: 'hep-b-3', name: '乙肝疫苗（第3剂）', month: 6, type: '一类' },
  { key: 'bcg', name: '卡介苗', month: 0, type: '一类' },
  { key: 'ipv-1', name: '脊灰灭活疫苗（第1剂）', month: 2, type: '一类' },
  { key: 'ipv-2', name: '脊灰灭活疫苗（第2剂）', month: 3, type: '一类' },
  { key: 'bopv-1', name: '脊灰减毒活疫苗（第1剂）', month: 4, type: '一类' },
  { key: 'bopv-2', name: '脊灰减毒活疫苗（第2剂）', month: 48, type: '一类' },
  { key: 'dtap-1', name: '百白破疫苗（第1剂）', month: 3, type: '一类' },
  { key: 'dtap-2', name: '百白破疫苗（第2剂）', month: 4, type: '一类' },
  { key: 'dtap-3', name: '百白破疫苗（第3剂）', month: 5, type: '一类' },
  { key: 'dtap-4', name: '百白破疫苗（第4剂）', month: 18, type: '一类' },
  { key: 'dt', name: '白破疫苗', month: 72, type: '一类' },
  { key: 'mmr-1', name: '麻腮风疫苗（第1剂）', month: 8, type: '一类' },
  { key: 'mmr-2', name: '麻腮风疫苗（第2剂）', month: 18, type: '一类' },
  { key: 'je-1', name: '乙脑减毒活疫苗（第1剂）', month: 8, type: '一类' },
  { key: 'je-2', name: '乙脑减毒活疫苗（第2剂）', month: 24, type: '一类' },
  { key: 'mpsv-a-1', name: 'A群流脑多糖疫苗（第1剂）', month: 6, type: '一类' },
  { key: 'mpsv-a-2', name: 'A群流脑多糖疫苗（第2剂）', month: 9, type: '一类' },
  { key: 'mpsv-ac-1', name: 'A群C群流脑多糖疫苗（第1剂）', month: 36, type: '一类' },
  { key: 'mpsv-ac-2', name: 'A群C群流脑多糖疫苗（第2剂）', month: 72, type: '一类' },
  { key: 'hepa', name: '甲肝减毒活疫苗', month: 18, type: '一类' },
  { key: 'rv', name: '轮状病毒疫苗', month: 2, type: '二类' },
  { key: 'pcv13', name: '13价肺炎球菌结合疫苗', month: 2, type: '二类' },
  { key: 'dtap-ipv-hib', name: '五联疫苗', month: 2, type: '二类' },
  { key: 'hib', name: 'Hib疫苗', month: 2, type: '二类' },
  { key: 'ev71', name: 'EV71手足口病疫苗', month: 6, type: '二类' },
  { key: 'flu', name: '流感疫苗', month: 6, type: '二类' },
  { key: 'var', name: '水痘疫苗', month: 12, type: '二类' },
]
```

- [ ] **Step 4: Implement the vaccine module**

Create `src/utils/baby/vaccines.js`:

```js
import { readStorage, writeStorage } from '../storage.js'
import { VACCINES_KEY } from './keys.js'
import { VACCINE_PLAN } from '../../data/vaccinePlan.js'

export const VACCINE_TYPES = ['一类', '二类']

function makeId(now) {
  return `custom-${now}-${Math.random().toString(36).slice(2, 8)}`
}

export function createBuiltinVaccines() {
  return VACCINE_PLAN.map((item) => ({
    id: `builtin-${item.key}`,
    name: item.name,
    month: item.month,
    type: item.type,
    done: false,
    date: '',
    builtin: true,
  }))
}

function normalize(item) {
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') return null
  if (!VACCINE_TYPES.includes(item.type)) return null
  const month = item.month == null ? null : Number(item.month)
  if (month != null && (!Number.isInteger(month) || month < 0)) return null
  return {
    id: item.id,
    name: item.name,
    month,
    type: item.type,
    done: !!item.done,
    date: typeof item.date === 'string' ? item.date : '',
    builtin: !!item.builtin,
  }
}

export function loadVaccines() {
  const raw = readStorage(VACCINES_KEY, null)
  if (!Array.isArray(raw)) {
    const builtins = createBuiltinVaccines()
    writeStorage(VACCINES_KEY, builtins)
    return builtins
  }
  return raw.map(normalize).filter(Boolean)
}

export function saveVaccines(list) {
  return writeStorage(VACCINES_KEY, list)
}

export function setVaccineDone(list, id, done, date = '') {
  return list.map((item) => {
    if (item.id !== id) return item
    if (!done) return { ...item, done: false, date: '' }
    return { ...item, done: true, date: date || item.date }
  })
}

export function addCustomVaccine(list, input, now = Date.now()) {
  const name = String(input.name || '').trim()
  if (!name) return { ok: false, error: '请输入疫苗名称' }
  if (name.length > 30) return { ok: false, error: '名称最多 30 个字' }
  if (!VACCINE_TYPES.includes(input.type)) return { ok: false, error: '请选择疫苗类型' }
  let month = null
  if (input.month !== '' && input.month != null) {
    month = Number(input.month)
    if (!Number.isInteger(month) || month < 0 || month > 216) {
      return { ok: false, error: '参考月龄需为 0–216 的整数' }
    }
  }
  const vaccine = {
    id: makeId(now),
    name,
    month,
    type: input.type,
    done: false,
    date: '',
    builtin: false,
  }
  return { ok: true, list: [...list, vaccine], vaccine }
}

export function removeCustomVaccine(list, id) {
  const target = list.find((item) => item.id === id)
  if (!target) return { ok: false, error: '疫苗不存在' }
  if (target.builtin) return { ok: false, error: '内置参考项不可删除' }
  return { ok: true, list: list.filter((item) => item.id !== id) }
}

export function vaccineStatus(vaccine, totalMonths) {
  if (vaccine.done) return { key: 'done', label: '已接种' }
  if (vaccine.month == null || totalMonths == null) {
    return { key: 'pending', label: '未接种' }
  }
  if (totalMonths <= vaccine.month) return { key: 'due', label: '待接种' }
  return { key: 'overdue', label: '已超过参考月龄' }
}

export function nextVaccine(list, totalMonths) {
  if (totalMonths == null) return null
  const candidates = list.filter((item) => !item.done && item.month != null)
  if (!candidates.length) return null
  candidates.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month
    if (a.type !== b.type) return a.type === '一类' ? -1 : 1
    return a.name.localeCompare(b.name, 'zh')
  })
  return candidates[0]
}

export function groupVaccines(list) {
  const sortItems = (items) =>
    [...items].sort((a, b) => {
      if (a.month == null && b.month == null) return a.name.localeCompare(b.name, 'zh')
      if (a.month == null) return 1
      if (b.month == null) return -1
      if (a.month !== b.month) return a.month - b.month
      return a.name.localeCompare(b.name, 'zh')
    })
  return VACCINE_TYPES
    .map((type) => ({ type, items: sortItems(list.filter((item) => item.type === type)) }))
    .filter((group) => group.items.length > 0)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/baby-vaccines.test.js`

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/data/vaccinePlan.js src/utils/baby/vaccines.js tests/baby-vaccines.test.js
git commit -m "feat: add vaccine reference data and status logic"
```

---

### Task 6: 成长手记与参考里程碑

**Files:**
- Create: `src/data/referenceMilestones.js`
- Create: `src/utils/baby/journal.js`
- Test: `tests/baby-journal.test.js`

**Interfaces:**
- Consumes: `MILESTONES_KEY`, `MOODS_KEY`, `NOTES_KEY`, `parseLocalDate`, `readStorage`, `writeStorage`.
- Produces:
  - `REFERENCE_MILESTONES`、`REFERENCE_MILESTONE_NOTE`
  - `MOODS`（5 项，`{ key, emoji, label }`）
  - `loadMilestones()`、`addMilestone(input, now?)`、`removeMilestone(id)`
  - `loadMoods()`、`setMood(date, moodKey)`
  - `loadNotes()`、`addNote(input, now?)`、`removeNote(id)`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-journal.test.js`:

```js
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
} from '../src/utils/baby/journal.js'
import {
  REFERENCE_MILESTONES,
  REFERENCE_MILESTONE_NOTE,
} from '../src/data/referenceMilestones.js'
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-journal.test.js`

Expected: FAIL, because `src/utils/baby/journal.js` and `src/data/referenceMilestones.js` do not exist.

- [ ] **Step 3: Create the reference milestone data**

Create `src/data/referenceMilestones.js`:

```js
export const REFERENCE_MILESTONES = [
  { month: 1, text: '短暂抬头，开始追视人脸' },
  { month: 3, text: '俯卧抬头较稳，会笑出声' },
  { month: 6, text: '扶坐或独坐，伸手抓玩具' },
  { month: 9, text: '会爬，扶物站立' },
  { month: 12, text: '独立站立，可能有意识叫爸爸妈妈' },
  { month: 18, text: '独立行走，会说几个词' },
  { month: 24, text: '会跑，能说短句' },
  { month: 36, text: '双脚跳，尝试自己穿简单衣物' },
]

export const REFERENCE_MILESTONE_NOTE =
  '以上仅为常见发育里程碑参考，个体差异较大，不构成发育评估。如有疑问请咨询儿科医生。'
```

- [ ] **Step 4: Implement the journal module**

Create `src/utils/baby/journal.js`:

```js
import { readStorage, writeStorage } from '../storage.js'
import { MILESTONES_KEY, MOODS_KEY, NOTES_KEY } from './keys.js'
import { parseLocalDate } from './date.js'

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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/baby-journal.test.js`

Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/data/referenceMilestones.js src/utils/baby/journal.js tests/baby-journal.test.js
git commit -m "feat: add baby journal and reference milestones"
```

---

### Task 7: 导出、恢复与清空

**Files:**
- Create: `src/utils/baby/backup.js`
- Test: `tests/baby-backup.test.js`

**Interfaces:**
- Consumes: 所有 `baby.*` key、`loadProfile`、`loadGrowth`、`loadVaccines`、`loadMilestones`、`loadMoods`、`loadNotes`、`readStorage`、`writeStorage`、`removeStorage`。
- Produces:
  - `MAX_IMPORT_BYTES`（2MB）
  - `listRecordMonths(): string[]`
  - `buildExportPayload(now?: Date): object`
  - `validateImportPayload(raw: string | object): { ok, error?, payload? }`
  - `backupCurrent(now?: Date): boolean`
  - `restoreData(data, now?: Date): { ok, error? }`
  - `clearBabyData(): boolean`
  - `exportFileName(now?: Date): string`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-backup.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MAX_IMPORT_BYTES,
  buildExportPayload,
  validateImportPayload,
  backupCurrent,
  restoreData,
  clearBabyData,
  exportFileName,
} from '../src/utils/baby/backup.js'
import {
  BACKUP_KEY,
  GROWTH_KEY,
  META_KEY,
  MILESTONES_KEY,
  MOODS_KEY,
  NOTES_KEY,
  PROFILE_KEY,
  VACCINES_KEY,
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
    },
  })
  store[GROWTH_KEY] = JSON.stringify([
    { id: 'g1', date: '2026-10-01', height: 75, weight: 9.5, createdAt: 1 },
  ])
  store[VACCINES_KEY] = JSON.stringify([
    {
      id: 'v1',
      name: '乙肝疫苗（第1剂）',
      month: 0,
      type: '一类',
      done: true,
      date: '2025-01-02',
      builtin: true,
    },
  ])
  store[MILESTONES_KEY] = JSON.stringify([
    { id: 'ms1', date: '2026-06-01', title: '第一次翻身', note: '', createdAt: 1 },
  ])
  store[MOODS_KEY] = JSON.stringify({ '2026-10-24': 'happy' })
  store[NOTES_KEY] = JSON.stringify([
    { id: 'n1', date: '2026-10-24', content: '今天很乖', createdAt: 1 },
  ])
}

describe('baby backup', () => {
  it('builds a complete export payload', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    expect(payload).toMatchObject({
      app: 'toolbox-baby',
      schemaVersion: 1,
      exportedAt: '2026-10-24 10:05',
    })
    expect(payload.data.profile.name).toBe('小满')
    expect(payload.data.records['2026-10']).toBeTruthy()
    expect(payload.data.growth).toHaveLength(1)
    expect(payload.data.vaccines).toHaveLength(1)
    expect(payload.data.milestones).toHaveLength(1)
    expect(payload.data.moods['2026-10-24']).toBe('happy')
    expect(payload.data.notes).toHaveLength(1)
  })

  it('validates import payloads', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    expect(validateImportPayload(JSON.stringify(payload)).ok).toBe(true)
    expect(validateImportPayload('{oops')).toEqual({
      ok: false,
      error: '文件不是有效的 JSON',
    })
    expect(validateImportPayload({ app: 'x', schemaVersion: 1, data: {} }).error).toBe(
      '不是宝宝记录备份文件'
    )
    expect(validateImportPayload({ ...payload, schemaVersion: 2 }).error).toBe(
      '备份版本不支持'
    )
    expect(
      validateImportPayload({ ...payload, data: { ...payload.data, growth: null } }).ok
    ).toBe(false)
    expect(validateImportPayload('x'.repeat(MAX_IMPORT_BYTES + 1)).error).toBe(
      '文件超过 2MB 限制'
    )
  })

  it('backs up current data before restoring and replaces baby data only', () => {
    seed()
    store[recordsKey('2026-09')] = JSON.stringify({
      '2026-09-01': { milk: [], sleep: [], diaper: [] },
    })
    const imported = {
      profile: {
        name: '新宝宝',
        birthDate: '2026-01-01',
        gender: 'boy',
        createdAt: 2,
        updatedAt: 2,
      },
      records: {
        '2026-11': { '2026-11-01': { milk: [], sleep: [], diaper: [] } },
      },
      growth: [],
      vaccines: [],
      milestones: [],
      moods: {},
      notes: [],
    }
    const res = restoreData(imported, new Date(2026, 9, 25, 9, 0))
    expect(res.ok).toBe(true)
    const backup = JSON.parse(store[BACKUP_KEY])
    expect(backup.data.profile.name).toBe('小满')
    expect(JSON.parse(store[PROFILE_KEY]).name).toBe('新宝宝')
    expect(store[recordsKey('2026-10')]).toBeUndefined()
    expect(store[recordsKey('2026-09')]).toBeUndefined()
    expect(store[recordsKey('2026-11')]).toBeTruthy()
    expect(JSON.parse(store[META_KEY])).toEqual({ schemaVersion: 1 })
  })

  it('does not restore when the backup write fails', () => {
    seed()
    const originalSet = uni.setStorageSync
    uni.setStorageSync = (key, value) => {
      if (key === BACKUP_KEY) throw new Error('fail')
      originalSet(key, value)
    }
    const res = restoreData({ profile: null, records: {}, growth: [], vaccines: [], milestones: [], moods: {}, notes: [] })
    expect(res).toEqual({ ok: false, error: '备份当前数据失败，已取消导入' })
    expect(JSON.parse(store[PROFILE_KEY]).name).toBe('小满')
  })

  it('clears all baby data and keeps tools data', () => {
    seed()
    backupCurrent()
    store['tools.todos.v1'] = '[]'
    expect(clearBabyData()).toBe(true)
    expect(store[BACKUP_KEY]).toBeUndefined()
    expect(store[PROFILE_KEY]).toBeUndefined()
    expect(store[recordsKey('2026-10')]).toBeUndefined()
    expect(store['tools.todos.v1']).toBe('[]')
  })

  it('builds the export file name', () => {
    expect(exportFileName(new Date(2026, 9, 24, 10, 5))).toBe(
      'baby-record-20261024-1005.json'
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-backup.test.js`

Expected: FAIL, because `src/utils/baby/backup.js` does not exist.

- [ ] **Step 3: Implement the backup module**

Create `src/utils/baby/backup.js`:

```js
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
    if (raw.length > MAX_IMPORT_BYTES) return { ok: false, error: '文件超过 2MB 限制' }
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/baby-backup.test.js`

Expected: PASS, 6 tests.

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: PASS，原有工具测试加新增宝宝测试全部通过。

- [ ] **Step 6: Commit**

```bash
git add src/utils/baby/backup.js tests/baby-backup.test.js
git commit -m "feat: add baby data export, restore and clear"
```

### Task 8: 全局粉色主题

**Files:**
- Modify: `src/App.vue`
- Modify: `src/pages.json`
- Modify: `src/components/tools/TextPanel.vue:18,22`
- Modify: `src/pages/tools/index.vue:107,194`

**Interfaces:**
- Produces CSS 变量：`--primary`、`--primary-strong`、`--primary-soft`、`--accent`、`--accent-warm`，供所有页面使用。
- 不改任何业务逻辑。

- [ ] **Step 1: Replace the global CSS variables**

In `src/App.vue`, replace:

```css
  --bg: #F7F8FA;
  --surface: #FFFFFF;
  --primary: #4361EE;
  --primary-soft: #EEF2FF;
  --text: #1F2937;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
  --danger: #EF4444;
  --success: #10B981;
```

with:

```css
  --bg: #FFF9F5;
  --surface: #FFFFFF;
  --primary: #FF8FA3;
  --primary-strong: #E86F87;
  --primary-soft: #FFE4E1;
  --text: #4A4A4A;
  --text-secondary: #888888;
  --border: #FFE4E1;
  --danger: #D9485F;
  --success: #3E9B6B;
  --accent: #B5E4CA;
  --accent-warm: #FFD93D;
```

- [ ] **Step 2: Update the shared component styles**

In `src/App.vue`, apply these exact replacements:

```css
/* .card */
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.06);
/* -> */
  border-radius: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.12);
```

Add a new shared class immediately after the `.card` rule in `src/App.vue`:

```css
.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
```

```css
/* .input, .textarea, .picker-field each have this line */
  border-radius: 16rpx;
/* -> */
  border-radius: 24rpx;
```

```css
/* .chip */
  background: #F3F4F6;
/* -> */
  background: #FFF1F3;
```

```css
/* .chip.active */
  color: var(--primary);
/* -> */
  color: var(--primary-strong);
```

```css
/* .btn */
  border-radius: 16rpx;
/* -> */
  border-radius: 24rpx;
```

```css
/* .btn-primary */
  background: var(--primary);
/* -> */
  background: var(--primary-strong);
```

```css
/* .btn-ghost */
  border: 1rpx solid var(--primary);
  color: var(--primary);
/* -> */
  border: 1rpx solid var(--primary-strong);
  color: var(--primary-strong);
```

```css
/* .result-box */
  background: #F9FAFB;
/* -> */
  background: #FFF9F5;
```

```css
/* .copy-link */
  color: var(--primary);
/* -> */
  color: var(--primary-strong);
```

- [ ] **Step 3: Update pages.json colors**

In `src/pages.json`:

```json
"navigationBarBackgroundColor": "#FFF9F5",
"backgroundColor": "#FFF9F5"
```

and:

```json
"color": "#888888",
"selectedColor": "#FF8FA3"
```

- [ ] **Step 4: Update hardcoded switch and tools-page colors**

In `src/components/tools/TextPanel.vue`, change both `color="#4361EE"` attributes to `color="#E86F87"`.

In `src/pages/tools/index.vue`:

```css
/* .tools-fab */
  background: var(--primary-strong);
  box-shadow: 0 8rpx 24rpx rgba(232, 111, 135, 0.35);
```

```css
/* .tool-cell */
  background: #FFF9F5;
```

- [ ] **Step 5: Build both targets**

Run:

```bash
npm run build:mp-weixin
npm run build:h5
```

Expected: both builds succeed.

- [ ] **Step 6: Verify compiled colors**

Run:

```bash
node -e "const app=require('./dist/build/mp-weixin/app.json'); console.log(app.tabBar.selectedColor, app.globalStyle.navigationBarBackgroundColor)"
```

Expected: `#FF8FA3 #FFF9F5`.

- [ ] **Step 7: Commit**

```bash
git add src/App.vue src/pages.json src/components/tools/TextPanel.vue src/pages/tools/index.vue
git commit -m "style: apply pink theme globally"
```

---

### Task 9: 免责声明与折线图组件

**Files:**
- Create: `src/components/baby/Disclaimer.vue`
- Create: `src/components/baby/LineChart.vue`

**Interfaces:**
- `Disclaimer` props：`text?: string`。
- `LineChart` props：`points: Array<{ date: 'YYYY-MM-DD', value: number }>`、`unit?: string`、`color?: string`、`height?: number`（rpx，默认 360）；暴露 `redraw()`。

- [ ] **Step 1: Create the Disclaimer component**

Create `src/components/baby/Disclaimer.vue`:

```vue
<template>
  <view class="disclaimer-box">
    <text class="disclaimer-title">温馨提示</text>
    <text class="disclaimer-text">{{ text }}</text>
  </view>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '仅用于家庭记录，不构成医疗建议。如有健康疑问，请咨询医生或接种门诊。',
  },
})
</script>

<style scoped>
.disclaimer-box {
  margin-top: 32rpx;
  padding: 24rpx 28rpx;
  background: #FFF1F3;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
}
.disclaimer-title {
  display: block;
  margin-bottom: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text);
}
.disclaimer-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 2: Create the LineChart component**

Create `src/components/baby/LineChart.vue`:

```vue
<template>
  <view class="chart-wrap" :style="{ height: `${height}rpx` }">
    <canvas type="2d" :id="canvasId" :canvas-id="canvasId" class="chart-canvas" />
  </view>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { parseLocalDate } from '../../utils/baby/date.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
  unit: { type: String, default: '' },
  color: { type: String, default: '#E86F87' },
  height: { type: Number, default: 360 },
})

const instance = getCurrentInstance()
const canvasId = `baby-chart-${Math.random().toString(36).slice(2, 8)}`
const chartWidth = ref(0)
const chartHeight = ref(0)
let ctx = null

function normalizedPoints() {
  return props.points
    .filter(
      (item) => item && Number.isFinite(Number(item.value)) && parseLocalDate(item.date)
    )
    .map((item) => ({ date: item.date, value: Number(item.value) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function draw() {
  if (!ctx || !chartWidth.value || !chartHeight.value) return
  const width = chartWidth.value
  const height = chartHeight.value
  const points = normalizedPoints()
  ctx.clearRect(0, 0, width, height)
  if (!points.length) return

  const pad = { left: 46, right: 16, top: 18, bottom: 30 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  if (innerW <= 0 || innerH <= 0) return

  const values = points.map((item) => item.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  min -= span * 0.1
  max += span * 0.1

  const times = points.map((item) => parseLocalDate(item.date).getTime())
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const xOf = (time) =>
    maxTime === minTime
      ? pad.left + innerW / 2
      : pad.left + ((time - minTime) / (maxTime - minTime)) * innerW
  const yOf = (value) => pad.top + innerH - ((value - min) / (max - min)) * innerH

  ctx.strokeStyle = '#FFE4E1'
  ctx.fillStyle = '#999999'
  ctx.lineWidth = 1
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 3; i += 1) {
    const value = min + ((max - min) * i) / 3
    const y = yOf(value)
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillText(`${Number(value.toFixed(1))}${props.unit}`, pad.left - 6, y)
  }

  ctx.strokeStyle = props.color
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  points.forEach((item, index) => {
    const x = xOf(times[index])
    const y = yOf(item.value)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  ctx.fillStyle = props.color
  points.forEach((item, index) => {
    ctx.beginPath()
    ctx.arc(xOf(times[index]), yOf(item.value), 3, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.fillStyle = '#888888'
  ctx.font = '10px sans-serif'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(points[0].date.slice(5), pad.left, height - pad.bottom + 8)
  if (points.length > 1) {
    ctx.textAlign = 'right'
    ctx.fillText(
      points[points.length - 1].date.slice(5),
      width - pad.right,
      height - pad.bottom + 8
    )
  }
}

function initMpWeixin() {
  // #ifdef MP-WEIXIN
  const query = uni.createSelectorQuery().in(instance.proxy)
  query
    .select(`#${canvasId}`)
    .fields({ node: true, size: true })
    .exec((res) => {
      const info = res && res[0]
      if (!info || !info.node || !info.width || !info.height) return
      const dpr = uni.getSystemInfoSync().pixelRatio || 1
      info.node.width = info.width * dpr
      info.node.height = info.height * dpr
      ctx = info.node.getContext('2d')
      ctx.scale(dpr, dpr)
      chartWidth.value = info.width
      chartHeight.value = info.height
      draw()
    })
  // #endif
}

function initH5() {
  // #ifdef H5
  let el = document.getElementById(canvasId)
  if (!el && instance.proxy && instance.proxy.$el) {
    el = instance.proxy.$el.querySelector('canvas')
  }
  if (el && el.tagName !== 'CANVAS') el = el.querySelector('canvas')
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const dpr = window.devicePixelRatio || 1
  el.width = rect.width * dpr
  el.height = rect.height * dpr
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  ctx = el.getContext('2d')
  ctx.scale(dpr, dpr)
  chartWidth.value = rect.width
  chartHeight.value = rect.height
  draw()
  // #endif
}

function init() {
  initMpWeixin()
  initH5()
}

watch(
  () => props.points,
  () => nextTick(draw),
  { deep: true }
)

onMounted(() => {
  setTimeout(init, 50)
})

onUnmounted(() => {
  ctx = null
})

defineExpose({ redraw: draw })
</script>

<style scoped>
.chart-wrap {
  width: 100%;
}
.chart-canvas {
  width: 100%;
  height: 100%;
}
</style>
```

- [ ] **Step 3: Check SFC syntax**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for(const file of ['src/components/baby/Disclaimer.vue','src/components/baby/LineChart.vue']){const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')}"
```

Expected: prints both file names followed by `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/components/baby/Disclaimer.vue src/components/baby/LineChart.vue
git commit -m "feat: add baby disclaimer and line chart components"
```

---

### Task 10: 日常记录表单组件

**Files:**
- Create: `src/components/baby/RecordForm.vue`

**Interfaces:**
- Props：`visible: boolean`、`kind: 'milk'|'sleep'|'diaper'`、`date?: string`、`error?: string`。
- Emits：`close`、`submit`。
  - 喝奶提交 `{ time, type, amount: string | null }`
  - 睡眠提交 `{ start, end }`
  - 排便提交 `{ time, type, color }`
- 表单只负责收集与格式化，不直接写存储。

- [ ] **Step 1: Create the RecordForm component**

Create `src/components/baby/RecordForm.vue`:

```vue
<template>
  <view v-if="visible" class="form-mask" @click="$emit('close')">
    <view class="form-sheet" @click.stop>
      <view class="form-head">
        <text class="form-title">{{ title }}</text>
        <text class="form-close" @click="$emit('close')">✕</text>
      </view>

      <view v-if="error" class="form-error">{{ error }}</view>

      <template v-if="kind === 'milk'">
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">类型</view>
        <view class="chip-row">
          <view
            v-for="item in milkTypes"
            :key="item"
            class="chip"
            :class="{ active: milkType === item }"
            @click="milkType = item"
          >{{ item }}</view>
        </view>
        <view class="form-label">奶量（ml，可选）</view>
        <input class="input" type="number" v-model="amount" placeholder="例如 120" />
      </template>

      <template v-else-if="kind === 'sleep'">
        <view class="form-label">开始</view>
        <view class="form-row">
          <picker
            mode="date"
            :value="sleepStartDate"
            @change="sleepStartDate = $event.detail.value"
          >
            <view class="form-picker">{{ sleepStartDate }}</view>
          </picker>
          <picker
            mode="time"
            :value="sleepStartTime"
            @change="sleepStartTime = $event.detail.value"
          >
            <view class="form-picker">{{ sleepStartTime }}</view>
          </picker>
        </view>
        <view class="form-label">结束</view>
        <view class="form-row">
          <picker
            mode="date"
            :value="sleepEndDate"
            @change="sleepEndDate = $event.detail.value"
          >
            <view class="form-picker">{{ sleepEndDate }}</view>
          </picker>
          <picker
            mode="time"
            :value="sleepEndTime"
            @change="sleepEndTime = $event.detail.value"
          >
            <view class="form-picker">{{ sleepEndTime }}</view>
          </picker>
        </view>
      </template>

      <template v-else>
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">类型</view>
        <view class="chip-row">
          <view
            v-for="item in diaperTypes"
            :key="item"
            class="chip"
            :class="{ active: diaperType === item }"
            @click="diaperType = item"
          >{{ item }}</view>
        </view>
        <view class="form-label">颜色</view>
        <view class="chip-row">
          <view
            v-for="item in diaperColors"
            :key="item"
            class="chip"
            :class="{ active: diaperColor === item }"
            @click="diaperColor = item"
          >{{ item }}</view>
        </view>
      </template>

      <view class="btn-row">
        <view class="btn btn-primary" @click="submit">保存</view>
        <view class="btn btn-ghost" @click="$emit('close')">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatDateTime, todayKey } from '../../utils/baby/date.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  kind: { type: String, default: 'milk' },
  date: { type: String, default: () => todayKey() },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const milkTypes = ['母乳', '配方奶', '混合']
const diaperTypes = ['大便', '小便', '都有']
const diaperColors = ['正常', '绿色', '黑色', '白色', '带血']

const date = ref(props.date)
const time = ref('')
const milkType = ref('母乳')
const amount = ref('')
const sleepStartDate = ref('')
const sleepStartTime = ref('')
const sleepEndDate = ref('')
const sleepEndTime = ref('')
const diaperType = ref('小便')
const diaperColor = ref('正常')

const title = computed(() => {
  if (props.kind === 'sleep') return '记录睡眠'
  if (props.kind === 'diaper') return '记录排便'
  return '记录喝奶'
})

function reset() {
  const now = new Date()
  const start = formatDateTime(now)
  const end = formatDateTime(new Date(now.getTime() + 60 * 60000))
  date.value = props.date || todayKey()
  time.value = start.slice(11, 16)
  milkType.value = '母乳'
  amount.value = ''
  sleepStartDate.value = start.slice(0, 10)
  sleepStartTime.value = start.slice(11, 16)
  sleepEndDate.value = end.slice(0, 10)
  sleepEndTime.value = end.slice(11, 16)
  diaperType.value = '小便'
  diaperColor.value = '正常'
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset()
  }
)

watch(
  () => props.kind,
  () => {
    if (props.visible) reset()
  }
)

watch(
  () => props.date,
  (value) => {
    if (props.visible) date.value = value
  }
)

reset()

function submit() {
  if (props.kind === 'milk') {
    emit('submit', {
      time: `${date.value} ${time.value}`,
      type: milkType.value,
      amount: amount.value === '' ? null : amount.value,
    })
    return
  }
  if (props.kind === 'sleep') {
    emit('submit', {
      start: `${sleepStartDate.value} ${sleepStartTime.value}`,
      end: `${sleepEndDate.value} ${sleepEndTime.value}`,
    })
    return
  }
  emit('submit', {
    time: `${date.value} ${time.value}`,
    type: diaperType.value,
    color: diaperColor.value,
  })
}
</script>

<style scoped>
.form-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(74, 74, 74, 0.45);
}
.form-sheet {
  width: 100%;
  max-height: 86vh;
  overflow-y: auto;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 40rpx 40rpx 0 0;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.form-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.form-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.form-label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.form-row {
  display: flex;
  justify-content: space-between;
}
.form-row picker {
  width: 48%;
}
.form-picker {
  height: 80rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
  font-size: 30rpx;
  color: var(--text);
}
.form-error {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--danger);
}
</style>
```

- [ ] **Step 2: Check SFC syntax**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/components/baby/RecordForm.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/components/baby/RecordForm.vue OK`.

- [ ] **Step 3: Commit**

```bash
git add src/components/baby/RecordForm.vue
git commit -m "feat: add baby record form component"
```

### Task 11: 日常记录页与分包注册

**Files:**
- Create: `src/package-baby/records/index.vue`
- Modify: `src/pages.json`

**Interfaces:**
- 路由：`/package-baby/records/index?type=milk|sleep|diaper`。
- Consumes：Task 3 的记录函数、Task 9 的 `Disclaimer`、Task 10 的 `RecordForm`、现有 `AdBanner`。
- Produces：分包根 `package-baby` 与第一个页面 `records/index`。

- [ ] **Step 1: Create the records page**

Create `src/package-baby/records/index.vue`:

```vue
<template>
  <view class="records-page">
    <view class="kind-tabs">
      <view
        v-for="item in kinds"
        :key="item.key"
        class="kind-tab"
        :class="{ active: kind === item.key }"
        @click="kind = item.key"
      >{{ item.label }}</view>
    </view>

    <view class="stat-grid">
      <view class="stat-card">
        <text class="stat-value">{{ summary.milkCount }}</text>
        <text class="stat-label">喝奶次数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ (summary.sleepMinutes / 60).toFixed(1) }}</text>
        <text class="stat-label">睡眠小时</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ summary.diaperCount }}</text>
        <text class="stat-label">排便次数</text>
      </view>
    </view>

    <view class="card list-card">
      <view class="list-head">
        <text class="list-title">今天 · {{ currentLabel }}</text>
        <view class="add-btn" @click="openForm">+ 添加</view>
      </view>

      <view v-if="!list.length" class="empty-tip">今天还没有记录</view>

      <view v-for="item in list" :key="item.id" class="record-item">
        <view class="record-body">
          <template v-if="kind === 'milk'">
            <view class="record-main">{{ item.time.slice(11) }} · {{ item.type }}</view>
            <view class="record-sub">
              {{ item.amount == null ? '奶量未记录' : `${item.amount} ml` }}
            </view>
          </template>
          <template v-else-if="kind === 'sleep'">
            <view class="record-main">{{ item.start.slice(11) }} – {{ item.end.slice(11) }}</view>
            <view class="record-sub">
              {{ formatDuration(durationMinutes(item.start, item.end)) }}
            </view>
          </template>
          <template v-else>
            <view class="record-main">{{ item.time.slice(11) }} · {{ item.type }}</view>
            <view class="record-sub">颜色：{{ item.color }}</view>
          </template>
        </view>
        <text class="record-delete" @click="remove(item.id)">删除</text>
      </view>
    </view>

    <Disclaimer text="记录仅用于家庭照顾参考，不构成医疗建议。如宝宝出现异常症状，请及时就医。" />
    <AdBanner />

    <RecordForm
      :visible="formOpen"
      :kind="kind"
      :date="today"
      :error="formError"
      @close="closeForm"
      @submit="submitForm"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import RecordForm from '../../components/baby/RecordForm.vue'
import {
  addRecord,
  loadDay,
  removeRecord,
  summarizeDay,
  sortRecords,
} from '../../utils/baby/records.js'
import { durationMinutes, formatDuration, todayKey } from '../../utils/baby/date.js'

const kinds = [
  { key: 'milk', label: '喝奶' },
  { key: 'sleep', label: '睡眠' },
  { key: 'diaper', label: '排便' },
]

const today = ref(todayKey())
const day = ref(loadDay(today.value))
const kind = ref('milk')
const formOpen = ref(false)
const formError = ref('')

const summary = computed(() => summarizeDay(day.value))
const list = computed(() => sortRecords(day.value[kind.value] || [], kind.value))
const currentLabel = computed(
  () => kinds.find((item) => item.key === kind.value)?.label || ''
)

function refresh() {
  today.value = todayKey()
  day.value = loadDay(today.value)
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
  const res = addRecord(kind.value, payload)
  if (!res.ok) {
    formError.value = res.error
    return
  }
  formOpen.value = false
  formError.value = ''
  refresh()
  uni.showToast({ title: '已记录', icon: 'none' })
}

function remove(id) {
  uni.showModal({
    title: '删除记录',
    content: '删除后不可恢复，确定删除这条记录吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeRecord(kind.value, id, today.value)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      refresh()
    },
  })
}

onLoad((options) => {
  if (options && kinds.some((item) => item.key === options.type)) {
    kind.value = options.type
    openForm()
  }
})

onShow(refresh)
</script>

<style scoped>
.records-page {
  padding: 24rpx 32rpx 64rpx;
}
.kind-tabs {
  display: flex;
  padding: 8rpx;
  background: #FFF1F3;
  border-radius: 24rpx;
}
.kind-tab {
  flex: 1;
  padding: 16rpx 0;
  text-align: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.kind-tab.active {
  background: #FFFFFF;
  color: var(--primary-strong);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 143, 163, 0.18);
}
.stat-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}
.stat-card {
  width: calc(33.33% - 10rpx);
  padding: 24rpx 8rpx;
  background: var(--surface);
  border-radius: 24rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.1);
}
.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--primary-strong);
}
.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.list-card {
  margin-top: 24rpx;
}
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.list-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.add-btn {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: var(--primary-strong);
  color: #FFFFFF;
  font-size: 26rpx;
}
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.record-item:last-child {
  border-bottom: none;
}
.record-main {
  font-size: 30rpx;
  color: var(--text);
}
.record-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.record-delete {
  padding-left: 24rpx;
  font-size: 24rpx;
  color: var(--danger);
}
.empty-tip {
  margin-top: 48rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 2: Register the subpackage**

In `src/pages.json`, insert a top-level `subPackages` block after the closing of the `pages` array and before `"globalStyle"`:

```json
  "subPackages": [
    {
      "root": "package-baby",
      "pages": [
        {
          "path": "records/index",
          "style": {
            "navigationBarTitleText": "日常记录"
          }
        }
      ]
    }
  ],
```

The resulting file must still be valid JSON (the existing `globalStyle` and `tabBar` remain unchanged).

- [ ] **Step 3: Build and verify the subpackage output**

Run:

```bash
npm run build:mp-weixin
```

Expected: build succeeds and `dist/build/mp-weixin/package-baby/records/index.js` exists.

- [ ] **Step 4: Commit**

```bash
git add src/package-baby/records/index.vue src/pages.json
git commit -m "feat: add baby records page"
```

---

### Task 12: 生长曲线页

**Files:**
- Create: `src/package-baby/growth/index.vue`
- Modify: `src/pages.json`

**Interfaces:**
- 路由：`/package-baby/growth/index`。
- Consumes：Task 4 的生长函数、Task 9 的 `LineChart` / `Disclaimer`。
- Produces：分包页面 `growth/index`。

- [ ] **Step 1: Create the growth page**

Create `src/package-baby/growth/index.vue`:

```vue
<template>
  <view class="growth-page">
    <view class="card form-card">
      <view class="card-title">记录身高体重</view>
      <view class="label">测量日期</view>
      <picker mode="date" :value="form.date" @change="form.date = $event.detail.value">
        <view class="picker-field">
          <text>{{ form.date }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="form-row">
        <view class="form-col">
          <view class="label">身高（cm）</view>
          <input class="input" type="digit" v-model="form.height" placeholder="例如 72.5" />
        </view>
        <view class="form-col">
          <view class="label">体重（kg）</view>
          <input class="input" type="digit" v-model="form.weight" placeholder="例如 8.6" />
        </view>
      </view>
      <view v-if="error" class="error">{{ error }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="save">
          {{ isUpdate ? '更新记录' : '添加记录' }}
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">身高曲线（cm）</view>
      <LineChart v-if="heightPoints.length" :points="heightPoints" unit="cm" />
      <view v-else class="empty-tip">暂无数据</view>
    </view>

    <view class="card">
      <view class="card-title">体重曲线（kg）</view>
      <LineChart v-if="weightPoints.length" :points="weightPoints" unit="kg" />
      <view v-else class="empty-tip">暂无数据</view>
    </view>

    <view class="card">
      <view class="card-title">历史记录</view>
      <view v-if="!history.length" class="empty-tip">还没有生长记录</view>
      <view v-for="item in history" :key="item.id" class="history-item">
        <view>
          <view class="history-date">{{ item.date }}</view>
          <view class="history-value">{{ item.height }} cm · {{ item.weight }} kg</view>
        </view>
        <text class="history-delete" @click="remove(item.id)">删除</text>
      </view>
    </view>

    <Disclaimer text="生长数据仅记录用户输入，不提供发育评估。如对宝宝生长有疑问，请咨询儿科医生。" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import LineChart from '../../components/baby/LineChart.vue'
import {
  chartPoints,
  loadGrowth,
  removeGrowth,
  upsertGrowth,
} from '../../utils/baby/growth.js'
import { todayKey } from '../../utils/baby/date.js'

const list = ref([])
const error = ref('')
const form = ref({ date: todayKey(), height: '', weight: '' })

const heightPoints = computed(() => chartPoints(list.value, 'height'))
const weightPoints = computed(() => chartPoints(list.value, 'weight'))
const history = computed(() =>
  [...list.value].sort((a, b) => b.date.localeCompare(a.date))
)
const isUpdate = computed(() =>
  list.value.some((item) => item.date === form.value.date)
)

function refresh() {
  list.value = loadGrowth()
}

function save() {
  const res = upsertGrowth(list.value, form.value)
  if (!res.ok) {
    error.value = res.error
    return
  }
  list.value = res.list
  error.value = ''
  form.value = { date: todayKey(), height: '', weight: '' }
  uni.showToast({ title: '已保存', icon: 'none' })
}

function remove(id) {
  uni.showModal({
    title: '删除生长记录',
    content: '删除后不可恢复，确定删除吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeGrowth(list.value, id)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      list.value = result.list
    },
  })
}

onShow(refresh)
</script>

<style scoped>
.growth-page {
  padding: 24rpx 32rpx 64rpx;
}
.form-card {
  margin-top: 0;
}
.form-row {
  display: flex;
  justify-content: space-between;
}
.form-col {
  width: 48%;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.history-item:last-child {
  border-bottom: none;
}
.history-date {
  font-size: 28rpx;
  color: var(--text);
}
.history-value {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.history-delete {
  padding-left: 24rpx;
  font-size: 24rpx;
  color: var(--danger);
}
</style>
```

- [ ] **Step 2: Register the growth page**

In `src/pages.json`, append this object to the `subPackages[0].pages` array after the records page:

```json
        {
          "path": "growth/index",
          "style": {
            "navigationBarTitleText": "生长曲线"
          }
        }
```

Remember to add a comma before it if the previous item does not have one.

- [ ] **Step 3: Build and verify**

Run:

```bash
npm run build:mp-weixin
```

Expected: build succeeds and `dist/build/mp-weixin/package-baby/growth/index.js` exists.

- [ ] **Step 4: Commit**

```bash
git add src/package-baby/growth/index.vue src/pages.json
git commit -m "feat: add baby growth page"
```

---

### Task 13: 疫苗参考页

**Files:**
- Create: `src/package-baby/health/index.vue`
- Modify: `src/pages.json`

**Interfaces:**
- 路由：`/package-baby/health/index`。
- Consumes：Task 5 的疫苗数据与状态函数、Task 2 的 `loadProfile`、Task 9 的 `Disclaimer`。
- Produces：分包页面 `health/index`；本页不展示广告。

- [ ] **Step 1: Create the vaccine page**

Create `src/package-baby/health/index.vue`:

```vue
<template>
  <view class="health-page">
    <Disclaimer
      text="疫苗清单仅作记录参考，不构成医疗建议，也不代表推荐接种。具体程序、费用和禁忌请咨询当地接种门诊。"
    />

    <view v-if="!age" class="card profile-tip">
      <view class="tip-text">完善宝宝出生日期后，可显示参考月龄和待接种提示。</view>
      <view class="tip-btn" @click="goSettings">去完善资料</view>
    </view>

    <view class="toolbar">
      <text class="page-note">按参考月龄排序，可勾选已接种并修改日期。</text>
      <view class="add-custom" @click="openCustom">+ 自定义疫苗</view>
    </view>

    <view v-for="group in groups" :key="group.type" class="card">
      <view class="group-head">
        <text class="group-title">{{ group.type }}疫苗</text>
        <text v-if="group.type === '二类'" class="self-paid-tag">自费自愿</text>
      </view>
      <view v-if="group.type === '二类'" class="group-note">
        二类疫苗为自费自愿接种，请咨询接种门诊。
      </view>

      <view v-for="item in group.items" :key="item.id" class="vaccine-item">
        <view class="vaccine-row" @click="toggle(item)">
          <view class="check" :class="{ checked: item.done }">{{ item.done ? '✓' : '' }}</view>
          <view class="vaccine-info">
            <view class="vaccine-name">
              {{ item.name }}
              <text v-if="item.type === '二类'" class="mini-tag">自费自愿</text>
            </view>
            <view class="vaccine-meta">参考月龄：{{ formatMonthAge(item.month) }}</view>
            <view v-if="statusOf(item).key === 'overdue'" class="overdue-note">
              请咨询接种门诊
            </view>
          </view>
          <text class="status" :class="statusOf(item).key">{{ statusOf(item).label }}</text>
        </view>
        <view v-if="item.done" class="date-row">
          <text class="date-label">接种日期</text>
          <picker
            mode="date"
            :value="item.date || today"
            @change="changeDate(item, $event.detail.value)"
          >
            <view class="date-field">{{ item.date || '选择日期' }} ›</view>
          </picker>
        </view>
        <view v-if="!item.builtin" class="custom-delete" @click="removeCustom(item)">
          删除自定义项
        </view>
      </view>
    </view>

    <view class="source-card">
      <view class="source-title">参考来源</view>
      <view class="source-line">{{ VACCINE_SOURCE.title }}</view>
      <view class="source-line">整理日期：{{ VACCINE_SOURCE.updatedAt }}</view>
      <view class="source-line">{{ VACCINE_SOURCE.note }}</view>
    </view>

    <view v-if="customOpen" class="form-mask" @click="customOpen = false">
      <view class="form-sheet" @click.stop>
        <view class="form-head">
          <text class="form-title">自定义疫苗</text>
          <text class="form-close" @click="customOpen = false">✕</text>
        </view>
        <view class="form-label">名称</view>
        <input class="input" v-model="custom.name" maxlength="30" placeholder="疫苗名称" />
        <view class="form-label">类型</view>
        <view class="chip-row">
          <view
            v-for="type in VACCINE_TYPES"
            :key="type"
            class="chip"
            :class="{ active: custom.type === type }"
            @click="custom.type = type"
          >{{ type }}</view>
        </view>
        <view v-if="custom.type === '二类'" class="form-tip">
          二类疫苗为自费自愿，请咨询接种门诊。
        </view>
        <view class="form-label">参考月龄（可选）</view>
        <input class="input" type="number" v-model="custom.month" placeholder="例如 6" />
        <view v-if="customError" class="form-error">{{ customError }}</view>
        <view class="btn-row">
          <view class="btn btn-primary" @click="saveCustom">添加</view>
          <view class="btn btn-ghost" @click="customOpen = false">取消</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import { VACCINE_SOURCE } from '../../data/vaccinePlan.js'
import { ageInfo, formatMonthAge, todayKey } from '../../utils/baby/date.js'
import { loadProfile } from '../../utils/baby/profile.js'
import {
  VACCINE_TYPES,
  addCustomVaccine,
  groupVaccines,
  loadVaccines,
  removeCustomVaccine,
  saveVaccines,
  setVaccineDone,
  vaccineStatus,
} from '../../utils/baby/vaccines.js'

const profile = ref(loadProfile())
const list = ref([])
const today = ref(todayKey())
const customOpen = ref(false)
const customError = ref('')
const custom = ref({ name: '', type: '一类', month: '' })

const age = computed(() => ageInfo(profile.value.birthDate))
const groups = computed(() => groupVaccines(list.value))

function refresh() {
  profile.value = loadProfile()
  list.value = loadVaccines()
  today.value = todayKey()
}

function statusOf(item) {
  return vaccineStatus(item, age.value ? age.value.totalMonths : null)
}

function persist(next) {
  if (!saveVaccines(next)) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    return false
  }
  list.value = next
  return true
}

function toggle(item) {
  persist(setVaccineDone(list.value, item.id, !item.done, today.value))
}

function changeDate(item, date) {
  persist(setVaccineDone(list.value, item.id, true, date))
}

function openCustom() {
  custom.value = { name: '', type: '一类', month: '' }
  customError.value = ''
  customOpen.value = true
}

function saveCustom() {
  const res = addCustomVaccine(list.value, custom.value)
  if (!res.ok) {
    customError.value = res.error
    return
  }
  if (!persist(res.list)) return
  customOpen.value = false
  customError.value = ''
}

function removeCustom(item) {
  uni.showModal({
    title: '删除自定义疫苗',
    content: `确定删除「${item.name}」吗？`,
    success: (res) => {
      if (!res.confirm) return
      const result = removeCustomVaccine(list.value, item.id)
      if (!result.ok) {
        uni.showToast({ title: result.error, icon: 'none' })
        return
      }
      persist(result.list)
    },
  })
}

function goSettings() {
  uni.navigateTo({ url: '/package-baby/settings/index' })
}

onShow(refresh)
</script>

<style scoped>
.health-page {
  padding: 24rpx 32rpx 64rpx;
}
.profile-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}
.tip-text {
  flex: 1;
  margin-right: 20rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.tip-btn {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: var(--primary-strong);
  color: #FFFFFF;
  font-size: 24rpx;
  white-space: nowrap;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}
.page-note {
  flex: 1;
  margin-right: 16rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-secondary);
}
.add-custom {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--primary-strong);
  color: var(--primary-strong);
  font-size: 24rpx;
  white-space: nowrap;
}
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.group-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.self-paid-tag,
.mini-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 20rpx;
}
.group-note {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.vaccine-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.vaccine-item:last-child {
  border-bottom: none;
}
.vaccine-row {
  display: flex;
  align-items: flex-start;
}
.check {
  width: 40rpx;
  height: 40rpx;
  margin-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border);
  border-radius: 12rpx;
  color: #FFFFFF;
  font-size: 24rpx;
}
.check.checked {
  background: var(--primary-strong);
  border-color: var(--primary-strong);
}
.vaccine-info {
  flex: 1;
  margin-left: 16rpx;
}
.vaccine-name {
  font-size: 28rpx;
  line-height: 1.5;
  color: var(--text);
}
.vaccine-meta {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.overdue-note {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.status {
  margin-left: 12rpx;
  font-size: 22rpx;
  white-space: nowrap;
}
.status.done {
  color: var(--success);
}
.status.due {
  color: var(--primary-strong);
}
.status.overdue {
  color: var(--danger);
}
.status.pending {
  color: var(--text-secondary);
}
.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-left: 56rpx;
}
.date-label {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.date-field {
  padding: 8rpx 16rpx;
  border: 1rpx solid var(--border);
  border-radius: 12rpx;
  font-size: 24rpx;
  color: var(--text);
}
.custom-delete {
  margin-top: 12rpx;
  padding-left: 56rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.source-card {
  margin-top: 32rpx;
  padding: 24rpx;
  background: #FFF1F3;
  border-radius: 24rpx;
}
.source-title {
  margin-bottom: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text);
}
.source-line {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
.form-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(74, 74, 74, 0.45);
}
.form-sheet {
  width: 100%;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 40rpx 40rpx 0 0;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.form-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.form-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.form-label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.form-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--primary-strong);
}
.form-error {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--danger);
}
</style>
```

- [ ] **Step 2: Register the health page**

In `src/pages.json`, append this object to the `subPackages[0].pages` array:

```json
        {
          "path": "health/index",
          "style": {
            "navigationBarTitleText": "疫苗参考"
          }
        }
```

- [ ] **Step 3: Build and verify**

Run:

```bash
npm run build:mp-weixin
```

Expected: build succeeds and `dist/build/mp-weixin/package-baby/health/index.js` exists.

- [ ] **Step 4: Commit**

```bash
git add src/package-baby/health/index.vue src/pages.json
git commit -m "feat: add baby vaccine reference page"
```

### Task 14: 成长手记页

**Files:**
- Create: `src/package-baby/journal/index.vue`
- Modify: `src/pages.json`

**Interfaces:**
- 路由：`/package-baby/journal/index`。
- Consumes：Task 6 的 `MOODS`、里程碑/心情/心得函数、参考里程碑数据、Task 9 的 `Disclaimer`、Task 1 的 `formatMonthAge`。
- Produces：分包页面 `journal/index`；本页不展示广告。

- [ ] **Step 1: Create the journal page**

Create `src/package-baby/journal/index.vue`:

```vue
<template>
  <view class="journal-page">
    <view class="card form-card">
      <view class="card-title">成长里程碑</view>
      <view class="label">日期</view>
      <picker
        mode="date"
        :value="milestoneForm.date"
        @change="milestoneForm.date = $event.detail.value"
      >
        <view class="picker-field">
          <text>{{ milestoneForm.date }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="label">标题</view>
      <input
        class="input"
        v-model="milestoneForm.title"
        maxlength="40"
        placeholder="例如：第一次翻身"
      />
      <view class="label">备注（可选）</view>
      <textarea
        class="textarea"
        v-model="milestoneForm.note"
        maxlength="200"
        placeholder="记录当时的情景"
      />
      <view v-if="milestoneError" class="error">{{ milestoneError }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="saveMilestone">添加里程碑</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">里程碑时间线</view>
      <view v-if="!milestones.length" class="empty-tip">还没有里程碑记录</view>
      <view v-for="item in milestones" :key="item.id" class="timeline-item">
        <view class="timeline-date">{{ item.date }}</view>
        <view class="timeline-title">{{ item.title }}</view>
        <view v-if="item.note" class="timeline-note">{{ item.note }}</view>
        <text class="timeline-delete" @click="removeMilestoneItem(item.id)">删除</text>
      </view>
    </view>

    <view class="card">
      <view class="ref-toggle" @click="refOpen = !refOpen">
        <text>参考里程碑</text>
        <text class="ref-arrow">{{ refOpen ? '收起' : '展开' }}</text>
      </view>
      <view v-if="refOpen" class="ref-body">
        <view
          v-for="item in REFERENCE_MILESTONES"
          :key="`${item.month}-${item.text}`"
          class="ref-item"
        >
          <text class="ref-month">{{ formatMonthAge(item.month) }}</text>
          <text class="ref-text">{{ item.text }}</text>
        </view>
        <view class="ref-note">{{ REFERENCE_MILESTONE_NOTE }}</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">今天的心情</view>
      <view class="mood-row">
        <view
          v-for="mood in MOODS"
          :key="mood.key"
          class="mood-item"
          :class="{ active: moods[today] === mood.key }"
          @click="chooseMood(mood.key)"
        >
          <text class="mood-emoji">{{ mood.emoji }}</text>
          <text class="mood-label">{{ mood.label }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">育儿心得</view>
      <view class="label">日期</view>
      <picker mode="date" :value="noteForm.date" @change="noteForm.date = $event.detail.value">
        <view class="picker-field">
          <text>{{ noteForm.date }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="label">内容</view>
      <textarea
        class="textarea"
        v-model="noteForm.content"
        maxlength="500"
        placeholder="记录今天的心得或想对宝宝说的话"
      />
      <view v-if="noteError" class="error">{{ noteError }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="saveNote">添加心得</view>
      </view>
      <view v-if="!notes.length" class="empty-tip">还没有心得记录</view>
      <view v-for="item in notes" :key="item.id" class="note-item">
        <view class="note-head">
          <text class="note-date">{{ item.date }}</text>
          <text class="note-delete" @click="removeNoteItem(item.id)">删除</text>
        </view>
        <view class="note-content">{{ item.content }}</view>
      </view>
    </view>

    <Disclaimer
      text="参考里程碑仅作了解，个体差异较大，不构成发育评估。如有疑问请咨询儿科医生。"
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import {
  REFERENCE_MILESTONES,
  REFERENCE_MILESTONE_NOTE,
} from '../../data/referenceMilestones.js'
import { formatMonthAge, todayKey } from '../../utils/baby/date.js'
import {
  MOODS,
  addMilestone,
  addNote,
  loadMilestones,
  loadMoods,
  loadNotes,
  removeMilestone,
  removeNote,
  setMood,
} from '../../utils/baby/journal.js'

const today = ref(todayKey())
const milestones = ref([])
const moods = ref({})
const notes = ref([])
const refOpen = ref(false)
const milestoneError = ref('')
const noteError = ref('')
const milestoneForm = ref({ date: todayKey(), title: '', note: '' })
const noteForm = ref({ date: todayKey(), content: '' })

function refresh() {
  today.value = todayKey()
  milestones.value = loadMilestones()
  moods.value = loadMoods()
  notes.value = loadNotes()
}

function saveMilestone() {
  const res = addMilestone(milestoneForm.value)
  if (!res.ok) {
    milestoneError.value = res.error
    return
  }
  milestones.value = res.list
  milestoneError.value = ''
  milestoneForm.value = { date: todayKey(), title: '', note: '' }
}

function removeMilestoneItem(id) {
  uni.showModal({
    title: '删除里程碑',
    content: '删除后不可恢复，确定删除吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeMilestone(id)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      milestones.value = result.list
    },
  })
}

function chooseMood(key) {
  const res = setMood(today.value, key)
  if (!res.ok) {
    uni.showToast({ title: res.error, icon: 'none' })
    return
  }
  moods.value = res.moods
}

function saveNote() {
  const res = addNote(noteForm.value)
  if (!res.ok) {
    noteError.value = res.error
    return
  }
  notes.value = res.list
  noteError.value = ''
  noteForm.value = { date: todayKey(), content: '' }
}

function removeNoteItem(id) {
  uni.showModal({
    title: '删除心得',
    content: '删除后不可恢复，确定删除吗？',
    success: (res) => {
      if (!res.confirm) return
      const result = removeNote(id)
      if (!result.ok) {
        uni.showToast({ title: result.error || '删除失败', icon: 'none' })
        return
      }
      notes.value = result.list
    },
  })
}

onShow(refresh)
</script>

<style scoped>
.journal-page {
  padding: 24rpx 32rpx 64rpx;
}
.form-card {
  margin-top: 0;
}
.timeline-item {
  position: relative;
  padding: 24rpx 0 24rpx 28rpx;
  border-left: 4rpx solid var(--primary-soft);
}
.timeline-date {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.timeline-title {
  margin-top: 6rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.timeline-note {
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.timeline-delete {
  display: inline-block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.ref-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.ref-arrow {
  font-size: 24rpx;
  font-weight: 400;
  color: var(--primary-strong);
}
.ref-body {
  margin-top: 20rpx;
}
.ref-item {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.ref-month {
  width: 150rpx;
  font-size: 24rpx;
  color: var(--primary-strong);
}
.ref-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text);
}
.ref-note {
  margin-top: 16rpx;
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
.mood-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
}
.mood-item {
  width: calc(20% - 8rpx);
  padding: 16rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
}
.mood-item.active {
  background: var(--primary-soft);
  border-color: var(--primary-strong);
}
.mood-emoji {
  font-size: 40rpx;
}
.mood-label {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}
.note-item {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--border);
}
.note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.note-date {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.note-delete {
  font-size: 22rpx;
  color: var(--danger);
}
.note-content {
  margin-top: 10rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
}
</style>
```

- [ ] **Step 2: Register the journal page**

In `src/pages.json`, append this object to the `subPackages[0].pages` array:

```json
        {
          "path": "journal/index",
          "style": {
            "navigationBarTitleText": "成长手记"
          }
        }
```

- [ ] **Step 3: Build and verify**

Run:

```bash
npm run build:mp-weixin
```

Expected: build succeeds and `dist/build/mp-weixin/package-baby/journal/index.js` exists.

- [ ] **Step 4: Commit**

```bash
git add src/package-baby/journal/index.vue src/pages.json
git commit -m "feat: add baby journal page"
```

---

### Task 15: 数据与设置页

**Files:**
- Create: `src/package-baby/settings/index.vue`
- Modify: `src/pages.json`

**Interfaces:**
- 路由：`/package-baby/settings/index`。
- Consumes：Task 2 的 `loadProfile` / `saveProfile`、Task 7 的导出恢复函数、`copyText`。
- Produces：分包页面 `settings/index`；本页不展示广告。

- [ ] **Step 1: Create the settings page**

Create `src/package-baby/settings/index.vue`:

```vue
<template>
  <view class="settings-page">
    <view class="card form-card">
      <view class="card-title">宝宝资料</view>
      <view class="label">昵称</view>
      <input class="input" v-model="form.name" maxlength="20" placeholder="宝宝昵称" />
      <view class="label">出生日期</view>
      <picker mode="date" :value="form.birthDate" @change="form.birthDate = $event.detail.value">
        <view class="picker-field">
          <text>{{ form.birthDate || '请选择出生日期' }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="label">性别</view>
      <view class="chip-row">
        <view
          class="chip"
          :class="{ active: form.gender === 'boy' }"
          @click="form.gender = 'boy'"
        >男宝</view>
        <view
          class="chip"
          :class="{ active: form.gender === 'girl' }"
          @click="form.gender = 'girl'"
        >女宝</view>
      </view>
      <view v-if="profileError" class="error">{{ profileError }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="save">保存资料</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">数据管理</view>
      <view class="row" @click="exportData">
        <view class="row-body">
          <view class="row-title">导出数据</view>
          <view class="row-desc">生成 JSON 备份，可保存到聊天或复制到剪贴板</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @click="restore">
        <view class="row-body">
          <view class="row-title">恢复数据</view>
          <view class="row-desc">从备份文件恢复，恢复前会自动备份当前数据</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row danger" @click="clearData">
        <view class="row-body">
          <view class="row-title">清空宝宝数据</view>
          <view class="row-desc">删除资料、记录和备份，不可恢复</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="card">
      <view class="row" @click="openAbout">
        <view class="row-body">
          <view class="row-title">关于与免责声明</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="note">
      <view>数据仅保存在本机，不会上传服务器，也不会申请定位权限。</view>
      <view>清理小程序缓存或卸载小程序会丢失本机数据，请定期导出备份。</view>
      <view>备份文件包含宝宝资料和健康记录，请妥善保管。</view>
    </view>

    <view v-if="pasteOpen" class="form-mask" @click="pasteOpen = false">
      <view class="form-sheet" @click.stop>
        <view class="form-head">
          <text class="form-title">粘贴备份 JSON</text>
          <text class="form-close" @click="pasteOpen = false">✕</text>
        </view>
        <textarea
          class="textarea"
          v-model="importText"
          placeholder="在这里粘贴导出的 JSON 内容"
        />
        <view class="btn-row">
          <view class="btn btn-primary" @click="applyPaste">导入</view>
          <view class="btn btn-ghost" @click="pasteOpen = false">取消</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { copyText } from '../../utils/clipboard.js'
import { loadProfile, saveProfile } from '../../utils/baby/profile.js'
import {
  MAX_IMPORT_BYTES,
  buildExportPayload,
  clearBabyData,
  exportFileName,
  restoreData,
  validateImportPayload,
} from '../../utils/baby/backup.js'

const form = ref({ name: '宝宝', birthDate: '', gender: 'boy' })
const profileError = ref('')
const pasteOpen = ref(false)
const importText = ref('')

function refresh() {
  const profile = loadProfile()
  form.value = {
    name: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
  }
  profileError.value = ''
}

function save() {
  const res = saveProfile(form.value)
  if (!res.ok) {
    profileError.value = res.error
    return
  }
  profileError.value = ''
  refresh()
  uni.showToast({ title: '已保存', icon: 'none' })
}

function exportData() {
  const text = JSON.stringify(buildExportPayload(), null, 2)
  // #ifdef MP-WEIXIN
  const fileName = exportFileName()
  try {
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    wx.getFileSystemManager().writeFileSync(filePath, text, 'utf8')
    if (typeof wx.shareFileMessage === 'function') {
      wx.shareFileMessage({ filePath, fileName, fail: () => copyText(text) })
      return
    }
  } catch (e) {
    // 文件导出失败时降级为剪贴板
  }
  copyText(text)
  // #endif
  // #ifndef MP-WEIXIN
  copyText(text)
  // #endif
}

function restore() {
  // #ifdef MP-WEIXIN
  if (typeof wx.chooseMessageFile === 'function') {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        if (file.size > MAX_IMPORT_BYTES) {
          uni.showToast({ title: '文件超过 2MB 限制', icon: 'none' })
          return
        }
        try {
          const text = wx.getFileSystemManager().readFileSync(file.path, 'utf8')
          applyImport(text)
        } catch (e) {
          uni.showToast({ title: '读取文件失败', icon: 'none' })
        }
      },
      fail: () => uni.showToast({ title: '未选择文件', icon: 'none' }),
    })
    return
  }
  // #endif
  pasteOpen.value = true
}

function applyPaste() {
  if (!importText.value.trim()) {
    uni.showToast({ title: '请粘贴备份内容', icon: 'none' })
    return
  }
  const text = importText.value
  pasteOpen.value = false
  importText.value = ''
  applyImport(text)
}

function applyImport(text) {
  const check = validateImportPayload(text)
  if (!check.ok) {
    uni.showModal({ title: '导入失败', content: check.error, showCancel: false })
    return
  }
  uni.showModal({
    title: '恢复数据',
    content: '将覆盖当前宝宝数据，导入前会自动备份当前数据。是否继续？',
    success: (res) => {
      if (!res.confirm) return
      const result = restoreData(check.payload.data)
      if (!result.ok) {
        uni.showModal({ title: '恢复失败', content: result.error, showCancel: false })
        return
      }
      refresh()
      uni.showToast({ title: '已恢复', icon: 'none' })
    },
  })
}

function clearData() {
  uni.showModal({
    title: '清空宝宝数据',
    content:
      '宝宝资料、所有记录、成长数据、疫苗记录和备份都会被删除且不可恢复。工具相关数据不受影响。',
    confirmText: '清空',
    confirmColor: '#D9485F',
    success: (res) => {
      if (!res.confirm) return
      if (!clearBabyData()) {
        uni.showToast({ title: '清空失败', icon: 'none' })
        return
      }
      refresh()
      uni.showToast({ title: '已清空', icon: 'none' })
    },
  })
}

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}

onShow(refresh)
</script>

<style scoped>
.settings-page {
  padding: 24rpx 32rpx 64rpx;
}
.form-card {
  margin-top: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.row:last-child {
  border-bottom: none;
}
.row-body {
  flex: 1;
}
.row-title {
  font-size: 30rpx;
  color: var(--text);
}
.row-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-secondary);
}
.row-arrow {
  margin-left: 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.danger .row-title {
  color: var(--danger);
}
.note {
  margin-top: 32rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
.form-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(74, 74, 74, 0.45);
}
.form-sheet {
  width: 100%;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 40rpx 40rpx 0 0;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.form-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.form-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 2: Register the settings page**

In `src/pages.json`, append this object to the `subPackages[0].pages` array:

```json
        {
          "path": "settings/index",
          "style": {
            "navigationBarTitleText": "数据与设置"
          }
        }
```

- [ ] **Step 3: Build and verify**

Run:

```bash
npm run build:mp-weixin
npm run build:h5
```

Expected: both builds succeed and `dist/build/mp-weixin/package-baby/settings/index.js` exists.

- [ ] **Step 4: Commit**

```bash
git add src/package-baby/settings/index.vue src/pages.json
git commit -m "feat: add baby settings and data management page"
```

### Task 16: 宝宝首页

**Files:**
- Create: `src/pages/baby/index.vue`
- Modify: `src/pages.json`

**Interfaces:**
- 路由：`/pages/baby/index`（主包，后续作为 Tab 页）。
- Consumes：Task 1-7 的全部数据函数、Task 9 的 `Disclaimer`、现有 `AdBanner`。
- Produces：宝宝首页；快捷记录跳转 `/package-baby/records/index?type=...`。

- [ ] **Step 1: Create the baby home page**

Create `src/pages/baby/index.vue`:

```vue
<template>
  <view class="baby-page">
    <view class="profile-card">
      <view class="avatar">👶</view>
      <view class="profile-info">
        <view class="profile-name">{{ profile.name }}</view>
        <view v-if="age" class="profile-age">
          {{ age.text }} · {{ profile.gender === 'girl' ? '女宝' : '男宝' }}
        </view>
        <view v-else class="profile-age">还没有填写出生日期</view>
      </view>
      <view class="profile-edit" @click="goSettings">{{ age ? '编辑' : '去设置' }}</view>
    </view>

    <view class="quick-grid">
      <view
        v-for="item in quickActions"
        :key="item.kind"
        class="quick-item"
        @click="goRecords(item.kind)"
      >
        <text class="quick-icon">{{ item.icon }}</text>
        <text class="quick-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="card">
      <view class="card-title">今日记录</view>
      <view class="today-grid">
        <view class="today-cell">
          <text class="today-value">{{ summary.milkCount }}</text>
          <text class="today-label">喝奶次数</text>
        </view>
        <view class="today-cell">
          <text class="today-value">{{ (summary.sleepMinutes / 60).toFixed(1) }}</text>
          <text class="today-label">睡眠小时</text>
        </view>
        <view class="today-cell">
          <text class="today-value">{{ summary.diaperCount }}</text>
          <text class="today-label">排便次数</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">下一条疫苗参考</view>
      <view v-if="nextVaccineItem" class="vaccine-preview">
        <view>
          <view class="preview-name">{{ nextVaccineItem.name }}</view>
          <view class="preview-meta">
            参考月龄：{{ formatMonthAge(nextVaccineItem.month) }}
          </view>
        </view>
        <text class="status" :class="nextStatus.key">{{ nextStatus.label }}</text>
      </view>
      <view v-else-if="!age" class="empty-tip">完善出生日期后显示参考疫苗</view>
      <view v-else class="empty-tip">暂无待接种参考</view>
      <view class="card-link" @click="goPage('/package-baby/health/index')">
        查看疫苗参考 ›
      </view>
    </view>

    <view class="card">
      <view class="card-title">最近生长</view>
      <view v-if="latest" class="growth-preview">
        <view>
          <view class="preview-name">{{ latest.date }}</view>
          <view class="preview-meta">{{ latest.height }} cm · {{ latest.weight }} kg</view>
        </view>
        <text class="card-link inline" @click="goPage('/package-baby/growth/index')">
          查看曲线 ›
        </text>
      </view>
      <view v-else class="empty-tip">还没有身高体重记录</view>
    </view>

    <view class="feature-list">
      <view
        v-for="item in features"
        :key="item.url"
        class="feature-item"
        @click="goPage(item.url)"
      >
        <view class="feature-body">
          <view class="feature-title">{{ item.title }}</view>
          <view class="feature-desc">{{ item.desc }}</view>
        </view>
        <text class="feature-arrow">›</text>
      </view>
    </view>

    <Disclaimer />
    <AdBanner />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import { ageInfo, formatMonthAge, todayKey } from '../../utils/baby/date.js'
import { latestGrowth, loadGrowth } from '../../utils/baby/growth.js'
import { loadProfile } from '../../utils/baby/profile.js'
import { loadDay, summarizeDay } from '../../utils/baby/records.js'
import { loadVaccines, nextVaccine, vaccineStatus } from '../../utils/baby/vaccines.js'

const quickActions = [
  { kind: 'milk', icon: '🍼', label: '喝奶' },
  { kind: 'sleep', icon: '😴', label: '睡眠' },
  { kind: 'diaper', icon: '💧', label: '排便' },
]

const features = [
  { title: '生长曲线', desc: '记录身高体重', url: '/package-baby/growth/index' },
  { title: '疫苗参考', desc: '一类 / 二类参考清单', url: '/package-baby/health/index' },
  { title: '成长手记', desc: '里程碑、心情与心得', url: '/package-baby/journal/index' },
  { title: '数据与设置', desc: '资料、导出与恢复', url: '/package-baby/settings/index' },
]

const profile = ref(loadProfile())
const today = ref(todayKey())
const summary = ref(summarizeDay(loadDay(today.value)))
const latest = ref(null)
const nextVaccineItem = ref(null)

const age = computed(() => ageInfo(profile.value.birthDate))
const nextStatus = computed(() =>
  nextVaccineItem.value
    ? vaccineStatus(nextVaccineItem.value, age.value ? age.value.totalMonths : null)
    : { key: 'pending', label: '' }
)

function refresh() {
  profile.value = loadProfile()
  today.value = todayKey()
  summary.value = summarizeDay(loadDay(today.value))
  latest.value = latestGrowth(loadGrowth())
  nextVaccineItem.value = nextVaccine(
    loadVaccines(),
    age.value ? age.value.totalMonths : null
  )
}

function goRecords(kind) {
  uni.navigateTo({ url: `/package-baby/records/index?type=${kind}` })
}

function goPage(url) {
  uni.navigateTo({ url })
}

function goSettings() {
  uni.navigateTo({ url: '/package-baby/settings/index' })
}

onShow(refresh)

onShareAppMessage(() => ({
  title: '宝宝记录 · 本地优先',
  path: '/pages/baby/index',
}))
</script>

<style scoped>
.baby-page {
  padding: 24rpx 32rpx 64rpx;
}
.profile-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #FFE4E1, #FFB6C1);
  border-radius: 40rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFFFFF;
  font-size: 52rpx;
}
.profile-info {
  flex: 1;
  margin-left: 24rpx;
}
.profile-name {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text);
}
.profile-age {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #7A5B60;
}
.profile-edit {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: #FFFFFF;
  color: var(--primary-strong);
  font-size: 24rpx;
  white-space: nowrap;
}
.quick-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}
.quick-item {
  width: calc(33.33% - 12rpx);
  padding: 28rpx 0;
  background: var(--surface);
  border-radius: 28rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.1);
}
.quick-icon {
  display: block;
  font-size: 44rpx;
}
.quick-label {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text);
}
.today-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}
.today-cell {
  width: 33%;
  text-align: center;
}
.today-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--primary-strong);
}
.today-label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.vaccine-preview,
.growth-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
}
.preview-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.preview-meta {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.status {
  margin-left: 16rpx;
  font-size: 22rpx;
  white-space: nowrap;
}
.status.done {
  color: var(--success);
}
.status.due {
  color: var(--primary-strong);
}
.status.overdue {
  color: var(--danger);
}
.status.pending {
  color: var(--text-secondary);
}
.card-link {
  margin-top: 20rpx;
  text-align: right;
  font-size: 24rpx;
  color: var(--primary-strong);
}
.card-link.inline {
  margin-top: 0;
  white-space: nowrap;
}
.feature-list {
  margin-top: 24rpx;
  background: var(--surface);
  border-radius: 40rpx;
  padding: 0 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.12);
}
.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.feature-item:last-child {
  border-bottom: none;
}
.feature-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.feature-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.feature-arrow {
  font-size: 32rpx;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 2: Add the home page to the pages array**

In `src/pages.json`, add this entry after `pages/tools/index` and before `pages/todo/index`:

```json
    {
      "path": "pages/baby/index",
      "style": {
        "navigationBarTitleText": "宝宝记录"
      }
    },
```

- [ ] **Step 3: Build and verify**

Run:

```bash
npm run build:mp-weixin
```

Expected: build succeeds and `dist/build/mp-weixin/pages/baby/index.js` exists.

- [ ] **Step 4: Manual smoke test**

In WeChat devtools, use the compile-mode page selector to open `/pages/baby/index`. Verify:

- 资料卡显示「宝宝 / 还没有填写出生日期 / 去设置」。
- 三个快捷记录按钮能打开 `/package-baby/records/index` 并自动弹出对应表单。
- 今日统计为 0，疫苗卡显示「完善出生日期后显示参考疫苗」，生长卡显示空状态。
- 底部有免责声明和广告位（开发者工具可能不渲染广告，真机为准）。

- [ ] **Step 5: Commit**

```bash
git add src/pages/baby/index.vue src/pages.json
git commit -m "feat: add baby home page"
```

### Task 17: 切换双 Tab、移除待办并清理文档

**Files:**
- Modify: `src/pages.json`（最终结构）
- Modify: `src/pages/tools/index.vue`
- Modify: `src/manifest.json`
- Modify: `src/pages/about/about.vue`
- Modify: `README.md`
- Modify: `scripts/gen-tab-icons.cjs`
- Create: `src/static/tab-baby.png`
- Create: `src/static/tab-baby-active.png`
- Modify: `src/static/tab-tools.png`、`src/static/tab-tools-active.png`（由脚本重新生成）
- Delete: `src/pages/todo/`
- Delete: `src/components/tools/TodoItem.vue`
- Delete: `src/utils/todo.js`
- Delete: `src/utils/timestamp.js`
- Delete: `src/utils/calendar.js`
- Delete: `tests/todo.test.js`
- Delete: `tests/timestamp.test.js`
- Delete: `src/static/tab-todo.png`
- Delete: `src/static/tab-todo-active.png`

**Interfaces:**
- Produces 最终 tabBar：`工具`（`pages/tools/index`）与 `宝宝`（`pages/baby/index`）。
- 保留 `tools.todos.v1` 存储数据，不做自动删除。

- [ ] **Step 1: Replace pages.json with the final structure**

Replace the entire contents of `src/pages.json` with:

```json
{
  "pages": [
    {
      "path": "pages/tools/index",
      "style": {
        "navigationBarTitleText": "工具箱"
      }
    },
    {
      "path": "pages/baby/index",
      "style": {
        "navigationBarTitleText": "宝宝记录"
      }
    },
    {
      "path": "pages/about/about",
      "style": {
        "navigationBarTitleText": "关于"
      }
    }
  ],
  "subPackages": [
    {
      "root": "package-baby",
      "pages": [
        {
          "path": "records/index",
          "style": {
            "navigationBarTitleText": "日常记录"
          }
        },
        {
          "path": "growth/index",
          "style": {
            "navigationBarTitleText": "生长曲线"
          }
        },
        {
          "path": "health/index",
          "style": {
            "navigationBarTitleText": "疫苗参考"
          }
        },
        {
          "path": "journal/index",
          "style": {
            "navigationBarTitleText": "成长手记"
          }
        },
        {
          "path": "settings/index",
          "style": {
            "navigationBarTitleText": "数据与设置"
          }
        }
      ]
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "宝宝记录与工具箱",
    "navigationBarBackgroundColor": "#FFF9F5",
    "backgroundColor": "#FFF9F5"
  },
  "tabBar": {
    "color": "#888888",
    "selectedColor": "#FF8FA3",
    "borderStyle": "white",
    "backgroundColor": "#FFFFFF",
    "list": [
      {
        "pagePath": "pages/tools/index",
        "iconPath": "static/tab-tools.png",
        "selectedIconPath": "static/tab-tools-active.png",
        "text": "工具"
      },
      {
        "pagePath": "pages/baby/index",
        "iconPath": "static/tab-baby.png",
        "selectedIconPath": "static/tab-baby-active.png",
        "text": "宝宝"
      }
    ]
  }
}
```

- [ ] **Step 2: Remove todo logic from the tools page**

In `src/pages/tools/index.vue`, change:

```js
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
```

to:

```js
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
```

Delete this import:

```js
import { loadTodos, activeCount, updateTabBadge } from '../../utils/todo.js'
```

Delete this block:

```js
onShow(() => {
  updateTabBadge(activeCount(loadTodos()))
})
```

Change the share title:

```js
onShareAppMessage(() => ({
  title: '宝宝记录与工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
}))
```

- [ ] **Step 3: Delete todo, timestamp and calendar files**

Run:

```bash
rm -rf src/pages/todo
rm -f src/components/tools/TodoItem.vue
rm -f src/utils/todo.js src/utils/timestamp.js src/utils/calendar.js
rm -f tests/todo.test.js tests/timestamp.test.js
rm -f src/static/tab-todo.png src/static/tab-todo-active.png
```

- [ ] **Step 4: Update the icon generator and regenerate tab icons**

Modify `scripts/gen-tab-icons.cjs`:

1. Change the colors:

```js
const NORMAL = [136, 136, 136]
const ACTIVE = [255, 143, 163]
```

2. Delete `circleDistance`, `segmentDistance` and `todoCoverage`（只有已移除的待办 tab 使用）。

3. Add `heartCoverage` immediately before `paint`:

```js
function heartCoverage(x, y) {
  const samples = 4
  let hit = 0
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const px = x - 0.5 + (sx + 0.5) / samples
      const py = y - 0.5 + (sy + 0.5) / samples
      const nx = (px / SIZE) * 2.4 - 1.2
      const ny = 1.2 - (py / SIZE) * 2.4
      const t = nx * nx + ny * ny - 1
      if (t * t * t - nx * nx * ny * ny * ny <= 0) hit += 1
    }
  }
  return hit / (samples * samples)
}
```

4. Replace the `outputs` array with:

```js
const outputs = [
  ['tab-tools.png', paint(toolsCoverage, NORMAL)],
  ['tab-tools-active.png', paint(toolsCoverage, ACTIVE)],
  ['tab-baby.png', paint(heartCoverage, NORMAL)],
  ['tab-baby-active.png', paint(heartCoverage, ACTIVE)],
]
```

Run the generator:

```bash
node scripts/gen-tab-icons.cjs
```

Verify the PNG signature and sizes:

```bash
node -e "const fs=require('fs');for(const f of ['src/static/tab-tools.png','src/static/tab-tools-active.png','src/static/tab-baby.png','src/static/tab-baby-active.png']){const b=fs.readFileSync(f);console.log(f,b.length,b.slice(0,8).toString('hex'))}"
```

Expected: all four files start with `89504e470d0a1a0a`; the tools icons are roughly 490 bytes and the baby icons roughly 750 bytes.

- [ ] **Step 5: Update manifest**

In `src/manifest.json`, change:

```json
"name": "工具箱",
"appid": "wx51b1f4f41c89ec6f",
"description": "计算工具与待办清单小程序",
"versionName": "1.0.0",
"versionCode": "100",
```

to:

```json
"name": "宝宝记录与工具箱",
"appid": "wx51b1f4f41c89ec6f",
"description": "本地优先的宝宝记录工具与日常计算工具箱",
"versionName": "1.1.0",
"versionCode": "110",
```

- [ ] **Step 6: Update the about page**

Replace the entire contents of `src/pages/about/about.vue` with:

```vue
<template>
  <view class="about">
    <view class="hero">
      <image class="logo" src="../../static/logo.png" mode="aspectFit" />
      <view class="app-name">宝宝记录与工具箱</view>
      <view class="version">v1.1.0</view>
    </view>

    <view class="card">
      <view class="section-title">功能</view>
      <view class="text">宝宝记录：日常记录 · 生长曲线 · 疫苗参考 · 成长手记</view>
      <view class="text">工具箱：增值税计算 · 单位换算 · 文本处理 · 进制转换</view>
    </view>

    <view class="card">
      <view class="section-title">免责声明</view>
      <view class="text">
        所有计算均在本地完成，结果仅供参考，不构成税务、财务或其他专业建议。
      </view>
      <view class="text">
        宝宝记录与疫苗参考仅用于家庭记录，不构成医疗建议、诊断或接种推荐。具体健康问题请咨询医生；疫苗程序、费用和禁忌请以当地接种门诊安排为准。
      </view>
    </view>

    <view class="card">
      <view class="section-title">隐私说明</view>
      <view class="text">宝宝资料和记录只保存在本机，不登录、不上传、不申请定位权限。</view>
      <view class="text">导出与恢复由用户主动发起，备份文件请自行妥善保管。</view>
      <view class="text">清理小程序缓存或卸载小程序会丢失本机数据。</view>
    </view>

    <view class="card">
      <view class="section-title">开源</view>
      <view class="text link" @click="copyRepo">github.com/HerryLo/uniapp-wxapp</view>
    </view>
  </view>
</template>

<script setup>
import { copyText } from '../../utils/clipboard.js'

const repo = 'https://github.com/HerryLo/uniapp-wxapp'

function copyRepo() {
  copyText(repo)
}
</script>

<style scoped>
.about {
  padding: 32rpx 32rpx 64rpx;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 16rpx;
}
.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
}
.app-name {
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text);
}
.version {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.section-title {
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.text {
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
.text + .text {
  margin-top: 12rpx;
}
.link {
  color: var(--primary-strong);
}
</style>
```

- [ ] **Step 7: Update README**

Replace the entire contents of `README.md` with:

````markdown
# 宝宝记录与工具箱

基于 uni-app + Vue 3 + Vite 的本地优先小程序：宝宝记录 + 日常计算工具。所有数据与计算均在本机完成，无后端依赖。

## 功能

### 宝宝（Tab）

- 宝宝资料：昵称、出生日期、性别与月龄
- 日常记录：喝奶、睡眠、排便，今日统计
- 生长曲线：身高体重记录与 canvas 折线图
- 疫苗参考：一类 / 二类参考清单、已接种标记、自定义疫苗
- 成长手记：里程碑、每日心情、育儿心得
- 数据管理：JSON 导出 / 恢复 / 清空

### 工具（Tab）

- 增值税计算：含税/不含税双向换算，支持常用税率与自定义税率
- 单位换算：长度、重量、温度、存储、面积
- 文本处理：按行去重、大小写转换
- 进制转换：2–36 进制，支持负数与超大整数

工具页右下角的悬浮按钮打开「全部工具」抽屉，默认展示增值税。

## 运行

```bash
yarn install

# 微信小程序开发
yarn dev:mp-weixin

# H5 开发（仅用于本地调试）
yarn dev:h5

# 单元测试
yarn test
```

微信小程序：使用微信开发者工具导入 `dist/dev/mp-weixin`。发布前请先将 `src/manifest.json` 中的 appid 改为自己的小程序 appid。

## 构建

```bash
yarn build:mp-weixin
yarn build:h5
```

## 目录结构

- `src/pages/tools/index.vue`：工具页与「全部工具」抽屉
- `src/pages/baby/index.vue`：宝宝首页
- `src/package-baby/records/index.vue`：日常记录
- `src/package-baby/growth/index.vue`：生长曲线
- `src/package-baby/health/index.vue`：疫苗参考
- `src/package-baby/journal/index.vue`：成长手记
- `src/package-baby/settings/index.vue`：数据与设置
- `src/components/baby/*`：宝宝模块组件
- `src/data/*`：疫苗与参考里程碑数据
- `src/utils/baby/*`：宝宝模块纯逻辑与本地存储
- `tests/*.test.js`：Vitest 单元测试

## 说明

- 宝宝资料与记录只保存在本机，不登录、不上云、不申请定位权限。
- 清理小程序缓存或卸载小程序会丢失本机数据，请定期在「数据与设置」中导出备份。
- 宝宝记录与疫苗参考仅用于家庭记录，不构成医疗建议、诊断或接种推荐；具体健康问题请咨询医生，疫苗安排以当地接种门诊为准。
- 广告出现在工具页、宝宝首页和日常记录页。
- 旧待办数据 key `tools.todos.v1` 不再使用，但不会被自动删除。

## License

[MIT](./LICENSE)
````

- [ ] **Step 8: Verify no stale references**

Run:

```bash
rg -n "utils/todo|TodoItem|timestamp|calendar" src tests || true
```

Expected: no output. The string `tools.todos.v1` in README is intentionally not matched by this pattern.

- [ ] **Step 9: Run tests and clean builds**

Run:

```bash
npm test
rm -rf dist/build/mp-weixin dist/build/h5
npm run build:mp-weixin
npm run build:h5
```

Expected: all tests pass and both builds succeed.

- [ ] **Step 10: Verify the compiled app structure**

Run:

```bash
node -e "const app=require('./dist/build/mp-weixin/app.json');const subs=app.subPackages||app.subpackages||[];console.log(JSON.stringify({pages:app.pages,tabs:app.tabBar.list.map(i=>i.text+':'+i.pagePath),sub:subs.map(s=>s.root+':'+s.pages.map(p=>p.path).join(','))},null,2))"
```

Expected:

```json
{
  "pages": [
    "pages/tools/index",
    "pages/baby/index",
    "pages/about/about"
  ],
  "tabs": [
    "工具:pages/tools/index",
    "宝宝:pages/baby/index"
  ],
  "sub": [
    "package-baby:records/index,growth/index,health/index,journal/index,settings/index"
  ]
}
```

Also run:

```bash
test ! -d dist/build/mp-weixin/pages/todo && echo "todo page removed"
test -f dist/build/mp-weixin/static/tab-baby.png && echo "baby icon copied"
```

Expected: both lines print.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: switch to tools and baby tabs, remove todo"
```

---

### Task 18: 端到端验收

**Files:**
- 无新增代码；如发现问题，修复后补充测试并提交。

**Interfaces:**
- 验证 Task 1-17 的整体交付。

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm test
```

Expected: all existing utility tests plus the new baby tests pass.

- [ ] **Step 2: Build both targets**

Run:

```bash
rm -rf dist/build/mp-weixin dist/build/h5
npm run build:mp-weixin
npm run build:h5
```

Expected: both builds succeed with no errors.

- [ ] **Step 3: Devtools manual checklist**

Open the built mini program in WeChat devtools and verify:

- Tab bar shows exactly `工具` and `宝宝`; `宝宝` opens the baby home.
- Tools page drawer still opens, all four tools work, and the share path includes `?tool=`.
- Baby settings: save name/birth date/gender; returning home shows age and gender.
- Quick records: milk/sleep/diaper each open the correct form; sleep end must be after start; saving updates today's stats; deleting asks for confirmation.
- Milk amount 0 is accepted; negative or decimal amounts are rejected.
- Growth: add two dates, update an existing date, charts render, history deletes with confirmation.
- Vaccine: 一类 and 二类 groups render; 二类 shows「自费自愿」and「请咨询接种门诊」; checking an item fills today's date and the date can be changed; unchecking clears it; custom vaccine can be added and deleted; built-in items cannot be deleted.
- Journal: milestone add/delete, mood overwrite, note add/delete; reference milestones are collapsed by default and show the non-diagnostic note.
- Settings: export writes a JSON file and opens the share sheet; restore chooses a JSON file and asks for confirmation; restoring writes `baby.backup.v1`; clear deletes all `baby.*` but keeps `tools.todos.v1`.
- Ads appear on the tools page, baby home and records page; health/journal/settings have no ad slot.
- No location permission prompt appears.

- [ ] **Step 4: Real-device checklist**

On an iOS and an Android device:

- Canvas charts render with correct aspect ratio and redraw after adding data.
- Export share sheet works; restore file picker works.
- Ads render on the baby home and records page (devtools cannot reliably render native template ads).
- Forms and pickers are usable with the keyboard open.

- [ ] **Step 5: H5 checklist**

Run `npm run dev:h5` and open the local URL. Verify:

- Baby pages are reachable and data persists across reloads.
- Charts render.
- Export copies JSON to the clipboard.
- Restore opens the paste sheet.
- Ads do not render.

- [ ] **Step 6: Check package sizes**

Run:

```bash
du -sh dist/build/mp-weixin
du -sh dist/build/mp-weixin/package-baby
```

Expected: main package stays under the WeChat 2MB limit; the subpackage contains the five baby pages. Confirm the exact sizes in devtools if available.

- [ ] **Step 7: Review the working tree**

Run:

```bash
git status --short
```

Expected: only intentional changes; `dist/` remains ignored. Do not commit or push unless the user explicitly asks.

- [ ] **Step 8: Report results**

Report to the user:

- Test count and result.
- Both build results.
- Any manual checks that could not be performed in this environment (devtools/real-device ad rendering).
- Any remaining risk or follow-up work.

No commit is required in this task unless a fix was made; if a fix was made, commit it with a message describing the fix.

---

## Self-Review Notes

- **Spec coverage:** 双 Tab 与待办移除（Task 17）、宝宝资料（Task 2）、日常记录（Task 3/11）、生长曲线（Task 4/12）、疫苗参考（Task 5/13）、成长手记（Task 6/14）、导出恢复清空（Task 7/15）、宝宝首页（Task 16）、粉色主题（Task 8）、广告位（Task 11/16）、分包（Task 11-17）、测试与验收（Task 18）。
- **Health copy:** 所有健康相关页面使用 `Disclaimer`；二类疫苗在数据、列表、自定义表单和关于页均标注「自费自愿」与「请咨询接种门诊」；没有药物、剂量或诊断内容。
- **Type consistency:** 页面使用的函数名与 Task 1-7 的 Produces 一致；存储 key 全部来自 `src/utils/baby/keys.js`；记录/生长/疫苗/手记的返回结构在各任务间一致。
- **No placeholders:** 每个任务包含可直接创建或替换的完整代码、明确命令和预期结果。

