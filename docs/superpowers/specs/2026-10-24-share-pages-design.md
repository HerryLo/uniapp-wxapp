# 宝宝页与工具页分享能力设计

日期：2026-10-24
范围：`src/components/ShareButton.vue`（新增）、`src/pages/baby/index.vue`、`src/pages/tools/index.vue`、`src/pages.json`

## 目标

为宝宝首页和工具页补全对外分享能力：页面内可见分享入口、发送给朋友、分享到朋友圈，并统一使用「垣计算」品牌标题。

## 现状

- 两个 Tab 页已经有 `onShareAppMessage`，可通过右上角菜单发送给朋友。
- 没有页面内分享按钮，没有 `onShareTimeline`，没有显式开启分享菜单配置。
- 分享标题仍使用旧名称「宝宝记录与工具箱」「宝宝记录 · 本地优先」。

## 组件设计

新增 `src/components/ShareButton.vue`：

```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <button class="share-btn" open-type="share">{{ label }}</button>
  <!-- #endif -->
  <!-- #ifdef H5 -->
  <button class="share-btn" @click="copyLink">{{ label }}</button>
  <!-- #endif -->
</template>
```

- Props：`label: string`，默认「分享给朋友」。
- 微信端使用 `open-type="share"`，点击直接调起分享面板；分享内容由页面的 `onShareAppMessage` 决定。
- H5 端复制 `window.location.href`，成功提示「链接已复制」，失败提示「复制失败」。
- 样式：浅粉底 `#FFF1F3`、深粉字 `var(--primary-strong)`、24rpx 圆角、居中；清除 button 默认边框和背景。

## 页面接入

### 宝宝首页

- 在功能列表之后、`Disclaimer` 之前插入 `<ShareButton />`。
- 修改 `onShareAppMessage`：

```js
onShareAppMessage(() => ({
  title: '垣计算 · 记录宝宝成长',
  path: '/pages/baby/index',
  imageUrl: '/static/logo.png',
}))
```

- 新增 `onShareTimeline`：

```js
onShareTimeline(() => ({
  title: '垣计算 · 记录宝宝成长',
  imageUrl: '/static/logo.png',
}))
```

- 在 `onLoad` 中调用 `uni.showShareMenu`（仅微信端）：

```js
// #ifdef MP-WEIXIN
uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
// #endif
```

### 工具页

- 底部「关于与免责声明」改为一行两个操作：「关于与免责声明」与 `<ShareButton label="分享给朋友" />`。
- 修改 `onShareAppMessage`：

```js
onShareAppMessage(() => ({
  title: '垣计算 · 日常计算工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
  imageUrl: '/static/logo.png',
}))
```

- 新增 `onShareTimeline`：

```js
onShareTimeline(() => ({
  title: '垣计算 · 日常计算工具箱',
  query: `tool=${active.value}`,
  imageUrl: '/static/logo.png',
}))
```

- 现有 `onLoad` 中补充 `uni.showShareMenu`（仅微信端）。

## 页面配置

在 `src/pages.json` 的两个页面 style 中增加：

```json
"enableShareAppMessage": true,
"enableShareTimeline": true
```

## 分享内容

| 项目 | 宝宝首页 | 工具页 |
|---|---|---|
| 标题 | 垣计算 · 记录宝宝成长 | 垣计算 · 日常计算工具箱 |
| 路径 | `/pages/baby/index` | `/pages/tools/index?tool=<当前工具>` |
| 朋友圈 query | 无 | `tool=<当前工具>` |
| 封面 | `/static/logo.png` | `/static/logo.png` |

使用 `logo.png` 作为封面，避免默认页面截图包含宝宝昵称、月龄等个人信息。

## 边界与错误处理

- 页面右上角菜单始终保留，分享按钮只是补充入口。
- 朋友圈打开工具页时，`onLoad` 读取 `tool` 参数恢复对应工具；参数非法时保持默认增值税。
- H5 不支持小程序分享面板，按钮退化为复制当前链接。
- 不新增网络请求、不上传任何数据。
- 分包页面与关于页不在本次范围。

## 验证

1. `npm test` 保持 13 个文件、75 个测试通过（本次不改逻辑层）。
2. `npm run build:mp-weixin` 成功。
3. 编译产物检查：
   - 两个页面 JSON 含 `enableShareAppMessage`、`enableShareTimeline`。
   - 页面 JS 含 `onShareAppMessage`、`onShareTimeline`。
4. 微信开发者工具人工检查：
   - 宝宝首页和工具页出现「分享给朋友」按钮，点击可调起分享面板。
   - 右上角菜单同时有「发送给朋友」和「分享到朋友圈」。
   - 工具页分享后打开仍停留在分享时的工具。
   - 分享封面为 logo，不显示宝宝资料。
5. H5 构建后点击按钮可复制当前链接。

## 不在范围

- 不自定义分享海报、不接入第三方分享 SDK。
- 不改分包页面、关于页的分享能力。
- 不改动业务数据。
