# 「我的」页 + 补剂记录 + 宝宝头像 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增「我的」Tab 并把工具页移入其中、新增独立「补剂」记录类型、支持宝宝头像的更换与备份。

**Architecture:** 沿用现有的本地存储与分包结构：补剂复用 `RecordPage` / `RecordForm` / `RecordList` 的记录链路，只在 `records.js` 增加 `supplement` 类型；头像以压缩后的 base64 存入 `profile.avatar`，随现有备份 payload 自动迁移；「我的」页是普通 Tab 页面，工具页降级为从「我的」进入的普通页面。全程不新增网络请求。

**Tech Stack:** uni-app 3 + Vue 3 + Vite 5、微信小程序、Vitest。

**分支:** `feat/profile-and-supplement`（已基于 `origin/master` 创建）

---

## 文件结构

新增：

- `src/utils/baby/avatar.js`：头像校验、选图与压缩。纯校验函数可测试；平台相关代码用 `#ifdef` 隔离。
- `src/pages/mine/index.vue`：「我的」Tab。
- `src/package-baby/records/supplement.vue`：补剂记录页，薄包装 `RecordPage`。
- `tests/baby-avatar.test.js`：头像校验单测。
- `src/static/tab-mine.png` / `tab-mine-active.png`：由脚本生成。

修改：

- `src/utils/baby/records.js`：新增 `supplement` 类型、校验、增删与当天清理。
- `src/utils/baby/profile.js`：新增 `avatar` 字段、校验、`saveAvatar`。
- `src/utils/baby/sidebar.js`：新增补剂入口、移除设置入口。
- `src/package-baby/components/RecordForm.vue`：用药/补剂共用自定义字段。
- `src/package-baby/components/records/RecordList.vue`：补剂列表行。
- `src/pages.json`：新增我的 Tab、补剂分包页、调整 tabBar。
- `src/pages/baby/index.vue`：首页头像展示与更换。
- `src/package-baby/settings/index.vue`：设置页头像行。
- `scripts/gen-tab-icons.cjs`：生成「我的」图标，停止生成工具 Tab 图标。
- `CLAUDE.md`、`README.md`：架构与目录说明。
- 测试：`baby-records`、`baby-backup`、`baby-sync`、`baby-sidebar`、`baby-profile`、`boundaries`。

---

## Task 1: 补剂数据层与当天清理

**Files:**
- Modify: `src/utils/baby/records.js`
- Test: `tests/baby-records.test.js`
- Test: `tests/boundaries.test.js`

- [ ] **Step 1: 写失败测试**

在 `tests/baby-records.test.js` 的 import 中加入 `validateSupplement`：

```js
import {
  FOOD_REACTIONS,
  addRecord,
  loadDay,
  loadRecentMilkSummary,
  milkChartPoints,
  removeRecord,
  summarizeDay,
  sortRecords,
  syncRecordMonthIndex,
  validateFood,
  validateMedicine,
  validateMilk,
  validateSleep,
  validateDiaper,
  validateSupplement,
} from '../src/utils/baby/records.js'
```

在 `describe('baby records')` 内追加：

```js
  it('validates supplement inputs', () => {
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: ' 维生素D ',
        amount: '',
        note: '',
      })
    ).toBe('')
    expect(validateSupplement({ time: '', name: '维生素D' })).toContain('时间')
    expect(validateSupplement({ time: '2026-10-24 08:00', name: '' })).toContain(
      '补剂名称'
    )
    expect(
      validateSupplement({ time: '2026-10-24 08:00', name: 'x'.repeat(31) })
    ).toContain('补剂名称')
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: '维生素D',
        amount: 'x'.repeat(21),
      })
    ).toContain('用量')
    expect(
      validateSupplement({
        time: '2026-10-24 08:00',
        name: '维生素D',
        note: 'x'.repeat(201),
      })
    ).toContain('备注')
  })

  it('stores supplement records separately from medicine', () => {
    const medicine = addRecord(
      'medicine',
      { time: '2026-10-24 09:00', name: '退烧药', amount: '', note: '' },
      1
    )
    const supplement = addRecord(
      'supplement',
      { time: '2026-10-24 10:00', name: ' 维生素D ', amount: '1 滴', note: '' },
      2
    )
    expect(medicine.ok).toBe(true)
    expect(supplement.ok).toBe(true)
    expect(supplement.record.name).toBe('维生素D')

    const day = loadDay('2026-10-24')
    expect(day.medicine).toHaveLength(1)
    expect(day.supplement).toHaveLength(1)

    expect(
      removeRecord('supplement', supplement.record.id, '2026-10-24').ok
    ).toBe(true)
    expect(loadDay('2026-10-24').supplement).toHaveLength(0)
    expect(loadDay('2026-10-24').medicine).toHaveLength(1)
  })

  it('drops the day when the last record of any kind is removed', () => {
    const medicine = addRecord(
      'medicine',
      { time: '2026-10-24 09:00', name: '退烧药', amount: '', note: '' },
      1
    )
    expect(removeRecord('medicine', medicine.record.id, '2026-10-24').ok).toBe(true)
    expect(JSON.parse(store[recordsKey('2026-10')])).toEqual({})
    expect(JSON.parse(store[RECORDS_INDEX_KEY])).toEqual([])
  })
```

在已有的 `keeps old record data without food and medicine arrays working` 测试末尾追加：

```js
    expect(day.supplement).toEqual([])
```

