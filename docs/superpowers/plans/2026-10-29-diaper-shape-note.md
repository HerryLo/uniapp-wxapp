# 排便记录形状与备注实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 排便记录增加「形状」与「备注」字段，大便时可选五档形状，任何类型都可备注，并在表单、列表、统计中展示。

**Architecture:** 数据层在 `records.js` 增加 `DIAPER_SHAPES` 常量、校验与写入逻辑；表单在 `RecordForm.vue` 的排便分支按类型条件渲染形状 chip 与备注框；展示层在 `RecordList.vue` 拼副行、在 `diaper.vue` 的「最近一次」拼接形状。旧记录缺字段时按空值处理，存储与备份格式不变。

**Tech Stack:** uni-app + Vue 3 + Vite、Vitest（node 环境，无 jsdom）、微信小程序 / H5 双端构建。

---

**执行前须知：**

- 所有命令在 `D:\dev\uniapp-wxapp` 下执行。
- 当前分支为 `feat/share-and-search`，按要求继续在此分支提交。
- 工作区有一个未跟踪修改 ` M .gitignore`，**不要** `git add .`，每个任务只显式添加本任务涉及的文件。
- 若本机正在运行 `npm run dev:h5` 或 `npm run dev:mp-weixin` 监听进程，先停止再执行构建命令，避免与手动构建互相覆盖 `dist`。

### Task 1: 数据层——形状常量、校验与写入

**Files:**
- Modify: `src/utils/baby/records.js:15-18`（常量）、`:111-116`（`validateDiaper`）、`:204-210`（`makeRecord` 排便分支）
- Test: `tests/baby-records.test.js:47`、`:79`、`:330`（更新现有用例）、文件末尾（新增用例）

- [ ] **Step 1: 更新现有用例并写新的失败测试**

先改三处现有用例，让它们在新的必填形状规则下仍然合法：

`tests/baby-records.test.js:47`，把

```js
expect(validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常' })).toBe('')
```

改为

```js
expect(
  validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常', shape: '糊状' })
).toBe('')
```

`tests/baby-records.test.js:79`，把

```js
const added = addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '绿色' }, 1)
```

改为

```js
const added = addRecord(
  'diaper',
  { time: '2026-10-24 09:00', type: '大便', color: '绿色', shape: '糊状' },
  1
)
```

`tests/baby-records.test.js:330`，把

```js
addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '正常' }, 4)
```

改为

```js
addRecord('diaper', { time: '2026-10-24 09:00', type: '大便', color: '正常', shape: '糊状' }, 4)
```

然后在文件末尾的 `describe('baby records', () => { ... })` 内、最后一个 `it(...)` 之后追加三个新用例：

```js
  it('validates diaper shape and note', () => {
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '小便', color: '正常', shape: '水样' })
    ).toBe('')
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常', shape: '糊状' })
    ).toBe('')
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常' })
    ).toBe('请选择排便形状')
    expect(
      validateDiaper({ time: '2026-10-24 08:00', type: '大便', color: '正常', shape: '很干' })
    ).toBe('请选择排便形状')
    expect(
      validateDiaper({
        time: '2026-10-24 08:00',
        type: '大便',
        color: '正常',
        shape: '糊状',
        note: 'x'.repeat(201),
      })
    ).toBe('备注最多 200 个字')
  })

  it('stores diaper shape and note, ignoring shape for urine', () => {
    const stool = addRecord(
      'diaper',
      {
        time: '2026-10-24 09:00',
        type: '大便',
        color: '正常',
        shape: '成形',
        note: '  有点干  ',
      },
      1
    )
    expect(stool.ok).toBe(true)
    expect(stool.record).toMatchObject({ shape: '成形', note: '有点干' })

    const urine = addRecord(
      'diaper',
      { time: '2026-10-24 10:00', type: '小便', color: '正常', shape: '水样', note: '' },
      2
    )
    expect(urine.ok).toBe(true)
    expect(urine.record.shape).toBe('')
    expect(urine.record.note).toBe('')
  })

  it('loads legacy diaper records without shape or note', () => {
    store[recordsKey('2026-10')] = JSON.stringify({
      '2026-10-24': {
        diaper: [
          { id: 'old-1', time: '2026-10-24 09:00', type: '大便', color: '正常', createdAt: 1 },
        ],
      },
    })
    const day = loadDay('2026-10-24')
    expect(day.diaper).toHaveLength(1)
    expect(summarizeRecentDay('diaper', day).text).toBe('1 次')
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/baby-records.test.js`

