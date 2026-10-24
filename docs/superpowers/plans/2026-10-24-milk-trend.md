# 喝奶七日汇总与趋势图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在喝奶记录中增加今日总量、最近 7 天奶量列表，并在有奶量数值的天数超过 3 天时展示趋势图，同时优化图表坐标轴标签间距。

**Architecture:** 数据计算放进 `src/utils/baby/records.js` 的纯函数并补单元测试；页面只负责展示与刷新；`LineChart` 增加 X 轴标签抽稀和 Y 轴刻度自适应，绘图逻辑不引入新依赖。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vitest，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 日期使用本地时间，禁止 `toISOString()` 取日期。
- 统计只累加有数值的奶量；未填奶量的记录计入次数、不计入总量。
- 曲线图只画 `hasMilkAmount` 为 true 的日期，不补 0。
- 有奶量数值的天数 ≥ 4 时才显示曲线图。
- 不改存储结构、不加依赖；睡眠、排便 Tab 不受影响。
- 提交仅在用户授权后执行。

---

### Task 1: 最近七日奶量汇总与图表数据

**Files:**
- Modify: `src/utils/baby/records.js`
- Test: `tests/baby-records.test.js`

**Interfaces:**
- Consumes: `loadDay`, `summarizeDay`, `formatDate`
- Produces:
  - `loadRecentMilkSummary(days?: number, now?: Date): Array<{ date: string, milkCount: number, milkAmount: number, hasMilkAmount: boolean }>`（按日期升序）
  - `milkChartPoints(summary: Array): Array<{ date: string, value: number }>`（只保留有奶量数值的日期）

- [ ] **Step 1: Write the failing tests**

在 `tests/baby-records.test.js` 顶部 import 中加入两个函数：

```js
import {
  addRecord,
  loadDay,
  loadRecentMilkSummary,
  milkChartPoints,
  removeRecord,
  summarizeDay,
  sortRecords,
  validateMilk,
  validateSleep,
  validateDiaper,
} from '../src/utils/baby/records.js'
```

在 `describe('baby records', () => { ... })` 内部、最后一个 `it` 之后追加：

```js
  it('summarizes the recent seven days across month boundaries', () => {
    addRecord('milk', { time: '2026-09-28 08:00', type: '配方奶', amount: '100' }, 1)
    addRecord('milk', { time: '2026-09-28 12:00', type: '母乳', amount: '' }, 2)
    addRecord('milk', { time: '2026-10-01 09:00', type: '配方奶', amount: '120' }, 3)

    const summary = loadRecentMilkSummary(7, new Date(2026, 9, 1))
    expect(summary).toHaveLength(7)
    expect(summary.map((item) => item.date)).toEqual([
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ])
    expect(summary.find((item) => item.date === '2026-09-28')).toMatchObject({
      milkCount: 2,
      milkAmount: 100,
      hasMilkAmount: true,
    })
    expect(summary.find((item) => item.date === '2026-10-01')).toMatchObject({
      milkCount: 1,
      milkAmount: 120,
      hasMilkAmount: true,
    })
    expect(milkChartPoints(summary)).toEqual([
      { date: '2026-09-28', value: 100 },
      { date: '2026-10-01', value: 120 },
    ])
  })

  it('marks days without recorded amounts and filters chart points', () => {
    addRecord('milk', { time: '2026-10-01 08:00', type: '母乳', amount: '' }, 1)

    const summary = loadRecentMilkSummary(7, new Date(2026, 9, 1))
    expect(summary.find((item) => item.date === '2026-10-01')).toMatchObject({
      milkCount: 1,
      milkAmount: 0,
      hasMilkAmount: false,
    })
    expect(milkChartPoints(summary)).toEqual([])
  })

  it('returns an empty seven-day window when there is no data', () => {
    const summary = loadRecentMilkSummary(7, new Date(2026, 9, 1))
    expect(summary).toHaveLength(7)
    expect(
      summary.every(
        (item) => item.milkCount === 0 && item.milkAmount === 0 && !item.hasMilkAmount
      )
    ).toBe(true)
    expect(milkChartPoints(summary)).toEqual([])
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/baby-records.test.js`

Expected: FAIL，提示 `loadRecentMilkSummary is not a function`（或同类导入错误）。

- [ ] **Step 3: Implement the summary functions**

在 `src/utils/baby/records.js` 中：

1. 把 import 改为：

```js
import { readStorage, writeStorage } from '../storage.js'
import { recordsKey } from './keys.js'
import { durationMinutes, formatDate, monthKey, parseLocalDateTime } from './date.js'
```

