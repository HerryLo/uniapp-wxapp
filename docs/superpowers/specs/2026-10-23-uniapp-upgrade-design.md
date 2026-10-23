# uni-app 框架升级设计（Vue 2 → uni-app 3.x / Vue 3）

- 日期：2026-10-23
- 状态：已确认，待实施
- 开发分支：`chore/upgrade-uniapp-vue3`（从 `master` 切出）

## 1. 背景与目标

当前项目是基于 uni-app `2.0.1-alpha-36920221111002` + Vue 2.6 + vue-cli 4/webpack 的个人博客微信小程序，通过语雀 API 获取知识库文档并在小程序中展示。

升级目标：迁移到当前 uni-app Vue 3 稳定线 `3.0.0-5020620260917001`，对应 Vue `3.4.21`、Vite `5.2.8`，构建链路由 vue-cli/webpack 切换为 Vite。

版本依据（2026-10-23 通过 npm registry 确认）：

- `@dcloudio/uni-app` 非 alpha 稳定版本最新为 `3.0.0-5020620260917001`。
- Vue 2 线仍发布 `2.0.2-5020620260917001`，但 Vue 2 已 EOL，本次不采用。
- `vite-plugin-uni@3.0.0-5020620260917001` 的 peer 依赖为 `vite 5.2.8`，Node 要求 `^14.18.0 || >=16.0.0`，当前 Node 22 满足要求。

## 2. 范围

### 包含

- 依赖、脚本、构建配置升级到 Vue 3 稳定线。
- 源码中仅做迁移必需的改动（Vue 2 专有 API、废弃单位、失效的旧类型声明）。
- 保留 H5 与微信小程序两个平台，移除其它平台依赖和脚本。
- 为 H5 开发环境增加语雀 API 代理，便于本地验证。

### 不包含

- 语雀 Token 泄露修复（`src/yuque.json` 已提交到公开仓库）。该项需要到语雀后台重置 Token 并调整配置管理方式，单独处理。
- UI/交互改版、新增功能。
- 改写为 Composition API。
- H5 生产环境的 CORS 方案（本项目以小程序为主，H5 仅用于开发验证）。

## 3. 依赖与脚本

`package.json` 替换为以下核心内容（`name`、`version` 保持不变）：

```json
{
  "scripts": {
    "serve": "npm run dev:h5",
    "build": "npm run build:h5",
    "dev:h5": "uni",
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:h5": "uni build",
    "build:mp-weixin": "uni build -p mp-weixin"
  },
  "dependencies": {
    "@dcloudio/uni-app": "3.0.0-5020620260917001",
    "@dcloudio/uni-components": "3.0.0-5020620260917001",
    "@dcloudio/uni-h5": "3.0.0-5020620260917001",
    "@dcloudio/uni-mp-weixin": "3.0.0-5020620260917001",
    "vue": "^3.4.21",
    "vue-i18n": "^9.1.9"
  },
  "devDependencies": {
    "@dcloudio/types": "^3.4.8",
    "@dcloudio/uni-cli-shared": "3.0.0-5020620260917001",
    "@dcloudio/uni-stacktracey": "3.0.0-5020620260917001",
    "@dcloudio/vite-plugin-uni": "3.0.0-5020620260917001",
    "@vue/runtime-core": "^3.4.21",
    "rollup": "4.14.3",
    "vite": "5.2.8"
  }
}
```

移除的依赖：`vuex`、`flyio`、`core-js`、`regenerator-runtime`、`@vue/shared`、全部 `@dcloudio/vue-cli-*` / `webpack-*` / `@vue/cli-*` 相关包、`jest` 及其它微信小程序类型包。

移除的字段：`browserslist`、`resolutions`、`uni-app.scripts`。

`uni` 命令由 `@dcloudio/vite-plugin-uni` 提供（bin 为 `bin/uni.js`）。

## 4. 构建配置

新增 `vite.config.js`：

