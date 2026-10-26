# 「我的」页 + 补剂记录 + 宝宝头像设计

日期：2026-10-26
分支：`feat/profile-and-supplement`（基于 `origin/master` b753303）

## 1. 背景与目标

「垣计算」当前是「宝宝 / 工具」两个底部 Tab：

- 宝宝 Tab 承载首页与侧栏（喝奶、睡眠、排便、辅食、用药、疫苗、生长、手记、妈妈、旅行、设置）。
- 工具 Tab 承载 4 个计算工具。

本次要解决三件事：

1. 新增「补剂」日常记录，与「用药」并列，不合并、不改名。
2. 支持修改宝宝头像，并让头像随本地备份一起导出/恢复。
3. 新增「我的」页面，把工具、数据与设置、关于收拢到监护人侧，并为后续接口数据同步预留位置。

## 2. 评估结论

增加「我的」页是合适的：

- 工具是监护人低频使用，不应占一级 Tab；宝宝记录才是高频核心。
- 头像、设置、备份、关于、未来账号与同步都属于监护人侧，集中到「我的」后信息架构更清晰。
- 侧栏 12 项已偏满；把「设置」移出侧栏、归入「我的」后，侧栏专注宝宝记录。
- 风险是「我的」与侧栏设置项重复，因此本次明确移除侧栏「设置」。
- 同步目前只做占位，不新增网络请求、不新增登录，不改变“纯本地”产品边界。

## 3. 信息架构与导航

底部 Tab 调整为：

```
宝宝  /  我的
```

- 「宝宝」：`pages/baby/index`，保持现有首页与侧栏。
- 「我的」：`pages/mine/index`，监护人中心，不使用宝宝侧栏。
- 工具页 `pages/tools/index` 保留，但从 tabBar 移除，改为从「我的」进入的普通页面。
- 侧栏移除「设置」，新增「补剂」。侧栏最终顺序：
  首页、喝奶、睡眠、排便、辅食、用药、补剂、疫苗、生长、手记、妈妈、旅行（共 12 项）。
- 设置页仍使用 `BabyPage` 外壳，保留侧栏作为返回宝宝记录的路径；由于侧栏不再有「设置」项，`active` 不会高亮任何项。

## 4. 「我的」页设计

### 4.1 页面结构

```
┌──────────────────────────────┐
│  ╭────╮   本地模式           │  身份卡（粉色渐变）
│  │ 👤 │   数据仅保存在本机    │
│  ╰────╯   [未登录]           │
├──────────────────────────────┤
│  ☁️ 数据同步                  │
│  当前为本机存储               │
│  云端同步即将上线，届时可在    │
│  多台设备间同步宝宝记录        │
│  [ 即将上线 ]（置灰不可用）    │
├──────────────────────────────┤
│  🧰 工具箱                    │
│  🧮 增值税       含税/不含税 › │
│  📐 单位换算     长度/重量  › │
│  ✂️ 文本处理     去重/大小写 › │
│  🔢 进制转换     2–36 进制  › │
├──────────────────────────────┤
│  ⚙️ 数据与设置              › │
│  ℹ️ 关于与免责声明          › │
└──────────────────────────────┘
```

### 4.2 交互

- 身份卡：展示家长占位头像（👤）、“本地模式”、“数据仅保存在本机”和「未登录」标签。当前不可点击，为未来账号头像/昵称预留。
- 数据同步卡：纯展示，不可发起任何网络请求；按钮显示“即将上线”，点击只给 `uni.showToast` 提示，不触发同步。
- 工具箱：4 行入口，点击后 `uni.navigateTo({ url: '/pages/tools/index?tool=<key>' })`，工具页按现有 `onLoad` 的 `tool` 参数直接定位。
- 数据与设置：`uni.navigateTo({ url: '/package-baby/settings/index' })`。
- 关于与免责声明：`uni.navigateTo({ url: '/pages/about/about' })`。
- 页面沿用全局 `--primary`、`--surface`、`--border` 等变量和 `.card` 视觉，保持奶油糖果风。

### 4.3 非目标

- 不做真实登录、账号体系、云同步或网络请求。
- 不在「我的」页重复宝宝资料编辑表单（资料编辑仍在设置页，头像在首页与设置页均可改）。

## 5. 宝宝头像设计

### 5.1 数据模型

`profile` 增加字段：

```js
{
  name: '宝宝',
  birthDate: '',
  gender: 'boy',
  avatar: '',        // data:image/jpeg;base64,... 或空字符串
  createdAt: null,
  updatedAt: null,
}
```

- 头像以压缩后的 base64 data URL 存入 `profile.avatar`。
- 不使用本地文件路径，避免换设备、清理临时文件后失效。
- 备份 payload 的 `data.profile` 已包含 profile，因此头像自动随导出/恢复迁移，无需改动备份 schema。

