# 宝宝模块左侧固定侧栏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为宝宝首页和 5 个分包页面增加可折叠的左侧固定侧栏，集中放置 7 个页面入口，并精简首页。

**Architecture:** 新增侧栏状态模块、`BabySidebar` 导航组件和 `BabyPage` 布局组件；6 个宝宝页面用 `BabyPage` 包裹，侧栏宽度变化通过内容区 `margin-left` 过渡；侧栏状态独立存储在 `ui.baby-sidebar.v1`。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vitest，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 侧栏只出现在宝宝首页和 5 个分包页面，不出现在工具页、关于页。
- 侧栏入口顺序固定：喝奶、睡眠、排便、疫苗、生长、成长、设置。
- 默认展开（200rpx），收起后 76rpx，只显示 emoji。
- 侧栏状态 key 为 `ui.baby-sidebar.v1`，不属于 `baby.*`，清空宝宝数据不删除。
- 首页移除快捷记录区和功能列表，其他预览卡片、分享、免责声明、广告保留。
- 分包页之间用 `redirectTo`，从首页进入用 `navigateTo`。
- 不改业务数据、备份结构、页面注册。
- 提交仅在用户授权后执行。

---

### Task 1: 侧栏状态与导航项

**Files:**
- Create: `src/utils/baby/sidebar.js`
- Test: `tests/baby-sidebar.test.js`

**Interfaces:**
- Produces:
  - `SIDEBAR_ITEMS: Array<{ key, label, emoji, url }>`
  - `SIDEBAR_STATE_KEY = 'ui.baby-sidebar.v1'`
  - `loadSidebarCollapsed(): boolean`
  - `saveSidebarCollapsed(collapsed: boolean): boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/baby-sidebar.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SIDEBAR_ITEMS,
  SIDEBAR_STATE_KEY,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from '../src/utils/baby/sidebar.js'
import { isBabyKey } from '../src/utils/baby/keys.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key) => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: (key) => { delete store[key] },
    showToast: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baby sidebar', () => {
  it('ships the seven entries in order', () => {
    expect(SIDEBAR_ITEMS.map((item) => item.key)).toEqual([
      'milk',
      'sleep',
      'diaper',
      'health',
      'growth',
      'journal',
      'settings',
    ])
    expect(SIDEBAR_ITEMS.map((item) => item.label)).toEqual([
      '喝奶',
      '睡眠',
      '排便',
      '疫苗',
      '生长',
      '成长',
      '设置',
    ])
    expect(SIDEBAR_ITEMS[0].url).toBe('/package-baby/records/index?type=milk')
    expect(SIDEBAR_ITEMS[3].url).toBe('/package-baby/health/index')
  })

  it('uses a UI key outside the baby data prefix', () => {
    expect(SIDEBAR_STATE_KEY).toBe('ui.baby-sidebar.v1')
    expect(isBabyKey(SIDEBAR_STATE_KEY)).toBe(false)
  })

  it('defaults to expanded and persists the collapsed state', () => {
    expect(loadSidebarCollapsed()).toBe(false)
    expect(saveSidebarCollapsed(true)).toBe(true)
    expect(loadSidebarCollapsed()).toBe(true)
    expect(saveSidebarCollapsed(false)).toBe(true)
    expect(loadSidebarCollapsed()).toBe(false)
  })

  it('falls back to expanded when stored state is corrupt', () => {
    store[SIDEBAR_STATE_KEY] = '{oops'
    expect(loadSidebarCollapsed()).toBe(false)
    store[SIDEBAR_STATE_KEY] = 'true'
    expect(loadSidebarCollapsed()).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/baby-sidebar.test.js`

Expected: FAIL，`src/utils/baby/sidebar.js` 不存在。

- [ ] **Step 3: Implement the module**

Create `src/utils/baby/sidebar.js`:

