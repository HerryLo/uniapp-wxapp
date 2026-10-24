# 疫苗参考页表格化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把疫苗参考页的一类、二类疫苗列表改为可横向滑动的表格，保留全部现有交互。

**Architecture:** 只改 `src/package-baby/health/index.vue` 的模板与样式：用一个横向 `scroll-view` 包住两张 flex 表格，列宽固定、总宽超出屏幕；脚本逻辑和 `src/utils/baby/vaccines.js` 完全复用，不改数据层。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vitest，目标平台 `mp-weixin` 与 H5。

## Global Constraints

- 数据只保存在本机，不新增网络请求、不新增依赖。
- 二类疫苗必须保留「自费自愿」标签和「请咨询接种门诊」提示。
- 沿用粉色主题 CSS 变量：`--surface`、`--text`、`--text-secondary`、`--border`、`--primary-strong`、`--danger`、`--success`。
- 不改 `src/utils/baby/vaccines.js`、不改存储 key、不改其他页面。
- 提交仅在用户授权后执行。

---

### Task 1: 疫苗列表改为横向滑动表格

**Files:**
- Modify: `src/package-baby/health/index.vue:17-55`（模板列表区）
- Modify: `src/package-baby/health/index.vue:262-348`（列表样式区）

**Interfaces:**
- Consumes: `groups`（`groupVaccines` 结果）、`toggle(item)`、`changeDate(item, date)`、`removeCustom(item)`、`statusOf(item)`、`formatMonthAge(month)`、`today`
- Produces: 无新增导出；页面 DOM 结构变为表格

- [ ] **Step 1: 替换模板中的分组列表**

把 `src/package-baby/health/index.vue` 中从 `<view v-for="group in groups" :key="group.type" class="card">` 开始、到该分组卡片结束的整段内容（当前第 17–55 行）替换为：

```vue
    <view class="table-tip">左右滑动查看完整表格</view>

    <scroll-view scroll-x class="table-scroll">
      <view class="vaccine-table">
        <view v-for="group in groups" :key="group.type" class="group-block">
          <view class="group-head">
            <text class="group-title">{{ group.type }}疫苗</text>
            <text v-if="group.type === '二类'" class="self-paid-tag">自费自愿</text>
          </view>
          <view v-if="group.type === '二类'" class="group-note">
            二类疫苗为自费自愿接种，请咨询接种门诊。
          </view>

          <view class="table-row table-header">
            <view class="cell col-check">接种</view>
            <view class="cell col-name">疫苗名称</view>
            <view class="cell col-month">参考月龄</view>
            <view class="cell col-status">状态</view>
            <view class="cell col-date">接种日期</view>
            <view class="cell col-action">操作</view>
          </view>

          <view v-for="item in group.items" :key="item.id" class="table-row">
            <view class="cell col-check" @click="toggle(item)">
              <view class="check" :class="{ checked: item.done }">{{ item.done ? '✓' : '' }}</view>
            </view>
            <view class="cell col-name">
              <view class="vaccine-name">
                {{ item.name }}
                <text v-if="item.type === '二类'" class="mini-tag">自费自愿</text>
              </view>
              <view v-if="statusOf(item).key === 'overdue'" class="overdue-note">
                请咨询接种门诊
              </view>
            </view>
            <view class="cell col-month">{{ formatMonthAge(item.month) }}</view>
            <view class="cell col-status">
              <text class="status" :class="statusOf(item).key">{{ statusOf(item).label }}</text>
            </view>
            <view class="cell col-date">
              <picker
                v-if="item.done"
                mode="date"
                :value="item.date || today"
                @change="changeDate(item, $event.detail.value)"
              >
                <view class="date-field">{{ item.date || '选择日期' }} ›</view>
              </picker>
              <text v-else class="date-empty">—</text>
            </view>
            <view class="cell col-action">
              <text v-if="!item.builtin" class="custom-delete" @click.stop="removeCustom(item)">删除</text>
              <text v-else class="action-none">—</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
```

- [ ] **Step 2: 替换旧的列表样式**

在 `<style scoped>` 中，把从 `.vaccine-item {` 开始、到 `.custom-delete { ... }` 结束的整段样式（当前第 262–348 行）替换为：