在 `tests/boundaries.test.js` 中把 `loadDay('bad')` 的期望对象改为：

```js
    expect(loadDay('bad')).toEqual({
      milk: [],
      sleep: [],
      diaper: [],
      food: [],
      medicine: [],
      supplement: [],
    })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/baby-records.test.js tests/boundaries.test.js`

Expected: FAIL，提示 `validateSupplement is not a function`，以及 `loadDay('bad')` 缺少 `supplement`。

- [ ] **Step 3: 实现数据层**

在 `src/utils/baby/records.js` 顶部把 `KINDS` 改为：

```js
const KINDS = ['milk', 'sleep', 'diaper', 'food', 'medicine', 'supplement']
```

把 `emptyDay()` 改为：

```js
function emptyDay() {
  return {
    milk: [],
    sleep: [],
    diaper: [],
    food: [],
    medicine: [],
    supplement: [],
  }
}
```

在 `normalizeDay()` 的返回值中追加：

```js
    supplement: sanitize(source.supplement, 'time'),
```

在 `validateMedicine` 后面新增：

```js
export function validateSupplement(input) {
  if (!parseLocalDateTime(input.time)) return '请选择补剂时间'
  const nameError = requiredTextError(input.name, '补剂名称', 30)
  if (nameError) return nameError
  const amountError = optionalTextError(input.amount, '用量', 20)
  if (amountError) return amountError
  return optionalTextError(input.note, '备注', 200)
}
```

在 `validateRecord()` 中追加：

```js
  if (kind === 'supplement') return validateSupplement(input)
```

把 `makeRecord()` 中的 `if (kind === 'medicine')` 分支改为：

```js
  if (kind === 'medicine' || kind === 'supplement') {
    return {
      id: makeId(now),
      time: input.time,
      name: String(input.name).trim(),
      amount: String(input.amount || '').trim(),
      note: String(input.note || '').trim(),
      createdAt: now,
    }
  }
```

把 `removeRecord()` 中的当天清理判断改为：

```js
  if (KINDS.every((recordKind) => !(nextDay[recordKind] || []).length)) {
    delete data[dateStr]
  } else {
    data[dateStr] = nextDay
  }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/baby-records.test.js tests/boundaries.test.js`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/utils/baby/records.js tests/baby-records.test.js tests/boundaries.test.js
git commit -m "feat: add supplement record data layer" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 2: 补剂表单、列表、页面与侧栏入口

**Files:**
- Modify: `src/package-baby/components/RecordForm.vue`
- Modify: `src/package-baby/components/records/RecordList.vue`
- Create: `src/package-baby/records/supplement.vue`
- Modify: `src/pages.json`
- Modify: `src/utils/baby/sidebar.js`
- Test: `tests/baby-sidebar.test.js`

- [ ] **Step 1: 写失败的侧栏测试**

把 `tests/baby-sidebar.test.js` 中的第一个测试替换为：

```js
  it('ships the twelve entries in order', () => {
    expect(SIDEBAR_ITEMS.map((item) => item.key)).toEqual([
      'home',
      'milk',
      'sleep',
      'diaper',
      'food',
      'medicine',
      'supplement',
      'health',
      'growth',
      'journal',
      'mom',
      'travel',
    ])
    expect(SIDEBAR_ITEMS.map((item) => item.label)).toEqual([
      '首页',
      '喝奶',
      '睡眠',
      '排便',
      '辅食',
      '用药',
      '补剂',
      '疫苗',
      '生长',
      '手记',
      '妈妈',
      '旅行',
    ])
    expect(SIDEBAR_ITEMS[0].url).toBe('/pages/baby/index')
    expect(SIDEBAR_ITEMS[1].url).toBe('/package-baby/records/milk')
    expect(SIDEBAR_ITEMS[4].url).toBe('/package-baby/records/food')
    expect(SIDEBAR_ITEMS[5].url).toBe('/package-baby/records/medicine')
    expect(SIDEBAR_ITEMS[6].url).toBe('/package-baby/records/supplement')
    expect(SIDEBAR_ITEMS[7].url).toBe('/package-baby/health/index')
    expect(SIDEBAR_ITEMS[10].url).toBe('/package-baby/mom/index')
    expect(SIDEBAR_ITEMS[11].url).toBe('/package-baby/travel/index')
    expect(
      SIDEBAR_ITEMS.every((item) => typeof item.icon === 'string' && item.icon)
    ).toBe(true)
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/baby-sidebar.test.js`

Expected: FAIL，`supplement` 缺失、`settings` 仍在。

- [ ] **Step 3: 更新侧栏**

把 `src/utils/baby/sidebar.js` 的 `SIDEBAR_ITEMS` 改为：

```js
export const SIDEBAR_ITEMS = [
  { key: 'home', label: '首页', icon: '🏠', url: '/pages/baby/index' },
  { key: 'milk', label: '喝奶', icon: '🍼', url: '/package-baby/records/milk' },
  { key: 'sleep', label: '睡眠', icon: '😴', url: '/package-baby/records/sleep' },
  { key: 'diaper', label: '排便', icon: '💧', url: '/package-baby/records/diaper' },
  { key: 'food', label: '辅食', icon: '🍚', url: '/package-baby/records/food' },
  { key: 'medicine', label: '用药', icon: '💊', url: '/package-baby/records/medicine' },
  { key: 'supplement', label: '补剂', icon: '🌿', url: '/package-baby/records/supplement' },
  { key: 'health', label: '疫苗', icon: '💉', url: '/package-baby/health/index' },
  { key: 'growth', label: '生长', icon: '📈', url: '/package-baby/growth/index' },
  { key: 'journal', label: '手记', icon: '📖', url: '/package-baby/journal/index' },
  { key: 'mom', label: '妈妈', icon: '👩', url: '/package-baby/mom/index' },
  { key: 'travel', label: '旅行', icon: '🧳', url: '/package-baby/travel/index' },
]
```

