# 喝奶七日汇总与趋势图设计

日期：2026-10-24
范围：`src/utils/baby/records.js`、`src/package-baby/records/index.vue`、`src/components/baby/LineChart.vue`、`tests/baby-records.test.js`

## 目标

在「日常记录 → 喝奶」中补充今日奶量汇总和最近 7 天奶量列表；当有奶量数值的天数超过 3 天时，用折线图展示趋势，并优化图表坐标轴标签间距，避免数据变多后标签重叠。

## 现状

喝奶页只展示今日记录列表和「喝奶次数」统计卡。`summarizeDay` 已经能算出单日奶量总和；`LineChart` 已支持 `points: [{ date, value }]`，但 X 轴固定只显示首尾两个日期，Y 轴固定 4 个刻度，未处理标签过密的情况。

## 数据设计

在 `src/utils/baby/records.js` 新增纯函数：

```js
loadRecentMilkSummary(days = 7, now = new Date())
// => Array<{ date, milkCount, milkAmount, hasMilkAmount }>，按日期升序
```

- 逐日调用 `loadDay(date)` 与 `summarizeDay(day)`，自动处理跨月、跨年。
- `milkAmount` 只累加有数值的奶量；`hasMilkAmount` 表示当天是否至少有一条带数值的喝奶记录。
- `milkCount` 为当天喝奶记录条数（含未填奶量的记录）。
- 日期使用本地时间，通过 `formatDate` 生成，不调用 `toISOString()`。

新增辅助函数：

```js
milkChartPoints(summary)
// => Array<{ date, value }>，只保留 hasMilkAmount 为 true 的日期
```

页面用 `summary.filter(item => item.hasMilkAmount).length > 3` 判断是否展示曲线图。

## 页面设计

仅当 `kind === 'milk'` 时展示新增内容。

### 今日汇总

「今天 · 喝奶」标题右侧显示：

- 有奶量数值：`共 360 ml · 4 次`
- 有记录但都未填奶量：`奶量未记录 · 4 次`
- 无记录：不显示右侧汇总（列表区显示现有空状态）

### 最近 7 天列表

新增卡片「最近 7 天奶量」，位于今日记录卡片下方：

- 包含今天在内的 7 个自然日，最新一天在最上方。
- 每行：日期（今天 / MM-DD）、总量、次数。
- 当天没有奶量数值：总量显示「未记录」，次数仍展示。
- 当天完全无记录：显示「未记录」和「0 次」。
- 列表始终展示 7 行，即使全无数据。

### 曲线图

- 有奶量数值的天数 ≥ 4 时，在列表下方显示折线图。
- 数据点只取有奶量数值的日期，按日期升序；不补 0。
- 高度 320rpx，单位 `ml`，颜色使用主题色 `#E86F87`。
- 图上方标注「近 7 天奶量趋势」。

## 坐标轴优化

在 `LineChart.vue` 中调整标签绘制逻辑：

- 新增 prop `maxXLabels`，默认 4。
- X 轴标签数量 = `min(maxXLabels, floor(可用宽度 / 48px), 数据点数)`，至少 1 个。
- 标签索引在数据点中等距选取，始终包含首尾点；首标签左对齐、尾标签右对齐、中间标签居中对齐。
- Y 轴刻度数量按可用高度自适应：`min(4, floor(可用高度 / 28px))`，至少 2 个刻度，避免纵向重叠。
- 数值标签保留最多 1 位小数；单位继续追加在数值后。
- 数据点不足时保持现有绘制行为。

## 边界与错误处理

- 读取存储失败沿用 `readStorage` 的容错，按空数据处理。
- 跨月、跨年日期用本地 `Date` 逐年月日回退计算。
- 7 天内没有有效奶量时不渲染图表，只显示列表。
- 删除记录后重新计算汇总，图表随之更新。
- 不改存储结构、不加依赖、不影响睡眠与排便 Tab。

## 测试

在 `tests/baby-records.test.js` 增加：

1. 7 天窗口跨月时日期连续且升序。
2. 单日总量、次数、`hasMilkAmount` 计算正确。
3. 未填奶量的记录计入次数但不计入总量，且不进入图表数据。
4. 空数据时返回 7 个空日条目。
5. `milkChartPoints` 只返回有数值的日期。

图表绘制属于 canvas 显示逻辑，无法在 Vitest 中断言像素，改为构建校验 + 开发者工具人工检查。

## 不在范围

- 不做周/月切换、不做平均值或目标值。
- 不改其他记录类型的统计。
- 不引入图表库。
