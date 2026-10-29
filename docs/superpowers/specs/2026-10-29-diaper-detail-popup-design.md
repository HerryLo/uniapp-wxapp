# 排便记录详情弹窗设计

日期：2026-10-29
范围：`src/package-baby/components/records/RecordList.vue`、新增 `src/package-baby/components/records/RecordDetail.vue`、`src/package-baby/components/records/RecordsHistory.vue`、`src/package-baby/components/records/RecordPage.vue`

## 目标

- 排便页当日列表只展示精简信息：时间、类型（大便 / 小便 / 都有）、颜色。
- 点击当日任意一条排便记录，弹窗展示该条记录的完整信息，含形状与备注。
- 最近 7 天历史卡片展开后的列表同样支持点击查看详情。
- 其他五类记录的列表展示与交互保持不变。

## 现状

- `RecordList.vue` 的排便行显示 `💧 HH:mm · 类型` 与 `颜色：X · 形状：X · 备注`，信息较长。
- 当日列表与 7 天历史展开列表都复用 `RecordList`，`RecordsHistory` 以 `readonly` 传入隐藏删除。
- 当日列表右侧有「删除」按钮；历史列表没有。
- 没有记录详情弹窗，也没有行点击交互。

## 组件设计

### `RecordList.vue`

排便分支改为：

- 主行：`💧 {{ time.slice(11) }} · {{ type }}`
- 副行：`颜色：{{ color }}`
- 删除 `diaperDetail()` 函数，形状与备注不再出现在行内。

交互：

- 新增 `<view class="record-item" :class="{ selectable: kind === 'diaper' }" @click="onSelect(item)">`。
- `onSelect(item)` 仅在 `kind === 'diaper'` 时 `emit('select', item)`，避免影响其他类型。
- 「删除」按钮位于行内部，点击会冒泡到行，因此删除按钮的点击处理改为 `@click.stop="$emit('remove', item.id)"`，只删除、不打开详情。
- 可点击行加 `.record-item.selectable:active { opacity: 0.7; }` 的按压反馈。

事件：`defineEmits(['remove', 'select'])`。

### `RecordDetail.vue`（新增）

Props：

```js
visible: Boolean
record: Object | null   // 排便记录
```

Emits：`close`。

- 外观与「添加记录」表单一致：底部抽屉 + 半透明遮罩，点击遮罩关闭，点击内容区 `@click.stop`。`RecordForm` 的样式是 scoped 的，`RecordDetail` 需要在自己的 `<style scoped>` 中写同名视觉的样式（遮罩、圆角、内边距沿用同一套数值）。
- 标题固定「💧 排便详情」，右上角 `✕` 关闭。
- 内容按行展示：

| 行 | 展示规则 |
| --- | --- |
| 时间 | `record.time`，格式 `YYYY-MM-DD HH:mm` |
| 类型 | `record.type` |
| 颜色 | `record.color` |
| 形状 | `record.shape` 非空时显示；`小便` 记录的 `shape` 为空，整行隐藏 |
| 备注 | `record.note` 非空时显示原文，否则显示「无」 |

- 备注文本允许换行，`word-break: break-all`，不做截断。
- 只读，不提供编辑、删除入口。
- 组件自身不做存储读取，仅渲染传入的 `record`；`visible` 为 false 或 `record` 为空时不渲染内容。

### `RecordsHistory.vue`

- 在展开区的 `<RecordList>` 上监听 `select`，并转发：

```html
<RecordList
  :kind="kind"
  :list="sortedList(item)"
  readonly
  @select="$emit('select', $event)"
/>
```

- `defineEmits(['select'])`。

### `RecordPage.vue`

- 新增状态：

```js
const detailRecord = ref(null)

function openDetail(record) {
  detailRecord.value = record || null
}

function closeDetail() {
  detailRecord.value = null
}
```

- 当日列表绑定 `@select="openDetail"`。
- `RecordsHistory` 绑定 `@select="openDetail"`。
- 在页面末尾、`RecordForm` 之后渲染：

```html
<RecordDetail :visible="!!detailRecord" :record="detailRecord" @close="closeDetail" />
```

- 其他记录类型不会发出 `select`，因此弹窗只会在排便页被触发。

## 边界与错误处理

- 旧记录没有 `shape`、`note` 字段：形状行隐藏，备注显示「无」。
- 备注很长时弹窗内换行展示，不截断。
- 点击「删除」不会打开详情；删除后 `detailRecord` 若指向已删除记录不会造成问题，因为删除按钮与详情入口互斥，弹窗打开时列表不可见。
- 不改存储结构、校验、备份格式与 7 天汇总文案。

## 测试

数据层无变化，现有 `tests/baby-records.test.js` 保持通过即可。组件交互项目没有 jsdom，不做组件测试，以 `npm test`、`npm run build:mp-weixin`、`npm run build:h5` 和微信开发者工具人工检查为准：

1. 当日大便记录行只显示时间和类型、颜色；点击弹出详情，包含形状与备注。
2. 当日小便记录行点击弹出详情，不显示形状行，备注为空时显示「无」。
3. 7 天历史展开后点击任意一条，弹出同样的详情，且弹窗内无删除入口。
4. 点击「删除」按钮只删除记录，不弹出详情。
5. 其他五类记录行点击无反应。

## 不在范围

- 不为其他记录类型增加详情弹窗。
- 不在弹窗内编辑或删除记录。
- 不改排便表单、存储字段与历史汇总。
