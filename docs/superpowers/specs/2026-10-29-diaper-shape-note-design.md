# 排便记录增加形状与备注设计

日期：2026-10-29
范围：`src/utils/baby/records.js`、`src/package-baby/components/RecordForm.vue`、`src/package-baby/components/records/RecordList.vue`、`src/package-baby/records/diaper.vue`、`tests/baby-records.test.js`

## 目标

- 排便记录在类型、颜色之外，增加「形状」与「备注」两个字段。
- 形状只在 `type` 为「大便」或「都有」时填写，固定五档；备注任意类型均可填写，自由文本。
- 旧数据不受影响，备份与恢复格式不变。

## 现状

- 排便记录结构为 `{ id, time, type, color, createdAt }`，由 `makeRecord` 生成，`validateDiaper` 校验。
- `RecordForm.vue` 的排便分支只有时间、类型、颜色三组输入，使用 chip 选择；`type` 默认「小便」，`color` 默认「正常」。
- `RecordList.vue` 排便分支副行固定显示 `颜色：X`。
- `diaper.vue` 的「最近一次」显示 `${type} · ${color}`。
- 记录按月原样存储，备份导出与恢复直接透传月份对象，不需要字段白名单。

## 数据设计

在 `src/utils/baby/records.js`：

```js
export const DIAPER_SHAPES = ['水样', '偏稀', '糊状', '成形', '偏干']
```

- 与现有 `FOOD_REACTIONS` 一样导出，供表单渲染，避免选项在表单与校验之间重复定义。
- 内部仍保留 `DIAPER_TYPES`、`DIAPER_COLORS` 私有常量，不改变现有导出面。

### 记录字段

排便记录新增：

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `shape` | string | `type` 为「大便」或「都有」时必须是 `DIAPER_SHAPES` 之一；`type` 为「小便」时存 `''` |
| `note` | string | 可选，去除首尾空格，最长 200 字；无备注存 `''` |

### 校验

`validateDiaper(input)` 在现有时间、类型、颜色校验之后追加：

1. `type !== '小便'` 时，`shape` 必须属于 `DIAPER_SHAPES`，否则返回 `请选择排便形状`。
2. `note` 复用 `optionalTextError(input.note, '备注', 200)`。

`type === '小便'` 时忽略传入的 `shape`，不报错。

### 写入

`makeRecord` 排便分支增加：

```js
shape: input.type === '小便' ? '' : input.shape,
note: String(input.note || '').trim(),
```

### 兼容性

- `normalizeDay` / `sanitize` 只要求 `id` 与 `time`，旧记录缺少 `shape`、`note` 仍会正常加载。
- 展示层对缺失字段按空字符串处理：无形状不显示形状段，无备注不显示备注段。
- 不做数据迁移，不改 `schemaVersion`、备份结构与月份索引。

## 表单设计

`RecordForm.vue` 排便分支（模板最后的 `<template v-else>`）：

- 时间、类型、颜色保持不变。
- 颜色 chip 行之后：

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

- 新增状态 `diaperShape`（默认 `'糊状'`）、`diaperNote`（默认 `''`），并在 `reset()` 中复位。
- 类型从「大便」切到「小便」时形状选项隐藏，提交时强制空值，不需要额外清空逻辑。
- 提交：

```js
emit('submit', {
  time: `${date.value} ${time.value}`,
  type: diaperType.value,
  color: diaperColor.value,
  shape: diaperType.value === '小便' ? '' : diaperShape.value,
  note: diaperNote.value,
})
```

- 表单从 `../../utils/baby/records.js` 导入 `DIAPER_SHAPES`，与现有 `FOOD_REACTIONS` 导入同一行。

## 展示设计

### `RecordList.vue` 排便分支

副行拼接规则：

- 基础段：`颜色：${item.color}`。
- `item.shape` 非空时追加 ` · 形状：${item.shape}`。
- `item.note` 非空时追加 ` · ${item.note}`。

示例：`颜色：正常 · 形状：糊状 · 有点干`；小便无备注时为 `颜色：正常`。
与辅食、用药页把备注接在副行末尾的做法一致，不新增行。

### `diaper.vue` 最近一次

- 有形状时显示 `${type} · ${color} · ${shape}`。
- 无形状时保持 `${type} · ${color}`。

### 最近 7 天历史

`summarizeRecentDay('diaper', day)` 仍返回 `${count} 次`，不改汇总文案；展开后由 `RecordList` 展示形状与备注。

## 测试

在 `tests/baby-records.test.js` 增加：

1. `addRecord('diaper', ...)` 传入合法形状与备注，落库后 `shape`、`note` 与输入一致（去除首尾空格）。
2. `type` 为「大便」缺失或传入非法形状时校验失败，错误文案为 `请选择排便形状`。
3. `type` 为「小便」传入形状时保存为 `''`，不报错。
4. 备注超过 200 字时校验失败。
5. 旧记录（无 `shape`、`note`）经 `loadDay` 读取后仍可被 `summarizeRecentDay('diaper', day)` 汇总为 `${count} 次`。

现有 `tests/baby-records.test.js` 中两条新增「大便」记录的用例（约第 79 行、第 330 行）没有传形状，新校验下会失败，需要在这两条用例的输入里补上合法 `shape`（如 `'糊状'`）。

组件渲染与交互属于界面行为，项目没有 jsdom，不做组件测试；以 `npm test`、`npm run build:mp-weixin`、`npm run build:h5` 和微信开发者工具人工检查为准。

## 不在范围

- 不改辅食、用药、补剂等其他记录类型。
- 不为排便增加健康提示、异常判定或就医建议。
- 不做形状趋势图、统计分布或筛选。
- 不改备份格式、同步快照与存储 key。
- 不提供历史记录编辑（历史仍为只读展开）。
