# uni-app Vue 2 → Vue 3 升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把项目从 uni-app `2.0.1-alpha`（Vue 2 + vue-cli/webpack）升级到 uni-app `3.0.0-5020620260917001`（Vue 3.4 + Vite 5），保持现有功能不变，并让小程序与 H5 开发环境都能运行验证。

**Architecture:** 原地迁移。依赖与脚本替换为 uni-app Vue 3 官方 CLI 模板的组合，构建链路从 vue-cli/webpack 切换为 Vite；源码只做迁移必需改动（`createSSRApp` 入口、`vueVersion` 标记、`upx`→`rpx`、H5 开发代理），页面/组件/业务逻辑保持 Options API 不变。

**Tech Stack:** uni-app 3.0.0-5020620260917001、Vue ^3.4.21、Vite 5.2.8、vue-i18n ^9.1.9、Yarn 1.22、Node 22。

**设计文档:** `docs/superpowers/specs/2026-10-23-uniapp-upgrade-design.md`
**开发分支:** `chore/upgrade-uniapp-vue3`

---

### Task 1: 前置检查并提交计划文档

**Files:**
- Create: `docs/superpowers/plans/2026-10-23-uniapp-upgrade.md`（本文件）

- [ ] **Step 1: 确认分支与工作区状态**

Run:
```bash
git branch --show-current
git status --short
```
Expected: 第一行输出 `chore/upgrade-uniapp-vue3`；第二行只有 `?? .claude/` 和 `?? docs/superpowers/plans/2026-10-23-uniapp-upgrade.md`。`.claude/` 是本地工具配置，**不要提交**。

- [ ] **Step 2: 提交计划文档**

```bash
git add docs/superpowers/plans/2026-10-23-uniapp-upgrade.md
git commit -m "$(cat <<'EOF'
docs 添加 uni-app Vue3 升级实施计划

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
Expected: commit 成功，`git status --short` 仅剩 `?? .claude/`。

---

### Task 2: 替换 package.json 依赖与脚本

**Files:**
- Modify: `package.json`（整体替换）

- [ ] **Step 1: 写入新的 package.json**

```json
{
  "name": "uniapp-blog1",
  "version": "0.1.0",
  "private": true,
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

- [ ] **Step 2: 校验 JSON 与关键版本**

Run:
```bash
node -e "const p=require('./package.json'); console.log(p.dependencies['@dcloudio/uni-app'], p.devDependencies['vite'], p.scripts['dev:mp-weixin'])"
```
Expected: `3.0.0-5020620260917001 5.2.8 uni -p mp-weixin`

- [ ] **Step 3: 提交**

```bash
git add package.json
git commit -m "chore 升级 uni-app 依赖到 Vue3 稳定版并收敛平台脚本"
```

---

### Task 3: 新增 Vite 配置与 H5 入口

**Files:**
- Create: `vite.config.js`
- Create: `index.html`

- [ ] **Step 1: 创建 vite.config.js**

```js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5173,
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

- [ ] **Step 2: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script>
      var coverSupport = 'CSS' in window && typeof CSS.supports === 'function' && (CSS.supports('top: env(a)') ||
        CSS.supports('top: constant(a)'))
      document.write(
        '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0' +
        (coverSupport ? ', viewport-fit=cover' : '') + '" />')
    </script>
    <title></title>
    <!--preload-links-->
    <!--app-context-->
  </head>
  <body>
    <div id="app"><!--app-html--></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 3: 确认文件内容**

Run:
```bash
grep -n "vite-plugin-uni" vite.config.js
grep -n 'src="/src/main.js"' index.html
```
Expected: 两条 grep 均有输出。

- [ ] **Step 4: 提交**

```bash
git add vite.config.js index.html
git commit -m "chore 添加 Vite 构建配置与 H5 入口"
```

---

### Task 4: 改写 main.js 为 Vue 3 入口

**Files:**
- Modify: `src/main.js`（整体替换）

- [ ] **Step 1: 写入新的 main.js**

```js
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
```

- [ ] **Step 2: 确认旧写法已移除**

Run:
```bash
grep -n "createSSRApp\|new Vue" src/main.js
```
Expected: 只有 `createSSRApp` 相关行，没有 `new Vue`。

- [ ] **Step 3: 提交**

```bash
git add src/main.js
git commit -m "chore 使用 createSSRApp 作为 Vue3 应用入口"
```

---

### Task 5: 在 manifest.json 标记 Vue 3

**Files:**
- Modify: `src/manifest.json`（文件尾部）

- [ ] **Step 1: 在文件末尾增加 vueVersion 字段**

将：
```json
	"h5": {
	}
}
```
替换为：
```json
	"h5": {
	},
	"vueVersion": "3"
}
```

- [ ] **Step 2: 校验**

Run:
```bash
grep -n '"vueVersion"' src/manifest.json
```
Expected: 输出包含 `"vueVersion": "3"`。

- [ ] **Step 3: 提交**

```bash
git add src/manifest.json
git commit -m "chore manifest 标记 vueVersion 为 3"
```

---

### Task 6: H5 开发环境接入语雀 API 代理

**Files:**
- Modify: `src/utils/constant.js`（整体替换）

- [ ] **Step 1: 写入新的 constant.js**

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

- [ ] **Step 2: 确认条件编译标记与导出仍在**

Run:
```bash
grep -n "#ifdef H5\|#ifndef H5\|AuthToken\|namespace\|reposLink" src/utils/constant.js
```
Expected: 5 个关键词均出现，`requestHttp` 有两处条件分支。

- [ ] **Step 3: 提交**

```bash
git add src/utils/constant.js
git commit -m "chore H5 开发环境通过本地代理访问语雀 API"
```

---

### Task 7: 将废弃的 upx 单位替换为 rpx

**Files:**
- Modify: `src/components/YuqueRichtext/YuqueRichtext.vue`
- Modify: `src/components/ArticleCard/ArticleCard.vue`
- Modify: `src/pages/article/article.vue`
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/about/about.vue`
- Modify: `src/components/SliderCard/SliderCard.vue`
- Modify: `src/pages/detail/detail.vue`

