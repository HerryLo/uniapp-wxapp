# CLAUDE.md

本文件为在本仓库中工作的 Claude Code 提供指引。

## 项目概览

uni-app + Vue 3 + Vite 小程序「垣计算」：本地优先的宝宝记录 + 计算工具箱。没有后端，所有记录存在 `uni` 本地存储，所有计算在设备上完成。微信小程序是主目标，H5 只用于本地调试和文件导出。

## 常用命令

```bash
npm install

npm run dev:mp-weixin   # 小程序开发，产物 dist/dev/mp-weixin，用微信开发者工具导入
npm run dev:h5          # H5 调试，http://localhost:5173
npm test                # 单元测试（vitest run，单次执行）
npx vitest run tests/baby-records.test.js   # 单个测试文件
npm run build:mp-weixin
npm run build:h5
```

- `npm run build` / `npm run serve` 等同于 H5 目标，小程序要用 `:mp-weixin` 变体。
- 没有 lint / format / typecheck 脚本，不要自行添加；`jsconfig.json` 只用于编辑器类型提示。

## 架构

### 应用外壳与路由

- `src/main.js` 用 `createSSRApp`；`src/App.vue` 放全局 CSS 变量、页面背景和共享的 `.card` / `.btn` / 表单样式（粉奶油主题，`rpx` 单位）。
- `src/pages.json` 定义全部路由：两个 tabBar 页（`pages/baby/index`、`pages/mine/index`）、非 tab 的 `pages/tools/index` 与 `pages/about/about`，以及 `package-baby` 分包。新增宝宝页放在 `package-baby/` 下并在 `pages.json` 注册。
- 平台差异用条件编译（`// #ifdef MP-WEIXIN`、`// #ifdef H5`），模板和脚本都要保留；H5 路径需能用于本地调试。

### 宝宝数据层

- `src/utils/storage.js` 是唯一存储入口（JSON 序列化 + try/catch，返回兜底值），支持替换驱动与变更订阅。功能模块不要直接调用 `uni.getStorageSync`。
- `src/utils/baby/keys.js` 集中管理存储 key（`baby.` 前缀）：单例功能各一个 key，日常记录按月分桶（`baby.records.v1.YYYY-MM`）并有索引 key。
- `src/utils/baby/*` 基本是纯同步逻辑，`avatar.js` 是异步、依赖平台的例外。持久化函数统一「校验 → 读取 → 转换 → 写入」，返回 `{ ok: true, ... }` 或 `{ ok: false, error }`（中文提示）。
- 头像以压缩后的 base64 data URL 存在 `profile.avatar`，随备份一起导出。
- 记录：`records.js` 维护六类（`milk`、`sleep`、`diaper`、`food`、`medicine`、`supplement`），按天分组放在按月对象里；`normalizeDay` 必须兼容缺少新字段的旧数据。界面只编辑**当天**记录，按月分桶用于趋势汇总与备份。
- 疫苗：内置项来自 `src/data/vaccinePlan.js`，首次加载时写入；内置项不可删除，只有自定义项可删。参考内容与免责声明写在数据文件里，编辑时保留原措辞。
- 备份/恢复（`src/package-baby/utils/backup.js`）：结构为 `{ app, schemaVersion: 1, exportedAt, data }`，上限 2 MB；恢复前先备份当前数据，写入失败则回滚。`sync.js` 只是同步载荷的占位封装，不是已实现的同步功能。

### 界面组合

- `src/components/baby/BabyPage.vue` 是所有宝宝页的标准外壳：内容区 + `BabySidebar`（可收起为悬浮按钮），传 `active="<侧栏 key>"`。侧栏导航：首页用 `switchTab`，分包页之间用 `redirectTo`，从 tab 页进入用 `navigateTo`。
- 侧栏收起状态与悬浮按钮位置是 `src/utils/baby/sidebar.js` 里的内存状态（不持久化），通过 `onSidebarCollapsedChange` / `onSidebarPositionChange` 订阅同步，保证已挂载的 tab 页跟上分包页的收起与拖动。
- `SIDEBAR_ITEMS` 也在 `sidebar.js`：新增宝宝页通常要同时加侧栏条目和 `pages.json` 路由。设置不在侧栏，从「我的」或宝宝首页资料卡进入。
- 宝宝资料（`package-baby/settings/index`）与数据管理（`package-baby/settings/data`）是两个页，都从「我的」进入；数据管理是一级入口，因为本地数据只能靠导出备份保住。
- 六个日常记录页都是 `package-baby/components/records/RecordPage.vue` 的薄封装。新增记录类型要改 `KINDS`、`records.js` 的校验、`RecordForm.vue`、`RecordList.vue`，需要出现在顶部切换器时再改 `RecordPage.vue`。
- 工具页 `pages/tools/index.vue` 从「我的」进入，四个面板用 `v-show` 常驻；计算逻辑在 `src/utils/{vat,units,text,radix}.js`，保持与 UI 无关。
- 其他共享组件：`ShareButton.vue`、`AdBanner.vue`（仅微信）、`Disclaimer.vue`；图表 `LineChart.vue` 用 `type="2d"` canvas。

### 测试

Vitest 跑 `tests/**/*.test.js`（node 环境，无 jsdom、不挂载组件）。测试用 `vi.stubGlobal` stub 全局 `uni`，直接测纯模块和 `useDayRecords`。新逻辑写成纯模块再测，避免模块导入时就依赖 `uni`。

## 约定与限制

- 界面文案、注释、校验提示都用中文。
- 产品边界：纯本地。不要加网络请求、登录或云同步，`sync.js` 只是载荷占位。
- 存储兼容：旧数据和 `schemaVersion: 1` 的备份要能读，不要直接重命名或删除 key / 字段。
- 小程序限制：导入上限 2 MB、分包体积、广告组件只在 `#ifdef MP-WEIXIN` 内使用。
- 版本号同时出现在 `src/manifest.json`（`versionName` / `versionCode`）和 `src/pages/about/about.vue`，要一起改。
- 版本更新：`src/utils/update.js` 在 `App.vue` 的 `onLaunch` 里启用，新版本下载完成后弹窗并 `applyUpdate` 强制重启；微信只在冷启动检查新版本，热启动不会触发。逻辑通过依赖注入测试（`tests/update-manager.test.js`）。
- `scripts/gen-tab-icons.cjs` 是生成 tabBar 图标的独立脚本，不参与构建。
- 设计文档与实施计划在 `docs/superpowers/specs/` 与 `docs/superpowers/plans/`，改相关行为前先读对应文档。
