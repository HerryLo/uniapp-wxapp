# 二期：辅食、用药、妈妈记录、旅行设计

日期：2026-10-24
范围：日常记录扩展、妈妈记录页、旅行记录页、备份兼容

## 目标

在现有宝宝记录基础上增加四类记录：

1. 辅食（并入日常记录）
2. 用药（并入日常记录，只记用户自定义名称与用户手填用量）
3. 妈妈记录（独立页面，每日一条）
4. 旅行（独立页面，手动地点，不使用定位）

补剂、户外、洗澡、早教不在本期。

## 页面结构

- **日常记录** Tab 变为：🍼 喝奶 / 😴 睡眠 / 💧 排便 / 🍚 辅食 / 💊 用药。
- **妈妈记录**：新增 `src/package-baby/mom/index.vue`，通过左侧栏「妈妈」进入。
- **旅行记录**：新增 `src/package-baby/travel/index.vue`，通过左侧栏「旅行」进入。
- 两个新页面使用 `<BabyPage>` 包裹，与现有宝宝页共享侧栏；不放广告。
- 侧栏入口调整为：首页、喝奶、睡眠、排便、疫苗、生长、手记、妈妈、旅行、设置，共 10 项。
- 温馨提示只在宝宝首页展示；新页面使用表单内的安全提示，不再使用 `Disclaimer`。
- 新页面沿用奶油糖果风：卡片标题带 emoji、全局胶囊按钮和圆角输入框。

## 数据模型

### 日常记录扩展

继续使用 `baby.records.v1.YYYY-MM`，每日对象新增 `food`、`medicine` 数组：

```js
{
  milk: [],
  sleep: [],
  diaper: [],
  food: [
    { id, time, name, amount, reaction, note, createdAt }
  ],
  medicine: [
    { id, time, name, amount, note, createdAt }
  ]
}
```

- `time` 使用 `YYYY-MM-DD HH:mm` 本地时间。
- `amount` 为自由文本，可为空字符串。
- `reaction` 取值：`喜欢` / `一般` / `拒绝` / `异常`，默认 `一般`。
- 旧数据没有 `food` / `medicine` 时按空数组处理。

### 妈妈记录

新增 key：`baby.mom.v1`，存储数组，每个日期一条：

```js
{
  date: 'YYYY-MM-DD',
  sleepHours: number | null,
  mood: 'happy' | 'calm' | 'tired' | 'anxious' | 'low',
  condition: string,
  note: string,
  createdAt: number,
  updatedAt: number
}
```

心情选项：

| key | emoji | 文案 |
|---|---|---|
| happy | 😊 | 开心 |
| calm | 😌 | 平静 |
| tired | 😪 | 疲惫 |
| anxious | 😟 | 焦虑 |
| low | 😔 | 低落 |

同一天再次保存时覆盖原记录，`createdAt` 保留首次时间。

### 旅行记录

新增 key：`baby.travel.v1`，存储数组：

```js
{
  id: string,
  startDate: 'YYYY-MM-DD',
  endDate: 'YYYY-MM-DD',
  place: string,
  note: string,
  createdAt: number
}
```

按 `startDate` 倒序展示。

## 接口设计

### `src/utils/baby/records.js`

- `KINDS` 扩展为 `['milk', 'sleep', 'diaper', 'food', 'medicine']`
- `emptyDay()` 返回五个数组
- `normalizeDay()` 读取并清洗 `food`、`medicine`
- 新增导出 `FOOD_REACTIONS = ['喜欢', '一般', '拒绝', '异常']`
- 新增 `validateFood(input): string`
  - 时间必填合法
  - 食物名称必填，≤30 字
  - 份量可选，≤20 字
  - 反应必须在 `FOOD_REACTIONS` 内
  - 备注可选，≤200 字
- 新增 `validateMedicine(input): string`
  - 时间必填合法
  - 药品名称必填，≤30 字
  - 用量可选，≤20 字
  - 备注可选，≤200 字
- `addRecord` / `removeRecord` 支持新类型
- `recordDate` / `sortRecords` 继续按 `time` 字段处理新类型

### `src/utils/baby/keys.js`

新增：

```js
export const MOM_KEY = 'baby.mom.v1'
export const TRAVEL_KEY = 'baby.travel.v1'
```

### `src/utils/baby/mom.js`

