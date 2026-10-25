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

按以下顺序展示 7 个入口：

| key | 文案 | emoji | 目标 |
|---|---|---|---|
| milk | 喝奶 | 🍼 | `/package-baby/records/index?type=milk` |
| sleep | 睡眠 | 😴 | `/package-baby/records/index?type=sleep` |
| diaper | 排便 | 💧 | `/package-baby/records/index?type=diaper` |
| health | 疫苗 | 💉 | `/package-baby/health/index` |
| growth | 生长 | 📈 | `/package-baby/growth/index` |
| journal | 成长 | 📖 | `/package-baby/journal/index` |
| settings | 设置 | ⚙️ | `/package-baby/settings/index` |

喝奶/睡眠/排便进入日常记录后会自动打开对应记录表单（复用现有 `onLoad` 的 `type` 参数逻辑）。

## 布局与交互

- 侧栏固定在页面左侧，`position: fixed`，白色背景，右边框使用 `var(--border)`。
- 默认展开：宽度 200rpx，显示 emoji + 文案。
- 收起：宽度 76rpx，只显示 emoji；点击底部「收起 / 展开」切换。
- 内容区通过 `margin-left` 跟随侧栏宽度变化，带 0.2s 过渡，避免遮挡内容。
- 当前页面入口高亮：
  - 日常记录按当前 Tab 高亮喝奶/睡眠/排便
  - 生长、疫苗、成长、设置页高亮对应入口
  - 宝宝首页无高亮项
- 点击当前已激活项不重复导航。
- 从宝宝首页进入分包页使用 `uni.navigateTo`；分包页之间切换使用 `uni.redirectTo`，避免页面栈持续增长。
- H5 环境对 `getCurrentPages` 做存在性判断，缺失时回退 `navigateTo`。
- 收起状态保存在 UI key `ui.baby-sidebar.v1`，不进入宝宝数据导出，也不会被「清空宝宝数据」删除。
- 侧栏底部预留 `env(safe-area-inset-bottom)` 间距。

## 组件设计

### `src/utils/baby/sidebar.js`

- `SIDEBAR_ITEMS`：上表 7 项数组。
- `SIDEBAR_STATE_KEY = 'ui.baby-sidebar.v1'`
- `loadSidebarCollapsed(): boolean`：读取失败或数据损坏时返回 `false`（默认展开）。
- `saveSidebarCollapsed(collapsed: boolean): boolean`：写入 UI 状态。

### `src/components/baby/BabySidebar.vue`

- Props：
  - `active: string`，默认空字符串
  - `collapsed: boolean`，默认 `false`
- Emits：`toggle`
- 渲染 7 个入口和底部的展开/收起按钮。
- 点击入口时按当前页面判断 `navigateTo` 或 `redirectTo`。

### `src/components/baby/BabyPage.vue`

- Props：`active: string`，默认空字符串
- 读取 `loadSidebarCollapsed()` 初始化收起状态。
- 切换时调用 `saveSidebarCollapsed()`。
- 模板结构：内容区 slot + `BabySidebar`。

## 页面接入

- 每个宝宝页面用 `<BabyPage>` 包裹现有根节点。
- `active` 传值：
  - 首页：不传
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

- 侧栏状态读取失败时默认展开，不影响页面使用。
- 当前已激活入口不导航。
- 侧栏与内容区不重叠；收起/展开时过渡平滑。
- 侧栏不改变现有数据读写、备份和清空逻辑。
- 分包页面注册与页面栈行为不变。

## 测试

- `tests/baby-sidebar.test.js`：
  - 7 个入口的顺序、文案与 URL 正确。
  - 默认展开。
  - 收起状态可保存并重新读取。
  - 存储损坏时回退为展开。
- 现有 125 个测试保持通过。
- `npm run build:mp-weixin`、`npm run build:h5` 成功。
- 人工检查 6 个页面的侧栏展开/收起、高亮、跳转、表单自动打开和内容不被遮挡。

## 不在范围

- 不改侧栏为抽屉或手势操作。
- 不增加「宝宝首页」入口（使用系统返回）。
- 不改工具页、关于页。
- 不调整现有业务数据和备份结构。