```js
import { readStorage, writeStorage } from '../storage.js'

export const SIDEBAR_STATE_KEY = 'ui.baby-sidebar.v1'

export const SIDEBAR_ITEMS = [
  {
    key: 'milk',
    label: '喝奶',
    emoji: '🍼',
    url: '/package-baby/records/index?type=milk',
  },
  {
    key: 'sleep',
    label: '睡眠',
    emoji: '😴',
    url: '/package-baby/records/index?type=sleep',
  },
  {
    key: 'diaper',
    label: '排便',
    emoji: '💧',
    url: '/package-baby/records/index?type=diaper',
  },
  {
    key: 'health',
    label: '疫苗',
    emoji: '💉',
    url: '/package-baby/health/index',
  },
  {
    key: 'growth',
    label: '生长',
    emoji: '📈',
    url: '/package-baby/growth/index',
  },
  {
    key: 'journal',
    label: '成长',
    emoji: '📖',
    url: '/package-baby/journal/index',
  },
  {
    key: 'settings',
    label: '设置',
    emoji: '⚙️',
    url: '/package-baby/settings/index',
  },
]

export function loadSidebarCollapsed() {
  const raw = readStorage(SIDEBAR_STATE_KEY, null)
  return !!(raw && typeof raw === 'object' && raw.collapsed === true)
}

export function saveSidebarCollapsed(collapsed) {
  return writeStorage(SIDEBAR_STATE_KEY, { collapsed: !!collapsed })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/baby-sidebar.test.js`

Expected: PASS，4 个测试全部通过。

- [ ] **Step 5: Commit**

```bash
git add src/utils/baby/sidebar.js tests/baby-sidebar.test.js
git commit -m "feat: add baby sidebar state and entries"
```

---

### Task 2: 侧栏与页面布局组件

**Files:**
- Create: `src/components/baby/BabySidebar.vue`
- Create: `src/components/baby/BabyPage.vue`

**Interfaces:**
- `BabySidebar` props：`active: string`、`collapsed: boolean`；emits：`toggle`
- `BabyPage` props：`active: string`；内部管理折叠状态并提供 slot

- [ ] **Step 1: Create BabySidebar**

Create `src/components/baby/BabySidebar.vue`:

```vue
<template>
  <view class="baby-sidebar" :class="{ collapsed }">
    <view class="sidebar-head">
      <text v-if="!collapsed" class="sidebar-title">宝宝</text>
    </view>

    <view class="sidebar-list">
      <view
        v-for="item in SIDEBAR_ITEMS"
        :key="item.key"
        class="sidebar-item"
        :class="{ active: item.key === active }"
        @click="go(item)"
      >
        <text class="sidebar-emoji">{{ item.emoji }}</text>
        <text v-if="!collapsed" class="sidebar-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="sidebar-toggle" @click="$emit('toggle')">
      <text class="sidebar-toggle-text">{{ collapsed ? '›' : '‹' }}</text>
      <text v-if="!collapsed" class="sidebar-toggle-label">收起</text>
    </view>
  </view>
</template>

<script setup>
import { SIDEBAR_ITEMS } from '../../utils/baby/sidebar.js'

const props = defineProps({
  active: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
})

defineEmits(['toggle'])

function isSubpackagePage() {
  if (typeof getCurrentPages !== 'function') return false
  const pages = getCurrentPages()
  const current = pages && pages[pages.length - 1]
  return !!(
    current &&
    typeof current.route === 'string' &&
    current.route.startsWith('package-baby/')
  )
}

function go(item) {
  if (item.key === props.active) return
  if (isSubpackagePage()) {
    uni.redirectTo({ url: item.url })
    return
  }
  uni.navigateTo({ url: item.url })
}
</script>

<style scoped>
.baby-sidebar {
  position: fixed;
  top: var(--window-top, 0);
  bottom: var(--window-bottom, 0);
  left: 0;
  z-index: 220;
  width: 200rpx;
  display: flex;
  flex-direction: column;
  padding: 16rpx 12rpx calc(16rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-right: 1rpx solid var(--border);
  transition: width 0.2s ease;
}
.baby-sidebar.collapsed {
  width: 76rpx;
  padding-left: 8rpx;
  padding-right: 8rpx;
}
.sidebar-head {
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text-secondary);
}
.sidebar-list {
  flex: 1;
  margin-top: 12rpx;
  overflow-y: auto;
}
.sidebar-item {
  display: flex;
  align-items: center;
  height: 80rpx;
  margin-bottom: 8rpx;
  padding: 0 16rpx;
  border-radius: 20rpx;
  color: var(--text-secondary);
}
.baby-sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: 0;
}
.sidebar-item.active {
  background: #FFF1F3;
  color: var(--primary-strong);
  font-weight: 600;
}
.sidebar-emoji {
  font-size: 30rpx;
}
.sidebar-label {
  margin-left: 12rpx;
  font-size: 26rpx;
}
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid var(--border);
  color: var(--text-secondary);
}
.sidebar-toggle-text {
  font-size: 30rpx;
}
.sidebar-toggle-label {
  margin-left: 8rpx;
  font-size: 22rpx;
}
</style>
```

