# 宝宝页与工具页分享能力 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为宝宝首页和工具页增加页面内分享按钮、朋友圈分享和统一品牌分享标题。

**Architecture:** 新增一个跨平台 `ShareButton` 组件（微信原生分享按钮 / H5 复制链接），两个 Tab 页分别接入并补全 `onShareTimeline` 与 `showShareMenu`，最后在 `pages.json` 开启分享配置。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vite 5 + Vitest，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 分享标题统一使用「垣计算」品牌。
- 分享封面统一使用 `/static/logo.png`，避免泄露宝宝昵称和月龄。
- 微信端分享菜单必须同时包含「发送给朋友」和「分享到朋友圈」。
- 工具页分享路径/query 必须携带当前 `tool`，打开后恢复对应工具。
- 不新增网络请求、不上传数据、不加依赖。
- 只改两个 Tab 页、`pages.json` 和新组件；分包页面与关于页不动。
- 提交仅在用户授权后执行。

---

### Task 1: 新增 ShareButton 组件

**Files:**
- Create: `src/components/ShareButton.vue`

**Interfaces:**
- Props：`label?: string`（默认「分享给朋友」）
- 无 emits；微信端依赖页面注册 `onShareAppMessage`

- [ ] **Step 1: Create the component**

Create `src/components/ShareButton.vue`:

```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <button class="share-btn" open-type="share">{{ displayLabel }}</button>
  <!-- #endif -->
  <!-- #ifdef H5 -->
  <button class="share-btn" @click="copyLink">{{ displayLabel }}</button>
  <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
})

const displayLabel = computed(() => props.label || '分享给朋友')

function copyLink() {
  // #ifdef H5
  uni.setClipboardData({
    data: window.location.href,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'none' })
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' })
    },
  })
  // #endif
}
</script>

<style scoped>
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 12rpx 28rpx;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 26rpx;
  line-height: 1.4;
  white-space: nowrap;
}
.share-btn::after {
  border: none;
}
</style>
```

- [ ] **Step 2: Validate the SFC**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/components/ShareButton.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/components/ShareButton.vue OK`

- [ ] **Step 3: Commit**

```bash
git add src/components/ShareButton.vue
git commit -m "feat: add share button component"
```

---

### Task 2: 宝宝首页接入分享

**Files:**
- Modify: `src/pages/baby/index.vue`

**Interfaces:**
- Consumes: `ShareButton`（Task 1）
- Produces: 页面分享标题/路径/封面、朋友圈 query、分享菜单

- [ ] **Step 1: Add the button to the template**

在 `feature-list` 的结束 `</view>` 之后、`<Disclaimer />` 之前插入：

```vue
    <ShareButton class="share-entry" />
```

- [ ] **Step 2: Update the script**

把生命周期 import 改为：

```js
import {
  onLoad,
  onShareAppMessage,
  onShareTimeline,
  onShow,
} from '@dcloudio/uni-app'
```

在组件 import 区加入：

```js
import ShareButton from '../../components/ShareButton.vue'
```

在 `onShow(refresh)` 之前加入：

```js
onLoad(() => {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
  // #endif
})
```

把现有的 `onShareAppMessage` 替换为：

```js
onShareAppMessage(() => ({
  title: '垣计算 · 记录宝宝成长',
  path: '/pages/baby/index',
  imageUrl: '/static/logo.png',
}))

onShareTimeline(() => ({
  title: '垣计算 · 记录宝宝成长',
  imageUrl: '/static/logo.png',
}))
```

- [ ] **Step 3: Add the style**

在 `<style scoped>` 中已有的 `.baby-page` 规则之后加入：

```css
.share-entry {
  display: flex;
  width: 100%;
  margin-top: 24rpx;
}
```

- [ ] **Step 4: Validate the SFC**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/pages/baby/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/pages/baby/index.vue OK`

- [ ] **Step 5: Commit**

```bash
git add src/pages/baby/index.vue
git commit -m "feat: add sharing to baby home"
```

---

### Task 3: 工具页接入分享

**Files:**
- Modify: `src/pages/tools/index.vue`

**Interfaces:**
- Consumes: `ShareButton`（Task 1）
- Produces: 页面分享标题/路径/封面、朋友圈 query、分享菜单

- [ ] **Step 1: Update the footer template**

把：

```vue
      <AdBanner />
      <view class="about-link" @click="openAbout">关于与免责声明</view>
```

替换为：

```vue
      <AdBanner />
      <view class="footer-links">
        <view class="about-link" @click="openAbout">关于与免责声明</view>
        <ShareButton class="share-entry" />
      </view>
```

- [ ] **Step 2: Update the script**

把生命周期 import 改为：

```js
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
```

在组件 import 区加入：