2. 在文件末尾追加：

```js
export function loadRecentMilkSummary(days = 7, now = new Date()) {
  const count = Math.max(1, Math.floor(Number(days) || 0))
  const result = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const dateStr = formatDate(date)
    const day = loadDay(dateStr)
    const summary = summarizeDay(day)
    result.push({
      date: dateStr,
      milkCount: summary.milkCount,
      milkAmount: summary.milkAmount,
      hasMilkAmount: day.milk.some(
        (item) => typeof item.amount === 'number' && Number.isFinite(item.amount)
      ),
    })
  }
  return result
}

export function milkChartPoints(summary) {
  if (!Array.isArray(summary)) return []
  return summary
    .filter((item) => item && item.hasMilkAmount)
    .map((item) => ({ date: item.date, value: item.milkAmount }))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/baby-records.test.js`

Expected: PASS，原有 5 个测试加新增 3 个测试全部通过。

- [ ] **Step 5: Commit**

```bash
git add src/utils/baby/records.js tests/baby-records.test.js
git commit -m "feat: add seven-day milk summary helpers"
```

---

### Task 2: 喝奶页今日汇总与七日列表/趋势图

**Files:**
- Modify: `src/package-baby/records/index.vue`

**Interfaces:**
- Consumes: `loadRecentMilkSummary`, `milkChartPoints`（Task 1）、`LineChart` 组件
- Produces: 无新增导出

- [ ] **Step 1: Update the template**

把 `src/package-baby/records/index.vue` 中 `.list-card` 的标题行替换为：

```vue
      <view class="list-head">
        <view class="list-heading">
          <text class="list-title">今天 · {{ currentLabel }}</text>
          <text v-if="todayMilkText" class="list-summary">{{ todayMilkText }}</text>
        </view>
        <view class="add-btn" @click="openForm">+ 添加</view>
      </view>
```

在今日列表卡片 `</view>` 之后、`<Disclaimer ... />` 之前插入：

```vue
    <view v-if="kind === 'milk'" class="card trend-card">
      <text class="list-title">最近 7 天奶量</text>
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
        <text class="trend-chart-title">近 7 天奶量趋势</text>
        <LineChart :points="milkChart" unit="ml" :height="320" />
      </view>
    </view>
```

- [ ] **Step 2: Update the script**

在 import 区加入 LineChart：

```js
import LineChart from '../../components/baby/LineChart.vue'
```

把 records 工具函数的 import 改为：

```js
import {
  addRecord,
  loadDay,
  loadRecentMilkSummary,
  milkChartPoints,
  removeRecord,
  summarizeDay,
  sortRecords,
} from '../../utils/baby/records.js'
```

在 `currentLabel` 计算属性之后加入：

```js
const recentMilk = ref(loadRecentMilkSummary(7))

const recentMilkList = computed(() => [...recentMilk.value].reverse())
const milkChart = computed(() => milkChartPoints(recentMilk.value))
const showMilkChart = computed(
  () => recentMilk.value.filter((item) => item.hasMilkAmount).length > 3
)
const todayMilkText = computed(() => {
  if (kind.value !== 'milk' || !summary.value.milkCount) return ''
  const hasAmount = day.value.milk.some(
    (item) => typeof item.amount === 'number' && Number.isFinite(item.amount)
  )
  return hasAmount
    ? `共 ${summary.value.milkAmount} ml · ${summary.value.milkCount} 次`
    : `奶量未记录 · ${summary.value.milkCount} 次`
})
```

把 `refresh` 改为：

```js
function refresh() {
  today.value = todayKey()
  day.value = loadDay(today.value)
  recentMilk.value = loadRecentMilkSummary(7)
}
```

- [ ] **Step 3: Add the styles**

在 `<style scoped>` 中 `.list-card` 规则之后加入：

```css
.list-heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  flex: 1;
}
.list-summary {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
```

在 `.empty-tip` 规则之前加入：

```css
.trend-card {
  margin-top: 24rpx;
}
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
```

- [ ] **Step 4: Validate the SFC and run tests**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/package-baby/records/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
npx vitest run tests/baby-records.test.js
```

Expected: SFC 打印 `OK`；测试全部通过。

- [ ] **Step 5: Build**

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`

- [ ] **Step 6: Manual check in devtools**

导入 `dist/build/mp-weixin`，打开「宝宝 → 日常记录 → 喝奶」确认：

