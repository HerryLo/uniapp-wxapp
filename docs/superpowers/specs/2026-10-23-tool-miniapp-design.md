# 计算工具小程序改造设计

**日期：** 2026-10-23
**目标：** 将现有语雀博客小程序改造为纯前端计算工具小程序，包含 7 个工具与待办清单（系统日历提醒）。

## 1. 背景与目标

现有项目是基于 uni-app + Vue 3 + Vite 的语雀博客小程序，包含首页、文章列表、文章详情、关于四个页面，依赖语雀 API（`src/service`、`src/yuque.json`）。

改造目标：

- 移除博客与语雀 API 依赖，改造为工具类小程序。
- 提供 7 个工具：增值税计算、单位换算、文本处理、编码工具、进制转换、时间戳转换、JSON 格式化。
- 新增待办清单，支持本地存储与系统日历提醒。
- 视觉风格：浅色极简 + 科技感。
- 本期不引入后端，全部计算与数据在本地完成。

## 2. 范围与非目标

**范围内**

- 工具页、待办页、关于页的重写。
- 7 个工具的计算逻辑与 UI。
- 待办增删改查、筛选、本地持久化、tab 徽标、系统日历提醒。
- 删除博客相关页面、组件、服务与配置文件。
- 单元测试（纯函数）与构建验证。

**非目标**

- 不做微信订阅消息 / uniCloud，不做账号体系与云同步。
- 不做汇率、个税、二维码、健康类工具。
- 不做深色模式。
- 不做待办分类、优先级、子任务。
- 不重构 uni-app 升级以外的构建配置。

## 3. 技术架构

- 沿用 Vue 3 + Vite + uni-app，不引入 UI 框架，不引入状态管理库。
- 平台：微信小程序为主，H5 用于本地开发调试；日历提醒仅微信小程序可用。
- 逻辑分层：
  - `src/utils/*.js`：纯函数，负责计算与转换，可被单元测试直接覆盖。
  - `src/components/tools/*Panel.vue`：每个工具一个面板组件，只负责输入、展示与交互。
  - `src/pages/tools/index.vue`：标签切换与面板编排。
  - `src/pages/todo/index.vue`：待办列表与交互。
- 样式：全局 CSS 变量定义在 `App.vue`，组件使用普通 CSS + `var()`，不新增 Sass 依赖。
- 存储：`uni.setStorageSync` / `uni.getStorageSync`，通过 `src/utils/storage.js` 统一封装，键名带版本号。
- 测试：Vitest 覆盖纯函数；UI 通过微信开发者工具与 H5 手动验收。

## 4. 导航与页面结构

底部 tabBar 两项：

| tab | 页面 | 说明 |
|---|---|---|
| 工具 | `pages/tools/index` | 默认首页，工具标签切换 |
| 待办 | `pages/todo/index` | 待办清单，显示未完成数量徽标 |

其他页面：

- `pages/about/about`：关于与免责声明，入口为工具页底部的「关于与免责声明」文字链接。
- 删除 `pages/index/index`、`pages/article/article`、`pages/detail/detail`。

深链：`pages/tools/index?tool=<key>`，key 取值 `vat | unit | text | encode | radix | timestamp | json`，默认 `vat`。分享路径带该参数，H5 通过 URL 查询参数同样生效。

## 5. 工具页布局与切换

- 原生导航栏标题「工具箱」。
- 顶部为吸顶标签栏：一行等宽 7 项，不滚动，字号 `24rpx`，高度 `88rpx`：
  - 增值税、单位换算、文本处理、编码、进制、时间戳、JSON。
  - 选中态：主色文字 + 下方 `4rpx × 32rpx` 主色短横线；未选中为次要文字色。
- 标签下为工具面板区，使用 `v-show` 切换，保留各工具输入状态。
- 每个面板顶部显示完整工具名称与一行说明。
- 页面底部为「关于与免责声明」链接。
- 无「最近使用」模块。

标签与面板对应关系：

| 标签 | 组件 | 完整名称 |
|---|---|---|
| 增值税 | `VatPanel.vue` | 增值税计算 |
| 单位换算 | `UnitPanel.vue` | 单位换算 |
| 文本处理 | `TextPanel.vue` | 文本处理 |
| 编码 | `EncodePanel.vue` | Base64 / URL 编码 |
| 进制 | `RadixPanel.vue` | 进制转换 |
| 时间戳 | `TimestampPanel.vue` | 时间戳转换 |
| JSON | `JsonPanel.vue` | JSON 格式化 |

## 6. 各工具详设