- [ ] **Step 2: Create BabyPage**

Create `src/components/baby/BabyPage.vue`:

```vue
<template>
  <view class="baby-shell">
    <view class="baby-content" :class="{ collapsed }">
      <slot />
    </view>
    <BabySidebar :active="active" :collapsed="collapsed" @toggle="toggle" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import BabySidebar from './BabySidebar.vue'
import {
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from '../../utils/baby/sidebar.js'

defineProps({
  active: { type: String, default: '' },
})

const collapsed = ref(loadSidebarCollapsed())

function toggle() {
  collapsed.value = !collapsed.value
  saveSidebarCollapsed(collapsed.value)
}
</script>

<style scoped>
.baby-shell {
  min-height: 100vh;
}
.baby-content {
  margin-left: 200rpx;
  transition: margin-left 0.2s ease;
}
.baby-content.collapsed {
  margin-left: 76rpx;
}
</style>
```

- [ ] **Step 3: Validate both SFCs**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/components/baby/BabySidebar.vue','src/components/baby/BabyPage.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
```

Expected: 两个文件均打印 `OK`。

- [ ] **Step 4: Commit**

```bash
git add src/components/baby/BabySidebar.vue src/components/baby/BabyPage.vue
git commit -m "feat: add baby sidebar layout components"
```

---

### Task 3: 宝宝首页接入侧栏并精简

**Files:**
- Modify: `src/pages/baby/index.vue`

**Interfaces:**
- Consumes: `BabyPage`（Task 2）
- Produces: 首页使用侧栏，移除快捷记录区与功能列表

- [ ] **Step 1: Wrap the template with BabyPage**

把模板开头：

```vue
<template>
  <view class="baby-page">
```

改为：

```vue
<template>
  <BabyPage>
    <view class="baby-page">
```

把模板结尾：

```vue
    <Disclaimer />
    <AdBanner />
  </view>
</template>
```

改为：

```vue
      <Disclaimer />
      <AdBanner />
    </view>
  </BabyPage>
</template>
```

- [ ] **Step 2: Remove the quick actions section**

删除整段：

```vue
    <view class="quick-grid">
      <view
        v-for="item in quickActions"
        :key="item.kind"
        class="quick-item"
        @click="goRecords(item.kind)"
      >
        <text class="quick-icon">{{ item.icon }}</text>
        <text class="quick-label">{{ item.label }}</text>
      </view>
    </view>
```

- [ ] **Step 3: Remove the feature list section**

删除整段：

```vue
    <view class="feature-list">
      <view
        v-for="item in features"
        :key="item.url"
        class="feature-item"
        @click="goPage(item.url)"
      >
        <view class="feature-body">
          <view class="feature-title">{{ item.title }}</view>
          <view class="feature-desc">{{ item.desc }}</view>
        </view>
        <text class="feature-arrow">›</text>
      </view>
    </view>