- 今日标题旁显示「共 X ml · N 次」；未填奶量时显示「奶量未记录 · N 次」。
- 最近 7 天卡片固定 7 行，最新一天在上，未记录显示「未记录」。
- 有奶量数值的天数 ≤ 3 时不显示图表；≥ 4 时出现趋势图且只画有数值的日期。
- 切换到睡眠、排便 Tab 时七日卡片隐藏。
- 添加或删除喝奶记录后，汇总和图表同步刷新。

- [ ] **Step 7: Commit**

```bash
git add src/package-baby/records/index.vue
git commit -m "feat: show seven-day milk summary and trend chart"
```

---

### Task 3: 图表坐标轴标签自适应

**Files:**
- Modify: `src/components/baby/LineChart.vue`

**Interfaces:**
- Consumes: 现有 `points`、`unit`、`color`、`height` props
- Produces: 新增 prop `maxXLabels: number`（默认 4）

- [ ] **Step 1: Add the prop**

把 props 定义改为：

```js
const props = defineProps({
  points: { type: Array, default: () => [] },
  unit: { type: String, default: '' },
  color: { type: String, default: '#E86F87' },
  height: { type: Number, default: 360 },
  maxXLabels: { type: Number, default: 4 },
})
```

- [ ] **Step 2: Make Y-axis ticks adapt to height**

把原来的固定 4 刻度循环：

```js
  for (let i = 0; i <= 3; i += 1) {
    const value = min + ((max - min) * i) / 3
    const y = yOf(value)
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillText(`${Number(value.toFixed(1))}${props.unit}`, pad.left - 6, y)
  }
```

替换为：

```js
  const yTickCount = Math.max(2, Math.min(4, Math.floor(innerH / 28)))
  for (let i = 0; i < yTickCount; i += 1) {
    const value = min + ((max - min) * i) / (yTickCount - 1)
    const y = yOf(value)
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillText(`${Number(value.toFixed(1))}${props.unit}`, pad.left - 6, y)
  }
```

- [ ] **Step 3: Thin out X-axis labels**

把原来的首尾日期标签绘制：

```js
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
```

替换为：

```js
  ctx.fillStyle = '#888888'
  ctx.font = '10px sans-serif'
  ctx.textBaseline = 'top'

  const maxLabels = Math.max(1, Math.floor(Number(props.maxXLabels) || 4))
  const fitByWidth = Math.max(1, Math.floor(innerW / 48))
  const labelCount = Math.min(maxLabels, fitByWidth, points.length)
  const labelIndices = []
  if (labelCount === 1) {
    labelIndices.push(points.length - 1)
  } else {
    for (let i = 0; i < labelCount; i += 1) {
      labelIndices.push(Math.round((i * (points.length - 1)) / (labelCount - 1)))
    }
  }
  const uniqueIndices = [...new Set(labelIndices)]
  uniqueIndices.forEach((index) => {
    const x = xOf(times[index])
    if (uniqueIndices.length === 1) ctx.textAlign = 'center'
    else if (index === 0) ctx.textAlign = 'left'
    else if (index === points.length - 1) ctx.textAlign = 'right'
    else ctx.textAlign = 'center'
    ctx.fillText(points[index].date.slice(5), x, height - pad.bottom + 8)
  })
```

- [ ] **Step 4: Validate the SFC and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/components/baby/LineChart.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
npm run build:mp-weixin
```

Expected: SFC 打印 `OK`；构建输出 `DONE Build complete.`

- [ ] **Step 5: Manual chart check**

在开发者工具中确认：

- 7 天趋势图 X 轴最多 4 个日期标签，标签之间不重叠。
- 图表高度为 320rpx 时 Y 轴刻度不超过 4 个，纵向不重叠。
- 生长曲线页的图表仍正常渲染。

- [ ] **Step 6: Run the full test suite**

Run: `npm test`

Expected: 13 个测试文件、75 个测试全部通过（Task 1 新增 3 个）。

- [ ] **Step 7: Commit**

```bash
git add src/components/baby/LineChart.vue
git commit -m "fix: space chart axis labels adaptively"
```

---

## Self-Review Notes

- **Spec coverage:** 今日汇总（Task 2）、七日列表（Task 2）、>3 天显示图表（Task 2）、只画有数值日期（Task 1/2）、坐标轴间距（Task 3）、跨月与容错（Task 1）、测试（Task 1）均有对应步骤。
- **Placeholder scan:** 无 TBD/TODO，所有代码与命令完整。
- **Type consistency:** `loadRecentMilkSummary` 返回字段 `date/milkCount/milkAmount/hasMilkAmount` 与页面使用一致；`milkChartPoints` 返回 `{ date, value }` 与 `LineChart` 的 `points` 格式一致；`maxXLabels` 在 props 与绘制逻辑中同名。
