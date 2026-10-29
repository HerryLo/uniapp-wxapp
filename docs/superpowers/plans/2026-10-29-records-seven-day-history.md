# 日常记录最近 7 天历史展示实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 六类日常记录页统一展示最近 7 天历史汇总，并允许展开查看过去日期的只读记录明细。

**Architecture:** 在 `utils/baby/records.js` 增加两个纯函数负责读取 7 天数据与生成每行文案；新增 `RecordsHistory.vue` 渲染历史卡片与单开手风琴；`RecordPage.vue` 统一挂载该卡片，喝奶页只保留趋势图。数据仍按月分桶存储，不改存储结构。

**Tech Stack:** uni-app + Vue 3 + Vite、Vitest、SCSS 全局样式变量（`App.vue`）。

**前置说明：**

- 仓库目录：`D:\dev\uniapp-wxapp`，当前分支 `feat/share-and-search`。
- 工作区已有未提交的 `.gitignore` 改动，与本次无关，提交时只 `git add` 本计划涉及的文件。
- 没有 lint / typecheck 脚本，验证用 `npm test` 与构建命令。
- 所有界面文案、注释、提示保持中文。

---

## 文件结构

- 修改 `src/utils/baby/records.js`：新增 `loadRecentDays`、`summarizeRecentDay`。
- 修改 `src/utils/baby/records.js` 顶部 import：追加 `formatDuration`。
- 修改 `src/package-baby/components/records/RecordList.vue`：增加 `readonly` prop。
- 新增 `src/package-baby/components/records/RecordsHistory.vue`：历史卡片与展开逻辑。
- 修改 `src/package-baby/components/records/RecordPage.vue`：挂载历史卡片并刷新数据。
- 修改 `src/package-baby/records/milk.vue`：删除自带历史列表，只保留趋势图。
- 修改 `src/App.vue`：删除不再使用的 `.trend-list` 系列样式。
- 修改 `tests/baby-records.test.js`：新增数据层测试。
- 修改 `README.md`：功能说明补充历史展示。

---

### Task 1: `summarizeRecentDay` 汇总文案

**Files:**
- Modify: `src/utils/baby/records.js:7`（import）、文件末尾追加函数
- Test: `tests/baby-records.test.js`

- [ ] **Step 1: 写失败测试**

在 `tests/baby-records.test.js` 的 import 列表中加入 `summarizeRecentDay`：

```js
import {
  FOOD_REACTIONS,
  addRecord,
  loadDay,
  loadRecentMilkSummary,
  milkChartPoints,
  removeRecord,
  summarizeDay,
  summarizeRecentDay,
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

在 `describe('baby records', ...)` 内追加：

```js
it('summarizes recent days for every record kind', () => {
  addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '100' }, 1)
  addRecord('milk', { time: '2026-10-24 12:00', type: '配方奶', amount: '120' }, 2)
  addRecord('sleep', { start: '2026-10-24 23:00', end: '2026-10-25 01:30' }, 3)
  addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '正常' }, 4)
  addRecord('diaper', { time: '2026-10-24 11:00', type: '小便', color: '正常' }, 5)
  addRecord(
    'food',
    { time: '2026-10-24 10:00', name: '米糊', amount: '', reaction: '喜欢', note: '' },
    6
  )
  addRecord(
    'food',
    { time: '2026-10-24 15:00', name: '蛋黄', amount: '', reaction: '异常', note: '' },
    7
  )
  addRecord('supplement', { time: '2026-10-24 08:00', name: '维生素D', amount: '', note: '' }, 8)
  addRecord('supplement', { time: '2026-10-24 09:00', name: '维生素D', amount: '', note: '' }, 9)
  addRecord('supplement', { time: '2026-10-24 10:00', name: '钙', amount: '', note: '' }, 10)
  addRecord('medicine', { time: '2026-10-24 08:00', name: '退烧药', amount: '', note: '' }, 11)
  addRecord('medicine', { time: '2026-10-24 09:00', name: '益生菌', amount: '', note: '' }, 12)
  addRecord('medicine', { time: '2026-10-24 10:00', name: '止咳药', amount: '', note: '' }, 13)

  const day = loadDay('2026-10-24')
  expect(summarizeRecentDay('milk', day)).toMatchObject({
    count: 2,
    hasData: true,
    text: '220 ml · 2 次',
  })
  expect(summarizeRecentDay('sleep', day).text).toBe('2 小时 30 分钟 · 1 次')
  expect(summarizeRecentDay('diaper', day)).toMatchObject({ count: 2, text: '2 次' })
  expect(summarizeRecentDay('food', day).text).toBe('2 次 · 异常 1 次')
  expect(summarizeRecentDay('supplement', day).text).toBe('钙、维生素D · 3 次')
  expect(summarizeRecentDay('medicine', day).text).toBe('止咳药、益生菌 等 · 3 次')
})

