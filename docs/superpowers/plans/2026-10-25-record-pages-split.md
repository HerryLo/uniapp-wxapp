# 日常记录拆分独立页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把喝奶、睡眠、排便、辅食、用药拆成 5 个独立分包页面，共享数据逻辑、列表和表单，并保留侧栏与奶油糖果风。

**Architecture:** `useDayRecords` 负责当天数据与增删状态；`RecordPage` 提供页面壳、侧栏、表单和插槽；`RecordList` 渲染各类型记录；5 个页面只负责专属标题、统计和喝奶页的七日趋势。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vitest，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 数据层、备份、表单校验、字段结构不变。
- 5 个页面都使用 `<BabyPage :active="kind">` 包裹，侧栏高亮 key 不变。
- 旧 `/package-baby/records/index?type=` 直接移除，没有其他引用。
- 广告只保留在喝奶页、宝宝首页、工具页；其他记录页不放广告。
- 沿用奶油糖果风、emoji 标题、胶囊按钮和浅色统计卡。
- 提交仅在用户授权后执行。

---

### Task 1: 共享记录状态 composable

**Files:**
- Create: `src/composables/useDayRecords.js`
- Test: `tests/use-day-records.test.js`

**Interfaces:**
- `useDayRecords(kind, { onChange } = {})` 返回：
  - `today`、`day`、`list`、`summary`
  - `formOpen`、`formError`
  - `refresh()`、`openForm()`、`closeForm()`
  - `submitForm(payload): boolean`
  - `remove(id)`

- [ ] **Step 1: Write the failing test**

Create `tests/use-day-records.test.js`:

```js
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

    records.submitForm({
      start: `${formatDateTime(new Date()).slice(0, 10)} 09:00`,
      end: `${formatDateTime(new Date()).slice(0, 10)} 10:00`,
    })
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/use-day-records.test.js`

Expected: FAIL，`src/composables/useDayRecords.js` 不存在。

- [ ] **Step 3: Implement the composable**

Create `src/composables/useDayRecords.js`:

```js
import { computed, ref } from 'vue'
import {
  addRecord,
  loadDay,
  removeRecord,
  summarizeDay,
  sortRecords,
} from '../utils/baby/records.js'
import { todayKey } from '../utils/baby/date.js'

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/use-day-records.test.js`

Expected: PASS，3 个测试全部通过。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useDayRecords.js tests/use-day-records.test.js
git commit -m "feat: add shared day records composable"
```

---

### Task 2: 共享记录页面组件与全局样式

**Files:**
- Create: `src/components/baby/records/RecordList.vue`
- Create: `src/components/baby/records/RecordPage.vue`
- Modify: `src/App.vue`

**Interfaces:**
- `RecordList` props：`kind`、`list`、`emptyText`；emits：`remove(id)`
- `RecordPage` props：`kind`、`emoji`、`title`、`emptyText`；emits：`change`
- 插槽：`stats`（props: `summary/day/list/today`）、`extra`

- [ ] **Step 1: Add global record styles**

在 `src/App.vue` 的 `.empty-tip` 规则之后加入：

```css
.record-stats {
  display: flex;
  margin-top: 20rpx;
}
.record-stat {
  flex: 1;
  padding: 20rpx 8rpx;
  border-radius: 28rpx;
  text-align: center;
  background: #FFF1F3;
}
.record-stat + .record-stat {
  margin-left: 12rpx;
  background: #F0FAF4;
}
.record-stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--primary-strong);
}
.record-stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}
```

- [ ] **Step 2: Create RecordList**

Create `src/components/baby/records/RecordList.vue`:

```vue
<template>
  <view class="record-list">
    <view v-if="!list.length" class="empty-tip">{{ emptyText }}</view>
    <view v-for="item in list" :key="item.id" class="record-item">
      <view class="record-body">
        <template v-if="kind === 'milk'">
          <view class="record-main">🍼 {{ item.time.slice(11) }} · {{ item.type }}</view>
          <view class="record-sub">
            {{ item.amount == null ? '奶量未记录' : `${item.amount} ml` }}
          </view>
        </template>
        <template v-else-if="kind === 'sleep'">
          <view class="record-main">😴 {{ item.start.slice(11) }} – {{ item.end.slice(11) }}</view>
          <view class="record-sub">
            {{ formatDuration(durationMinutes(item.start, item.end)) }}
          </view>
        </template>
        <template v-else-if="kind === 'diaper'">
          <view class="record-main">💧 {{ item.time.slice(11) }} · {{ item.type }}</view>
          <view class="record-sub">颜色：{{ item.color }}</view>
        </template>
        <template v-else-if="kind === 'food'">
          <view class="record-main">🍚 {{ item.time.slice(11) }} · {{ item.name }}</view>
          <view class="record-sub">{{ foodDetail(item) }}</view>
        </template>
        <template v-else>
          <view class="record-main">💊 {{ item.time.slice(11) }} · {{ item.name }}</view>
          <view class="record-sub">
            {{ [item.amount, item.note].filter(Boolean).join(' · ') || '用量未记录' }}
          </view>
        </template>
      </view>
      <text class="record-delete" @click="$emit('remove', item.id)">删除</text>
    </view>
  </view>