### 6.1 增值税计算（`utils/vat.js`）

输入：

- 金额输入框（decimal 键盘，最多两位小数，必须大于 0，上限 1,000,000,000 元）。
- 模式切换：`不含税 → 含税`、`含税 → 不含税`。
- 税率快捷项：13%、9%、6%、5%、3%、1%、自定义（0–100%，最多两位小数）。

计算（全部以「分」为整数，四舍五入）：

- 不含税 → 含税：`税额 = round(不含税分 × 税率基点 / 10000)`，`含税分 = 不含税分 + 税额`。
- 含税 → 不含税：`不含税分 = round(含税分 × 10000 / (10000 + 税率基点))`，`税额 = 含税分 - 不含税分`。
- 税率基点：13% = 1300，0.5% = 50。
- 金额字符串转分：拆分整数与小数部分，超过两位小数按四舍五入。

输出：

- 不含税金额、税额、价税合计，固定两位小数，例如 `113.00`。
- 一键复制，格式为三行：
  ```
  不含税金额：100.00
  税额：13.00
  价税合计：113.00
  ```

其他：

- 记住上次模式与税率（键 `tools.vat.prefs`）。
- 非法/空输入显示行内错误，不输出结果。
- 面板底部固定免责声明：「计算结果仅供参考，不构成税务建议」。

### 6.2 单位换算（`utils/units.js`）

五类单位，基础单位换算系数：

- 长度：`mm(0.001) | cm(0.01) | m(1) | km(1000) | inch(0.0254) | foot(0.3048) | mile(1609.344)`
- 重量：`g(1) | kg(1000) | t(1000000) | 斤(500) | lb(453.59237) | oz(28.349523125)`
- 温度：`℃ / ℉ / K`，仿射换算，以摄氏度为中间量。
- 存储：`B(1) | KB(1024) | MB(1024²) | GB(1024³) | TB(1024⁴)`。
- 面积：`cm²(0.0001) | m²(1) | km²(1000000) | 亩(666.6666667) | 公顷(10000) | ft²(0.09290304)`

交互：

- 类别 chips 五选一，切换时重置为每类第一个单位。
- 数值输入、源单位 picker、目标单位 picker、一键互换。
- 结果实时更新；保留最多 6 位小数并去掉末尾多余的 0。
- 非法输入显示行内错误。

### 6.3 文本处理（`utils/text.js`）

布局：

- 「原文」textarea（`maxlength="-1"`，超过 100,000 字符时提示，并按前 100,000 字符处理）。
- 「结果」只读 textarea。
- 实时统计：原文行数、字符数（不含换行）、结果行数。

操作：

- 去重：按行拆分，忽略空行，保留首次出现顺序。
  - 开关「忽略大小写」：比较时统一转小写。
  - 开关「忽略首尾空白」：比较前对每行 `trim`。
- 全大写 / 全小写：作用于原文，输出到结果。
- 首字母大写：原文整体转小写后，对每个英文单词首字母转大写。
- 复制结果、用结果替换原文、清空。
- 大小写转换仅影响 ASCII 字母，中文与非拉丁字符保持不变。

### 6.4 编码工具（`utils/encode.js`）

- 模式 chips：Base64 / URL。
- 输入 textarea（`maxlength="-1"`）、输出只读 textarea。
- 操作：编码、解码、复制结果、清空。
- Base64 使用自实现的 UTF-8 安全编解码（不依赖 `btoa` / `TextEncoder`，保证小程序与 H5 一致）。
- 解码失败显示「输入不是合法的 Base64 / URL 编码」。
- 不支持二进制文件编码。

### 6.5 进制转换（`utils/radix.js`）

- 输入数值与源进制 picker（2–36，默认 10）。
- 同屏展示四个结果：二进制、八进制、十进制、十六进制，每行可复制。
- 十六进制输出大写；其他进制小写无影响。
- 支持负数与超大整数（BigInt 逐位解析与 `toString(base)`）。
- 不支持小数，输入含 `.` 报错。
- 输入非法字符（如二进制含 2）报错：`输入包含非 <base> 进制字符`。
- 输入长度上限 512 字符。

### 6.6 时间戳转换（`utils/timestamp.js`）

- 模式切换：`时间戳 → 日期时间`、`日期时间 → 时间戳`。
- 时间戳 → 日期时间：
  - 单位 switch：秒 / 毫秒，默认秒。
  - 纯数字校验；输出本地时间 `YYYY-MM-DD HH:mm:ss` 与 UTC 时间 `YYYY-MM-DD HH:mm:ss UTC`。
