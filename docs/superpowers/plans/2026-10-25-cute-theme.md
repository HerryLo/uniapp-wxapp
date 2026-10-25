# 奶油糖果风可爱化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有粉色主题上统一增加奶油糖果风细节，让宝宝页和工具页更可爱，同时保持表单、计算和表格的可读性。

**Architecture:** 先在 `App.vue` 统一卡片、按钮、输入框、chips、结果区和空状态；再调整共享组件；最后给各页面补 emoji、浅色统计块和空状态文案。不改布局与业务逻辑。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + WXSS/H5 CSS，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 不引入外部图片、字体、图标库或 UI 组件库。
- 不改页面结构、信息层级、业务逻辑、数据读写、备份、分享、广告和侧栏行为。
- 可爱元素只做点缀；表单文字、计算结果、疫苗表格保持清晰。
- 不使用循环动画；动效只放在可点击元素上。
- 所有页面共享同一套圆角、阴影和按钮规范。
- 提交仅在用户授权后执行。

---

### Task 1: 全局主题与共享组件

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/ShareButton.vue`
- Modify: `src/components/baby/Disclaimer.vue`
- Modify: `src/components/baby/RecordForm.vue`

**Interfaces:**
- 不新增导出；CSS 变量新增 `--peach`、`--cream`。

- [ ] **Step 1: Add candy color tokens and page background**

在 `src/App.vue` 的 `page` 规则中，`--accent-warm` 之后加入：

```css
  --peach: #FFB6C1;
  --cream: #FFFDFC;
```

并把：

```css
  background-color: var(--bg);