- `MOODS`：5 项 `{ key, emoji, label }`
- `loadMomEntries()`：清洗非法日期/心情，按日期倒序
- `saveMomEntry(input, now?)`：校验并 upsert，返回 `{ ok, error?, entry?, entries? }`
  - 日期必填、不能晚于今天
  - 睡眠时长可为空；填写时为 0–24 的数字
  - 心情必须在 `MOODS` 内
  - 身体状态 ≤50 字，备注 ≤200 字
- `removeMomEntry(date)`：按日期删除，返回 `{ ok, error?, entries? }`

### `src/utils/baby/travel.js`

- `loadTravels()`：清洗非法日期/地点，按开始日期倒序
- `addTravel(input, now?)`：返回 `{ ok, error?, travel?, list? }`
  - 开始、结束日期必填且合法
  - 结束日期不得早于开始日期
  - 地点必填，≤30 字
  - 备注 ≤200 字
- `removeTravel(id)`：返回 `{ ok, error?, list? }`

### `src/utils/baby/backup.js`

- 导出载荷 `data` 增加 `mom: loadMomEntries()`、`travel: loadTravels()`
- 导入校验：`mom`、`travel` 存在时必须是数组；缺失时兼容旧备份
- 恢复时存在则写入对应 key
- `clearExceptBackup` 的兜底 key 列表加入 `MOM_KEY`、`TRAVEL_KEY`
- `schemaVersion` 保持 1

## 页面设计

### 日常记录

- Tab 增加「辅食」「用药」，5 个 Tab 等宽排列。
- 辅食列表行：时间 · 食物名称；副行显示份量、反应、备注。
- 用药列表行：时间 · 药品名称；副行显示用量、备注。
- 顶部统计卡保持三项；辅食/用药 Tab 在列表标题旁显示「今日 N 次」。
- 删除继续使用二次确认。

### RecordForm

新增两个分支：

- 辅食：日期/时间、食物名称、份量（可选）、反应 chips、备注 textarea
- 用药：日期/时间、药品名称、用量（可选）、备注 textarea
  - 表单提示：「仅记录用户输入，不提供用药建议，请遵医嘱。」
- 选择「异常」反应时显示提示：「如出现持续异常反应，请咨询儿科医生。」

### 妈妈记录页

- 表单：日期、睡眠时长（可选，数字）、心情 chips、身体状态（可选）、备注
- 保存后同日期覆盖
- 历史列表：日期、心情 emoji + 文案、睡眠时长、身体状态/备注；可删除
- 免责声明：「妈妈记录仅用于个人记录，不构成医疗建议。如有持续不适，请咨询医生。」

### 旅行记录页

- 表单：开始日期、结束日期、地点（手动输入）、备注
- 列表：日期范围、地点、备注；可删除
- 免责声明：「地点为手动输入，不使用定位权限。」

## 边界与错误处理

- 存储读取失败沿用 `readStorage` 容错，按空数据展示。
- 旧备份缺少 `mom` / `travel` 时正常导入，新数据为空。
- 日期非法、结束早于开始、必填项缺失时阻止保存并显示具体错误。
- 不申请定位、不发起网络请求、不上传数据。
- 新页面不展示广告。

## 测试

- `tests/baby-records.test.js`：辅食/用药校验、增删、按日加载、跨类型互不影响。
- `tests/baby-mom.test.js`：日期与睡眠校验、upsert 覆盖、删除、脏数据过滤。
- `tests/baby-travel.test.js`：日期顺序校验、增删、脏数据过滤。
- `tests/baby-backup.test.js`：导出包含 mom/travel、恢复写入、旧备份兼容。

## 验收

1. `npm test` 全部通过。
2. `npm run build:mp-weixin`、`npm run build:h5` 成功。
3. 开发者工具检查：
   - 日常记录 5 个 Tab 可切换，辅食/用药可新增、展示、删除。
   - 妈妈记录同日保存覆盖，历史列表正确。
   - 旅行日期校验生效，列表按开始日期倒序。
   - 导出 JSON 包含 `mom`、`travel`；恢复后两个页面数据正确。
4. 页面不使用定位权限，无新增网络请求。

## 不在范围

- 补剂、户外、洗澡、辅食营养参考、早教、旅行地图。
- 用药提醒、剂量建议、药品库。
- 云同步、多宝宝、系统日历。