Expected: 新增用例失败，关键报错包括
`AssertionError: expected '' to be '请选择排便形状'`
以及 `stores diaper shape and note...` 中 `expected undefined to be '成形'`。其余既有用例通过。

- [ ] **Step 3: 实现常量和校验**

在 `src/utils/baby/records.js` 第 19 行 `export const FOOD_REACTIONS = ...` 之前新增：

```js
export const DIAPER_SHAPES = ['水样', '偏稀', '糊状', '成形', '偏干']
```

把 `validateDiaper` 改为：

```js
export function validateDiaper(input) {
  if (!parseLocalDateTime(input.time)) return '请选择排便时间'
  if (!DIAPER_TYPES.includes(input.type)) return '请选择排便类型'
  if (!DIAPER_COLORS.includes(input.color)) return '请选择颜色'
  if (input.type !== '小便' && !DIAPER_SHAPES.includes(input.shape)) {
    return '请选择排便形状'
  }
  return optionalTextError(input.note, '备注', 200)
}
```

- [ ] **Step 4: 实现写入**

把 `makeRecord` 末尾的排便返回值改为：

```js
  return {
    id: makeId(now),
    time: input.time,
    type: input.type,
    color: input.color,
    shape: input.type === '小便' ? '' : input.shape,
    note: String(input.note || '').trim(),
    createdAt: now,
  }
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run tests/baby-records.test.js`

Expected: 全部通过（PASS，无失败）。

- [ ] **Step 6: 提交**

```bash
git add src/utils/baby/records.js tests/baby-records.test.js
git commit -m "feat: 排便记录支持形状与备注字段

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

### Task 2: 表单——形状选项与备注输入

**Files:**
- Modify: `src/package-baby/components/RecordForm.vue:186`（导入）、`:209-217`（状态）、`:143-173`（排便模板分支）、`:240-241`（`reset`）、`:309-313`（`submit`）

- [ ] **Step 1: 导入常量**

把

```js
import { FOOD_REACTIONS } from '../../utils/baby/records.js'
```

改为

```js
import { DIAPER_SHAPES, FOOD_REACTIONS } from '../../utils/baby/records.js'
```

- [ ] **Step 2: 增加状态**

在 `const diaperColor = ref('正常')` 之后新增：

```js
const diaperShape = ref('糊状')
const diaperNote = ref('')
```

- [ ] **Step 3: 复位状态**

在 `reset()` 的 `diaperColor.value = '正常'` 之后新增：

```js
  diaperShape.value = '糊状'
  diaperNote.value = ''
```

- [ ] **Step 4: 模板增加形状与备注**

在排便分支（`<template v-else>`）中，颜色 `</view>`（颜色 chip 行结束）之后、`</template>` 之前插入：

```html
        <template v-if="diaperType !== '小便'">
          <view class="form-label">形状</view>
          <view class="chip-row">
            <view
              v-for="item in DIAPER_SHAPES"
              :key="item"
              class="chip"
              :class="{ active: diaperShape === item }"
              @click="diaperShape = item"
            >{{ item }}</view>
          </view>
        </template>
        <view class="form-label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="diaperNote"
          maxlength="200"
          placeholder="记录排便情况"
        />
```

- [ ] **Step 5: 提交时带上字段**

把 `submit()` 末尾的排便提交改为：

```js
  emit('submit', {
    time: `${date.value} ${time.value}`,
    type: diaperType.value,
    color: diaperColor.value,
    shape: diaperType.value === '小便' ? '' : diaperShape.value,
    note: diaperNote.value,
  })
```

- [ ] **Step 6: 构建验证模板与脚本可编译**

Run: `npm run build:h5`

Expected: 构建成功，输出 `DONE  Build complete`，无 Vue 模板或 script 报错。

- [ ] **Step 7: 提交**

```bash
git add src/package-baby/components/RecordForm.vue
git commit -m "feat: 排便表单增加形状与备注输入

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

### Task 3: 列表与最近一次展示