```

- [ ] **Step 4: Update the script**

1. 在组件 import 区加入：

```js
import BabyPage from '../../components/baby/BabyPage.vue'
```

2. 删除 `quickActions` 和 `features` 两个常量数组。

3. 删除 `goRecords` 函数：

```js
function goRecords(kind) {
  uni.navigateTo({ url: `/package-baby/records/index?type=${kind}` })
}
```

4. 保留 `goPage`、`goSettings`，它们仍被预览卡片和资料卡使用。

- [ ] **Step 5: Remove obsolete styles**

删除以下两段完整样式：

```css
.quick-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}
.quick-item {
  width: calc(33.33% - 12rpx);
  padding: 28rpx 0;
  background: var(--surface);
  border-radius: 28rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.1);
}
.quick-icon {
  display: block;
  font-size: 44rpx;
}
.quick-label {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text);
}
```

```css
.feature-list {
  margin-top: 24rpx;
  background: var(--surface);
  border-radius: 40rpx;
  padding: 0 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.12);
}
.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.feature-item:last-child {
  border-bottom: none;
}
.feature-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.feature-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.feature-arrow {
  font-size: 32rpx;
  color: var(--text-secondary);
}
```

- [ ] **Step 6: Validate**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/pages/baby/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/pages/baby/index.vue OK`

- [ ] **Step 7: Commit**

```bash
git add src/pages/baby/index.vue
git commit -m "feat: add sidebar to baby home"
```

---

### Task 4: 日常记录页接入侧栏

**Files:**
- Modify: `src/package-baby/records/index.vue`

**Interfaces:**
- Consumes: `BabyPage`（Task 2）
- Produces: 侧栏高亮跟随当前 `kind`

- [ ] **Step 1: Wrap the template**

把：

```vue
<template>
  <view class="records-page">
```

改为：

```vue
<template>
  <BabyPage :active="kind">
    <view class="records-page">
```

把结尾：

```vue
    />
  </view>
</template>
```

改为：

```vue
      />
    </view>
  </BabyPage>
</template>
```

- [ ] **Step 2: Import BabyPage**

在 `RecordForm` import 之后加入：

```js
import BabyPage from '../../components/baby/BabyPage.vue'
```

- [ ] **Step 3: Validate**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/package-baby/records/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/package-baby/records/index.vue OK`

- [ ] **Step 4: Commit**

```bash
git add src/package-baby/records/index.vue
git commit -m "feat: add sidebar to records page"
```

---

### Task 5: 其余四个分包页面接入侧栏

**Files:**
- Modify: `src/package-baby/growth/index.vue`
- Modify: `src/package-baby/health/index.vue`
- Modify: `src/package-baby/journal/index.vue`
- Modify: `src/package-baby/settings/index.vue`

**Interfaces:**
- Consumes: `BabyPage`（Task 2）
- Produces: 各页面固定高亮对应入口

- [ ] **Step 1: Growth**

1. 模板开头：

```vue
<template>
  <view class="growth-page">
```

改为：

```vue
<template>
  <BabyPage active="growth">
    <view class="growth-page">
```

2. 结尾：

```vue
    <Disclaimer text="生长数据仅记录用户输入，不提供发育评估。如对宝宝生长有疑问，请咨询儿科医生。" />
  </view>
</template>
```

改为：

```vue
      <Disclaimer text="生长数据仅记录用户输入，不提供发育评估。如对宝宝生长有疑问，请咨询儿科医生。" />
    </view>
  </BabyPage>
</template>
```

3. 在 `Disclaimer` import 之后加入：

```js
import BabyPage from '../../components/baby/BabyPage.vue'
```

- [ ] **Step 2: Health**

1. 模板开头：

```vue
<template>
  <view class="health-page">
```

改为：

```vue
<template>
  <BabyPage active="health">
    <view class="health-page">