- 日期时间 → 时间戳：
  - 使用日期 picker 与时间 picker（默认当前时间）。
  - 输出秒级与毫秒级两个时间戳，可分别复制。
- 「现在」按钮填充当前时间。
- 仅处理本机时区与 UTC，不提供时区选择。
- 非法或越界日期显示行内错误。

### 6.7 JSON 格式化（`utils/json.js`）

- 输入 textarea（`maxlength="-1"`）；超过 100,000 字符提示性能风险并拒绝处理。
- 操作：格式化（2 空格缩进）、压缩、校验、复制结果、清空。
- 校验成功提示「JSON 格式正确」；失败展示 `JSON 格式错误：<解析器返回信息>`。
- 结果输出到只读 textarea。
- 不提供 JSONPath、排序、转义等高级功能。

## 7. 待办与日历提醒

### 7.1 数据模型

```js
{
  id: String,          // 时间戳 + 随机串
  title: String,       // 1–60 字符
  done: Boolean,
  dueAt: Number|null,  // 毫秒时间戳
  remind: Boolean,     // 仅微信小程序且 dueAt 非空时生效
  createdAt: Number,
  completedAt: Number|null
}
```

- 存储键：`tools.todos.v1`，值为数组。
- 读取时做一次结构校验，损坏数据回退为空数组，不抛出异常。

### 7.2 页面与交互

- 顶部输入框 + 「添加」按钮；标题 trim 后为空不允许添加。
- 筛选 chips：全部 / 未完成 / 已完成（含数量）。
- 列表项：复选框、标题、截止时间徽标、「⋯」按钮。
  - 点击复选框切换完成状态，写入/清空 `completedAt`。
  - 点击条目进入行内编辑：标题输入、日期 picker、时间 picker、提醒 switch、保存/取消。
  - 点击「⋯」弹出 actionSheet：删除；删除前 `uni.showModal` 二次确认。
- 排序：
  - 未完成在前，按 `dueAt` 升序，无截止时间排最后。
  - 已完成在后，按 `completedAt` 降序。
- 逾期未完成项显示红色「已逾期」提示。
- 无数据时显示空状态文案。

### 7.3 日历提醒（`utils/calendar.js`）

- 仅 `#ifdef MP-WEIXIN` 注册实现；H5 端隐藏提醒开关并显示「仅微信小程序支持日历提醒」。
- 保存待办且 `remind === true && dueAt` 时调用：

  ```js
  wx.addPhoneCalendar({
    title: `待办：${title}`,
    startTime: Math.floor(dueAt / 1000),
    endTime: Math.floor(dueAt / 1000) + 1800,
    alarm: true,
    alarmOffset: 0,
    description: '来自工具箱待办清单',
    success, fail
  })
  ```

- 成功 toast「已添加到手机日历」；失败 toast「添加日历失败，请检查日历权限」。
- 用户首次调用时由微信弹出授权，拒绝后需到系统设置开启。

### 7.4 tab 徽标

- 工具页与待办页 `onShow` 及每次增删改后更新：
  - 未完成数量 > 0：`uni.setTabBarBadge({ index: 1, text: String(count) })`。
  - 为 0：`uni.removeTabBarBadge({ index: 1 })`。
- 计算与更新封装在 `utils/todo.js`，避免页面重复逻辑。

### 7.5 已知限制（待办页底部说明）

- 日历事件写入后没有删除或更新 API，修改/删除待办不会同步系统日历，旧事件需用户手动删除。
- 提醒依赖用户授权系统日历。
- 数据仅保存在本机，清理小程序缓存或卸载后会丢失。
- H5 端不支持日历提醒。

## 8. 数据存储

| 键 | 内容 |
|---|---|
| `tools.todos.v1` | 待办数组 |
| `tools.vat.prefs` | 上次增值税模式与税率 |

- 统一通过 `utils/storage.js` 读写，JSON 序列化，异常时返回默认值。
- 不对数据进行跨版本迁移；v1 为初始版本。

## 9. 视觉规范（浅色极简 + 科技感）

CSS 变量（定义在 `App.vue` 的 `page` 选择器）：

| 变量 | 值 |
|---|---|
| `--bg` | `#F7F8FA` |
| `--surface` | `#FFFFFF` |
| `--primary` | `#4361EE` |
| `--primary-soft` | `#EEF2FF` |
| `--text` | `#1F2937` |
| `--text-secondary` | `#6B7280` |
| `--border` | `#E5E7EB` |
| `--danger` | `#EF4444` |
| `--success` | `#10B981` |