**Files:**
- Modify: `src/package-baby/components/records/RecordList.vue:18-21`（排便分支）、`:52-58`（新增 `diaperDetail`）
- Modify: `src/package-baby/records/diaper.vue:29-32`（`latestText`）

- [ ] **Step 1: 列表副行拼接形状与备注**

把 `RecordList.vue` 中的

```html
        <template v-else-if="kind === 'diaper'">
          <view class="record-main">💧 {{ item.time.slice(11) }} · {{ item.type }}</view>
          <view class="record-sub">颜色：{{ item.color }}</view>
        </template>
```

改为

```html
        <template v-else-if="kind === 'diaper'">
          <view class="record-main">💧 {{ item.time.slice(11) }} · {{ item.type }}</view>
          <view class="record-sub">{{ diaperDetail(item) }}</view>
        </template>
```

并在 `foodDetail` 函数之后新增：

```js
function diaperDetail(item) {
  const parts = [`颜色：${item.color}`]
  if (item.shape) parts.push(`形状：${item.shape}`)
  if (item.note) parts.push(item.note)
  return parts.join(' · ')
}
```

- [ ] **Step 2: 「最近一次」拼接形状**

把 `diaper.vue` 中的

```js
function latestText(list) {
  if (!list.length) return '暂无'
  return `${list[0].type} · ${list[0].color}`
}
```

改为

```js
function latestText(list) {
  if (!list.length) return '暂无'
  const { type, color, shape } = list[0]
  return [type, color, shape].filter(Boolean).join(' · ')
}
```

- [ ] **Step 3: 构建验证**

Run: `npm run build:mp-weixin`

Expected: 构建成功，输出 `DONE  Build complete (mp-weixin)`，无报错。

- [ ] **Step 4: 提交**

```bash
git add src/package-baby/components/records/RecordList.vue src/package-baby/records/diaper.vue
git commit -m "feat: 排便记录展示形状与备注

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

### Task 4: 文档与整体验收

**Files:**
- Modify: `README.md:11`

- [ ] **Step 1: 更新功能说明**

把

```markdown
- 日常记录：喝奶、睡眠、排便、辅食、用药、补剂，首页汇总今日喝奶次数、睡眠时长与排便次数
```

改为

```markdown
- 日常记录：喝奶、睡眠、排便、辅食、用药、补剂；排便记录类型、颜色、形状与备注，首页汇总今日喝奶次数、睡眠时长与排便次数
```

- [ ] **Step 2: 运行完整测试**

Run: `npm test`

Expected: 全部测试文件通过（23 个文件，200+ 用例，无失败）。新增用例后总数应比原来的 199 条多 3 条。

- [ ] **Step 3: 双端构建**

Run: `npm run build:mp-weixin && npm run build:h5`

Expected: 两条构建均输出 `DONE  Build complete`，无报错。

- [ ] **Step 4: 提交**

```bash
git add README.md
git commit -m "docs: 补充排便形状与备注说明

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Step 5: 微信开发者工具人工验收**

在开发者工具中打开 `dist/dev/mp-weixin`（或重新导入构建产物），逐项检查：

1. 排便页「添加」→ 默认类型「小便」时看不到形状选项，有备注框。
2. 切到「大便」或「都有」→ 出现形状 chip，默认「糊状」。
3. 选「成形」并输入备注 → 保存后列表副行显示 `颜色：正常 · 形状：成形 · 备注文字`。
4. 小便记录保存后副行只有 `颜色：正常`，不出现形状。
5. 排便页「最近一次」在大便时显示 `大便 · 正常 · 成形`，小便时保持 `小便 · 正常`。
6. 最近 7 天历史中展开一条大便记录，只读列表同样显示形状与备注，且没有删除按钮。
7. 备注输入 200 字以上会被 `maxlength` 截断。
8. 从「我的 - 数据管理」导出再恢复，形状与备注仍在。

---

## 自查记录

- 规格覆盖：数据字段与校验 → Task 1；表单 → Task 2；列表与最近一次 → Task 3；历史卡片复用 `RecordList` 无需改动；README → Task 4。
- 现有用例影响：`tests/baby-records.test.js:47`、`:79`、`:330` 三条大便用例已纳入 Task 1 Step 1 同步更新。
- 命名一致：字段统一为 `shape`、`note`，常量统一为 `DIAPER_SHAPES`，展示函数为 `diaperDetail`，各任务前后一致。