- [ ] **Step 1: 全局替换（7 个文件，104 处）**

Run:
```bash
grep -rl "upx" src | xargs sed -i 's/upx/rpx/g'
```

- [ ] **Step 2: 确认无残留**

Run:
```bash
grep -rn "upx" src || echo "NO_UPX"
git diff --stat
```
Expected: 输出 `NO_UPX`；`git diff --stat` 恰好列出上述 7 个文件。

- [ ] **Step 3: 提交**

```bash
git add src/components src/pages
git commit -m "chore 将 upx 单位统一替换为 rpx"
```

---

### Task 8: 清理失效的 Vue 2 类型声明与未使用引入

**Files:**
- Modify: `src/pages/index/index.vue`
- Modify: `jsconfig.json`
- Delete: `sfc.d.ts`
- Delete: `shime-vue.d.ts`

- [ ] **Step 1: 删除 index.vue 中未使用的 ArticleCard 引入**

删除这一行：
```js
import ArticleCard from "../../components/ArticleCard/ArticleCard";
```
并把：
```js
  components: { ArticleCard, SliderCard },
```
改为：
```js
  components: { SliderCard },
```

- [ ] **Step 2: 简化 jsconfig.json**

将整个文件替换为：
```json
{
  "compilerOptions": {
    "types": [
      "@dcloudio/types"
    ]
  }
}
```

- [ ] **Step 3: 删除 Vue 2 类型声明文件**

```bash
git rm sfc.d.ts shime-vue.d.ts
```
Expected: 输出 `rm 'sfc.d.ts'` 和 `rm 'shime-vue.d.ts'`。

- [ ] **Step 4: 校验**

Run:
```bash
grep -n "ArticleCard" src/pages/index/index.vue || echo "IMPORT_CLEAN"
grep -n "components:" -A1 src/pages/index/index.vue
```
Expected: 输出 `IMPORT_CLEAN`；`components` 行为 `components: { SliderCard },`。

- [ ] **Step 5: 提交**

```bash
git add src/pages/index/index.vue jsconfig.json
git commit -m "chore 清理 Vue2 类型声明与未使用组件引入"
```

---

### Task 9: 删除旧构建配置与锁文件并重装依赖

**Files:**
- Delete: `babel.config.js`
- Delete: `postcss.config.js`
- Delete: `yarn.lock`
- Regenerate: `yarn.lock`
- Local only: `node_modules/`、`dist/`

- [ ] **Step 1: 删除旧配置文件与锁文件**

```bash
git rm babel.config.js postcss.config.js yarn.lock
```
Expected: 输出三条 `rm '...'`。

- [ ] **Step 2: 删除旧依赖与旧构建产物（均被 gitignore）**

```bash
rm -rf node_modules dist
```
Expected: 命令无输出。

- [ ] **Step 3: 提交删除**

```bash
git commit -m "chore 移除 vue-cli/webpack 配置与旧锁文件"
```

- [ ] **Step 4: 安装新依赖**

```bash
yarn install
```
Expected: 安装成功，生成新的 `yarn.lock`；允许出现 peer dependency 警告但不得有 error。

- [ ] **Step 5: 校验安装结果**

Run:
```bash
node -p "require('@dcloudio/vite-plugin-uni/package.json').version"
ls node_modules/.bin/uni
node -p "require('vue/package.json').version"
```
Expected: 输出 `3.0.0-5020620260917001`；`node_modules/.bin/uni` 存在；Vue 版本以 `3.4.` 或更高 `3.x` 开头。

- [ ] **Step 6: 提交新锁文件**

```bash
git add yarn.lock
git commit -m "chore 重新生成 Vue3 依赖锁文件"
```

---

### Task 10: 构建微信小程序与 H5 生产包

**Files:** 无源码改动，产出于 `dist/build/`

- [ ] **Step 1: 构建微信小程序**

Run:
```bash
yarn build:mp-weixin
```
Expected: 命令成功退出，无 `ERROR`。若失败，先检查 Task 9 的安装结果与 `package.json` 版本是否一致，不要跳过。

- [ ] **Step 2: 检查小程序产物**