### 5.2 校验

新增 `src/utils/baby/avatar.js`：

- `MAX_AVATAR_CHARS = 300 * 1024`（base64 字符数上限，约 225KB 二进制）。
- `isValidAvatar(value)`：
  - `''` 合法（表示无头像）；
  - 必须是字符串；
  - 长度不超过 `MAX_AVATAR_CHARS`；
  - 必须匹配 `^data:image\/(jpeg|png|webp);base64,`。
- `chooseAvatarImage(options)`：返回 `Promise<{ ok: true, dataUrl } | { ok: false, error }>`。

### 5.3 选图与压缩

- 统一使用 `uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType })`。
- 微信小程序：
  1. 优先调用 `wx.compressImage({ src, quality: 70, compressedWidth: 400 })`；
  2. 用 `wx.getFileSystemManager().readFileSync(path, 'base64')` 读取；
  3. 根据扩展名生成 `data:image/jpeg;base64,...`；
  4. 若超长，降级为 quality 60 / width 320 再试一次，仍超限则返回“图片过大，请换一张”。
- H5：
  1. 用 `Image` 加载 `uni.chooseImage` 返回的临时路径；
  2. 用 canvas 等比缩放到最长边 400px；
  3. `canvas.toDataURL('image/jpeg', 0.7)`；
  4. 失败时降级为 `FileReader.readAsDataURL`。
- 压缩失败或用户取消时返回明确错误，不写入存储。

### 5.4 保存

`src/utils/baby/profile.js`：

- `DEFAULT_PROFILE.avatar = ''`。
- `loadProfile()`：头像不合法时回退为 `''`，不影响其他字段。
- `validateProfile()`：若传入头像且不合法，返回“头像格式不正确”或“头像图片过大，请换一张”。
- `saveProfile()`：写入 `avatar`；当 `input.avatar === undefined` 时保留旧头像，避免其他表单保存时误清空。
- 新增 `saveAvatar(avatar, now)`：只更新头像，不要求昵称/生日已填写，供宝宝首页直接更换头像使用。

### 5.5 入口 UI

- 宝宝首页 `pages/baby/index.vue`：
  - `profile.avatar` 存在时用 `<image mode="aspectFill">` 圆形展示，否则保留 👶；
  - 头像右下角加一个小相机角标；
  - 点击头像 → 选择拍照/相册 → `saveAvatar()` → 刷新并 toast「头像已更新」。
- 设置页 `package-baby/settings/index.vue`：
  - 「宝宝资料」卡片顶部增加“宝宝头像”行；
  - 点击弹出 action sheet：从相册选择 / 拍照 / 移除头像；
  - 表单 `form.avatar` 随「保存资料」一起写入。

## 6. 补剂记录设计

### 6.1 记录类型

新增独立类型 `supplement`，与 `medicine` 结构一致、互不影响：

```js
{
  id: '...',
  time: '2026-10-26 09:00',
  name: '维生素 D',
  amount: '1 滴',
  note: '',
  createdAt: 1234567890,
}
```

- `KINDS` 增加 `'supplement'`。
- `emptyDay()` 增加 `supplement: []`。
- `normalizeDay()` 增加 `supplement: sanitize(source.supplement, 'time')`。
- 旧数据缺少 `supplement` 时自然得到空数组，无需迁移。

### 6.2 校验

`validateSupplement(input)`：

- 时间必填，错误文案“请选择补剂时间”；
- 名称必填、≤30 字，错误文案“请输入补剂名称”/“补剂名称最多 30 个字”；
- 用量选填、≤20 字；
- 备注选填、≤200 字。

### 6.3 页面与表单

- 新增 `src/package-baby/records/supplement.vue`：
  - `RecordPage kind="supplement" emoji="🌿" title="补剂"`；
  - 空态文案：“今天还没有补剂记录，点‘添加’记一笔吧 🐣”；
  - 统计：补剂次数、最近补剂。
- `RecordForm.vue`：
  - 用药与补剂共用一组自定义字段（名称/用量/备注），通过 `kind` 切换标题、标签、占位符和提示；
  - 用药标题「💊 记录用药」，补剂标题「🌿 记录补剂」；
  - 补剂提示：“仅记录用户输入，不提供补剂建议，请遵医嘱。”
- `RecordList.vue`：
  - 用药与补剂共用列表渲染，emoji 分别 💊 / 🌿；
  - 副行显示用量与备注，空时显示“用量未记录”。
- `RecordPage.vue` 的快捷切换保持喝奶/睡眠/排便/辅食 4 项，补剂与用药一样从侧栏进入。

### 6.4 路由与侧栏