</template>

<script setup>
import { durationMinutes, formatDuration } from '../../../utils/baby/date.js'

defineProps({
  kind: { type: String, required: true },
  list: { type: Array, default: () => [] },
  emptyText: { type: String, default: '今天还没有记录' },
})

defineEmits(['remove'])

function foodDetail(item) {
  const parts = []
  if (item.amount) parts.push(item.amount)
  parts.push(`反应：${item.reaction || '未记录'}`)
  if (item.note) parts.push(item.note)
  return parts.join(' · ')
}
</script>

<style scoped>
.record-list {
  margin-top: 8rpx;
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
</style>
```

- [ ] **Step 3: Create RecordPage**

Create `src/components/baby/records/RecordPage.vue`:

```vue
<template>
  <BabyPage :active="kind">
    <view class="record-page">
      <view class="card">
        <view class="record-head">
          <text class="record-title">{{ emoji }} {{ title }}</text>
          <view class="add-btn" @click="openForm">+ 添加</view>
        </view>
        <slot name="stats" :summary="summary" :day="day" :list="list" :today="today" />
        <RecordList
          :kind="kind"
          :list="list"
          :empty-text="emptyText"
          @remove="remove"
        />
      </view>

      <slot name="extra" :refresh="refresh" />

      <RecordForm
        :visible="formOpen"
        :kind="kind"
        :date="today"
        :error="formError"
        @close="closeForm"
        @submit="submitForm"
      />
    </view>
  </BabyPage>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../baby/BabyPage.vue'
import RecordForm from '../../baby/RecordForm.vue'
import RecordList from './RecordList.vue'
import { useDayRecords } from '../../../composables/useDayRecords.js'

const props = defineProps({
  kind: { type: String, required: true },
  emoji: { type: String, default: '' },
  title: { type: String, required: true },
  emptyText: { type: String, default: '今天还没有记录' },
})

const emit = defineEmits(['change'])

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

onShow(refresh)
</script>

<style scoped>
.record-page {
  padding: 24rpx 32rpx 64rpx;
}
.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.record-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.add-btn {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  color: #FFFFFF;
  font-size: 26rpx;
  box-shadow: 0 6rpx 16rpx rgba(232, 111, 135, 0.22);
}
</style>
```

- [ ] **Step 4: Validate the SFCs**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/components/baby/records/RecordList.vue','src/components/baby/records/RecordPage.vue','src/App.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});if(descriptor.template){const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0]}console.log(file,'OK') }"
```

Expected: 三个文件均打印 `OK`。

- [ ] **Step 5: Commit**

```bash
git add src/App.vue src/components/baby/records/RecordList.vue src/components/baby/records/RecordPage.vue
git commit -m "feat: add shared record page and list components"
```

---

### Task 3: 创建 5 个独立记录页面

**Files:**
- Create: `src/package-baby/records/milk.vue`
- Create: `src/package-baby/records/sleep.vue`
- Create: `src/package-baby/records/diaper.vue`
- Create: `src/package-baby/records/food.vue`
- Create: `src/package-baby/records/medicine.vue`
- Delete: `src/package-baby/records/index.vue`

**Interfaces:**
- 每个页面使用 `RecordPage`，`kind` 分别为 milk/sleep/diaper/food/medicine

- [ ] **Step 1: Create the milk page**

Create `src/package-baby/records/milk.vue`:

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
      <view class="card">
        <view class="card-title">🍼 最近 7 天奶量</view>
        <view class="trend-list">
          <view v-for="item in recentMilkList" :key="item.date" class="trend-row">
            <text class="trend-date">{{ item.date === today ? '今天' : item.date.slice(5) }}</text>
            <text class="trend-amount" :class="{ empty: !item.hasMilkAmount }">
              {{ item.hasMilkAmount ? `${item.milkAmount} ml` : '未记录' }}
            </text>
            <text class="trend-count">{{ item.milkCount }} 次</text>
          </view>
        </view>
        <view v-if="showMilkChart" class="trend-chart">
          <text class="trend-chart-title">🍼 近 7 天奶量趋势</text>
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
import LineChart from '../../components/baby/LineChart.vue'
import RecordPage from '../../components/baby/records/RecordPage.vue'
import { todayKey } from '../../utils/baby/date.js'
import { loadRecentMilkSummary, milkChartPoints } from '../../utils/baby/records.js'

const today = ref(todayKey())
const recentMilk = ref(loadRecentMilkSummary(7))
const recentMilkList = computed(() => [...recentMilk.value].reverse())
const milkChart = computed(() => milkChartPoints(recentMilk.value))
const showMilkChart = computed(
  () => recentMilk.value.filter((item) => item.hasMilkAmount).length > 3
)

function refreshMilk() {
  today.value = todayKey()
  recentMilk.value = loadRecentMilkSummary(7)
}

onShow(refreshMilk)
</script>

<style scoped>
.trend-list {
  margin-top: 8rpx;
}
.trend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.trend-row:last-child {
  border-bottom: none;
}
.trend-date {
  flex: 1;
  font-size: 26rpx;
  color: var(--text);
}
.trend-amount {
  width: 180rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--primary-strong);
}
.trend-amount.empty {
  font-weight: 400;
  color: var(--text-secondary);
}
.trend-count {
  width: 100rpx;
  text-align: right;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.trend-chart {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--border);
}
.trend-chart-title {
  display: block;
  margin-bottom: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text);
}
</style>
```

- [ ] **Step 2: Create the sleep page**

Create `src/package-baby/records/sleep.vue`:

```vue
<template>
  <RecordPage
    kind="sleep"
    emoji="😴"
    title="睡眠"
    empty-text="今天还没有睡眠记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ summary, list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">睡眠次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value time">{{ formatDuration(summary.sleepMinutes) }}</text>
          <text class="record-stat-label">总时长</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'