- [ ] **Step 4: 运行侧栏测试确认通过**

Run: `npx vitest run tests/baby-sidebar.test.js`

Expected: PASS。

- [ ] **Step 5: 更新记录表单**

在 `src/package-baby/components/RecordForm.vue` 中：

1. 把用药分支的模板替换为用药/补剂共用分支：

```html
      <template v-else-if="kind === 'medicine' || kind === 'supplement'">
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">
          {{ kind === 'medicine' ? '药品名称（自定义）' : '补剂名称（自定义）' }}
        </view>
        <input
          class="input"
          v-model="customName"
          maxlength="30"
          :placeholder="kind === 'medicine' ? '输入药品名称' : '输入补剂名称'"
        />
        <view class="form-label">用量（可选，自行填写）</view>
        <input class="input" v-model="customAmount" maxlength="20" placeholder="例如 5 ml" />
        <view class="form-label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="customNote"
          maxlength="200"
          :placeholder="kind === 'medicine' ? '记录用药情况' : '记录补剂情况'"
        />
        <view class="form-tip">
          {{ kind === 'medicine'
            ? '仅记录用户输入，不提供用药建议，请遵医嘱。'
            : '仅记录用户输入，不提供补剂建议，请遵医嘱。' }}
        </view>
      </template>
```

2. 把 `medicineName / medicineAmount / medicineNote` 三个 ref 改为：

```js
const customName = ref('')
const customAmount = ref('')
const customNote = ref('')
```

3. 在 `title` computed 中追加：

```js
  if (props.kind === 'supplement') return '🌿 记录补剂'
```

4. 在 `reset()` 中把三个 `medicine*` 重置改为：

```js
  customName.value = ''
  customAmount.value = ''
  customNote.value = ''
```

5. 把 `submit()` 中的用药分支改为：

```js
  if (props.kind === 'medicine' || props.kind === 'supplement') {
    emit('submit', {
      time: `${date.value} ${time.value}`,
      name: customName.value,
      amount: customAmount.value,
      note: customNote.value,
    })
    return
  }
```

- [ ] **Step 6: 更新记录列表**

在 `src/package-baby/components/records/RecordList.vue` 中，把最后的 `<template v-else>` 分支改为：

```html
        <template v-else>
          <view class="record-main">
            {{ kind === 'supplement' ? '🌿' : '💊' }} {{ item.time.slice(11) }} · {{ item.name }}
          </view>
          <view class="record-sub">
            {{ [item.amount, item.note].filter(Boolean).join(' · ') || '用量未记录' }}
          </view>
        </template>
```

- [ ] **Step 7: 新建补剂页面**

创建 `src/package-baby/records/supplement.vue`：

```vue
<template>
  <RecordPage
    kind="supplement"
    emoji="🌿"
    title="补剂"
    empty-text="今天还没有补剂记录，点“添加”记一笔吧 🐣"
    :show-switch="false"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">补剂次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value is-text">{{ latestName(list) }}</text>
          <text class="record-stat-label">最近补剂</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../components/records/RecordPage.vue'

function latestName(list) {
  return list.length ? list[0].name : '暂无'
}
</script>
```

- [ ] **Step 8: 注册分包页面**

在 `src/pages.json` 的 `subPackages[0].pages` 中，`records/medicine` 后面加入：

```json
        {
          "path": "records/supplement",
          "style": {
            "navigationBarTitleText": "补剂记录"
          }
        },
```

- [ ] **Step 9: 运行测试并确认页面能编译**

Run: `npm test`

Expected: PASS（除 Task 3 尚未涉及的头像测试外，现有测试全绿）。

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`

- [ ] **Step 10: 提交**

```bash
git add src/package-baby/components/RecordForm.vue src/package-baby/components/records/RecordList.vue src/package-baby/records/supplement.vue src/pages.json src/utils/baby/sidebar.js tests/baby-sidebar.test.js
git commit -m "feat: add supplement record page and sidebar entry" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 3: 头像校验与 profile 数据层

**Files:**
- Create: `src/utils/baby/avatar.js`
- Modify: `src/utils/baby/profile.js`
- Test: `tests/baby-avatar.test.js`
- Test: `tests/baby-profile.test.js`

- [ ] **Step 1: 写失败的头像校验测试**

创建 `tests/baby-avatar.test.js`：

