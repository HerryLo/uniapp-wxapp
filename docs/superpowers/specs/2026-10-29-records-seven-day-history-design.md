# 日常记录最近 7 天历史展示设计

日期：2026-10-29
范围：`src/utils/baby/records.js`、`src/package-baby/components/records/RecordPage.vue`、`src/package-baby/components/records/RecordList.vue`、新增 `RecordsHistory.vue`、`src/package-baby/records/milk.vue`、`tests/baby-records.test.js`

## 目标

- 喝奶、睡眠、排便、辅食、补剂、用药六类记录页统一展示「最近 7 天」历史卡片。
- 有数据且不是今天的行可点击展开当天记录，展开内容只读。
- 今天行只显示汇总，不展开，因为今日记录已经在页面上方的主卡片中。
- 喝奶页保留近 7 天奶量趋势图，位置移到历史卡片下方。

## 现状

- `records.js` 已有 `loadRecentMilkSummary` 和 `milkChartPoints`，喝奶页展示 7 天奶量列表与趋势图。
- 睡眠、排便、辅食、补剂、用药页只有今日记录，没有历史展示。
- `RecordList.vue` 只支持带删除按钮的当日列表。
- `RecordPage.vue` 为六个记录页提供统一页面壳，已有 `extra` 插槽。

## 数据设计

在 `src/utils/baby/records.js` 新增纯函数：

```js
loadRecentDays(days = 7, now = new Date())
// => Array<{ date, day, summary }>，按日期升序，summary 为 summarizeDay(day) 的结果
```

- 逐日调用 `loadDay(date)` 与 `summarizeDay(day)`，与 `loadRecentMilkSummary` 相同的本地日期回退方式，自动处理跨月、跨年。
- `day` 保留完整的当日记录（六类数组），供展开时渲染。

```js
summarizeRecentDay(kind, day)
// => { count, hasData, text }
```

- `count`：该类当日记录条数。
- `hasData`：`count > 0`。
- `text` 按类型生成：

| 类型 | 有数据 | 无数据 |
| --- | --- | --- |
| `milk` | 有奶量数值：`360 ml · 4 次`；有记录但都未填奶量：`4 次 · 未记录奶量` | `未记录` |
| `sleep` | `2 小时 30 分钟 · 2 次`（复用 `formatDuration`） | `未记录` |
| `diaper` | `3 次` | `未记录` |
| `food` | `2 次`；存在异常反应时 `2 次 · 异常 1 次` | `未记录` |
| `supplement` / `medicine` | `维生素D、钙 · 2 次`，名称按记录时间倒序去重，最多展示 2 个，超过时追加「等」 | `未记录` |

- 读取存储失败沿用 `readStorage` 的容错，按空数据处理。
- 现有 `loadRecentMilkSummary`、`milkChartPoints` 保持不变，趋势图继续使用，避免破坏既有测试与行为。

## 组件设计

### 新增 `src/package-baby/components/records/RecordsHistory.vue`

Props：

```js
kind: string        // milk | sleep | diaper | food | medicine | supplement
days: Array         // loadRecentDays 的返回值
today: string       // YYYY-MM-DD
```

- 卡片标题按类型：`🍼 最近 7 天奶量`、`😴 最近 7 天睡眠`、`💧 最近 7 天排便`、`🍚 最近 7 天辅食`、`🌿 最近 7 天补剂`、`💊 最近 7 天用药`。
- 列表最新一天在最上方，始终展示 7 行。
- 每行布局：左侧日期（今天显示「今天」，其余显示 `MM-DD`），中间汇总文案，右侧展开箭头。
- 可展开条件：该行 `hasData` 且 `date !== today`。
- 单开手风琴：同一时间只展开一天；再次点击已展开行则收起。
- 「未记录」行置灰且不可点击；今天行显示汇总但不带箭头。
- 展开区复用 `RecordList`，传入 `readonly`，记录列表用 `sortRecords(day[kind], kind)` 排序。
- 刷新后若已展开的日期变为无数据，自动收起。

### 修改 `RecordList.vue`

新增 prop `readonly: Boolean`，默认 `false`。为 `true` 时隐藏删除按钮，其余渲染不变。

### 修改 `RecordPage.vue`

- 在主卡片之后、`extra` 插槽之前渲染 `<RecordsHistory :kind :days :today />`。
- 维护 `recentDays` 状态，初始化为 `loadRecentDays(7)`。
- 在 `useDayRecords` 的 `onChange` 回调中同时刷新 `recentDays`，保证新增或删除当天记录后历史立即更新。
- `onMounted` 触发的首次刷新同样会经过 `onChange`。

### 修改 `milk.vue`

- 移除页面自带的「最近 7 天奶量」列表，仅保留趋势图卡片与广告位。
- 趋势图显示条件与数据来源不变（`loadRecentMilkSummary`、`milkChartPoints`、`> 3 天有奶量`）。
- 页面顺序变为：今日记录卡片 → 最近 7 天历史卡片 → 趋势图卡片 → 广告位。

### 其他记录页

`sleep.vue`、`diaper.vue`、`food.vue`、`medicine.vue`、`supplement.vue` 无需改动，通过 `RecordPage` 自动获得历史卡片。

## 边界与错误处理

- 7 天内全部无记录时，历史卡片仍展示 7 行「未记录」。
- 跨月、跨年日期使用本地 `Date` 计算，不调用 `toISOString()`。
- 旧数据缺少 `food`、`medicine`、`supplement` 数组时，`normalizeDay` 已补齐为空数组。
- 展开只读，不提供删除或编辑入口；删除仍在今日列表进行。
- 不改存储结构、备份格式与 `schemaVersion`。

## 测试

在 `tests/baby-records.test.js` 增加：

1. `loadRecentDays` 返回 7 天、日期连续升序，跨月边界正确。
2. 每日 `day` 与 `summary` 对应正确，包含跨月月份桶读取。
3. `summarizeRecentDay` 对六类记录生成预期文案，覆盖：
   - 喝奶有奶量、无奶量、无记录三种情况；
   - 睡眠时长格式化；
   - 排便次数；
   - 辅食异常标记；
   - 补剂、用药名称去重与「等」截断。
4. 无数据时六类均返回 `未记录` 且 `hasData` 为 `false`。

组件渲染与点击展开属于界面行为，项目没有 jsdom，不做组件测试；以 `npm test`、`npm run build:mp-weixin`、`npm run build:h5` 和微信开发者工具人工检查为准。

## 不在范围

- 不改存储结构、备份格式与记录字段。
- 不做周/月切换、平均值或目标值。
- 不为睡眠、排便、辅食、补剂、用药增加趋势图。
- 不做历史记录的编辑或删除。
- 不改侧栏、表单、分享与广告位。
