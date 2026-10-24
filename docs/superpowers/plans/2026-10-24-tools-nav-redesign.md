# 工具页导航与瘦身实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 7 个平铺标签改为「自定义导航栏 + 全部工具抽屉」，精简为 4 个工具，放大字号，并在页面底部接入微信自定义广告。

**Architecture:** 新增共享 `NavBar` 与 `AdBanner` 组件；工具页用抽屉选择工具、默认增值税；待办页复用导航栏但不显示工具入口；删除编码/时间戳/JSON 三个工具，保留待办仍在使用的日期工具函数。

**Tech Stack:** uni-app + Vue 3 + Vite、微信小程序条件编译、Vitest。

## Global Constraints

- 仅微信小程序渲染 `ad-custom`，H5 不得出现未知组件。
- 工具页与待办页使用 `navigationStyle: "custom"`；关于页保持原生导航。
- 工具页右上角图标只出现在工具页，待办页不得出现。
- 默认工具为增值税；深链只接受 `vat | unit | text | radix`，其余回落到 `vat`。
- 保留 `dateToTimestamp`、`formatDateValue`、`formatTimeValue`，待办页依赖它们。

---

### Task 1: 新增 NavBar 与 AdBanner 组件

**Files:**
- Create: `src/components/NavBar.vue`
- Create: `src/components/AdBanner.vue`

**Interfaces:**
- `NavBar` props: `title: String`, `showToolMenu: Boolean`; emits `open-tools`.
- `AdBanner` 无 props，内部固定 `unit-id="adunit-a36ca84c0d70179a"`。

- [ ] **Step 1: 创建 NavBar.vue**

```vue
<template>
  <view class="nav-placeholder" :style="{ height: totalHeight + 'px' }"></view>
  <view class="nav-bar" :style="{ height: totalHeight + 'px', paddingTop: statusBarHeight + 'px' }">
    <view class="nav-inner" :style="{ height: navBarHeight + 'px' }">
      <text class="nav-title">{{ title }}</text>
      <view
        v-if="showToolMenu"
        class="nav-action"
        :style="{ right: rightOffset + 'px' }"
        @click="$emit('open-tools')"
      >
        <view class="grid-icon">
          <view class="grid-cell"></view>
          <view class="grid-cell"></view>
          <view class="grid-cell"></view>
          <view class="grid-cell"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  title: { type: String, default: '' },
  showToolMenu: { type: Boolean, default: false },
})
defineEmits(['open-tools'])

const metrics = (() => {
  const info = uni.getSystemInfoSync()
  let statusBarHeight = 0
  let navBarHeight = 44
  let rightOffset = 16
  // #ifdef MP-WEIXIN
  statusBarHeight = info.statusBarHeight || 0
  try {
    const menu = wx.getMenuButtonBoundingClientRect()
    navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height
    rightOffset = info.windowWidth - menu.left + 8
  } catch (e) {
    navBarHeight = 44
    rightOffset = 16
  }
  // #endif
  return { statusBarHeight, navBarHeight, rightOffset }
})()

const statusBarHeight = computed(() => metrics.statusBarHeight)
const navBarHeight = computed(() => metrics.navBarHeight)
const rightOffset = computed(() => metrics.rightOffset)
const totalHeight = computed(() => metrics.statusBarHeight + metrics.navBarHeight)
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-sizing: border-box;
  background: var(--surface);
  border-bottom: 1rpx solid var(--border);
}

.nav-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text);
}

.nav-action {
  position: absolute;
  top: 50%;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
}

.grid-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-content: space-between;
}

.grid-cell {
  width: 15rpx;
  height: 15rpx;
  border-radius: 3rpx;
  background: var(--text);
}
</style>
```

- [ ] **Step 2: 创建 AdBanner.vue**

```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <view class="ad-slot">
    <ad-custom
      unit-id="adunit-a36ca84c0d70179a"
      @load="adLoad"
      @error="adError"
      @close="adClose"
    />
  </view>
  <!-- #endif -->
</template>

<script setup>
function adLoad() {}

function adError(event) {
  console.warn('ad-custom error', event)
}

function adClose() {}
</script>

<style scoped>
.ad-slot {
  margin-top: 32rpx;
}
</style>
```

- [ ] **Step 3: 编译验证**

Run: `npm run build:mp-weixin`
Expected: `DONE Build complete.`

Run: `npm run build:h5`
Expected: `DONE Build complete.`

- [ ] **Step 4: 检查微信产物中的广告绑定**

Run: `grep -r "ad-custom" dist/build/mp-weixin -n`
Expected: 生成 `ad-custom` 节点，并带有 `bindload` / `binderror` / `bindclose`（若属性名未转换，改用 `bindload="adLoad"` 形式）。

- [ ] **Step 5: 提交**

