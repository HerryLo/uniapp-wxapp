# 日常记录拆分独立页面设计

日期：2026-10-25
范围：日常记录页面拆分、共享组件、侧栏与分包注册

## 目标

把喝奶、睡眠、排便、辅食、用药拆成 5 个独立分包页面，避免后续每类记录功能扩展时继续挤在同一个页面里。共享数据逻辑、列表渲染和表单，保持与现有侧栏、奶油糖果风一致。

## 现状

- `package-baby/records/index.vue` 用一个页面承载 5 个 Tab
- 数据层已经按 `milk / sleep / diaper / food / medicine` 分开
- 侧栏入口通过 `?type=` 切换 Tab
- 喝奶页额外有七日汇总和趋势图

## 架构

### 页面文件

删除 `src/package-baby/records/index.vue`，新增：

- `src/package-baby/records/milk.vue`
- `src/package-baby/records/sleep.vue`
- `src/package-baby/records/diaper.vue`
- `src/package-baby/records/food.vue`
- `src/package-baby/records/medicine.vue`

`pages.json` 注册路径：

```text
records/milk
records/sleep
records/diaper
records/food
records/medicine
```

标题分别为：喝奶记录、睡眠记录、排便记录、辅食记录、用药记录。

### 共享 composable

新增 `src/composables/useDayRecords.js`：

```js
useDayRecords(kind, { onChange } = {})
// => {
//   today, day, list, summary, formOpen, formError,
//   refresh, openForm, closeForm, submitForm, remove
// }
```

- `kind`：`milk | sleep | diaper | food | medicine`
- `refresh()`：重新读取当天数据，并调用 `onChange`
- `submitForm(payload)`：调用 `addRecord`，成功后刷新并提示
- `remove(id)`：二次确认后 `removeRecord`，成功后刷新
- `summary`：`summarizeDay(day)`
- `list`：按时间倒序的当天记录

### 共享页面壳

新增 `src/components/baby/records/RecordPage.vue`：

- 用 `<BabyPage :active="kind">` 包裹
- 顶部卡片：emoji + 页面标题、右侧「+ 添加」
- 默认插槽 `stats`：向页面暴露 `{ summary, day, list, today }`
- 命名插槽 `extra`：放在主卡片之后，供喝奶页放七日趋势
- 内部使用 `RecordList` 和 `RecordForm`
- `onShow` 时刷新当天数据
- 提交/删除成功后 emit `change`

Props：

```js
kind: string
emoji: string
title: string
emptyText: string
```

### 共享列表

新增 `src/components/baby/records/RecordList.vue`：

- Props：`kind`、`list`、`emptyText`
- Emits：`remove(id)`
- 按类型渲染记录行，沿用现有 emoji、副文案和删除按钮
- 空状态使用传入的可爱文案

## 每页内容

### 喝奶

- 统计：今日次数、今日总奶量
- 额外卡片：最近 7 天奶量列表 + 趋势图（复用现有 `loadRecentMilkSummary`、`milkChartPoints`、`LineChart`）
- `@change` 时同步刷新七日数据
- 页面底部保留现有广告位；其他 4 个记录页不放广告

### 睡眠

- 统计：今日次数、今日总时长（`formatDuration(summary.sleepMinutes)`）

### 排便

- 统计：今日次数、最近一次类型与颜色

### 辅食

- 统计：今日次数、异常反应次数

### 用药

- 统计：今日次数、最近一次药品名称

统计卡统一使用新增的全局样式 `.record-stats`、`.record-stat`、`.record-stat-value`、`.record-stat-label`，粉/薄荷/柠檬浅色底。

## 导航与侧栏

侧栏入口改为：

```text
milk     → /package-baby/records/milk
sleep    → /package-baby/records/sleep
diaper   → /package-baby/records/diaper
food     → /package-baby/records/food
medicine → /package-baby/records/medicine
```

- key 不变，侧栏高亮继续使用 `milk/sleep/diaper/food/medicine`
- 分包页之间继续用 `redirectTo`
- 旧 `/package-baby/records/index?type=` 没有其他引用，直接移除

## 不变项

- 数据结构、备份、清空、表单校验、记录字段不变
- 日常记录页不再自动打开表单
- 奶油糖果风、侧栏展开/收起、悬浮图标不变
- 广告位只保留在喝奶页、宝宝首页和工具页；睡眠、排便、辅食、用药页不放广告

## 测试与验证

- 更新 `tests/baby-sidebar.test.js` 中的 5 个记录页 URL
- 现有数据层测试保持不变
- `npm test` 全部通过
- `npm run build:mp-weixin`、`npm run build:h5` 成功
- 人工检查：
  - 5 个页面独立打开、返回、侧栏高亮正确
  - 新增/删除记录、表单校验、空状态
  - 喝奶页七日列表和趋势图随新增/删除刷新
  - 侧栏 12 项在矮屏可滚动
  - 宝宝首页和工具页广告仍正常

## 不在范围

- 不改数据结构和备份格式
- 不为每类记录新增业务功能（时间轴、食物库、提醒等）
- 不改宝宝首页、工具页和侧栏交互