```

2. 结尾：

```vue
    </view>
  </view>
</template>
```

改为：

```vue
      </view>
    </view>
  </BabyPage>
</template>
```

3. 在 `Disclaimer` import 之后加入：

```js
import BabyPage from '../../components/baby/BabyPage.vue'
```

- [ ] **Step 3: Journal**

1. 模板开头：

```vue
<template>
  <view class="journal-page">
```

改为：

```vue
<template>
  <BabyPage active="journal">
    <view class="journal-page">
```

2. 结尾：

```vue
    />
  </view>
</template>
```

改为：

```vue
      />
    </view>
  </BabyPage>
</template>
```

3. 在 `Disclaimer` import 之后加入：

```js
import BabyPage from '../../components/baby/BabyPage.vue'
```

- [ ] **Step 4: Settings**

1. 模板开头：

```vue
<template>
  <view class="settings-page">
```

改为：

```vue
<template>
  <BabyPage active="settings">
    <view class="settings-page">
```

2. 结尾：

```vue
    </view>
  </view>
</template>
```

改为：

```vue
      </view>
    </view>
  </BabyPage>
</template>
```

3. 在 `<script setup>` 的 import 区加入：

```js
import BabyPage from '../../components/baby/BabyPage.vue'
```

- [ ] **Step 5: Validate all four SFCs**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/package-baby/growth/index.vue','src/package-baby/health/index.vue','src/package-baby/journal/index.vue','src/package-baby/settings/index.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
```

Expected: 四个文件均打印 `OK`。

- [ ] **Step 6: Build**

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`

- [ ] **Step 7: Commit**

```bash
git add src/package-baby/growth/index.vue src/package-baby/health/index.vue src/package-baby/journal/index.vue src/package-baby/settings/index.vue
git commit -m "feat: add sidebar to remaining baby pages"
```

---

### Task 6: 整体验证

**Files:**
- 无新增代码；如发现问题，修复后补测试并提交。

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: 所有测试文件通过，包括新增的 `tests/baby-sidebar.test.js`。

- [ ] **Step 2: Build both targets**

Run:

```bash
rm -rf dist/build/mp-weixin dist/build/h5
npm run build:mp-weixin
npm run build:h5
```

Expected: 两个构建均成功。

- [ ] **Step 3: Manual check in devtools**

导入 `dist/build/mp-weixin`，确认：

- 宝宝首页、日常记录、生长曲线、疫苗参考、成长手记、数据与设置 6 个页面左侧都有侧栏。
- 默认展开显示文字，点击「收起」缩为 emoji，再点展开；切换页面后状态保持。
- 当前页面入口高亮；日常记录切换 Tab 时高亮跟随。
- 点击喝奶/睡眠/排便进入日常记录并自动打开对应表单。
- 从分包页切换其他入口不会不断叠加页面栈（使用 redirectTo）。
- 内容区不被侧栏遮挡，图表、疫苗表格、表单在展开/收起时正常显示。
- 首页不再显示快捷记录区和功能列表。
- 分享、免责声明、广告位仍正常。
- 工具页和关于页没有侧栏。

- [ ] **Step 4: Review the working tree**

Run: `git status --short`

Expected: 只有本次有意修改；`dist/` 保持忽略。不要自行提交或推送，除非用户明确授权。

---

## Self-Review Notes

- **Spec coverage:** 侧栏状态与入口（Task 1）、侧栏/布局组件（Task 2）、首页接入与精简（Task 3）、日常记录高亮（Task 4）、其余四页（Task 5）、整体验证（Task 6）均有对应步骤。
- **Placeholder scan:** 无 TBD/TODO，组件与接入代码完整。
- **Type consistency:** `SIDEBAR_ITEMS` 的 key 与各页面 `active` 值一致（milk/sleep/diaper/health/growth/journal/settings）；`BabyPage` 与 `BabySidebar` 的 props/emits 名称一致；状态读取函数在组件与测试中同名。