```js
import { describe, it, expect } from 'vitest'
import { MAX_AVATAR_CHARS, isValidAvatar } from '../src/utils/baby/avatar.js'

describe('baby avatar validation', () => {
  it('accepts empty values and supported data urls', () => {
    expect(isValidAvatar('')).toBe(true)
    expect(isValidAvatar(null)).toBe(true)
    expect(isValidAvatar(undefined)).toBe(true)
    expect(isValidAvatar('data:image/jpeg;base64,abc')).toBe(true)
    expect(isValidAvatar('data:image/png;base64,abc')).toBe(true)
    expect(isValidAvatar('data:image/webp;base64,abc')).toBe(true)
  })

  it('rejects unsupported formats and non-strings', () => {
    expect(isValidAvatar('https://example.com/a.jpg')).toBe(false)
    expect(isValidAvatar('data:image/gif;base64,abc')).toBe(false)
    expect(isValidAvatar({})).toBe(false)
  })

  it('accepts the exact size limit and rejects one character more', () => {
    const prefix = 'data:image/jpeg;base64,'
    const exact = prefix + 'a'.repeat(MAX_AVATAR_CHARS - prefix.length)
    expect(exact.length).toBe(MAX_AVATAR_CHARS)
    expect(isValidAvatar(exact)).toBe(true)
    expect(isValidAvatar(`${exact}a`)).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/baby-avatar.test.js`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 avatar.js**

创建 `src/utils/baby/avatar.js`：

```js
export const MAX_AVATAR_CHARS = 300 * 1024

const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,/

export function isValidAvatar(value) {
  if (value === '' || value == null) return true
  if (typeof value !== 'string') return false
  if (value.length > MAX_AVATAR_CHARS) return false
  return AVATAR_PATTERN.test(value)
}

export function chooseAvatarImage(options = {}) {
  const sourceType = Array.isArray(options.sourceType)
    ? options.sourceType
    : ['album', 'camera']
  return new Promise((resolve) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType,
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0]
        if (!path) {
          resolve({ ok: false, error: '未选择图片' })
          return
        }
        compressToDataUrl(path)
          .then((dataUrl) => {
            if (!isValidAvatar(dataUrl)) {
              resolve({ ok: false, error: '图片过大，请换一张' })
              return
            }
            resolve({ ok: true, dataUrl })
          })
          .catch(() => resolve({ ok: false, error: '图片处理失败，请重试' }))
      },
      fail: () => resolve({ ok: false, error: '未选择图片' }),
    })
  })
}

function compressToDataUrl(path) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    const read = (source) => {
      try {
        const base64 = wx.getFileSystemManager().readFileSync(source, 'base64')
        const ext = /\.png$/i.test(source)
          ? 'png'
          : /\.webp$/i.test(source)
            ? 'webp'
            : 'jpeg'
        resolve(`data:image/${ext};base64,${base64}`)
      } catch (e) {
        reject(e)
      }
    }
    if (typeof wx !== 'undefined' && typeof wx.compressImage === 'function') {
      wx.compressImage({
        src: path,
        quality: 70,
        compressedWidth: 400,
        success: (res) => read(res.tempFilePath),
        fail: () => read(path),
      })
      return
    }
    read(path)
  })
  // #endif

  // #ifdef H5
  return resizeImageInH5(path)
  // #endif
}

// #ifdef H5
function resizeImageInH5(path) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const maxSide = 400
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = path
  })
}
// #endif
```

- [ ] **Step 4: 运行头像测试确认通过**

Run: `npx vitest run tests/baby-avatar.test.js`

Expected: PASS。

- [ ] **Step 5: 写失败的 profile 测试**

在 `tests/baby-profile.test.js` 顶部 import 改为：

```js
import {
  loadProfile,
  saveAvatar,
  saveProfile,
  validateProfile,
} from '../src/utils/baby/profile.js'
import { MAX_AVATAR_CHARS } from '../src/utils/baby/avatar.js'
import { PROFILE_KEY } from '../src/utils/baby/keys.js'
```

在 `describe('baby profile')` 内追加：

```js
  it('saves and preserves avatar', () => {
    const avatar = 'data:image/jpeg;base64,abc'
    const res = saveProfile(
      { name: '宝宝', birthDate: '2025-01-01', gender: 'boy', avatar },
      1000
    )
    expect(res.ok).toBe(true)
    expect(loadProfile().avatar).toBe(avatar)

    saveProfile({ name: '宝宝', birthDate: '2025-01-01', gender: 'boy' }, 2000)
    expect(loadProfile().avatar).toBe(avatar)
  })

  it('validates avatar format and size', () => {
    expect(
      validateProfile({
        name: '宝宝',
        birthDate: '2025-01-01',
        avatar: 'https://example.com/a.jpg',
      })
    ).toBe('头像格式不正确')
    expect(
      validateProfile({
        name: '宝宝',
        birthDate: '2025-01-01',
        avatar: `data:image/jpeg;base64,${'a'.repeat(MAX_AVATAR_CHARS)}`,
      })
    ).toBe('头像图片过大，请换一张')
    expect(
      validateProfile({
        name: '宝宝',
        birthDate: '2025-01-01',
        avatar: 'data:image/jpeg;base64,abc',
      })
    ).toBe('')
  })

  it('falls back to an empty avatar when the stored value is invalid', () => {
    store[PROFILE_KEY] = JSON.stringify({
      name: '宝宝',
      birthDate: '',
      gender: 'boy',
      avatar: 'bad',
    })
    expect(loadProfile().avatar).toBe('')
  })

  it('updates only the avatar without requiring other fields', () => {
    saveProfile(
      {
        name: '小满',
        birthDate: '2025-01-01',
        gender: 'girl',
        avatar: '',
      },
      1000
    )
    const res = saveAvatar('data:image/png;base64,abc', 2000)
    expect(res.ok).toBe(true)
    expect(loadProfile()).toMatchObject({
      name: '小满',
      avatar: 'data:image/png;base64,abc',
      createdAt: 1000,
      updatedAt: 2000,
    })
  })
```