```css
.table-tip {
  margin-top: 24rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}
.table-scroll {
  width: 100%;
  margin-top: 12rpx;
  white-space: nowrap;
}
.vaccine-table {
  display: flex;
  flex-direction: column;
}
.group-block {
  width: 1020rpx;
  box-sizing: border-box;
  padding: 24rpx;
  background: var(--surface);
  border-radius: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.12);
}
.group-block + .group-block {
  margin-top: 24rpx;
}
.table-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1rpx solid var(--border);
}
.group-block .table-row:last-child {
  border-bottom: none;
}
.cell {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 20rpx 12rpx;
  font-size: 24rpx;
  color: var(--text);
  white-space: normal;
  word-break: break-all;
}
.table-header .cell {
  padding: 16rpx 12rpx;
  background: #FFF1F3;
  font-size: 22rpx;
  font-weight: 600;
  color: var(--text-secondary);
}
.table-header .col-check {
  border-radius: 16rpx 0 0 16rpx;
}
.table-header .col-action {
  border-radius: 0 16rpx 16rpx 0;
}
.col-check {
  width: 72rpx;
  justify-content: center;
}
.col-name {
  width: 300rpx;
  flex-direction: column;
  align-items: flex-start;
}
.col-month {
  width: 140rpx;
}
.col-status {
  width: 160rpx;
}
.col-date {
  width: 200rpx;
}
.col-action {
  width: 100rpx;
  justify-content: center;
}
.check {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border);
  border-radius: 12rpx;
  color: #FFFFFF;
  font-size: 24rpx;
}
.check.checked {
  background: var(--primary-strong);
  border-color: var(--primary-strong);
}
.vaccine-name {
  font-size: 26rpx;
  line-height: 1.4;
  color: var(--text);
}
.vaccine-name .mini-tag {
  display: inline-block;
  margin-left: 6rpx;
  vertical-align: middle;
}
.overdue-note {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: var(--danger);
}
.status {
  font-size: 22rpx;
}
.status.done {
  color: var(--success);
}
.status.due {
  color: var(--primary-strong);
}
.status.overdue {
  color: var(--danger);
}
.status.pending {
  color: var(--text-secondary);
}
.date-field {
  padding: 8rpx 12rpx;
  border: 1rpx solid var(--border);
  border-radius: 12rpx;
  font-size: 22rpx;
  color: var(--text);
  white-space: nowrap;
}
.date-empty,
.action-none {
  font-size: 22rpx;
  color: var(--text-secondary);
}
.custom-delete {
  font-size: 22rpx;
  color: var(--danger);
}
```

注意：`.self-paid-tag`、`.mini-tag`、`.group-head`、`.group-title`、`.group-note` 的原有样式保留不动。

- [ ] **Step 3: 校验 SFC 语法**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/package-baby/health/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
```

Expected: `src/package-baby/health/index.vue OK`

- [ ] **Step 4: 构建微信小程序**

Run: `npm run build:mp-weixin`

Expected: `DONE Build complete.`

- [ ] **Step 5: 运行测试**

Run: `npm test`

Expected: 13 个测试文件、72 个测试全部通过（本次不改逻辑层）。

- [ ] **Step 6: 开发者工具人工检查**

导入 `dist/build/mp-weixin`，打开「宝宝 → 疫苗参考」确认：

- 一类、二类表格可左右滑动，列对齐，表头固定显示。
- 点击勾选列可切换接种状态；已接种后日期列出现日期选择器并可修改。
- 自定义疫苗的「删除」可二次确认删除，内置项显示「—」。
- 二类分组保留「自费自愿」标签和「请咨询接种门诊」文案。
- 无出生日期时月龄显示「未设置」，状态显示「未接种」。

- [ ] **Step 7: 提交**

```bash
git add src/package-baby/health/index.vue
git commit -m "feat: render vaccine reference as scrollable table"
```

---

## Self-Review Notes

- **Spec coverage:** 横向滑动（Step 1–2）、六列（Step 1–2）、分组与二类文案（Step 1）、交互复用（Step 1）、验证（Step 3–6）均有对应步骤。
- **Placeholder scan:** 无 TBD/TODO，模板和样式均为完整代码。
- **Type consistency:** 只使用页面已有函数 `toggle`、`changeDate`、`removeCustom`、`statusOf`、`formatMonthAge`、`groups`、`today`，签名与现状一致。