- `src/pages.json` 的 `package-baby` 分包新增：

```json
{
  "path": "records/supplement",
  "style": { "navigationBarTitleText": "补剂记录" }
}
```

- `src/utils/baby/sidebar.js` 在 `medicine` 后新增：

```js
{ key: 'supplement', label: '补剂', icon: '🌿', url: '/package-baby/records/supplement' }
```

### 6.5 相邻修正

`removeRecord()` 当前判断是否删除当天数据时只看 `milk/sleep/diaper`，导致只含辅食/用药的日期删除后仍残留空对象。改为：所有 `KINDS` 数组都为空时才删除当天条目，并补充测试。

## 7. 路由与配置变更

`src/pages.json`：

- `pages` 新增 `pages/mine/index`，标题「我的」。
- `tabBar.list` 改为：

```json
[
  { "pagePath": "pages/baby/index", "text": "宝宝", "iconPath": "static/tab-baby.png", "selectedIconPath": "static/tab-baby-active.png" },
  { "pagePath": "pages/mine/index", "text": "我的", "iconPath": "static/tab-mine.png", "selectedIconPath": "static/tab-mine-active.png" }
]
```

- `pages/tools/index` 仍保留在 `pages`，但从 tabBar 移除。
- 新增分包页 `package-baby/records/supplement`。

图标：

- 扩展 `scripts/gen-tab-icons.cjs`，新增“家长/人形”图标生成，输出 `tab-mine.png`、`tab-mine-active.png`。
- 因工具页不再是 Tab，脚本不再生成 `tab-tools*.png`，并移除这两个静态文件（仅 pages.json 引用过它们）。

## 8. 兼容性

- 用药的存储键、路由、备份字段保持不变。
- 补剂是新增数组字段，旧数据、旧备份可直接读取。
- 头像写入 profile，旧备份无 avatar 时按空字符串处理。
- 备份 `schemaVersion` 保持 1，不新增必填字段。
- 我的页同步卡不产生网络请求，`sync.js` 保持现状。

## 9. 测试与验收

### 9.1 单元测试

- `tests/baby-records.test.js`：
  - 补剂时间/名称/用量/备注校验；
  - 补剂新增、删除、按日加载；
  - 旧数据缺少 `supplement` 时返回空数组；
  - 删除某类最后一条记录时当天清理逻辑正确。
- `tests/boundaries.test.js`：`loadDay('bad')` 返回值包含 `supplement: []`。
- `tests/baby-backup.test.js`：补剂记录导出/恢复 round-trip；空数组形状更新。
- `tests/baby-sync.test.js`：快照中的每日对象包含 `supplement`。
- `tests/baby-sidebar.test.js`：侧栏 12 项顺序、标签、补剂 URL；不再包含设置。
- `tests/baby-profile.test.js`：avatar 保存/读取、非法头像回退、`saveProfile` 保留旧头像。
- 新增 `tests/baby-avatar.test.js`：`isValidAvatar` 的空值、前缀、长度边界。

### 9.2 构建与手动验收

- `npm test` 全绿。
- `npm run build:mp-weixin` 构建成功。
- 微信开发者工具手动检查：
  1. 底部 Tab 为「宝宝 / 我的」，工具页不再是 Tab；
  2. 「我的」页布局、工具 4 行入口、设置/关于跳转正常；
  3. 同步卡按钮只提示“即将上线”；
  4. 宝宝首页点头像可更换并持久化；设置页也可更换/移除；
  5. 侧栏出现「补剂」，可新增、展示、删除；
  6. 导出后恢复，补剂与头像都保留；
  7. 旧数据（无 supplement、无 avatar）加载正常。

## 10. 明确不做

- 不接网络接口、不做登录、不做真实云同步。
- 不改用药存储键/路由/备份字段。
- 不做补剂提醒、剂量建议、补剂库。
- 不做头像裁剪编辑器、不做多宝宝切换。

## 11. 文件清单

新增：

- `src/pages/mine/index.vue`
- `src/package-baby/records/supplement.vue`
- `src/utils/baby/avatar.js`
- `src/static/tab-mine.png`
- `src/static/tab-mine-active.png`
- `tests/baby-avatar.test.js`
- `docs/superpowers/specs/2026-10-26-mine-page-supplement-avatar-design.md`

修改：

- `src/pages.json`
- `src/pages/baby/index.vue`
- `src/package-baby/settings/index.vue`
- `src/package-baby/components/RecordForm.vue`
- `src/package-baby/components/records/RecordList.vue`
- `src/utils/baby/records.js`
- `src/utils/baby/profile.js`
- `src/utils/baby/sidebar.js`
- `scripts/gen-tab-icons.cjs`
- `CLAUDE.md`
- `README.md`
- 相关测试文件