- 页面背景 `var(--bg)`，卡片背景 `var(--surface)`，圆角 `24rpx`，轻阴影 `0 8rpx 24rpx rgba(31, 41, 55, 0.06)`。
- 页面内边距 `32rpx`，卡片内边距 `32rpx`，卡片间距 `24rpx`。
- 输入框圆角 `16rpx`、1rpx 边框，聚焦时边框主色。
- 主按钮：主色填充、白字、圆角 `16rpx`；次按钮：白底、主色边框与文字。
- 结果数字使用等宽字体栈：`"SF Mono", Menlo, Consolas, monospace`。
- 标签 chips 圆角 `999rpx`，选中为 `--primary-soft` 背景 + 主色文字。
- 字号：页面标题 `34rpx`，面板标题 `30rpx`，正文 `28rpx`，辅助文字 `24rpx`。

## 10. 错误处理与边界

- 所有计算类输入在非法时显示行内错误，不抛异常、不输出错误结果。
- 复制统一使用 `uni.setClipboardData`，成功 toast「已复制」。
- 存储读写全部 try/catch，失败时降级为空数据并提示。
- 日历 API 不可用或授权失败时降级为 toast 提示，不影响待办保存。

## 11. 测试与验收

**单元测试（Vitest）**

- `vat`：正反向计算、税率边界（0%、13%、100%）、四舍五入、非法输入。
- `text`：去重顺序、忽略大小写/空白、大小写转换、空行处理。
- `radix`：2/8/10/16、2–36、负数、超大数、非法字符、小数报错。
- `units`：每类换算、温度三向换算、互换一致性。
- `timestamp`：秒/毫秒识别、格式化、非法输入。
- `json`：格式化、压缩、非法 JSON。
- `encode`：中文 Base64、URL 编解码、非法输入。
- `todo`：排序、筛选、徽标计数、存储容错。

**构建验证**

- `yarn build:mp-weixin` 成功。
- `yarn build:h5` 成功。

**手动验收（微信开发者工具 + 真机）**

- 导入 `dist/dev/mp-weixin`，逐个验证 7 个工具、默认标签、标签切换与状态保留。
- 验证待办增删改查、筛选、排序、徽标、重启后数据保留。
- 真机验证日历提醒授权与事件写入。
- H5 验证工具页与待办，确认提醒开关隐藏。
- 验证 `?tool=<key>` 深链。

## 12. 风险与限制

- `wx.addPhoneCalendar` 在部分设备/开发者工具中不可用，需真机验证；无删除/更新 API，会产生过期日历事件。
- 无后端，数据仅本地保存，无法跨设备同步。
- JSON 解析错误信息随 JS 引擎不同而变化，仅原样展示。
- 引入 Vitest 需要新增开发依赖，安装时需显式指定 npm 源（当前 `~/.npmrc` 私服返回 401）。
- `src/yuque.json` 中的历史 token 曾提交到公开仓库，本次删除文件无法清除 git 历史，仍建议轮换 token。

## 13. 文件变更概览

**新增**

- `src/pages/tools/index.vue`
- `src/pages/todo/index.vue`
- `src/components/tools/{Vat,Unit,Text,Encode,Radix,Timestamp,Json}Panel.vue`
- `src/components/tools/TodoItem.vue`
- `src/utils/{vat,units,text,encode,radix,timestamp,json,todo,storage,calendar}.js`
- `tests/*.test.js`
- `src/static/tab-tools.png`、`tab-tools-active.png`、`tab-todo.png`、`tab-todo-active.png`

**修改**

- `src/pages.json`：新页面、两项 tabBar、浅色全局样式。
- `src/App.vue`：全局 CSS 变量与基础样式。
- `src/pages/about/about.vue`：重写为通用工具说明与免责声明。
- `src/manifest.json`：名称改为「工具箱」，保留 appid。
- `package.json`：新增 `test` 脚本与 Vitest。
- `README.md`：更新项目定位、功能与运行说明。

**删除**

- `src/pages/index/index.vue`、`src/pages/article/article.vue`、`src/pages/detail/detail.vue`
- `src/components/ArticleCard/`、`src/components/SliderCard/`、`src/components/YuqueRichtext/`
- `src/service/index.js`、`src/utils/constant.js`、`src/yuque.json`
- 未使用的博客静态图片：`about*.png`、`art*.png`、`index*.png`、`gh_wxcode.jpg`、`img.png`、`look.png`、`qyz.png`、`xing.png`（保留 `logo.png`）