- [ ] **Step 6: 运行测试确认失败**

Run: `npx vitest run tests/baby-profile.test.js`

Expected: FAIL，`saveAvatar` 未导出、`avatar` 未保存。

- [ ] **Step 7: 实现 profile.js 改动**

在 `src/utils/baby/profile.js` 顶部加入：

```js
import { MAX_AVATAR_CHARS, isValidAvatar } from './avatar.js'
```

把 `DEFAULT_PROFILE` 改为：

```js
const DEFAULT_PROFILE = {
  name: '宝宝',
  birthDate: '',
  gender: 'boy',
  avatar: '',
  createdAt: null,
  updatedAt: null,
}
```

在 `loadProfile()` 的返回对象中，`gender` 后面加入：

```js
    avatar: isValidAvatar(raw.avatar) ? raw.avatar || '' : '',
```

在 `validateProfile()` 的 `return ''` 之前加入：

```js
  if (input.avatar !== undefined && !isValidAvatar(input.avatar)) {
    return typeof input.avatar === 'string' && input.avatar.length > MAX_AVATAR_CHARS
      ? '头像图片过大，请换一张'
      : '头像格式不正确'
  }
```

把 `saveProfile()` 改为：

```js
export function saveProfile(input, now = Date.now()) {
  const error = validateProfile(input)
  if (error) return { ok: false, error }
  const previous = loadProfile()
  const avatar =
    input.avatar === undefined ? previous.avatar : input.avatar || ''
  const profile = {
    name: String(input.name).trim(),
    birthDate: input.birthDate,
    gender: input.gender === 'girl' ? 'girl' : 'boy',
    avatar,
    createdAt: previous.createdAt || now,
    updatedAt: now,
  }
  if (!writeStorage(PROFILE_KEY, profile)) return { ok: false, error: '保存失败' }
  return { ok: true, profile }
}
```

在 `saveProfile` 后面新增：

```js
export function saveAvatar(avatar, now = Date.now()) {
  if (!isValidAvatar(avatar)) {
    return {
      ok: false,
      error:
        typeof avatar === 'string' && avatar.length > MAX_AVATAR_CHARS
          ? '头像图片过大，请换一张'
          : '头像格式不正确',
    }
  }
  const previous = loadProfile()
  const profile = { ...previous, avatar: avatar || '', updatedAt: now }
  if (!writeStorage(PROFILE_KEY, profile)) return { ok: false, error: '保存失败' }
  return { ok: true, profile }
}
```

- [ ] **Step 8: 运行测试确认通过**

Run: `npx vitest run tests/baby-avatar.test.js tests/baby-profile.test.js`

Expected: PASS。

- [ ] **Step 9: 提交**

```bash
git add src/utils/baby/avatar.js src/utils/baby/profile.js tests/baby-avatar.test.js tests/baby-profile.test.js
git commit -m "feat: add baby avatar validation and profile storage" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 4: 首页与设置页头像入口

**Files:**
- Modify: `src/pages/baby/index.vue`
- Modify: `src/package-baby/settings/index.vue`

- [ ] **Step 1: 首页展示头像并支持点击更换**

在 `src/pages/baby/index.vue` 的模板中，把：

```html
      <view class="avatar">👶</view>
```

替换为：

```html
      <view class="avatar" :class="{ 'has-image': profile.avatar }" @click="changeAvatar">
        <image
          v-if="profile.avatar"
          class="avatar-image"
          :src="profile.avatar"
          mode="aspectFill"
        />
        <text v-else class="avatar-emoji">👶</text>
        <view class="avatar-camera">📷</view>
      </view>
```

在 `<script setup>` 的 import 中加入：

```js
import { chooseAvatarImage } from '../../utils/baby/avatar.js'
```

把 `import { loadProfile } from '../../utils/baby/profile.js'` 改为：

```js
import { loadProfile, saveAvatar } from '../../utils/baby/profile.js'
```

在 `goSettings` 附近新增：

```js
async function changeAvatar() {
  const picked = await chooseAvatarImage()
  if (!picked.ok) {
    if (picked.error !== '未选择图片') {
      uni.showToast({ title: picked.error, icon: 'none' })
    }
    return
  }
  const res = saveAvatar(picked.dataUrl)
  if (!res.ok) {
    uni.showToast({ title: res.error || '保存失败', icon: 'none' })
    return
  }
  refresh()
  uni.showToast({ title: '头像已更新', icon: 'none' })
}
```

在样式区把 `.avatar` 规则改为：

```css
.avatar {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: #FFFFFF;
  font-size: 52rpx;
}
.avatar-image {
  width: 100%;
  height: 100%;
}
.avatar-emoji {
  font-size: 52rpx;
}
.avatar-camera {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 34rpx;
  height: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFFFFF;
  font-size: 18rpx;
  box-shadow: 0 2rpx 8rpx rgba(31, 41, 55, 0.18);
}
```

- [ ] **Step 2: 设置页增加头像行**

在 `src/package-baby/settings/index.vue` 的「宝宝资料」卡片中，把：

```html
      <view class="card-title">👶 宝宝资料</view>
      <view class="label">昵称</view>