import { formatDuration } from '../../utils/baby/date.js'
</script>

<style scoped>
.record-stat-value.time {
  font-size: 26rpx;
}
</style>
```

- [ ] **Step 3: Create the diaper page**

Create `src/package-baby/records/diaper.vue`:

```vue
<template>
  <RecordPage
    kind="diaper"
    emoji="💧"
    title="排便"
    empty-text="今天还没有排便记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">排便次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value text">{{ latestText(list) }}</text>
          <text class="record-stat-label">最近一次</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'

function latestText(list) {
  if (!list.length) return '暂无'
  return `${list[0].type} · ${list[0].color}`
}
</script>

<style scoped>
.record-stat-value.text {
  font-size: 26rpx;
}
</style>
```

- [ ] **Step 4: Create the food page**

Create `src/package-baby/records/food.vue`:

```vue
<template>
  <RecordPage
    kind="food"
    emoji="🍚"
    title="辅食"
    empty-text="今天还没有辅食记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">辅食次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value">{{ abnormalCount(list) }}</text>
          <text class="record-stat-label">异常反应</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'

function abnormalCount(list) {
  return list.filter((item) => item.reaction === '异常').length
}
</script>
```

- [ ] **Step 5: Create the medicine page**

Create `src/package-baby/records/medicine.vue`:

```vue
<template>
  <RecordPage
    kind="medicine"
    emoji="💊"
    title="用药"
    empty-text="今天还没有用药记录，点“添加”记一笔吧 🐣"
  >
    <template #stats="{ list }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ list.length }}</text>
          <text class="record-stat-label">用药次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value text">{{ latestName(list) }}</text>
          <text class="record-stat-label">最近药品</text>
        </view>
      </view>
    </template>
  </RecordPage>
</template>

<script setup>
import RecordPage from '../../components/baby/records/RecordPage.vue'

function latestName(list) {
  return list.length ? list[0].name : '暂无'
}
</script>

<style scoped>
.record-stat-value.text {
  font-size: 26rpx;
}
</style>
```

- [ ] **Step 6: Delete the old page**

```bash
rm src/package-baby/records/index.vue
```

- [ ] **Step 7: Validate and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/package-baby/records/milk.vue','src/package-baby/records/sleep.vue','src/package-baby/records/diaper.vue','src/package-baby/records/food.vue','src/package-baby/records/medicine.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
npm run build:mp-weixin
```

Expected: 5 个文件打印 `OK`；构建成功。

- [ ] **Step 8: Commit**

```bash
git add src/package-baby/records
git commit -m "feat: split daily records into five pages"
```

---

### Task 4: 更新页面注册与侧栏路径

**Files:**
- Modify: `src/pages.json`
- Modify: `src/utils/baby/sidebar.js`
- Modify: `tests/baby-sidebar.test.js`