```js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    proxy: {
      '/yuque-api': {
        target: 'https://www.yuque.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yuque-api/, ''),
      },
    },
  },
})
```

新增 `index.html`：使用官方 Vue 3 CLI 模板内容，`<script type="module" src="/src/main.js">`。

删除文件：

- `babel.config.js`（Vue 3 + Vite 不再使用）
- `postcss.config.js`（webpack/postcss-comment 专用）
- `sfc.d.ts`、`shime-vue.d.ts`（Vue 2 类型声明，且项目为 JS）
- 旧 `yarn.lock`（依赖整体变化，需重新生成）
- 旧 `dist/`（git 已忽略的构建产物，避免微信开发者工具读到 Vue 2 旧产物）

`jsconfig.json` 的 `types` 只保留 `@dcloudio/types`。

## 5. 源码改动

| 文件 | 改动 |
| --- | --- |
| `src/main.js` | `new Vue({...App}).$mount()` 改为导出 `createApp()`，内部使用 `createSSRApp(App)` |
| `src/manifest.json` | 增加 `"vueVersion": "3"`，保留 appid 与现有配置 |
| `src/utils/constant.js` | H5 开发环境使用 `/yuque-api/api/v2`，其它情况保持 `https://www.yuque.com/api/v2`（条件编译） |
| 所有 `.vue` 样式 | `upx` 统一替换为等值 `rpx` |
| `src/pages/index/index.vue` | 移除未使用的 `ArticleCard` 引入和 components 注册 |
| `src/App.vue`、`pages.json`、页面、组件、`service`、`utils`、静态资源、`yuque.json` | 不改 |

`src/main.js` 目标内容：

```js
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
```

`src/utils/constant.js` 目标内容：

```js
import yuque from '../yuque.json'

// #ifdef H5
export const requestHttp = import.meta.env.DEV
  ? '/yuque-api/api/v2'
  : yuque.requestHttp
// #endif
// #ifndef H5
export const requestHttp = yuque.requestHttp
// #endif

export const AuthToken = yuque.AuthToken
export const namespace = yuque.namespace
export const reposLink = yuque.reposLink
```

## 6. 验证计划

1. 删除 `node_modules`、旧 `yarn.lock`，执行 `yarn install` 成功。
2. `yarn build:mp-weixin` 成功产出 `dist/build/mp-weixin`。
3. `yarn dev:mp-weixin` 成功产出 `dist/dev/mp-weixin`，产物文件结构与旧版一致（`app.json`、`pages/`、`components/`）。
4. 用户使用微信开发者工具导入 `dist/dev/mp-weixin`，走查首页、文章列表（三个 tab）、文章详情、关于四个页面。
5. `yarn dev:h5` 启动后访问开发服务器地址，走查四个页面及经代理加载的语雀数据。
6. 自动化能验证的部分：安装、两条构建命令、产物文件、H5 服务响应；微信开发者工具内的点击走查由用户完成。

## 7. 风险与回滚

- Vue 3 兼容性：全源码仅 `src/main.js` 使用 Vue 2 专有写法，Options API、组件 props、`uni.*` API 在 Vue 3 下兼容，迁移风险低。
- `upx` 在 Vue 3 构建链路下不可靠，统一替换为数值等价的 `rpx`。
- H5 生产构建仍受语雀 API CORS 限制，属既有问题，不在本次范围。
- 首装依赖体积和耗时高于旧版，属预期。
- 回滚方式：切回 `master` 并重新 `yarn install` 即可；升级改动全部在新分支，且不修改 `yuque.json` 等业务配置。

## 8. 后续建议（本次不实施）

- 立即在语雀后台重置已泄露的 AuthToken。
- 将 `src/yuque.json` 移出版本控制，改用本地未跟踪配置或环境变量注入。
- 条件允许时将“最近发布/技术/随笔”的硬编码分类和 SliderCard 手写文章列表改为数据驱动。