```

替换为：

```html
      <view class="card-title">👶 宝宝资料</view>
      <view class="avatar-row" @click="editAvatar">
        <image
          v-if="form.avatar"
          class="avatar-preview"
          :src="form.avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar-preview avatar-placeholder">👶</view>
        <view class="avatar-meta">
          <view class="avatar-title">宝宝头像</view>
          <view class="avatar-desc">点击更换或移除</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="label">昵称</view>
```

在 `<script setup>` 的 import 中加入：

```js
import { chooseAvatarImage } from '../../utils/baby/avatar.js'
```

把 `form` 初始化改为：

```js
const form = ref({ name: '宝宝', birthDate: '', gender: 'boy', avatar: '' })
```

在 `refresh()` 的 `form.value` 中追加：

```js
    avatar: profile.avatar,
```

在 `save()` 前新增：

```js
function editAvatar() {
  uni.showActionSheet({
    itemList: ['从相册选择', '拍照', '移除头像'],
    success: async (res) => {
      if (res.tapIndex === 2) {
        form.value.avatar = ''
        return
      }
      const picked = await chooseAvatarImage({
        sourceType: res.tapIndex === 1 ? ['camera'] : ['album'],
      })
      if (!picked.ok) {
        uni.showToast({ title: picked.error, icon: 'none' })
        return
      }
      form.value.avatar = picked.dataUrl
    },
  })
}
```

在样式区新增：

```css
.avatar-row {
  display: flex;
  align-items: center;
  padding: 8rpx 0 24rpx;
  border-bottom: 1rpx solid var(--border);
}
.avatar-preview {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #FFF1F3;
}
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
}
.avatar-meta {
  flex: 1;
  margin-left: 20rpx;
}
.avatar-title {
  font-size: 30rpx;
  color: var(--text);
}
.avatar-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
```

- [ ] **Step 3: 构建验证**

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`

- [ ] **Step 4: 提交**

```bash
git add src/pages/baby/index.vue src/package-baby/settings/index.vue
git commit -m "feat: allow changing baby avatar from home and settings" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 5: 「我的」页、TabBar 与图标

**Files:**
- Create: `src/pages/mine/index.vue`
- Modify: `src/pages.json`
- Modify: `scripts/gen-tab-icons.cjs`
- Create: `src/static/tab-mine.png`
- Create: `src/static/tab-mine-active.png`
- Delete: `src/static/tab-tools.png`
- Delete: `src/static/tab-tools-active.png`

- [ ] **Step 1: 扩展图标脚本**

在 `scripts/gen-tab-icons.cjs` 的 `paint` 函数之前加入：

```js
function filledCircleCoverage(x, y, cx, cy, r) {
  const samples = 4
  let hit = 0
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const px = x - 0.5 + (sx + 0.5) / samples
      const py = y - 0.5 + (sy + 0.5) / samples
      if (Math.hypot(px - cx, py - cy) <= r) hit += 1
    }
  }
  return hit / (samples * samples)
}

function filledRoundedRectCoverage(x, y, left, top, right, bottom, radius) {
  const samples = 4
  let hit = 0
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const px = x - 0.5 + (sx + 0.5) / samples
      const py = y - 0.5 + (sy + 0.5) / samples
      const cx = Math.min(Math.max(px, left + radius), right - radius)
      const cy = Math.min(Math.max(py, top + radius), bottom - radius)
      if (Math.hypot(px - cx, py - cy) <= radius) hit += 1
    }
  }
  return hit / (samples * samples)
}

function personCoverage(x, y) {
  const head = filledCircleCoverage(x, y, 40.5, 27, 14)
  const body = filledRoundedRectCoverage(x, y, 17, 47, 64, 74, 13)
  return Math.max(head, body)
}
```

把 `outputs` 改为：

```js
const outputs = [
  ['tab-baby.png', paint(heartCoverage, NORMAL)],
  ['tab-baby-active.png', paint(heartCoverage, ACTIVE)],
  ['tab-mine.png', paint(personCoverage, NORMAL)],
  ['tab-mine-active.png', paint(personCoverage, ACTIVE)],
]
```

- [ ] **Step 2: 生成图标并删除旧工具图标**

Run:

```bash
node scripts/gen-tab-icons.cjs
git rm src/static/tab-tools.png src/static/tab-tools-active.png
ls src/static/tab-*.png
```

Expected: 输出 `generated tab-baby.png, tab-baby-active.png, tab-mine.png, tab-mine-active.png`，`ls` 只剩 baby 和 mine 四张。

- [ ] **Step 3: 新建「我的」页**

创建 `src/pages/mine/index.vue`：

```vue
<template>
  <view class="mine-page">
    <view class="identity-card">
      <view class="identity-avatar">👤</view>
      <view class="identity-body">
        <view class="identity-title">本地模式</view>
        <view class="identity-desc">数据仅保存在本机</view>
      </view>
      <view class="identity-tag">未登录</view>
    </view>

    <view class="card sync-card">
      <view class="card-title">☁️ 数据同步</view>
      <view class="sync-status">当前为本机存储</view>
      <view class="sync-desc">
        云端同步即将上线，届时可在多台设备间同步宝宝记录。
      </view>
      <view class="sync-btn" @click="syncSoon">即将上线</view>
    </view>

    <view class="card">
      <view class="card-title">🧰 工具箱</view>
      <view
        v-for="tool in tools"
        :key="tool.key"
        class="tool-row"
        @click="openTool(tool.key)"
      >
        <text class="tool-emoji">{{ tool.emoji }}</text>
        <view class="tool-body">
          <view class="tool-name">{{ tool.name }}</view>
          <view class="tool-desc">{{ tool.desc }}</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="card">
      <view class="row" @click="openSettings">
        <view class="row-body">
          <view class="row-title">⚙️ 数据与设置</view>
          <view class="row-desc">宝宝资料、导出恢复与清理</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @click="openAbout">
        <view class="row-body">
          <view class="row-title">ℹ️ 关于与免责声明</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="note">宝宝资料与记录只保存在本机，不登录、不上传。</view>
  </view>