it('marks milk days without amounts and empty kinds', () => {
  addRecord('milk', { time: '2026-10-24 08:00', type: '母乳', amount: '' }, 1)
  const day = loadDay('2026-10-24')
  expect(summarizeRecentDay('milk', day)).toMatchObject({
    count: 1,
    text: '1 次 · 未记录奶量',
  })

  const empty = loadDay('2026-10-25')
  for (const kind of ['milk', 'sleep', 'diaper', 'food', 'medicine', 'supplement']) {
    expect(summarizeRecentDay(kind, empty)).toEqual({
      count: 0,
      hasData: false,
      text: '未记录',
    })
  }
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /d/dev/uniapp-wxapp && npx vitest run tests/baby-records.test.js`

Expected: FAIL，报 `summarizeRecentDay is not a function` 或导入失败。

- [ ] **Step 3: 实现函数**

把 `src/utils/baby/records.js` 第 7 行的 import 改为：

```js
import {
  durationMinutes,
  formatDate,
  formatDuration,
  monthKey,
  parseLocalDateTime,
} from './date.js'
```

在文件末尾追加：

```js
function uniqueRecordNames(list) {
  const seen = new Set()
  const names = []
  for (const item of sortRecords(list, 'medicine')) {
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    if (!name || seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

export function summarizeRecentDay(kind, day) {
  const source = normalizeDay(day)
  const list = source[kind] || []
  const count = list.length
  const hasData = count > 0
  if (!hasData) return { count: 0, hasData: false, text: '未记录' }

  if (kind === 'milk') {
    const hasAmount = list.some(
      (item) => typeof item.amount === 'number' && Number.isFinite(item.amount)
    )
    if (!hasAmount) return { count, hasData, text: `${count} 次 · 未记录奶量` }
    const total = list.reduce(
      (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
      0
    )
    return { count, hasData, text: `${total} ml · ${count} 次` }
  }

  if (kind === 'sleep') {
    const minutes = list.reduce(
      (sum, item) => sum + durationMinutes(item.start, item.end),
      0
    )
    return { count, hasData, text: `${formatDuration(minutes)} · ${count} 次` }
  }

  if (kind === 'diaper') {
    return { count, hasData, text: `${count} 次` }
  }

  if (kind === 'food') {
    const abnormal = list.filter((item) => item.reaction === '异常').length
    return {
      count,
      hasData,
      text: abnormal ? `${count} 次 · 异常 ${abnormal} 次` : `${count} 次`,
    }
  }

  const names = uniqueRecordNames(list)
  const shown =
    names.length > 2 ? `${names.slice(0, 2).join('、')} 等` : names.join('、')
  return { count, hasData, text: shown ? `${shown} · ${count} 次` : `${count} 次` }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /d/dev/uniapp-wxapp && npx vitest run tests/baby-records.test.js`

Expected: PASS，新增 2 个用例通过。

- [ ] **Step 5: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add src/utils/baby/records.js tests/baby-records.test.js
git commit -m "feat: 汇总六类记录的最近一天数据

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: `loadRecentDays` 读取最近 7 天

**Files:**
- Modify: `src/utils/baby/records.js`（在 `summarizeRecentDay` 附近追加）
- Test: `tests/baby-records.test.js`

- [ ] **Step 1: 写失败测试**

先在 `tests/baby-records.test.js` 的 import 列表中加入 `loadRecentDays`（放在 `loadRecentMilkSummary` 之前）：

```js
  loadDay,
  loadRecentDays,
  loadRecentMilkSummary,
```

再在 `describe('baby records', ...)` 内追加：

```js
it('loads recent days with full day data and summaries', () => {
  addRecord('milk', { time: '2026-09-28 08:00', type: '配方奶', amount: '100' }, 1)
  addRecord('milk', { time: '2026-09-28 12:00', type: '母乳', amount: '' }, 2)
  addRecord('milk', { time: '2026-10-01 09:00', type: '配方奶', amount: '120' }, 3)

  const recent = loadRecentDays(7, new Date(2026, 9, 1))
  expect(recent.map((item) => item.date)).toEqual([
    '2026-09-25',
    '2026-09-26',
    '2026-09-27',
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
  ])

  const sep28 = recent.find((item) => item.date === '2026-09-28')
  expect(sep28.day.milk).toHaveLength(2)
  expect(sep28.summary).toMatchObject({ milkCount: 2, milkAmount: 100 })

  const oct01 = recent.find((item) => item.date === '2026-10-01')
  expect(oct01.summary.milkAmount).toBe(120)
  expect(recent[0].day.milk).toEqual([])
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /d/dev/uniapp-wxapp && npx vitest run tests/baby-records.test.js`

Expected: FAIL，报 `loadRecentDays is not a function`。

- [ ] **Step 3: 实现函数**

在 `src/utils/baby/records.js` 的 `summarizeRecentDay` 之前追加：

```js
export function loadRecentDays(days = 7, now = new Date()) {
  const count = Math.max(1, Math.floor(Number(days) || 0))
  const result = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const dateStr = formatDate(date)
    const day = loadDay(dateStr)
    result.push({ date: dateStr, day, summary: summarizeDay(day) })
  }
  return result
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /d/dev/uniapp-wxapp && npx vitest run tests/baby-records.test.js`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add src/utils/baby/records.js tests/baby-records.test.js
git commit -m "feat: 读取最近七天记录与汇总

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: `RecordList` 支持只读模式

**Files:**
- Modify: `src/package-baby/components/records/RecordList.vue:35`（删除按钮）、`:43-47`（props）

- [ ] **Step 1: 修改 props**

把：

```js
defineProps({
  kind: { type: String, required: true },
  list: { type: Array, default: () => [] },
  emptyText: { type: String, default: '今天还没有记录' },
})
```

改为：

```js
defineProps({
  kind: { type: String, required: true },
  list: { type: Array, default: () => [] },
  emptyText: { type: String, default: '今天还没有记录' },
  readonly: { type: Boolean, default: false },
})
```

- [ ] **Step 2: 隐藏删除按钮**

把：

```html
<text class="record-delete" @click="$emit('remove', item.id)">删除</text>
```

改为：

```html
<text v-if="!readonly" class="record-delete" @click="$emit('remove', item.id)">删除</text>
```

- [ ] **Step 3: 运行现有测试确认未破坏数据层**

Run: `cd /d/dev/uniapp-wxapp && npm test`

Expected: PASS（组件无单测，确认数据层仍全绿）。

- [ ] **Step 4: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add src/package-baby/components/records/RecordList.vue
git commit -m "feat: 记录列表支持只读模式

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 新增 `RecordsHistory.vue`

**Files:**
- Create: `src/package-baby/components/records/RecordsHistory.vue`

- [ ] **Step 1: 创建组件**

写入完整文件：

```vue
<template>
  <view class="card">
    <view class="card-title">{{ heading }}</view>
    <view class="history-list">
      <view v-for="item in rows" :key="item.date" class="history-item">
        <view
          class="history-row"
          :class="{
            expandable: canExpand(item),
            empty: !item.info.hasData,
            open: expandedDate === item.date,
          }"
          @click="toggle(item)"
        >
          <text class="history-date">{{ item.date === today ? '今天' : item.date.slice(5) }}</text>
          <view class="history-text">{{ item.info.text }}</view>
          <text v-if="canExpand(item)" class="history-arrow">
            {{ expandedDate === item.date ? '▴' : '▾' }}
          </text>
        </view>
        <view v-if="canExpand(item) && expandedDate === item.date" class="history-detail">
          <RecordList :kind="kind" :list="sortedList(item)" readonly />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import RecordList from './RecordList.vue'
import { sortRecords, summarizeRecentDay } from '../../../utils/baby/records.js'

const props = defineProps({
  kind: { type: String, required: true },
  days: { type: Array, default: () => [] },
  today: { type: String, default: '' },
})

const HEADINGS = {
  milk: '🍼 最近 7 天奶量',
  sleep: '😴 最近 7 天睡眠',
  diaper: '💧 最近 7 天排便',
  food: '🍚 最近 7 天辅食',
  medicine: '💊 最近 7 天用药',
  supplement: '🌿 最近 7 天补剂',
}

const heading = computed(() => HEADINGS[props.kind] || '最近 7 天')
const expandedDate = ref('')

const rows = computed(() =>
  [...props.days]
    .reverse()
    .map((entry) => ({
      ...entry,
      info: summarizeRecentDay(props.kind, entry.day),
    }))
)

function canExpand(item) {
  return item.info.hasData && item.date !== props.today
}

function toggle(item) {
  if (!canExpand(item)) return
  expandedDate.value = expandedDate.value === item.date ? '' : item.date
}

function sortedList(item) {
  return sortRecords(item.day[props.kind] || [], props.kind)
}

function collapseIfMissing() {
  if (!expandedDate.value) return
  const target = props.days.find((entry) => entry.date === expandedDate.value)
  if (!target || !summarizeRecentDay(props.kind, target.day).hasData) {
    expandedDate.value = ''
  }
}

watch(() => props.days, collapseIfMissing)
watch(() => props.kind, () => {
  expandedDate.value = ''
})
</script>

<style scoped>
.history-list {
  margin-top: 8rpx;
}
.history-item {
  border-bottom: 1rpx solid var(--border);
}
.history-item:last-child {
  border-bottom: none;
}
.history-row {
  display: flex;
  align-items: center;
  min-height: 64rpx;
  padding: 20rpx 0;
}
.history-row.expandable:active {
  opacity: 0.7;
}
.history-date {
  width: 110rpx;
  font-size: 26rpx;
  color: var(--text);
}
.history-text {
  flex: 1;
  overflow: hidden;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--primary-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-row.empty .history-text {
  font-weight: 400;
  color: var(--text-secondary);
}
.history-arrow {
  width: 48rpx;
  text-align: right;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.history-detail {
  padding: 0 0 16rpx 110rpx;
}
</style>
```

- [ ] **Step 2: 确认文件内容与任务一致**

组件此时还没有被任何页面导入，Vite 不会单独编译它。用编辑器打开文件，确认模板、脚本、样式三段完整，没有多余的占位文本。真正的编译验证在 Task 5 导入后进行。

- [ ] **Step 3: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add src/package-baby/components/records/RecordsHistory.vue
git commit -m "feat: 新增最近七天记录历史卡片

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: `RecordPage` 接入历史卡片

**Files:**
- Modify: `src/package-baby/components/records/RecordPage.vue:19-28`（模板）、`:46-58`（import 与 props 附近）、`:76-90`（composable 调用）

- [ ] **Step 1: 模板插入历史卡片**

把：

```html
        <slot name="stats" :summary="summary" :day="day" :list="list" :today="today" />
        <RecordList
          :kind="kind"
          :list="list"
          :empty-text="emptyText"
          @remove="remove"
        />
      </view>

      <slot name="extra" :refresh="refresh" />
```

改为：

```html
        <slot name="stats" :summary="summary" :day="day" :list="list" :today="today" />
        <RecordList
          :kind="kind"
          :list="list"
          :empty-text="emptyText"
          @remove="remove"
        />
      </view>

      <RecordsHistory :kind="kind" :days="recentDays" :today="today" />

      <slot name="extra" :refresh="refresh" />
```

- [ ] **Step 2: 引入组件与数据函数**

把：

```js
import { onMounted } from 'vue'
import BabyPage from '../../../components/baby/BabyPage.vue'
import RecordForm from '../RecordForm.vue'
import RecordList from './RecordList.vue'
import ShareButton from '../../../components/ShareButton.vue'
import { useDayRecords } from '../../composables/useDayRecords.js'
```

改为：

```js
import { onMounted, ref } from 'vue'
import BabyPage from '../../../components/baby/BabyPage.vue'
import RecordForm from '../RecordForm.vue'
import RecordList from './RecordList.vue'
import RecordsHistory from './RecordsHistory.vue'
import ShareButton from '../../../components/ShareButton.vue'
import { useDayRecords } from '../../composables/useDayRecords.js'
import { loadRecentDays } from '../../../utils/baby/records.js'
```

- [ ] **Step 3: 增加历史数据状态并接入刷新**

把：

```js
const {
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
} = useDayRecords(props.kind, { onChange: () => emit('change') })

onMounted(refresh)
```

改为：

```js
const recentDays = ref(loadRecentDays(7))

function refreshRecentDays() {
  recentDays.value = loadRecentDays(7)
}

const {
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
} = useDayRecords(props.kind, {
  onChange: () => {
    emit('change')
    refreshRecentDays()
  },
})

onMounted(refresh)
```

- [ ] **Step 4: 运行测试与构建**

Run: `cd /d/dev/uniapp-wxapp && npm test && npm run build:mp-weixin`

Expected: 测试全部通过，构建成功。

- [ ] **Step 5: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add src/package-baby/components/records/RecordPage.vue
git commit -m "feat: 记录页统一展示最近七天历史

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: 喝奶页只保留趋势图并清理旧样式

**Files:**
- Modify: `src/package-baby/records/milk.vue`（整体替换）
- Modify: `src/App.vue:260-294`、`:300-305`（删除 `.trend-list` 系列与 `.trend-chart-title`）

- [ ] **Step 1: 替换 `milk.vue`**

用以下内容整体覆盖 `src/package-baby/records/milk.vue`：

```vue
<template>
  <RecordPage
    kind="milk"
    emoji="🍼"
    title="喝奶"
    empty-text="今天还没有喝奶记录，点“添加”记一笔吧 🐣"
    @change="refreshMilk"
  >
    <template #stats="{ summary }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ summary.milkCount }}</text>
          <text class="record-stat-label">喝奶次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value">{{ summary.milkAmount }}</text>
          <text class="record-stat-label">总奶量（ml）</text>
        </view>
      </view>
    </template>

    <template #extra>
      <view v-if="showMilkChart" class="card">
        <view class="card-title">🍼 近 7 天奶量趋势</view>
        <view class="trend-chart">
          <LineChart :points="milkChart" unit="ml" :height="320" />
        </view>
      </view>
      <AdBanner />
    </template>
  </RecordPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import LineChart from '../components/LineChart.vue'
import RecordPage from '../components/records/RecordPage.vue'
import { loadRecentMilkSummary, milkChartPoints } from '../../utils/baby/records.js'
import { useBabyShare } from '../../utils/share.js'

useBabyShare('宝宝喝奶记录', '/package-baby/records/milk')

const recentMilk = ref(loadRecentMilkSummary(7))
const milkChart = computed(() => milkChartPoints(recentMilk.value))
const showMilkChart = computed(
  () => recentMilk.value.filter((item) => item.hasMilkAmount).length > 3
)

function refreshMilk() {
  recentMilk.value = loadRecentMilkSummary(7)
}

onShow(refreshMilk)
</script>
```

- [ ] **Step 2: 删除不再使用的全局样式**

在 `src/App.vue` 中删除从 `.trend-list {` 到 `.trend-count { ... }` 的整段（含 `.trend-list`、`.trend-row`、`.trend-row:last-child`、`.trend-date`、`.trend-amount`、`.trend-amount.empty`、`.trend-count`），再删除 `.trend-chart-title { ... }` 整段。保留 `.trend-chart`。

删除后的相邻代码应为：

```css
.record-stat-value.is-text {
  font-size: 26rpx;
  word-break: break-all;
}
.trend-chart {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--border);
}

.disclaimer {
```

- [ ] **Step 3: 构建与测试**

Run: `cd /d/dev/uniapp-wxapp && npm test && npm run build:mp-weixin && npm run build:h5`

Expected: 全部通过，两个目标均构建成功。

- [ ] **Step 4: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add src/package-baby/records/milk.vue src/App.vue
git commit -m "refactor: 喝奶页历史列表改用统一卡片

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: 更新 README 并做完整验证

**Files:**
- Modify: `README.md`（功能列表「日常记录」与「奶量趋势」两行）

- [ ] **Step 1: 更新功能说明**

把：

```markdown
- 日常记录：喝奶、睡眠、排便、辅食、用药、补剂，首页汇总今日喝奶次数、睡眠时长与排便次数
- 奶量趋势：最近 7 天列表，有奶量记录超过 3 天时显示折线图
```

改为：

```markdown
- 日常记录：喝奶、睡眠、排便、辅食、用药、补剂，首页汇总今日喝奶次数、睡眠时长与排便次数
- 历史回看：六类记录页展示最近 7 天汇总，点击有数据的历史行可展开查看当天记录（只读）
- 奶量趋势：喝奶页在最近 7 天汇总下方，有奶量记录超过 3 天时显示折线图
```

- [ ] **Step 2: 运行完整验证**

Run:

```bash
cd /d/dev/uniapp-wxapp
npm test
npm run build:mp-weixin
npm run build:h5
```

Expected: 测试全部通过；两份构建成功，无编译错误。

- [ ] **Step 3: 微信开发者工具人工检查**

按以下清单逐项确认（导入 `dist/dev/mp-weixin` 或重新构建后的 `dist/build/mp-weixin`）：

1. 喝奶页：今日记录卡片下方出现「最近 7 天奶量」；过去有奶量或次数的行显示 `▾`，点击展开当天喝奶记录，再点收起；今天行无箭头；趋势图仍在历史卡片下方。
2. 睡眠页：历史行文案为「X 小时 Y 分钟 · N 次」，展开后显示每条睡眠的起止时间与时长。
3. 排便页：历史行文案为「N 次」，展开后显示时间、类型与颜色。
4. 辅食页：有异常反应时显示「N 次 · 异常 M 次」，展开后显示名称、份量、反应与备注。
5. 补剂页、用药页：历史行显示名称与次数，展开后显示名称、用量与备注；展开区没有「删除」按钮。
6. 「未记录」行置灰且点击无反应。
7. 新增或删除今天的一条记录后，历史卡片第一行汇总立即更新。
8. 只展开一天时，点击另一天会自动收起前一天。
9. 页面切换（侧栏）后展开状态重置，不报错。

- [ ] **Step 4: 提交**

```bash
cd /d/dev/uniapp-wxapp
git add README.md
git commit -m "docs: 补充最近七天历史记录说明

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## 自检结果

- 规格覆盖：数据函数（Task 1、2）、只读列表（Task 3）、历史卡片与展开（Task 4）、页面接入与刷新（Task 5）、喝奶页趋势图与样式清理（Task 6）、文档与验证（Task 7）均有对应任务。
- 占位符：无。
- 类型/命名一致性：`loadRecentDays` 返回 `{ date, day, summary }`，`summarizeRecentDay` 返回 `{ count, hasData, text }`，组件与测试命名一致；`readonly` prop 在 Task 3 定义、Task 4 使用。