```bash
git add src/components/NavBar.vue src/components/AdBanner.vue
git commit -m "feat 新增自定义导航栏与广告组件"
```

---

### Task 2: 工具页改为 4 个工具 + 抽屉入口

**Files:**
- Modify: `src/pages/tools/index.vue`
- Modify: `src/pages.json`
- Delete: `src/components/tools/EncodePanel.vue`
- Delete: `src/components/tools/TimestampPanel.vue`
- Delete: `src/components/tools/JsonPanel.vue`
- Delete: `src/utils/encode.js`
- Delete: `src/utils/json.js`
- Delete: `tests/encode.test.js`
- Delete: `tests/json.test.js`
- Modify: `src/utils/timestamp.js`
- Modify: `tests/timestamp.test.js`

**Interfaces:**
- 工具页使用 `NavBar` 的 `showToolMenu` 和 `@open-tools`。
- 工具 key 固定为 `vat / unit / text / radix`。

- [ ] **Step 1: 重写工具页**

模板结构：

```vue
<view class="tools-page">
  <NavBar title="工具箱" show-tool-menu @open-tools="toolsOpen = true" />
  <view class="tools-body">
    <VatPanel v-show="active === 'vat'" />
    <UnitPanel v-show="active === 'unit'" />
    <TextPanel v-show="active === 'text'" />
    <RadixPanel v-show="active === 'radix'" />
    <view class="about-link" @click="openAbout">关于与免责声明</view>
    <AdBanner />
  </view>

  <view v-if="toolsOpen" class="sheet-mask" @click="toolsOpen = false">
    <view class="sheet" @click.stop>
      <view class="sheet-head">
        <text class="sheet-title">全部工具</text>
        <text class="sheet-close" @click="toolsOpen = false">✕</text>
      </view>
      <view class="tool-grid">
        <view
          v-for="tool in tools"
          :key="tool.key"
          class="tool-cell"
          :class="{ active: active === tool.key }"
          @click="pickTool(tool.key)"
        >
          <text class="tool-name">{{ tool.name }}</text>
          <text class="tool-desc">{{ tool.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

脚本：

```js
import { ref } from 'vue'
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
import NavBar from '../../components/NavBar.vue'
import AdBanner from '../../components/AdBanner.vue'
import VatPanel from '../../components/tools/VatPanel.vue'
import UnitPanel from '../../components/tools/UnitPanel.vue'
import TextPanel from '../../components/tools/TextPanel.vue'
import RadixPanel from '../../components/tools/RadixPanel.vue'
import { loadTodos, activeCount, updateTabBadge } from '../../utils/todo.js'

const tools = [
  { key: 'vat', name: '增值税', desc: '含税 / 不含税' },
  { key: 'unit', name: '单位换算', desc: '长度 / 重量 / 温度' },
  { key: 'text', name: '文本处理', desc: '去重 / 大小写' },
  { key: 'radix', name: '进制转换', desc: '2–36 进制' },
]
const toolKeys = tools.map((tool) => tool.key)
const active = ref('vat')
const toolsOpen = ref(false)

onLoad((options) => {
  if (options && toolKeys.includes(options.tool)) active.value = options.tool
})

onShow(() => {
  updateTabBadge(activeCount(loadTodos()))
})

onShareAppMessage(() => ({
  title: '计算工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
}))