</template>

<script setup>
const tools = [
  { key: 'vat', emoji: '🧮', name: '增值税', desc: '含税 / 不含税' },
  { key: 'unit', emoji: '📐', name: '单位换算', desc: '长度 / 重量 / 温度' },
  { key: 'text', emoji: '✂️', name: '文本处理', desc: '去重 / 大小写' },
  { key: 'radix', emoji: '🔢', name: '进制转换', desc: '2–36 进制' },
]

function openTool(key) {
  uni.navigateTo({ url: `/pages/tools/index?tool=${key}` })
}

function openSettings() {
  uni.navigateTo({ url: '/package-baby/settings/index' })
}

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}

function syncSoon() {
  uni.showToast({ title: '数据同步即将上线', icon: 'none' })
}
</script>

<style scoped>
.mine-page {
  padding: 24rpx 32rpx 64rpx;
}
.identity-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #FFE4E1, #FFB6C1);
  border-radius: 48rpx;
  box-shadow: 0 10rpx 30rpx rgba(255, 143, 163, 0.18);
}
.identity-avatar {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFFFFF;
  font-size: 52rpx;
}
.identity-body {
  flex: 1;
  margin-left: 24rpx;
}
.identity-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text);
}
.identity-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7A5B60;
}
.identity-tag {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  color: var(--primary-strong);
  font-size: 22rpx;
  white-space: nowrap;
}
.sync-card {
  margin-top: 24rpx;
}
.sync-status {
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text);
}
.sync-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.sync-btn {
  margin-top: 20rpx;
  padding: 18rpx 0;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--text-secondary);
  font-size: 26rpx;
  text-align: center;
}
.tool-row,
.row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.tool-row:last-child,
.row:last-child {
  border-bottom: none;
}
.tool-emoji {
  width: 56rpx;
  font-size: 36rpx;
}
.tool-body,
.row-body {
  flex: 1;
}
.tool-name,
.row-title {
  font-size: 30rpx;
  color: var(--text);
}
.tool-desc,
.row-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.row-arrow {
  margin-left: 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.note {
  margin-top: 32rpx;
  text-align: center;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 4: 更新 pages.json**

把 `pages` 数组改为：

```json
  "pages": [
    {
      "path": "pages/baby/index",
      "style": {
        "navigationBarTitleText": "宝宝记录",
        "enableShareAppMessage": true,
        "enableShareTimeline": true
      }
    },
    {
      "path": "pages/mine/index",
      "style": {
        "navigationBarTitleText": "我的"
      }
    },
    {
      "path": "pages/tools/index",
      "style": {
        "navigationBarTitleText": "工具箱",
        "enableShareAppMessage": true,
        "enableShareTimeline": true
      }
    },
    {
      "path": "pages/about/about",
      "style": {
        "navigationBarTitleText": "关于"
      }
    }
  ],
```

把 `tabBar.list` 改为：

```json
    "list": [
      {
        "pagePath": "pages/baby/index",
        "iconPath": "static/tab-baby.png",
        "selectedIconPath": "static/tab-baby-active.png",
        "text": "宝宝"
      },
      {
        "pagePath": "pages/mine/index",
        "iconPath": "static/tab-mine.png",
        "selectedIconPath": "static/tab-mine-active.png",
        "text": "我的"
      }
    ]
```

- [ ] **Step 5: 构建验证**

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`，并且 `dist/build/mp-weixin/app.json` 的 tabBar 只有 baby 和 mine。

Run:

```bash
node -e "const a=require('./dist/build/mp-weixin/app.json'); console.log(a.tabBar.list.map(i=>i.pagePath));"
```

Expected: `[ 'pages/baby/index', 'pages/mine/index' ]`。

- [ ] **Step 6: 提交**

```bash
git add src/pages/mine/index.vue src/pages.json scripts/gen-tab-icons.cjs src/static/tab-mine.png src/static/tab-mine-active.png
git commit -m "feat: add mine tab and move tools out of tab bar" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 6: 备份/同步兼容与测试补齐

**Files:**
- Test: `tests/baby-backup.test.js`
- Test: `tests/baby-sync.test.js`

- [ ] **Step 1: 备份 fixture 加入补剂与头像**

在 `tests/baby-backup.test.js` 的 `seed()` 中，把 profile 改为：

```js
  store[PROFILE_KEY] = JSON.stringify({
    name: '小满',
    birthDate: '2025-01-02',
    gender: 'girl',
    avatar: 'data:image/jpeg;base64,abc',
    createdAt: 1,
    updatedAt: 1,
  })
```

在 `seed()` 的 `2026-10-24` 对象中，`medicine` 数组后面加入：

```js
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
```

- [ ] **Step 2: 增加补剂与头像 round-trip 断言**

在 `describe` 内新增：

```js
  it('round-trips supplement records and avatar', () => {
    seed()
    const payload = buildExportPayload(new Date(2026, 9, 24, 10, 5))
    expect(payload.data.profile.avatar).toBe('data:image/jpeg;base64,abc')
    expect(
      payload.data.records['2026-10']['2026-10-24'].supplement
    ).toHaveLength(1)

    const res = restoreData(payload.data, new Date(2026, 9, 25, 9, 0))
    expect(res.ok).toBe(true)
    expect(loadDay('2026-10-24').supplement).toHaveLength(1)
    expect(loadDay('2026-10-24').supplement[0].name).toBe('维生素D')
    expect(JSON.parse(store[PROFILE_KEY]).avatar).toBe(
      'data:image/jpeg;base64,abc'
    )
  })
```

- [ ] **Step 3: 同步测试 fixture 加入补剂**

在 `tests/baby-sync.test.js` 的 `seed()` 中，把 `2026-10-24` 对象的 `medicine: []` 改为：

```js
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
```

在第一个测试 `wraps the export payload in a versioned snapshot` 中追加：

```js
    expect(
      payload.snapshot.data.records['2026-10']['2026-10-24'].supplement
    ).toHaveLength(1)
```

- [ ] **Step 4: 运行全部测试**

Run: `npm test`

Expected: PASS，所有测试全绿。

- [ ] **Step 5: 提交**

```bash
git add tests/baby-backup.test.js tests/baby-sync.test.js
git commit -m "test: cover supplement backup and sync round-trip" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 7: 文档更新与最终验证

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: 更新 CLAUDE.md**

把「App shell and routing」中的：

```markdown
- `src/pages.json` defines the whole route tree: two tabBar pages (`pages/baby/index`, `pages/tools/index`), `pages/about/about`, and a `package-baby` subpackage containing all baby sub-pages.
```

改为：

```markdown
- `src/pages.json` defines the whole route tree: two tabBar pages (`pages/baby/index`, `pages/mine/index`), the non-tab `pages/tools/index`, `pages/about/about`, and a `package-baby` subpackage containing all baby sub-pages.
```

把「Baby data layer」中的：

```markdown
- Records: `records.js` keeps five kinds (`milk`, `sleep`, `diaper`, `food`, `medicine`) grouped by day inside a monthly object.
```

改为：

```markdown
- Records: `records.js` keeps six kinds (`milk`, `sleep`, `diaper`, `food`, `medicine`, `supplement`) grouped by day inside a monthly object.
```

在「UI composition」中，把侧栏条目说明改为：

```markdown
- `src/utils/baby/sidebar.js` also owns `SIDEBAR_ITEMS`; a new baby page usually needs an entry there **and** in `pages.json`. Settings is intentionally not in the sidebar — it is reached from the 「我的」 tab.
```

把「Toolbox」段落改为：

```markdown
- Toolbox: `pages/tools/index.vue` is opened from the 「我的」 tab (not a tabBar page) and keeps all four panels mounted, toggling them with `v-show`; a floating button opens a bottom sheet to switch tools. Calculations live in `src/utils/{vat,units,text,radix}.js` and must stay UI-free.
```

在「Baby data layer」的 profile 说明附近补一句：

```markdown
- `profile.avatar` stores a compressed base64 data URL (max `MAX_AVATAR_CHARS` in `src/utils/baby/avatar.js`); `saveAvatar()` updates only the avatar so the home page can change it before birth date is filled. Avatars travel inside the existing backup payload.
```

把「Mini-program limits」中的备份说明保持不变；无需改 schemaVersion。

- [ ] **Step 2: 更新 README.md**

把目录结构中的：

```markdown
- `src/pages/tools/index.vue`：工具页与「全部工具」抽屉
```

改为：

```markdown
- `src/pages/mine/index.vue`：我的页（本地模式、同步占位、工具箱入口、数据与设置）
- `src/pages/tools/index.vue`：工具页与「全部工具」抽屉（从「我的」进入）
```

把分包说明改为：

```markdown
  - `records/*.vue`：喝奶 / 睡眠 / 排便 / 辅食 / 用药 / 补剂记录页，复用 `components/records/RecordPage.vue`
```

在「说明」中补充：

```markdown
- 宝宝头像以压缩后的图片数据保存在本机，并随导出备份一起迁移。
- 「我的」页的数据同步目前只是占位，不会发起网络请求。
```

- [ ] **Step 3: 运行完整测试与构建**

Run: `npm test`

Expected: PASS。

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`

- [ ] **Step 4: 提交**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document mine tab, supplement records and avatar" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## 手动验收清单

在微信开发者工具导入 `dist/build/mp-weixin` 后逐项确认：

- [ ] 底部 Tab 为「宝宝 / 我的」，工具页不再出现在 Tab 中。
- [ ] 从「我的」点击 4 个工具，分别打开工具页并定位到对应工具。
- [ ] 「我的」页同步卡点击只提示“数据同步即将上线”，不发起网络请求。
- [ ] 宝宝首页点头像可打开相册/相机，选择后头像更新；重新进入页面仍保留。
- [ ] 设置页可更换、移除头像，保存资料后首页同步更新。
- [ ] 侧栏出现「补剂」，可新增、展示、删除补剂记录。
- [ ] 补剂记录与用药记录互不影响。
- [ ] 导出备份 → 清空数据 → 恢复，补剂记录与头像都保留。
- [ ] 旧数据（无 supplement、无 avatar）加载正常。