Run:
```bash
ls dist/build/mp-weixin/app.json dist/build/mp-weixin/pages/index/index.wxml dist/build/mp-weixin/components/ArticleCard/ArticleCard.wxml
```
Expected: 三个文件均存在。

- [ ] **Step 3: 构建 H5**

Run:
```bash
yarn build:h5
```
Expected: 命令成功退出，无 `ERROR`。

- [ ] **Step 4: 检查 H5 产物**

Run:
```bash
ls dist/build/h5/index.html
```
Expected: 文件存在。

---

### Task 11: 验证微信小程序开发产物

**Files:** 无源码改动，产出于 `dist/dev/mp-weixin`

- [ ] **Step 1: 启动开发构建**

在后台运行（或在独立终端执行）：
```bash
yarn dev:mp-weixin
```
Expected: 等待出现 `Build complete` / `DONE` 类似输出，且进程保持 watch 状态。

- [ ] **Step 2: 检查开发产物**

Run:
```bash
ls dist/dev/mp-weixin/app.json dist/dev/mp-weixin/pages/index/index.wxml dist/dev/mp-weixin/pages/detail/detail.wxml dist/dev/mp-weixin/components/SliderCard/SliderCard.wxml
```
Expected: 四个文件均存在。

- [ ] **Step 3: 停止 watch 进程**

停止后台/终端中的 `yarn dev:mp-weixin` 进程（终端里按 Ctrl+C）。

- [ ] **Step 4: 交接给用户**

告知用户在微信开发者工具中导入 `dist/dev/mp-weixin`，依次检查：首页（文档数/查看数/滑动卡）、文章页三个 tab、文章详情（富文本与复制链接）、关于页（跳转与复制）。这一步无法由自动化完成。

---

### Task 12: 验证 H5 开发环境与语雀代理

**Files:** 无源码改动

- [ ] **Step 1: 启动 H5 开发服务器**

在后台运行：
```bash
yarn dev:h5
```
Expected: 输出 `Local: http://localhost:5173/`（若 5173 被占用，Vite 会换端口，以实际输出为准并替换后续 URL）。

- [ ] **Step 2: 检查首页响应**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```
Expected: `200`

- [ ] **Step 3: 检查代理已生效（未鉴权应为 401）**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/yuque-api/api/v2/repos/yopai/pp6bv5
```
Expected: `401`（请求已被转发到语雀；若不是代理，Vite 会返回 404）。

- [ ] **Step 4: 检查代理携带 Token 可返回数据（应为 200）**

Run:
```bash
TOKEN=$(node -p "require('./src/yuque.json').AuthToken")
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Auth-Token: $TOKEN" http://localhost:5173/yuque-api/api/v2/repos/yopai/pp6bv5
```
Expected: `200`

- [ ] **Step 5: 浏览器走查**

打开 `http://localhost:5173/`，检查首页显示文档数与查看数、文章页三个 tab、详情页富文本、关于页。完成后停止 `yarn dev:h5`。

---

### Task 13: 更新 README 运行说明

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 替换运行说明**

将 README 中：
```markdown
## 项目运行
```
// 注意：
// 如果全局安装过vue，如果版本不同可能需要移除下，再全局安装
npm install -g @vue/cli@4

yarn install

// 运行
npm run dev:mp-weixin
```
```
替换为：
```markdown
## 项目运行
```bash
yarn install

# 微信小程序开发
yarn dev:mp-weixin

# H5 开发（仅本地调试）
yarn dev:h5
```

> 微信小程序使用微信开发者工具导入 `dist/dev/mp-weixin`。
> H5 开发环境通过 Vite 代理访问语雀 API；H5 生产构建仍受语雀 API 的 CORS 限制。
```

- [ ] **Step 2: 校验**

Run:
```bash
grep -n "yarn dev:mp-weixin\|yarn dev:h5" README.md
```
Expected: 两行均出现。

- [ ] **Step 3: 提交**

```bash
git add README.md
git commit -m "docs 更新项目运行说明"
```

---

### Task 14: 最终检查与交付

**Files:** 无

- [ ] **Step 1: 检查工作区与提交记录**

Run:
```bash
git status --short
git log --oneline -10
```
Expected: `git status` 仅剩 `?? .claude/`；提交记录包含本次升级的各个 commit。

- [ ] **Step 2: 复核关键文件**

Run:
```bash
grep -n "createSSRApp" src/main.js
grep -n "vueVersion" src/manifest.json
grep -n "yuque-api" vite.config.js src/utils/constant.js
grep -rn "upx" src || echo "NO_UPX"
```
Expected: 前三组 grep 均有输出；最后输出 `NO_UPX`。

- [ ] **Step 3: 向用户汇报**

汇报内容：升级目标版本、改动文件清单、构建与 H5 验证结果、需要用户在微信开发者工具完成的走查项，以及未包含的 Token 泄露修复。

---

## 回滚方案

如需放弃：

```bash
git checkout master
yarn install
```

升级改动全部位于 `chore/upgrade-uniapp-vue3` 分支，`src/yuque.json` 等业务配置未被修改。