function pickTool(key) {
  active.value = key
  toolsOpen.value = false
}

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
```

样式核心：

```css
.tools-page { padding-bottom: 48rpx; }
.about-link { margin: 48rpx 32rpx 0; padding: 24rpx 0; text-align: center; font-size: 26rpx; color: var(--text-secondary); }
.sheet-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 200; display: flex; align-items: flex-end; background: rgba(17, 24, 39, 0.45); }
.sheet { width: 100%; padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom)); background: var(--surface); border-radius: 32rpx 32rpx 0 0; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.sheet-title { font-size: 32rpx; font-weight: 600; color: var(--text); }
.sheet-close { padding: 8rpx 16rpx; font-size: 32rpx; color: var(--text-secondary); }
.tool-grid { display: flex; flex-wrap: wrap; justify-content: space-between; }
.tool-cell { width: calc(50% - 10rpx); margin-bottom: 20rpx; padding: 24rpx; box-sizing: border-box; background: #F9FAFB; border: 2rpx solid transparent; border-radius: 24rpx; }
.tool-cell.active { background: var(--primary-soft); border-color: var(--primary); }
.tool-name { display: block; font-size: 30rpx; font-weight: 600; color: var(--text); }
.tool-desc { display: block; margin-top: 8rpx; font-size: 24rpx; color: var(--text-secondary); }
```

- [ ] **Step 2: 开启工具页自定义导航**

`src/pages.json` 的工具页 style 增加：

```json
"navigationStyle": "custom"
```

- [ ] **Step 3: 删除三个工具及测试**

```bash
rm src/components/tools/EncodePanel.vue src/components/tools/TimestampPanel.vue src/components/tools/JsonPanel.vue
rm src/utils/encode.js src/utils/json.js
rm tests/encode.test.js tests/json.test.js
```

- [ ] **Step 4: 精简 timestamp.js**

保留 `pad`、`dateToTimestamp`、`formatDateValue`、`formatTimeValue`；删除 `formatLocal`、`formatUtc`、`timestampToDate`、`nowTimestamp`。

- [ ] **Step 5: 精简 timestamp 测试**

```js
import { describe, it, expect } from 'vitest'
import { dateToTimestamp, formatDateValue, formatTimeValue } from '../src/utils/timestamp.js'

describe('timestamp helpers', () => {
  it('converts date and time to timestamps', () => {
    const ms = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(dateToTimestamp('2026-01-02', '03:04:05')).toEqual({
      seconds: Math.floor(ms / 1000),
      milliseconds: ms,
    })
  })

  it('rejects invalid dates and times', () => {
    expect(dateToTimestamp('2026-02-30', '10:00')).toEqual({ error: '日期无效' })
    expect(dateToTimestamp('2026-02-01', '25:00')).toEqual({ error: '时间无效' })
  })

  it('formats picker values', () => {
    const d = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDateValue(d)).toBe('2026-01-02')
    expect(formatTimeValue(d)).toBe('03:04')
  })
})
```

- [ ] **Step 6: 验证**

Run: `npm test`
Expected: 所有剩余测试通过。

Run: `npm run build:mp-weixin`
Expected: `DONE Build complete.`

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat 工具页改为抽屉导航并精简为四个工具"
```

---

### Task 3: 待办页导航、广告与全局字号

**Files:**
- Modify: `src/pages/todo/index.vue`
- Modify: `src/pages.json`
- Modify: `src/App.vue`
- Modify: `src/components/tools/TodoItem.vue`

- [ ] **Step 1: 待办页接入 NavBar 与 AdBanner**

在 `.todo-page` 内最前面放 `<NavBar title="待办" />`，原有内容包进 `.todo-body`，底部说明后放 `<AdBanner />`；`.todo-body` 使用 `padding: 32rpx 32rpx 64rpx`。

- [ ] **Step 2: 开启待办页自定义导航**

`src/pages.json` 的待办页 style 增加 `"navigationStyle": "custom"`。不要给待办页传 `showToolMenu`。

- [ ] **Step 3: 放大全局字号**

`src/App.vue` 按设计表调整：面板标题 34rpx、说明 26rpx、标签 28rpx、输入/按钮 30rpx、选项 28rpx、结果标签 28rpx、结果值 32rpx、辅助文字 24–26rpx。

- [ ] **Step 4: 放大待办页字号**

`src/pages/todo/index.vue`：添加按钮 30rpx、空状态 28rpx、底部说明 24rpx。
`src/components/tools/TodoItem.vue`：标题 30rpx、截止时间 24rpx、清除截止时间 26rpx、勾选符号 26rpx。

- [ ] **Step 5: 验证**

Run: `npm test`
Expected: 通过。

Run: `npm run build:mp-weixin && npm run build:h5`
Expected: 两端 `DONE Build complete.`

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat 待办页接入自定义导航与广告并放大字号"
```

---

### Task 4: 文档与整体验收

**Files:**
- Modify: `src/pages/about/about.vue`
- Modify: `README.md`
- Verify: `docs/superpowers/specs/2026-10-24-tools-nav-redesign-design.md`

- [ ] **Step 1: 更新关于页功能列表**

```html
<view class="text">增值税计算 · 单位换算 · 文本处理 · 进制转换</view>
<view class="text">待办清单</view>
```

同时将 `.section-title` 调整为 30rpx、`.text` 调整为 28rpx、`.version` 调整为 26rpx。

- [ ] **Step 2: 更新 README**

功能列表只保留 4 个工具与待办；目录结构把工具页描述改为「工具页与全部工具抽屉」，并补充 `NavBar.vue`、`AdBanner.vue`。

- [ ] **Step 3: 全量验证**

Run: `npm test`
Expected: 测试文件与用例数少于改造前，但全部通过。

Run: `npm run build:mp-weixin`
Run: `npm run build:h5`

- [ ] **Step 4: H5 冒烟**

启动 `npm run dev:h5`，用无头浏览器验证：
- 工具页默认显示增值税；
- 点击右上角图标出现「全部工具」；
- 切换单位换算/文本处理/进制后抽屉关闭且面板正确；
- `?tool=radix` 直接打开进制；`?tool=json` 回落到增值税；
- 待办页导航只有「待办」，无右上角图标；
- H5 页面 DOM 中不存在 `ad-custom`。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "docs 更新四工具说明与导航改造验收"
```
