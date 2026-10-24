# 工具页导航与字号改造设计

**日期：** 2026-10-24
**前置：** `2026-10-23-tool-miniapp-design.md`，本设计覆盖其导航、工具范围与字号部分。

## 1. 背景

原工具页把 7 个工具平铺为等宽标签，每项约 96rpx。24rpx 字号已是「单位换算」四个字不溢出的上限，无法继续放大。改造目标：

- 收起工具入口，放大标题与正文。
- 工具精简为 4 个：增值税、单位换算、文本处理、进制转换。
- 工具页与待办页使用统一的自定义导航栏。
- 页面底部接入微信自定义广告组件。

## 2. 导航结构

- 新增 `src/components/NavBar.vue`，工具页与待办页共用；关于页保留原生导航。
- 工具页导航标题「工具箱」，右上角显示 2×2 网格图标。
- 待办页导航标题「待办」，**不显示**工具入口图标。
- 点击工具页图标弹出底部抽屉「全部工具」，两列展示 4 个工具；点击选中项切换面板并关闭抽屉，点击遮罩或关闭按钮取消。
- 进入工具页默认展示增值税。
- 深链 `pages/tools/index?tool=vat|unit|text|radix` 继续生效；非法或已移除的 key 回落到 `vat`。
- 分享路径使用当前工具 key。

## 3. 自定义导航栏适配

- 微信小程序：读取 `uni.getSystemInfoSync().statusBarHeight` 与 `wx.getMenuButtonBoundingClientRect()`，导航内容高度取胶囊上下留白的两倍加胶囊高度；右上角图标放在胶囊左侧 8px。
- H5：状态栏高度为 0，导航内容高度固定 44px，图标右侧留 16px。
- 导航栏 `position: fixed`，组件内输出同高占位块，页面内容自然下移。
- 胶囊接口不可用时降级为状态栏 + 44px，右侧留 16px。

## 4. 字号

| 元素 | 原值 | 新值 |
|---|---|---|
| 导航标题 | — | 34rpx |
| 抽屉标题 | — | 32rpx |
| 抽屉工具名 / 说明 | — | 30rpx / 24rpx |
| 面板标题 / 说明 | 30 / 24rpx | 34 / 26rpx |
| 表单标签 | 26rpx | 28rpx |
| 输入框 / 按钮 / 选项 | 28 / 28 / 26rpx | 30 / 30 / 28rpx |
| 结果标签 / 数值 | 26 / 30rpx | 28 / 32rpx |
| 辅助文字 | 22–24rpx | 24–26rpx |

待办页标题、截止时间、底部说明同步放大到 30 / 24 / 24rpx。

## 5. 功能范围

保留：增值税、单位换算、文本处理、进制转换。

删除：

- `src/components/tools/EncodePanel.vue`
- `src/components/tools/TimestampPanel.vue`
- `src/components/tools/JsonPanel.vue`
- `src/utils/encode.js`、`src/utils/json.js`
- `tests/encode.test.js`、`tests/json.test.js`

`src/utils/timestamp.js` 保留待办页依赖的 `dateToTimestamp`、`formatDateValue`、`formatTimeValue`，删除工具专用的 `formatLocal`、`formatUtc`、`timestampToDate`、`nowTimestamp`，并精简 `tests/timestamp.test.js`。

待办数据与 `tools.vat.prefs` 不受影响，无需迁移。

## 6. 广告组件

新增 `src/components/AdBanner.vue`，仅在微信小程序编译：

```html
<ad-custom
  unit-id="adunit-a36ca84c0d70179a"
  bindload="adLoad"
  binderror="adError"
  bindclose="adClose"
/>
```

- 组件内部使用 `#ifdef MP-WEIXIN` 条件编译，H5 不渲染。
- 放在工具页「关于与免责声明」之后、待办页底部说明之后。
- 事件处理只记录日志，不阻塞页面。

## 7. 验证

- Vitest：剩余工具与待办相关测试通过；删除的测试同步移除。
- `build:mp-weixin` 与 `build:h5` 成功。
- H5：默认增值税、抽屉打开/切换/关闭、4 个工具可用、深链、待办页导航无工具图标、广告不渲染。
- 微信开发者工具/真机：导航高度与胶囊避让、抽屉安全区、广告组件加载/错误事件（本机无开发者工具，需人工验收）。
