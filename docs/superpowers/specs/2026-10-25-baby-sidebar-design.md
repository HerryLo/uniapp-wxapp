# 宝宝模块左侧固定侧栏设计

日期：2026-10-25
范围：6 个宝宝页面、2 个新组件、1 个侧栏状态模块

## 目标

在宝宝首页和全部宝宝分包页面左侧提供固定侧栏，默认展开、可点击收起，集中放置宝宝各页面入口，替代首页现有的快捷记录区和功能列表。

## 覆盖页面

1. `pages/baby/index`：宝宝首页
2. `package-baby/records/index`：日常记录
3. `package-baby/growth/index`：生长曲线
4. `package-baby/health/index`：疫苗参考
5. `package-baby/journal/index`：成长手记
6. `package-baby/settings/index`：数据与设置

侧栏不出现在工具页、关于页。

## 侧栏内容

按以下顺序展示 8 个入口：

| key | 文案 | 目标 |
|---|---|---|
| home | 首页 | `/pages/baby/index` |
| milk | 喝奶 | `/package-baby/records/index?type=milk` |
| sleep | 睡眠 | `/package-baby/records/index?type=sleep` |
| diaper | 排便 | `/package-baby/records/index?type=diaper` |
| health | 疫苗 | `/package-baby/health/index` |
| growth | 生长 | `/package-baby/growth/index` |
| journal | 手记 | `/package-baby/journal/index` |
| settings | 设置 | `/package-baby/settings/index` |

喝奶/睡眠/排便进入日常记录后只切换到对应 Tab，不自动打开记录表单。

## 布局与交互

- 侧栏固定在页面左侧，`position: fixed`，浅粉到奶油色渐变背景，右边框使用 `var(--border)`。
- 默认展开：宽度 120rpx，只显示文案，文字居中，不显示图标。
- 收起：隐藏侧栏，内容区恢复全宽；左下角出现一个圆形悬浮图标。
- 悬浮图标可拖动，位置限制在窗口范围内；点击图标重新展开侧栏。
- 内容区通过 `margin-left` 跟随展开/收起变化，带 0.2s 过渡，避免遮挡内容。
- 当前页面入口高亮：
  - 日常记录按当前 Tab 高亮喝奶/睡眠/排便
  - 生长、疫苗、成长、设置页高亮对应入口
  - 宝宝首页高亮「首页」
- 选中效果：白色背景、主题色文字、加粗，并在左侧显示主题色内阴影条。
- 点击当前已激活项不重复导航。
- 从宝宝首页进入分包页使用 `uni.navigateTo`；分包页之间切换使用 `uni.redirectTo`，避免页面栈持续增长。
- 返回宝宝首页使用 `uni.switchTab`。
- H5 环境对 `getCurrentPages` 做存在性判断，缺失时回退 `navigateTo`。
- 收起状态和悬浮图标位置保存在内存中：本次使用期间跨页面保持一致，重新打开小程序后恢复为默认展开、左下角默认位置。
- 侧栏底部预留 `env(safe-area-inset-bottom)` 间距。

## 组件设计

### `src/utils/baby/sidebar.js`

- `SIDEBAR_ITEMS`：上表 8 项数组。
- `loadSidebarCollapsed(): boolean`：读取当前会话的收起状态，默认 `false`（展开）。
- `saveSidebarCollapsed(collapsed: boolean): boolean`：更新当前会话的收起状态。
- `loadSidebarPosition(): { left, top } | null`：读取悬浮图标位置。
- `saveSidebarPosition(left, top): boolean`：保存悬浮图标位置。

### `src/components/baby/BabySidebar.vue`

- Props：
  - `active: string`，默认空字符串
  - `collapsed: boolean`，默认 `false`
- Emits：`toggle`
- 展开时渲染 8 个入口和底部的收起按钮。
- 收起时渲染可拖动的圆形悬浮图标，点击后触发 `toggle` 展开。
- 拖动使用 `touchstart/touchmove/touchend`，移动超过 4px 视为拖动并阻止误触展开。
- 点击入口时按当前页面判断 `navigateTo`、`redirectTo` 或返回首页的 `switchTab`。

### `src/components/baby/BabyPage.vue`

- Props：`active: string`，默认空字符串
- 读取 `loadSidebarCollapsed()` 初始化收起状态。
- 切换时调用 `saveSidebarCollapsed()`。
- 模板结构：内容区 slot + `BabySidebar`。

## 页面接入

- 每个宝宝页面用 `<BabyPage>` 包裹现有根节点。
- `active` 传值：
  - 首页：`active="home"`
  - 日常记录：`:active="kind"`
  - 生长：`active="growth"`
  - 疫苗：`active="health"`
  - 成长：`active="journal"`
  - 设置：`active="settings"`
- 页面自身的 padding、卡片、表单布局保持不变。

## 首页精简

移除以下内容（由侧栏替代）：

- 快捷记录区（喝奶/睡眠/排便三个格子）
- 功能列表（生长曲线、疫苗参考、成长手记、数据与设置）
- 对应的 `quickActions`、`features` 数组和 `goRecords` 函数及样式

保留：

- 宝宝资料卡（编辑/去设置）
- 今日记录汇总
- 下一条疫苗参考卡片（带跳转）
- 最近生长卡片（带跳转）
- 分享按钮
- 免责声明与广告位

## 边界与错误处理

- 每次启动默认展开，收起状态只在本次使用期间跨页面保持。
- 当前已激活入口不导航。
- 侧栏与内容区不重叠；收起/展开时过渡平滑。
- 侧栏不改变现有数据读写、备份和清空逻辑。
- 分包页面注册与页面栈行为不变。

## 测试

- `tests/baby-sidebar.test.js`：
  - 8 个入口的顺序、文案与 URL 正确。
  - 默认展开。
  - 收起状态在当前会话内可保存并重新读取。
  - 悬浮图标位置可保存并重新读取。
- 现有测试保持通过。
- `npm run build:mp-weixin`、`npm run build:h5` 成功。
- 人工检查 6 个页面的侧栏展开/收起、高亮、跳转、进入记录页不弹窗以及内容不被遮挡。

## 不在范围

- 不改侧栏为抽屉；手势只用于拖动悬浮图标。
- 不改工具页、关于页。
- 不调整现有业务数据和备份结构。