```

改为：

```css
  background-color: var(--bg);
  background-image: linear-gradient(180deg, #FFF3F5 0%, #FFF9F5 320rpx);
```

- [ ] **Step 2: Update global card, inputs, chips and buttons**

把 `.card` 规则替换为：

```css
.card {
  margin-top: 24rpx;
  background: var(--surface);
  border-radius: 48rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(255, 228, 225, 0.9);
  box-shadow: 0 10rpx 30rpx rgba(255, 143, 163, 0.14);
}
```

把 `.input`、`.textarea`、`.picker-field` 中的：

```css
  background: #FFFFFF;
  border-radius: 24rpx;
```

统一改为：

```css
  background: var(--cream);
  border-radius: 28rpx;
```

把 `.chip` 规则替换为：

```css
.chip {
  margin-right: 16rpx;
  margin-bottom: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--text-secondary);
  font-size: 28rpx;
  transition: transform 0.12s ease, opacity 0.12s ease;
}
```

把 `.chip.active` 替换为：

```css
.chip.active {
  background: linear-gradient(135deg, #FFE4E1, #FFD6DE);
  color: var(--primary-strong);
  font-weight: 600;
}
.chip:active {
  transform: scale(0.97);
  opacity: 0.9;
}
```

把 `.btn` 规则替换为：

```css
.btn {
  width: 48%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 30rpx;
  transition: transform 0.12s ease, opacity 0.12s ease;
}
```

把 `.btn-primary` 替换为：

```css
.btn-primary {
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  color: #FFFFFF;
  box-shadow: 0 8rpx 20rpx rgba(232, 111, 135, 0.25);
}
```

把 `.btn:active` 替换为：

```css
.btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}
```

把 `.result-box` 替换为：

```css
.result-box {
  margin-top: 24rpx;
  padding: 24rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 32rpx;
}
```

把 `.empty-tip` 替换为：

```css
.empty-tip {
  margin-top: 24rpx;
  text-align: center;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Make ShareButton a candy pill**

在 `src/components/ShareButton.vue` 中，把 `.share-btn` 替换为：

```css
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 12rpx 32rpx;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  color: #FFFFFF;
  font-size: 26rpx;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 8rpx 20rpx rgba(232, 111, 135, 0.22);
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.share-btn::after {
  border: none;
}
.share-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}
```

- [ ] **Step 4: Cute up the disclaimer**

在 `src/components/baby/Disclaimer.vue` 中，把标题：

```vue
    <text class="disclaimer-title">温馨提示</text>
```

改为：

```vue
    <text class="disclaimer-title">💡 温馨提示</text>
```

把 `.disclaimer-box` 的：

```css
  background: #FFF1F3;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
```

改为：

```css
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 32rpx;
```

- [ ] **Step 5: Add emoji to form titles and soften form fields**

在 `src/components/baby/RecordForm.vue` 的 `title` 计算属性中，改为：

```js
const title = computed(() => {
  if (props.kind === 'sleep') return '😴 记录睡眠'
  if (props.kind === 'diaper') return '💧 记录排便'
  return '🍼 记录喝奶'
})
```

把 `.form-sheet` 的 `border-radius` 改为：

```css
  border-radius: 48rpx 48rpx 0 0;
```

把 `.form-picker` 的：

```css
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
```

改为：

```css
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 28rpx;
```

- [ ] **Step 6: Validate and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/App.vue','src/components/ShareButton.vue','src/components/baby/Disclaimer.vue','src/components/baby/RecordForm.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
npm run build:mp-weixin
```

Expected: 四个文件均打印 `OK`；构建成功。

- [ ] **Step 7: Commit**

```bash
git add src/App.vue src/components/ShareButton.vue src/components/baby/Disclaimer.vue src/components/baby/RecordForm.vue
git commit -m "style: apply candy theme to global styles and shared components"
```

---

### Task 2: 宝宝首页与日常记录

**Files:**
- Modify: `src/pages/baby/index.vue`
- Modify: `src/package-baby/records/index.vue`

**Interfaces:**
- 无接口变化。

- [ ] **Step 1: Add emoji to baby home card titles**

在 `src/pages/baby/index.vue` 中替换：

```vue
      <view class="card-title">今日记录</view>
```

为：

```vue
      <view class="card-title">🍼 今日记录</view>
```

替换：

```vue
      <view class="card-title">下一条疫苗参考</view>
```

为：

```vue
      <view class="card-title">💉 下一条疫苗参考</view>
```

替换：

```vue
      <view class="card-title">最近生长</view>
```

为：

```vue
      <view class="card-title">📈 最近生长</view>
```

- [ ] **Step 2: Decorate the profile card and today cells**

在 `.profile-card` 规则中加入：

```css
  position: relative;
  overflow: hidden;
```

并在其后加入：

```css
.profile-card > view {
  position: relative;
  z-index: 1;
}
.profile-card::before {
  content: '';
  position: absolute;
  top: -70rpx;
  right: -50rpx;
  width: 190rpx;
  height: 190rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}
.profile-card::after {
  content: '';
  position: absolute;
  bottom: -40rpx;
  right: 120rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
}
```

把 `.today-cell` 替换为：

```css
.today-cell {
  width: 31%;
  padding: 20rpx 8rpx;
  border-radius: 28rpx;
  text-align: center;
  background: #FFF1F3;
}
.today-cell:nth-child(2) {
  background: #F0FAF4;
}
.today-cell:nth-child(3) {
  background: #FFFAE6;
}
```

- [ ] **Step 3: Add emoji to record tabs and rows**

在 `src/package-baby/records/index.vue` 中把 `kinds` 改为：

```js
const kinds = [
  { key: 'milk', label: '🍼 喝奶' },
  { key: 'sleep', label: '😴 睡眠' },
  { key: 'diaper', label: '💧 排便' },
]
```

把空状态：

```vue
      <view v-if="!list.length" class="empty-tip">今天还没有记录</view>
```

改为：

```vue
      <view v-if="!list.length" class="empty-tip">今天还没有记录，点“添加”记一笔吧 🐣</view>
```

把三类记录主文案分别改为：

```vue
            <view class="record-main">🍼 {{ item.time.slice(11) }} · {{ item.type }}</view>
```

```vue
            <view class="record-main">😴 {{ item.start.slice(11) }} – {{ item.end.slice(11) }}</view>
```

```vue
            <view class="record-main">💧 {{ item.time.slice(11) }} · {{ item.type }}</view>
```

把趋势卡标题：

```vue
        <text class="trend-chart-title">近 7 天奶量趋势</text>
```

改为：

```vue
        <text class="trend-chart-title">🍼 近 7 天奶量趋势</text>
```

- [ ] **Step 4: Add pastel stat cards**

在 `.stat-card` 规则之后加入：

```css
.stat-card:nth-child(1) {
  background: #FFF1F3;
}
.stat-card:nth-child(2) {
  background: #F0FAF4;
}
.stat-card:nth-child(3) {
  background: #FFFAE6;
}
```

- [ ] **Step 5: Validate and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/pages/baby/index.vue','src/package-baby/records/index.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
npm run build:mp-weixin
```

Expected: 两个文件打印 `OK`；构建成功。

- [ ] **Step 6: Commit**

```bash
git add src/pages/baby/index.vue src/package-baby/records/index.vue
git commit -m "style: cute up baby home and records page"
```

---

### Task 3: 生长、疫苗、手记、设置

**Files:**
- Modify: `src/package-baby/growth/index.vue`
- Modify: `src/package-baby/health/index.vue`
- Modify: `src/package-baby/journal/index.vue`
- Modify: `src/package-baby/settings/index.vue`

**Interfaces:**
- 无接口变化。

- [ ] **Step 1: Growth page**

把卡片标题替换为：

```vue
      <view class="card-title">📏 记录身高体重</view>
```

```vue
      <view class="card-title">📈 身高曲线（cm）</view>
```

```vue
      <view class="card-title">⚖️ 体重曲线（kg）</view>
```

```vue
      <view class="card-title">🗂 历史记录</view>
```

把两个「暂无数据」改为「暂无数据 🌱」，把「还没有生长记录」改为「还没有生长记录 🌱」。

把 `.history-item` 替换为：

```css
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
  padding: 20rpx;
  background: var(--cream);
  border-radius: 24rpx;
}
```

- [ ] **Step 2: Health page**

把分组标题：

```vue
            <text class="group-title">{{ group.type }}疫苗</text>
```

改为：

```vue
            <text class="group-title">{{ group.type === '一类' ? '🛡' : '💉' }} {{ group.type }}疫苗</text>
```

把 `.source-card` 的 `border-radius: 24rpx;` 改为 `border-radius: 32rpx;`。

- [ ] **Step 3: Journal page**

把卡片标题替换为：

```vue
      <view class="card-title">🌟 成长里程碑</view>
```

```vue
      <view class="card-title">📖 里程碑时间线</view>
```

```vue
      <view class="card-title">💭 今天的心情</view>
```

```vue
      <view class="card-title">✏️ 育儿心得</view>
```

把两个空状态加 emoji：

```vue
      <view v-if="!milestones.length" class="empty-tip">还没有里程碑记录 🌱</view>
```

```vue
      <view v-if="!notes.length" class="empty-tip">还没有心得记录 🌱</view>
```

在 `.mood-item` 中加入默认背景：

```css
  background: var(--cream);
```

- [ ] **Step 4: Settings page**

把：

```vue
      <view class="card-title">宝宝资料</view>
```

改为：

```vue
      <view class="card-title">👶 宝宝资料</view>
```

把：

```vue
      <view class="card-title">数据管理</view>
```

改为：

```vue
      <view class="card-title">📦 数据管理</view>
```

把三个行标题改为：

```vue
          <view class="row-title">📤 导出数据</view>
```

```vue
          <view class="row-title">📥 恢复数据</view>
```

```vue
          <view class="row-title">🧹 清空宝宝数据</view>
```

- [ ] **Step 5: Validate and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/package-baby/growth/index.vue','src/package-baby/health/index.vue','src/package-baby/journal/index.vue','src/package-baby/settings/index.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
npm run build:mp-weixin
```

Expected: 四个文件打印 `OK`；构建成功。

- [ ] **Step 6: Commit**

```bash
git add src/package-baby/growth/index.vue src/package-baby/health/index.vue src/package-baby/journal/index.vue src/package-baby/settings/index.vue
git commit -m "style: cute up growth health journal and settings pages"
```

---

### Task 4: 工具页与关于页

**Files:**
- Modify: `src/pages/tools/index.vue`
- Modify: `src/pages/about/about.vue`

**Interfaces:**
- 无接口变化。

- [ ] **Step 1: Add emoji to the tools list**

把 `src/pages/tools/index.vue` 的 `tools` 数组改为：

```js
const tools = [
  { key: 'vat', name: '增值税', emoji: '🧮', desc: '含税 / 不含税' },
  { key: 'unit', name: '单位换算', emoji: '📐', desc: '长度 / 重量 / 温度' },
  { key: 'text', name: '文本处理', emoji: '✂️', desc: '去重 / 大小写' },
  { key: 'radix', name: '进制转换', emoji: '🔢', desc: '2–36 进制' },
]
```

把工具格标题：

```vue
            <text class="tool-name">{{ tool.name }}</text>
```

改为：

```vue
            <text class="tool-name">{{ tool.emoji }} {{ tool.name }}</text>
```

- [ ] **Step 2: Soften tool cells and FAB**

把 `.tool-cell` 的：

```css
  background: #FFF9F5;
  border: 2rpx solid transparent;
  border-radius: 24rpx;
```

改为：

```css
  background: var(--cream);
  border: 2rpx solid transparent;
  border-radius: 32rpx;
  transition: transform 0.12s ease, opacity 0.12s ease;
```

在 `.tool-cell.active` 之后加入：

```css
.tool-cell:active {
  transform: scale(0.98);
  opacity: 0.9;
}
```

把 `.tools-fab` 的 `background` 和 `box-shadow` 改为：

```css
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  box-shadow: 0 10rpx 26rpx rgba(232, 111, 135, 0.3);
```

并加入：

```css
  transition: transform 0.12s ease;
```

在 `.tools-fab` 规则之后加入：

```css
.tools-fab:active {
  transform: scale(0.94);
}
```

- [ ] **Step 3: Cute up the about page**

把四个分区标题替换为：

```vue
      <view class="section-title">✨ 功能</view>
```

```vue
      <view class="section-title">📌 免责声明</view>
```

```vue
      <view class="section-title">🔒 隐私说明</view>
```

```vue
      <view class="section-title">🌱 开源</view>
```

把 `.version` 替换为：

```css
.version {
  margin-top: 12rpx;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 24rpx;
}
```

把 `.logo` 的 `border-radius` 改为 `32rpx`。

在最后一个 `</view>`（开源卡片后、页面根节点结束前）加入：

```vue
    <view class="footer-note">愿你记录下的每一天都软软的 🍞</view>
```

并在 `<style scoped>` 末尾加入：

```css
.footer-note {
  margin-top: 40rpx;
  text-align: center;
  font-size: 24rpx;
  color: var(--text-secondary);
}
```

- [ ] **Step 4: Validate and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');for (const file of ['src/pages/tools/index.vue','src/pages/about/about.vue']) { const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK') }"
npm run build:mp-weixin
```

Expected: 两个文件打印 `OK`；构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/index.vue src/pages/about/about.vue
git commit -m "style: cute up tools and about pages"
```

---

### Task 5: 整体验证

**Files:**
- 无新增代码；如发现问题，修复后补测试并提交。

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: 全部测试通过。

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

- 宝宝首页、日常记录、生长、疫苗、手记、设置、工具页、关于页的圆角、阴影、按钮和输入框统一。
- 统计卡浅色底不刺眼，文字对比度足够。
- 疫苗表格横向滑动、生长图表、工具计算结果未被样式破坏。
- 侧栏展开/收起、悬浮图标、分享按钮、广告位布局正常。
- 页面滚动流畅，没有循环动画或明显掉帧。

- [ ] **Step 4: Review the working tree**

Run: `git status --short`

Expected: 只有本次有意修改；`dist/` 保持忽略。不要自行提交或推送，除非用户明确授权。

---

## Self-Review Notes

- **Spec coverage:** 全局主题（Task 1）、宝宝首页与记录页（Task 2）、四个宝宝分包页（Task 3）、工具与关于（Task 4）、整体验证（Task 5）覆盖设计稿全部内容。
- **Placeholder scan:** 无 TBD/TODO，样式与模板替换均为完整代码。
- **Type consistency:** 新 CSS 变量 `--peach`、`--cream` 在全局定义并在页面中使用；emoji 直接写入模板，不新增运行时数据结构（工具页新增 `emoji` 字段并同步模板）。