```js
import ShareButton from '../../components/ShareButton.vue'
```

把现有的 `onLoad` 改为：

```js
onLoad((options) => {
  if (options && tools.some((tool) => tool.key === options.tool)) {
    active.value = options.tool
  }
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
  // #endif
})
```

把现有的 `onShareAppMessage` 替换为：

```js
onShareAppMessage(() => ({
  title: '垣计算 · 日常计算工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
  imageUrl: '/static/logo.png',
}))

onShareTimeline(() => ({
  title: '垣计算 · 日常计算工具箱',
  query: `tool=${active.value}`,
  imageUrl: '/static/logo.png',
}))
```

- [ ] **Step 3: Update the footer styles**

把现有的 `.about-link` 规则：

```css
.about-link {
  margin: 48rpx 32rpx 0;
  padding: 24rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-secondary);
}
```

替换为：

```css
.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 48rpx 32rpx 0;
}
.about-link {
  padding: 12rpx 0;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.share-entry {
  margin-left: 24rpx;
}
```

- [ ] **Step 4: Validate the SFC**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/pages/tools/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/pages/tools/index.vue OK`

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/index.vue
git commit -m "feat: add sharing to tools page"
```

---

### Task 4: 开启分享菜单配置并整体验证

**Files:**
- Modify: `src/pages.json`

**Interfaces:**
- Consumes: Task 2/3 的分享回调
- Produces: 页面级 `enableShareAppMessage` / `enableShareTimeline` 配置

- [ ] **Step 1: Add page share flags**

在 `src/pages.json` 的 `pages/baby/index` 与 `pages/tools/index` 的 `style` 中分别加入：

```json
"enableShareAppMessage": true,
"enableShareTimeline": true
```

`pages/baby/index` 的 style 最终为：

```json
{
  "path": "pages/baby/index",
  "style": {
    "navigationBarTitleText": "宝宝记录",
    "enableShareAppMessage": true,
    "enableShareTimeline": true
  }
}
```

`pages/tools/index` 的 style 最终为：

```json
{
  "path": "pages/tools/index",
  "style": {
    "navigationBarTitleText": "工具箱",
    "enableShareAppMessage": true,
    "enableShareTimeline": true
  }
}
```

- [ ] **Step 2: Build and verify compiled config**

Run:

```bash
npm run build:mp-weixin
node -e "const fs=require('fs');for (const p of ['dist/build/mp-weixin/pages/baby/index.json','dist/build/mp-weixin/pages/tools/index.json']) { const j=JSON.parse(fs.readFileSync(p,'utf8')); console.log(p, j.enableShareAppMessage, j.enableShareTimeline) }"
node -e "const fs=require('fs');for (const p of ['dist/build/mp-weixin/pages/baby/index.js','dist/build/mp-weixin/pages/tools/index.js']) { const s=fs.readFileSync(p,'utf8'); console.log(p, s.includes('onShareAppMessage'), s.includes('onShareTimeline')) }"
```

Expected:

```text
dist/build/mp-weixin/pages/baby/index.json true true
dist/build/mp-weixin/pages/tools/index.json true true
dist/build/mp-weixin/pages/baby/index.js true true
dist/build/mp-weixin/pages/tools/index.js true true
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: 13 个测试文件、75 个测试全部通过（本次不改逻辑层）。

- [ ] **Step 4: Manual check in devtools**

导入 `dist/build/mp-weixin` 确认：

- 宝宝首页功能列表下方出现「分享给朋友」，点击可调起分享面板。
- 工具页底部「关于与免责声明」右侧出现「分享给朋友」，点击可调起分享面板。
- 右上角菜单同时包含「发送给朋友」和「分享到朋友圈」。
- 切换到「单位换算」后分享，打开分享链接仍停留在单位换算。
- 分享卡片标题为「垣计算 · …」，封面为 logo，不显示宝宝资料。

- [ ] **Step 5: Build H5 and check the fallback**

Run: `npm run build:h5`

Expected: 构建成功；在 H5 中点击分享按钮提示「链接已复制」。

- [ ] **Step 6: Commit**

```bash
git add src/pages.json
git commit -m "feat: enable page share menu configuration"
```

---

## Self-Review Notes

- **Spec coverage:** 新组件（Task 1）、宝宝页入口与回调（Task 2）、工具页入口与回调（Task 3）、页面分享配置（Task 4）、验证（Task 4）均有对应步骤。
- **Placeholder scan:** 无 TBD/TODO，所有代码、命令与预期输出完整。
- **Type consistency:** `ShareButton` 的 `label` prop 在任务间一致；两个页面均使用 `onShareAppMessage` / `onShareTimeline`；工具页 query 字段 `tool` 与现有 `onLoad` 读取逻辑一致。