- [ ] **Step 1: Replace the records page registration**

在 `src/pages.json` 的 `package-baby` 分包中，把：

```json
        {
          "path": "records/index",
          "style": {
            "navigationBarTitleText": "日常记录"
          }
        },
```

替换为：

```json
        {
          "path": "records/milk",
          "style": {
            "navigationBarTitleText": "喝奶记录"
          }
        },
        {
          "path": "records/sleep",
          "style": {
            "navigationBarTitleText": "睡眠记录"
          }
        },
        {
          "path": "records/diaper",
          "style": {
            "navigationBarTitleText": "排便记录"
          }
        },
        {
          "path": "records/food",
          "style": {
            "navigationBarTitleText": "辅食记录"
          }
        },
        {
          "path": "records/medicine",
          "style": {
            "navigationBarTitleText": "用药记录"
          }
        },
```

- [ ] **Step 2: Update sidebar URLs**

在 `src/utils/baby/sidebar.js` 中把 5 个日常记录入口改为：

```js
  { key: 'milk', label: '喝奶', url: '/package-baby/records/milk' },
  { key: 'sleep', label: '睡眠', url: '/package-baby/records/sleep' },
  { key: 'diaper', label: '排便', url: '/package-baby/records/diaper' },
  { key: 'food', label: '辅食', url: '/package-baby/records/food' },
  { key: 'medicine', label: '用药', url: '/package-baby/records/medicine' },
```

- [ ] **Step 3: Update sidebar tests**

在 `tests/baby-sidebar.test.js` 中把 URL 断言改为：

```js
    expect(SIDEBAR_ITEMS[1].url).toBe('/package-baby/records/milk')
    expect(SIDEBAR_ITEMS[4].url).toBe('/package-baby/records/food')
    expect(SIDEBAR_ITEMS[5].url).toBe('/package-baby/records/medicine')
    expect(SIDEBAR_ITEMS[6].url).toBe('/package-baby/health/index')
    expect(SIDEBAR_ITEMS[9].url).toBe('/package-baby/mom/index')
    expect(SIDEBAR_ITEMS[10].url).toBe('/package-baby/travel/index')
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
npx vitest run tests/baby-sidebar.test.js tests/use-day-records.test.js
npm run build:mp-weixin
```

Expected: 测试全部通过；构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/pages.json src/utils/baby/sidebar.js tests/baby-sidebar.test.js
git commit -m "feat: route sidebar to split record pages"
```

---

### Task 5: 整体验证

**Files:**
- 无新增代码；如发现问题，修复后补测试并提交。

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: 全部测试通过。

- [ ] **Step 2: Build both targets**

Run:

```bash
rm -rf dist/build/mp-weixin dist/build/h5
npm run build:mp-weixin
npm run build:h5
```

Expected: 两个构建均成功。

- [ ] **Step 3: Verify compiled structure**

Run:

```bash
node -e "const app=require('./dist/build/mp-weixin/app.json');const sub=(app.subPackages||app.subpackages||[]).find(s=>s.root==='package-baby');console.log(JSON.stringify(sub.pages))"
```

Expected:

```json
["records/milk","records/sleep","records/diaper","records/food","records/medicine","growth/index","health/index","journal/index","mom/index","travel/index","settings/index"]
```

- [ ] **Step 4: Manual check in devtools**

导入 `dist/build/mp-weixin`，确认：

- 侧栏 5 个记录入口分别打开独立页面，当前页高亮正确。
- 5 个页面新增、删除、表单校验、空状态正常。
- 喝奶页统计、七日列表、趋势图随新增/删除刷新。
- 睡眠页总时长、排便最近一次、辅食异常次数、用药最近药品显示正确。
- 喝奶页保留广告；其他记录页没有广告。
- 侧栏 12 项在矮屏可滚动，展开/收起和悬浮图标正常。
- 宝宝首页、工具页、其他分包页不受影响。

- [ ] **Step 5: Review the working tree**

Run: `git status --short`

Expected: 只有本次有意修改；`dist/` 保持忽略。不要自行提交或推送，除非用户明确授权。

---

## Self-Review Notes

- **Spec coverage:** 共享 composable（Task 1）、共享页面/列表与全局样式（Task 2）、5 个页面（Task 3）、路由与侧栏（Task 4）、整体验证（Task 5）覆盖设计稿。
- **Placeholder scan:** 所有页面和组件均提供完整代码，无 TODO 或占位实现。
- **Type consistency:** `useDayRecords` 返回字段与 `RecordPage` 使用一致；`RecordList` 的 `remove` 事件与 `RecordPage` 绑定一致；侧栏 key 与页面 `kind` 一致。
