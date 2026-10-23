# 计算工具小程序改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有语雀博客小程序改造为纯前端计算工具小程序（7 个工具 + 待办清单 + 系统日历提醒）。

**Architecture:** 所有计算逻辑放在 `src/utils/*.js` 纯函数中并用 Vitest 覆盖；每个工具是一个 `src/components/tools/*Panel.vue` 组件，由 `pages/tools/index.vue` 用一行 7 个标签通过 `v-show` 切换；待办独立 tab，数据存本地并为未完成数量设置 tab 徽标。无后端、无 UI 框架。

**Tech Stack:** uni-app 3.0.0-5020620260917001、Vue 3.4.21、Vite 5.2.8、Vitest 1.6.0、微信小程序 + H5。

---

## 执行进度（更新于 2026-10-23）

**分支：** `feat/tool-miniapp`（已推送到 `origin`）

| 任务 | 状态 | 提交 |
|---|---|---|
| 前置准备（Step 0 / 0.1） | ✅ 完成 | — |
| Task 1 测试基础设施与存储封装 | ✅ 完成 | `1e849fd`、`5f5ac58` |
| Task 2 增值税计算逻辑 | ✅ 完成 | `0a14a35`、`fcf8d5d` |
| Task 3 文本处理逻辑 | ✅ 完成 | `1fb2c3d` |
| Task 4 进制转换逻辑 | ✅ 完成 | `dbd3355` |
| Task 5 单位换算逻辑 | ✅ 完成 | `4ed8797` |
| Task 6 时间戳转换逻辑 | ✅ 完成 | `531ee30` |
| Task 7 JSON 处理逻辑 | ✅ 完成 | `f8d0b57` |
| Task 8 编码工具逻辑 | ✅ 完成 | `721803b`、`21967e9` |
| Task 9 待办数据逻辑 | ✅ 完成 | `c6aecfb`、`768baff` |
| Task 10 生成 tab 图标 | ✅ 完成 | `54876ce` |
| Task 11 应用外壳 | ✅ 完成（spec 评审通过；代码质量评审被打断，恢复后可补做） | `3a73cf5` |
| Task 12–22 | ⬜ 未开始 | — |
| 最终整体代码评审 | ⬜ 未开始 | — |

**当前测试基线：** 9 个测试文件 / 49 个用例全部通过（`yarn test`）。`yarn build:mp-weixin` 在 Task 11 提交后构建成功。

**下一步：** 从 Task 12（增值税面板）继续。每完成一个任务：实现 → 构建验证 → 提交 → spec 评审 → 代码质量评审 → 勾选本计划对应步骤。

**注意：**
- 工作区有一个未提交的 `.gitignore` 改动（新增 `.claude/`），与计划无关，请勿提交。
- 依赖安装需使用 `--registry https://registry.yarnpkg.com`（本机 `~/.npmrc` 私服返回 401）。
- 微信开发者工具需真机验证日历提醒（Task 19 / 22）。

---

## 前置准备

- [x] **Step 0: 创建开发分支**

```bash
git checkout -b feat/tool-miniapp
```

Expected: `Switched to a new branch 'feat/tool-miniapp'`。

- [x] **Step 0.1: 确认基线**

```bash
yarn test 2>&1 | head -5 || true
```

Expected: 此时尚无 `test` 脚本，输出 `command not found` 类错误，属正常，Task 1 会补上。

## 文件结构

**新增**

- `vitest.config.js`
- `tests/{storage,vat,text,radix,units,timestamp,json,encode,todo}.test.js`
- `src/utils/{storage,vat,text,radix,units,timestamp,json,encode,todo,calendar}.js`
- `src/components/tools/{Vat,Unit,Text,Encode,Radix,Timestamp,Json}Panel.vue`
- `src/components/tools/TodoItem.vue`
- `src/pages/tools/index.vue`
- `src/pages/todo/index.vue`
- `scripts/gen-tab-icons.cjs`
- `src/static/tab-{tools,todo}{,-active}.png`

**修改**

- `package.json`、`src/pages.json`、`src/App.vue`、`src/manifest.json`、`src/pages/about/about.vue`、`README.md`

**删除（Task 20）**

- `src/pages/{index/index,article/article,detail/detail}.vue`
- `src/components/{ArticleCard,SliderCard,YuqueRichtext}/`
- `src/service/index.js`、`src/utils/constant.js`、`src/utils/util.js`、`src/yuque.json`
- 博客静态图片与 `public/index.html`、`public/static/gh_*.jpg`

---

### Task 1: 测试基础设施与存储封装

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json`
- Create: `tests/storage.test.js`
- Create: `src/utils/storage.js`

- [x] **Step 1: 配置 Vitest**

`vitest.config.js`：

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})
```

`package.json`（完整替换）：

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
    "build:mp-weixin": "uni build -p mp-weixin",
    "test": "vitest run"
  },
  "dependencies": {
    "@dcloudio/uni-app": "3.0.0-5020620260917001",
    "@dcloudio/uni-components": "3.0.0-5020620260917001",
    "@dcloudio/uni-h5": "3.0.0-5020620260917001",
    "@dcloudio/uni-mp-weixin": "3.0.0-5020620260917001",
    "vue": "3.4.21",
    "vue-i18n": "^9.1.9"
  },
  "devDependencies": {
    "@dcloudio/types": "3.4.31",
    "@dcloudio/uni-cli-shared": "3.0.0-5020620260917001",
    "@dcloudio/uni-stacktracey": "3.0.0-5020620260917001",
    "@dcloudio/vite-plugin-uni": "3.0.0-5020620260917001",
    "@vue/runtime-core": "3.4.21",
    "rollup": "4.14.3",
    "vite": "5.2.8",
    "vitest": "1.6.0"
  }
}
```

- [x] **Step 2: 安装依赖**

```bash
yarn install --registry https://registry.yarnpkg.com --network-timeout 600000
```

Expected: `Done in ...`，`node_modules/vitest` 存在。

- [x] **Step 3: 写失败的测试**

`tests/storage.test.js`：

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readStorage, writeStorage, removeStorage } from '../src/utils/storage.js'

let store

beforeEach(() => {
  store = {}
  vi.stubGlobal('uni', {
    getStorageSync: vi.fn((key) => (key in store ? store[key] : '')),
    setStorageSync: vi.fn((key, value) => { store[key] = value }),
    removeStorageSync: vi.fn((key) => { delete store[key] }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('storage', () => {
  it('returns fallback when key is missing', () => {
    expect(readStorage('missing', { a: 1 })).toEqual({ a: 1 })
  })

  it('round-trips objects through JSON', () => {
    writeStorage('key', { a: 1, b: [2] })
    expect(readStorage('key', null)).toEqual({ a: 1, b: [2] })
  })

  it('returns fallback when stored value is invalid JSON', () => {
    store.bad = '{oops'
    expect(readStorage('bad', [])).toEqual([])
  })

  it('removes a key', () => {
    writeStorage('key', 1)
    removeStorage('key')
    expect(readStorage('key', null)).toBe(null)
  })
})
```

- [x] **Step 4: 运行测试确认失败**

```bash
yarn test tests/storage.test.js
```

Expected: FAIL，`Cannot find module '../src/utils/storage.js'`。

- [x] **Step 5: 实现存储封装**

`src/utils/storage.js`：

```js
export function readStorage(key, fallback) {
  try {
    const raw = uni.getStorageSync(key)
    if (raw === '' || raw === null || raw === undefined) return fallback
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

export function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}
```

- [x] **Step 6: 运行测试确认通过**

```bash
yarn test tests/storage.test.js
```

Expected: 4 passed。

- [x] **Step 7: 提交**

```bash
git add package.json yarn.lock vitest.config.js tests/storage.test.js src/utils/storage.js
git commit -m "feat 新增存储封装与测试基础设施"
```

---

### Task 2: 增值税计算逻辑

**Files:**
- Create: `tests/vat.test.js`
- Create: `src/utils/vat.js`

- [x] **Step 1: 写失败的测试**

`tests/vat.test.js`：

```js
import { describe, it, expect } from 'vitest'
import {
  toCents,
  toBasisPoints,
  validateAmount,
  validateRate,
  calcVat,
  formatCents,
  formatVatText,
} from '../src/utils/vat.js'

describe('vat', () => {
  it('parses amounts to cents with rounding', () => {
    expect(toCents('100')).toBe(10000)
    expect(toCents('100.5')).toBe(10050)
    expect(toCents('100.005')).toBe(10001)
    expect(toCents('0')).toBe(0)
    expect(toCents('abc')).toBe(null)
    expect(toCents('-1')).toBe(null)
  })

  it('parses rates to basis points', () => {
    expect(toBasisPoints('13')).toBe(1300)
    expect(toBasisPoints('0.5')).toBe(50)
    expect(toBasisPoints('100')).toBe(10000)
    expect(toBasisPoints('100.01')).toBe(null)
  })

  it('validates amounts and rates', () => {
    expect(validateAmount('')).toEqual({ error: '请输入金额' })
    expect(validateAmount('0')).toEqual({ error: '金额必须大于 0' })
    expect(validateAmount('100')).toEqual({ cents: 10000 })
    expect(validateRate('')).toEqual({ error: '请输入税率' })
    expect(validateRate('101')).toEqual({ error: '请输入 0–100 的税率' })
    expect(validateRate('13')).toEqual({ bp: 1300 })
  })

  it('calculates excluded to included', () => {
    expect(calcVat(10000, 1300, 'excluded')).toEqual({ netCents: 10000, taxCents: 1300, grossCents: 11300 })
    expect(calcVat(10000, 0, 'excluded')).toEqual({ netCents: 10000, taxCents: 0, grossCents: 10000 })
  })

  it('calculates included to excluded', () => {
    expect(calcVat(11300, 1300, 'included')).toEqual({ netCents: 10000, taxCents: 1300, grossCents: 11300 })
    expect(calcVat(10001, 1300, 'included')).toEqual({ netCents: 8850, taxCents: 1151, grossCents: 10001 })
  })

  it('formats cents and result text', () => {
    expect(formatCents(11300)).toBe('113.00')
    expect(formatCents(5)).toBe('0.05')
    expect(formatVatText({ net: '100.00', tax: '13.00', gross: '113.00' }))
      .toBe('不含税金额：100.00\n税额：13.00\n价税合计：113.00')
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/vat.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现计算逻辑**

`src/utils/vat.js`：

```js
export const RATE_PRESETS = [13, 9, 6, 5, 3, 1]

const MAX_AMOUNT_CENTS = 100000000000

export function toCents(input) {
  const s = String(input).trim()
  if (!/^\d+(\.\d*)?$/.test(s)) return null
  const [intPart, fracPart = ''] = s.split('.')
  const frac = (fracPart + '000').slice(0, 3)
  let cents = Number(intPart) * 100 + Number(frac.slice(0, 2))
  if (Number(frac[2]) >= 5) cents += 1
  if (!Number.isSafeInteger(cents)) return null
  return cents
}

export function toBasisPoints(input) {
  const s = String(input).trim()
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null
  const [intPart, fracPart = ''] = s.split('.')
  const bp = Number(intPart) * 100 + Number((fracPart + '00').slice(0, 2))
  return bp > 10000 ? null : bp
}

export function validateAmount(input) {
  if (String(input).trim() === '') return { error: '请输入金额' }
  const cents = toCents(input)
  if (cents === null) return { error: '请输入有效数字' }
  if (cents <= 0) return { error: '金额必须大于 0' }
  if (cents > MAX_AMOUNT_CENTS) return { error: '金额过大' }
  return { cents }
}

export function validateRate(input) {
  if (String(input).trim() === '') return { error: '请输入税率' }
  const bp = toBasisPoints(input)
  if (bp === null || bp > 10000) return { error: '请输入 0–100 的税率' }
  return { bp }
}

export function calcVat(amountCents, bp, mode) {
  if (mode === 'included') {
    const netCents = Math.round((amountCents * 10000) / (10000 + bp))
    return { netCents, taxCents: amountCents - netCents, grossCents: amountCents }
  }
  const taxCents = Math.round((amountCents * bp) / 10000)
  return { netCents: amountCents, taxCents, grossCents: amountCents + taxCents }
}

export function formatCents(cents) {
  return (cents / 100).toFixed(2)
}

export function formatVatText({ net, tax, gross }) {
  return `不含税金额：${net}\n税额：${tax}\n价税合计：${gross}`
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/vat.test.js
```

Expected: 6 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/vat.js tests/vat.test.js
git commit -m "feat 新增增值税计算逻辑"
```

---

### Task 3: 文本处理逻辑

**Files:**
- Create: `tests/text.test.js`
- Create: `src/utils/text.js`

- [x] **Step 1: 写失败的测试**

`tests/text.test.js`：

```js
import { describe, it, expect } from 'vitest'
import {
  dedupeLines,
  toUpperCaseText,
  toLowerCaseText,
  toTitleCaseText,
  countText,
} from '../src/utils/text.js'

describe('text', () => {
  it('dedupes lines preserving first occurrence order', () => {
    expect(dedupeLines('a\nb\na')).toBe('a\nb')
    expect(dedupeLines('a\n\nb\n')).toBe('a\nb')
  })

  it('can ignore case and trim', () => {
    expect(dedupeLines('A\na', { ignoreCase: true })).toBe('A')
    expect(dedupeLines(' a \na', { trim: true })).toBe('a')
    expect(dedupeLines(' a \na')).toBe(' a \na')
  })

  it('converts case', () => {
    expect(toUpperCaseText('Abc')).toBe('ABC')
    expect(toLowerCaseText('AbC')).toBe('abc')
    expect(toTitleCaseText('HELLO world')).toBe('Hello World')
    expect(toTitleCaseText("don't stop")).toBe("Don't Stop")
    expect(toTitleCaseText('你好 hello')).toBe('你好 Hello')
  })

  it('counts lines and characters without newlines', () => {
    expect(countText('')).toEqual({ lines: 0, chars: 0 })
    expect(countText('a\nb')).toEqual({ lines: 2, chars: 2 })
    expect(countText('ab\r\ncd')).toEqual({ lines: 2, chars: 4 })
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/text.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现处理逻辑**

`src/utils/text.js`：

```js
export function dedupeLines(text, options = {}) {
  const ignoreCase = !!options.ignoreCase
  const trim = !!options.trim
  const seen = new Set()
  const out = []
  for (let line of String(text).split(/\r?\n/)) {
    if (trim) line = line.trim()
    if (line.trim() === '') continue
    const key = ignoreCase ? line.toLowerCase() : line
    if (seen.has(key)) continue
    seen.add(key)
    out.push(line)
  }
  return out.join('\n')
}

export function toUpperCaseText(text) {
  return String(text).toUpperCase()
}

export function toLowerCaseText(text) {
  return String(text).toLowerCase()
}

export function toTitleCaseText(text) {
  return String(text)
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (match, space, letter) => space + letter.toUpperCase())
}

export function countText(text) {
  const s = String(text)
  if (!s) return { lines: 0, chars: 0 }
  return {
    lines: s.split(/\r?\n/).length,
    chars: s.replace(/\r?\n/g, '').length,
  }
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/text.test.js
```

Expected: 4 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/text.js tests/text.test.js
git commit -m "feat 新增文本处理逻辑"
```

---

### Task 4: 进制转换逻辑

**Files:**
- Create: `tests/radix.test.js`
- Create: `src/utils/radix.js`

- [x] **Step 1: 写失败的测试**

`tests/radix.test.js`：

```js
import { describe, it, expect } from 'vitest'
import { parseRadix, convertRadix } from '../src/utils/radix.js'

describe('radix', () => {
  it('converts standard bases', () => {
    expect(convertRadix('255', 10)).toEqual({
      bin: '11111111',
      oct: '377',
      dec: '255',
      hex: 'FF',
    })
    expect(convertRadix('FF', 16)).toEqual({
      bin: '11111111',
      oct: '377',
      dec: '255',
      hex: 'FF',
    })
  })

  it('supports custom bases, negatives and big integers', () => {
    expect(convertRadix('z', 36).dec).toBe('35')
    expect(convertRadix('-10', 10).bin).toBe('-1010')
    expect(convertRadix('123456789012345678901234567890', 10).hex)
      .toBe('18EE90FF6C373E0EE4E3F0AD2')
  })

  it('rejects invalid input', () => {
    expect(convertRadix('2', 2)).toEqual({ error: '输入包含非 2 进制字符' })
    expect(convertRadix('1.5', 10)).toEqual({ error: '暂不支持小数' })
    expect(convertRadix('', 10)).toEqual({ error: '请输入数值' })
    expect(parseRadix('g', 16)).toEqual({ error: '输入包含非 16 进制字符' })
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/radix.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现转换逻辑**

`src/utils/radix.js`：

```js
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'
const MAX_LENGTH = 512

export function parseRadix(input, base) {
  const s = String(input).trim()
  if (!s) return { error: '请输入数值' }
  let sign = 1n
  let body = s
  if (body[0] === '-') {
    sign = -1n
    body = body.slice(1)
  } else if (body[0] === '+') {
    body = body.slice(1)
  }
  if (!body) return { error: '请输入数值' }
  if (body.includes('.')) return { error: '暂不支持小数' }
  if (body.length > MAX_LENGTH) return { error: '输入过长' }
  const bigBase = BigInt(base)
  let value = 0n
  for (const ch of body.toLowerCase()) {
    const digit = DIGITS.indexOf(ch)
    if (digit < 0 || digit >= base) {
      return { error: `输入包含非 ${base} 进制字符` }
    }
    value = value * bigBase + BigInt(digit)
  }
  return { value: sign * value }
}

export function convertRadix(input, base) {
  const parsed = parseRadix(input, base)
  if (parsed.error) return parsed
  const value = parsed.value
  return {
    bin: value.toString(2),
    oct: value.toString(8),
    dec: value.toString(10),
    hex: value.toString(16).toUpperCase(),
  }
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/radix.test.js
```

Expected: 3 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/radix.js tests/radix.test.js
git commit -m "feat 新增进制转换逻辑"
```

---

### Task 5: 单位换算逻辑

**Files:**
- Create: `tests/units.test.js`
- Create: `src/utils/units.js`

- [x] **Step 1: 写失败的测试**

`tests/units.test.js`：

```js
import { describe, it, expect } from 'vitest'
import { UNIT_GROUPS, convertUnit, formatUnitValue } from '../src/utils/units.js'

describe('units', () => {
  it('exposes five groups', () => {
    expect(Object.keys(UNIT_GROUPS)).toEqual(['length', 'weight', 'temperature', 'storage', 'area'])
  })

  it('converts length and weight', () => {
    expect(convertUnit('length', 1, 'km', 'm')).toBeCloseTo(1000)
    expect(convertUnit('length', 1, 'm', 'cm')).toBeCloseTo(100)
    expect(convertUnit('weight', 1, 'kg', 'jin')).toBeCloseTo(2)
  })

  it('converts temperature', () => {
    expect(convertUnit('temperature', 100, 'c', 'f')).toBeCloseTo(212)
    expect(convertUnit('temperature', 0, 'c', 'k')).toBeCloseTo(273.15)
    expect(convertUnit('temperature', 32, 'f', 'c')).toBeCloseTo(0)
  })

  it('converts storage and area', () => {
    expect(convertUnit('storage', 1, 'gb', 'mb')).toBe(1024)
    expect(convertUnit('area', 1, 'hectare', 'm2')).toBe(10000)
  })

  it('returns null for unknown units', () => {
    expect(convertUnit('length', 1, 'x', 'm')).toBe(null)
  })

  it('formats values to six decimals without trailing zeros', () => {
    expect(formatUnitValue(666.6666666666666)).toBe('666.666667')
    expect(formatUnitValue(1.5)).toBe('1.5')
    expect(formatUnitValue(0.0000004)).toBe('0')
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/units.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现换算逻辑**

`src/utils/units.js`：

```js
export const UNIT_GROUPS = {
  length: {
    label: '长度',
    units: [
      { key: 'mm', label: '毫米', factor: 0.001 },
      { key: 'cm', label: '厘米', factor: 0.01 },
      { key: 'm', label: '米', factor: 1 },
      { key: 'km', label: '千米', factor: 1000 },
      { key: 'inch', label: '英寸', factor: 0.0254 },
      { key: 'foot', label: '英尺', factor: 0.3048 },
      { key: 'mile', label: '英里', factor: 1609.344 },
    ],
  },
  weight: {
    label: '重量',
    units: [
      { key: 'g', label: '克', factor: 1 },
      { key: 'kg', label: '千克', factor: 1000 },
      { key: 't', label: '吨', factor: 1000000 },
      { key: 'jin', label: '斤', factor: 500 },
      { key: 'lb', label: '磅', factor: 453.59237 },
      { key: 'oz', label: '盎司', factor: 28.349523125 },
    ],
  },
  temperature: {
    label: '温度',
    units: [
      { key: 'c', label: '摄氏度' },
      { key: 'f', label: '华氏度' },
      { key: 'k', label: '开尔文' },
    ],
  },
  storage: {
    label: '存储',
    units: [
      { key: 'b', label: 'B', factor: 1 },
      { key: 'kb', label: 'KB', factor: 1024 },
      { key: 'mb', label: 'MB', factor: 1024 ** 2 },
      { key: 'gb', label: 'GB', factor: 1024 ** 3 },
      { key: 'tb', label: 'TB', factor: 1024 ** 4 },
    ],
  },
  area: {
    label: '面积',
    units: [
      { key: 'cm2', label: '平方厘米', factor: 0.0001 },
      { key: 'm2', label: '平方米', factor: 1 },
      { key: 'km2', label: '平方千米', factor: 1000000 },
      { key: 'mu', label: '亩', factor: 666.6666666666666 },
      { key: 'hectare', label: '公顷', factor: 10000 },
      { key: 'ft2', label: '平方英尺', factor: 0.09290304 },
    ],
  },
}

function toCelsius(groupKey, value, unitKey) {
  if (groupKey !== 'temperature') return null
  if (unitKey === 'c') return value
  if (unitKey === 'f') return ((value - 32) * 5) / 9
  if (unitKey === 'k') return value - 273.15
  return null
}

function fromCelsius(value, unitKey) {
  if (unitKey === 'c') return value
  if (unitKey === 'f') return (value * 9) / 5 + 32
  if (unitKey === 'k') return value + 273.15
  return null
}

export function convertUnit(groupKey, value, fromKey, toKey) {
  const group = UNIT_GROUPS[groupKey]
  if (!group) return null
  if (groupKey === 'temperature') {
    const celsius = toCelsius(groupKey, value, fromKey)
    if (celsius === null) return null
    return fromCelsius(celsius, toKey)
  }
  const from = group.units.find((u) => u.key === fromKey)
  const to = group.units.find((u) => u.key === toKey)
  if (!from || !to) return null
  return (value * from.factor) / to.factor
}

export function formatUnitValue(value) {
  if (!Number.isFinite(value)) return ''
  return String(Math.round(value * 1e6) / 1e6)
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/units.test.js
```

Expected: 6 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/units.js tests/units.test.js
git commit -m "feat 新增单位换算逻辑"
```

---

### Task 6: 时间戳转换逻辑

**Files:**
- Create: `tests/timestamp.test.js`
- Create: `src/utils/timestamp.js`

- [x] **Step 1: 写失败的测试**

`tests/timestamp.test.js`：

```js
import { describe, it, expect } from 'vitest'
import {
  formatLocal,
  formatUtc,
  timestampToDate,
  dateToTimestamp,
  nowTimestamp,
  formatDateValue,
  formatTimeValue,
} from '../src/utils/timestamp.js'

describe('timestamp', () => {
  it('formats local and UTC time', () => {
    const localMs = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(formatLocal(localMs)).toBe('2026-01-02 03:04:05')
    expect(formatUtc(Date.UTC(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02 03:04:05 UTC')
  })

  it('converts seconds and milliseconds timestamps', () => {
    const ms = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(timestampToDate(String(Math.floor(ms / 1000)), 's').local).toBe('2026-01-02 03:04:05')
    expect(timestampToDate(String(ms), 'ms').local).toBe('2026-01-02 03:04:05')
  })

  it('rejects invalid timestamps', () => {
    expect(timestampToDate('abc', 's')).toEqual({ error: '请输入整数时间戳' })
    expect(timestampToDate('99999999999999999999', 'ms').error).toBe('时间戳超出范围')
  })

  it('converts date and time to timestamps', () => {
    const ms = new Date(2026, 0, 2, 3, 4, 5).getTime()
    expect(dateToTimestamp('2026-01-02', '03:04:05')).toEqual({
      seconds: Math.floor(ms / 1000),
      milliseconds: ms,
    })
  })

  it('rejects invalid dates and times', () => {
    expect(dateToTimestamp('2026-02-30', '10:00')).toEqual({ error: '日期无效' })
    expect(dateToTimestamp('2026-02-01', '25:00')).toEqual({ error: '时间无效' })
  })

  it('formats picker values and current timestamp', () => {
    const d = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDateValue(d)).toBe('2026-01-02')
    expect(formatTimeValue(d)).toBe('03:04')
    expect(Number.isInteger(nowTimestamp('s'))).toBe(true)
    expect(nowTimestamp('ms')).toBeGreaterThan(0)
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/timestamp.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现转换逻辑**

`src/utils/timestamp.js`：

```js
function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatLocal(ms) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatUtc(ms) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

export function timestampToDate(input, unit) {
  const s = String(input).trim()
  if (!/^-?\d+$/.test(s)) return { error: '请输入整数时间戳' }
  const n = Number(s)
  if (!Number.isSafeInteger(n)) return { error: '时间戳超出范围' }
  const ms = unit === 'ms' ? n : n * 1000
  const local = formatLocal(ms)
  if (!local) return { error: '时间戳超出范围' }
  return { local, utc: formatUtc(ms) }
}

export function dateToTimestamp(dateStr, timeStr) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr))
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(timeStr))
  if (!dateMatch || !timeMatch) return { error: '请选择日期和时间' }
  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] || 0)
  if (hour > 23 || minute > 59 || second > 59) return { error: '时间无效' }
  const d = new Date(year, month - 1, day, hour, minute, second)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { error: '日期无效' }
  }
  const ms = d.getTime()
  return { seconds: Math.floor(ms / 1000), milliseconds: ms }
}

export function nowTimestamp(unit) {
  return unit === 'ms' ? Date.now() : Math.floor(Date.now() / 1000)
}

export function formatDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatTimeValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/timestamp.test.js
```

Expected: 6 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/timestamp.js tests/timestamp.test.js
git commit -m "feat 新增时间戳转换逻辑"
```

---

### Task 7: JSON 处理逻辑

**Files:**
- Create: `tests/json.test.js`
- Create: `src/utils/json.js`

- [x] **Step 1: 写失败的测试**

`tests/json.test.js`：

```js
import { describe, it, expect } from 'vitest'
import { formatJson, minifyJson, validateJson } from '../src/utils/json.js'

describe('json', () => {
  it('formats with two spaces', () => {
    expect(formatJson('{"a":1}')).toEqual({ text: '{\n  "a": 1\n}' })
    expect(formatJson('')).toEqual({ error: '请输入 JSON 内容' })
  })

  it('minifies', () => {
    expect(minifyJson('{ "a": 1, "b": [2] }')).toEqual({ text: '{"a":1,"b":[2]}' })
  })

  it('validates', () => {
    expect(validateJson('{"a":1}')).toEqual({ ok: true })
    expect(validateJson('{bad').error.startsWith('JSON 格式错误：')).toBe(true)
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/json.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现 JSON 逻辑**

`src/utils/json.js`：

```js
export function formatJson(input) {
  const s = String(input)
  if (!s.trim()) return { error: '请输入 JSON 内容' }
  try {
    return { text: JSON.stringify(JSON.parse(s), null, 2) }
  } catch (e) {
    return { error: `JSON 格式错误：${e.message}` }
  }
}

export function minifyJson(input) {
  const s = String(input)
  if (!s.trim()) return { error: '请输入 JSON 内容' }
  try {
    return { text: JSON.stringify(JSON.parse(s)) }
  } catch (e) {
    return { error: `JSON 格式错误：${e.message}` }
  }
}

export function validateJson(input) {
  const s = String(input)
  if (!s.trim()) return { error: '请输入 JSON 内容' }
  try {
    JSON.parse(s)
    return { ok: true }
  } catch (e) {
    return { error: `JSON 格式错误：${e.message}` }
  }
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/json.test.js
```

Expected: 3 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/json.js tests/json.test.js
git commit -m "feat 新增 JSON 处理逻辑"
```

---

### Task 8: 编码工具逻辑

**Files:**
- Create: `tests/encode.test.js`
- Create: `src/utils/encode.js`

- [x] **Step 1: 写失败的测试**

`tests/encode.test.js`：

```js
import { describe, it, expect } from 'vitest'
import { base64Encode, base64Decode, urlEncode, urlDecode } from '../src/utils/encode.js'

describe('encode', () => {
  it('base64 encodes ASCII and UTF-8', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=')
    expect(base64Encode('你好')).toBe('5L2g5aW9')
  })

  it('base64 decodes ASCII and UTF-8', () => {
    expect(base64Decode('aGVsbG8=')).toEqual({ text: 'hello' })
    expect(base64Decode('5L2g5aW9')).toEqual({ text: '你好' })
  })

  it('rejects invalid base64', () => {
    expect(base64Decode('!!!')).toEqual({ error: '输入不是合法的 Base64' })
    expect(base64Decode('abc')).toEqual({ error: '输入不是合法的 Base64' })
  })

  it('url encodes and decodes', () => {
    expect(urlEncode('a b&c')).toBe('a%20b%26c')
    expect(urlDecode('a%20b%26c')).toEqual({ text: 'a b&c' })
    expect(urlDecode('%E4%BD')).toEqual({ error: '输入不是合法的 URL 编码' })
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/encode.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现编码逻辑**

`src/utils/encode.js`：

```js
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function utf8Bytes(text) {
  const bytes = []
  for (const ch of String(text)) {
    const code = ch.codePointAt(0)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63))
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63))
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      )
    }
  }
  return bytes
}

function utf8String(bytes) {
  let result = ''
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++]
    if (first < 0x80) {
      result += String.fromCodePoint(first)
    } else if ((first & 0xe0) === 0xc0) {
      result += String.fromCodePoint(((first & 0x1f) << 6) | (bytes[i++] & 0x3f))
    } else if ((first & 0xf0) === 0xe0) {
      result += String.fromCodePoint(
        ((first & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      )
    } else if ((first & 0xf8) === 0xf0) {
      result += String.fromCodePoint(
        ((first & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f),
      )
    } else {
      throw new Error('invalid utf8')
    }
  }
  return result
}

export function base64Encode(text) {
  const bytes = utf8Bytes(text)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
    out += BASE64_CHARS[b1 >> 2]
    out += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)]
    out += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '='
    out += i + 2 < bytes.length ? BASE64_CHARS[b3 & 63] : '='
  }
  return out
}

export function base64Decode(text) {
  const s = String(text).replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 !== 0) {
    return { error: '输入不是合法的 Base64' }
  }
  const bytes = []
  for (let i = 0; i < s.length; i += 4) {
    const chunk = s.slice(i, i + 4)
    const values = []
    for (const ch of chunk) {
      values.push(ch === '=' ? 0 : BASE64_CHARS.indexOf(ch))
    }
    bytes.push((values[0] << 2) | (values[1] >> 4))
    if (chunk[2] !== '=') bytes.push(((values[1] & 15) << 4) | (values[2] >> 2))
    if (chunk[3] !== '=') bytes.push(((values[2] & 3) << 6) | values[3])
  }
  try {
    return { text: utf8String(bytes) }
  } catch (e) {
    return { error: '输入不是合法的 Base64' }
  }
}

export function urlEncode(text) {
  return encodeURIComponent(String(text))
}

export function urlDecode(text) {
  try {
    return { text: decodeURIComponent(String(text)) }
  } catch (e) {
    return { error: '输入不是合法的 URL 编码' }
  }
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/encode.test.js
```

Expected: 4 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/encode.js tests/encode.test.js
git commit -m "feat 新增编码工具逻辑"
```

---

### Task 9: 待办数据逻辑

**Files:**
- Create: `tests/todo.test.js`
- Create: `src/utils/todo.js`

- [x] **Step 1: 写失败的测试**

`tests/todo.test.js`：

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  TODOS_KEY,
  createTodo,
  sortTodos,
  filterTodos,
  activeCount,
  toggleTodo,
  loadTodos,
  saveTodos,
  updateTabBadge,
  formatDueLabel,
  isOverdue,
} from '../src/utils/todo.js'

const makeList = () => [
  { id: '1', title: 'a', done: false, dueAt: 3000, remind: false, createdAt: 1, completedAt: null },
  { id: '2', title: 'b', done: false, dueAt: null, remind: false, createdAt: 2, completedAt: null },
  { id: '3', title: 'c', done: false, dueAt: 1000, remind: false, createdAt: 3, completedAt: null },
  { id: '4', title: 'd', done: true, dueAt: null, remind: false, createdAt: 4, completedAt: 100 },
  { id: '5', title: 'e', done: true, dueAt: null, remind: false, createdAt: 5, completedAt: 200 },
]

describe('todo', () => {
  it('sorts unfinished by due time and finished by completion time', () => {
    expect(sortTodos(makeList()).map((t) => t.id)).toEqual(['3', '1', '2', '5', '4'])
  })

  it('filters and counts', () => {
    expect(filterTodos(makeList(), 'active').map((t) => t.id)).toEqual(['1', '2', '3'])
    expect(filterTodos(makeList(), 'done').map((t) => t.id)).toEqual(['4', '5'])
    expect(filterTodos(makeList(), 'all')).toHaveLength(5)
    expect(activeCount(makeList())).toBe(3)
  })

  it('creates and toggles todos', () => {
    const todo = createTodo('  写计划  ', null, 1000)
    expect(todo.title).toBe('写计划')
    expect(todo.id.startsWith('1000-')).toBe(true)
    expect(todo.done).toBe(false)

    const toggled = toggleTodo(makeList(), '1', 9999)
    expect(toggled.find((t) => t.id === '1')).toMatchObject({ done: true, completedAt: 9999 })
    expect(toggleTodo(toggled, '1', 10000).find((t) => t.id === '1').completedAt).toBe(null)
  })

  it('formats due labels and overdue state', () => {
    const now = new Date(2026, 0, 2, 10, 0).getTime()
    expect(formatDueLabel(new Date(2026, 0, 2, 18, 30).getTime(), now)).toBe('今天 18:30')
    expect(formatDueLabel(new Date(2026, 0, 3, 9, 5).getTime(), now)).toBe('明天 09:05')
    expect(formatDueLabel(new Date(2026, 0, 5, 8, 0).getTime(), now)).toBe('01-05 08:00')
    expect(formatDueLabel(null, now)).toBe('')
    expect(isOverdue({ done: false, dueAt: now - 1 }, now)).toBe(true)
    expect(isOverdue({ done: true, dueAt: now - 1 }, now)).toBe(false)
    expect(isOverdue({ done: false, dueAt: null }, now)).toBe(false)
  })
})

describe('todo storage and badge', () => {
  const store = {}

  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]
    vi.stubGlobal('uni', {
      getStorageSync: vi.fn((key) => (key in store ? store[key] : '')),
      setStorageSync: vi.fn((key, value) => { store[key] = value }),
      setTabBarBadge: vi.fn(),
      removeTabBarBadge: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips todos and filters corrupt entries', () => {
    saveTodos([createTodo('a', null, 1)])
    expect(loadTodos()).toHaveLength(1)

    store[TODOS_KEY] = JSON.stringify([{ id: 'x' }, null, { id: 'y', title: 'ok' }])
    expect(loadTodos()).toEqual([
      {
        id: 'y',
        title: 'ok',
        done: false,
        dueAt: null,
        remind: false,
        createdAt: expect.any(Number),
        completedAt: null,
      },
    ])
  })

  it('updates the tab badge', () => {
    updateTabBadge(2)
    expect(uni.setTabBarBadge).toHaveBeenCalledWith({ index: 1, text: '2' })
    updateTabBadge(0)
    expect(uni.removeTabBarBadge).toHaveBeenCalledWith({ index: 1 })
  })
})
```

- [x] **Step 2: 运行测试确认失败**

```bash
yarn test tests/todo.test.js
```

Expected: FAIL，模块不存在。

- [x] **Step 3: 实现待办逻辑**

`src/utils/todo.js`：

```js
import { readStorage, writeStorage } from './storage.js'

export const TODOS_KEY = 'tools.todos.v1'

export function createTodo(title, dueAt = null, now = Date.now()) {
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(title).trim(),
    done: false,
    dueAt,
    remind: false,
    createdAt: now,
    completedAt: null,
  }
}

export function sortTodos(list) {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (!a.done) {
      if (a.dueAt == null && b.dueAt == null) return b.createdAt - a.createdAt
      if (a.dueAt == null) return 1
      if (b.dueAt == null) return -1
      return a.dueAt - b.dueAt
    }
    return (b.completedAt || 0) - (a.completedAt || 0)
  })
}

export function filterTodos(list, filter) {
  if (filter === 'active') return list.filter((t) => !t.done)
  if (filter === 'done') return list.filter((t) => t.done)
  return list
}

export function activeCount(list) {
  return list.filter((t) => !t.done).length
}

export function toggleTodo(list, id, now = Date.now()) {
  return list.map((t) => {
    if (t.id !== id) return t
    const done = !t.done
    return { ...t, done, completedAt: done ? now : null }
  })
}

export function loadTodos() {
  const list = readStorage(TODOS_KEY, [])
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
    .map((item) => ({
      id: item.id,
      title: item.title,
      done: !!item.done,
      dueAt: typeof item.dueAt === 'number' ? item.dueAt : null,
      remind: !!item.remind,
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      completedAt: typeof item.completedAt === 'number' ? item.completedAt : null,
    }))
}

export function saveTodos(list) {
  return writeStorage(TODOS_KEY, list)
}

export function updateTabBadge(count) {
  if (count > 0) {
    uni.setTabBarBadge({ index: 1, text: String(count) })
  } else {
    uni.removeTabBarBadge({ index: 1 })
  }
}

export function formatDueLabel(dueAt, now = Date.now()) {
  if (!dueAt) return ''
  const d = new Date(dueAt)
  const n = new Date(now)
  const pad = (value) => String(value).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const sameDay =
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  const tomorrow = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1)
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  if (sameDay) return `今天 ${time}`
  if (isTomorrow) return `明天 ${time}`
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`
}

export function isOverdue(todo, now = Date.now()) {
  return !todo.done && todo.dueAt != null && todo.dueAt < now
}
```

- [x] **Step 4: 运行测试确认通过**

```bash
yarn test tests/todo.test.js
```

Expected: 6 passed。

- [x] **Step 5: 提交**

```bash
git add src/utils/todo.js tests/todo.test.js
git commit -m "feat 新增待办数据逻辑"
```

---

### Task 10: 生成 tab 图标

**Files:**
- Create: `scripts/gen-tab-icons.cjs`
- Create: `src/static/tab-tools.png`、`src/static/tab-tools-active.png`、`src/static/tab-todo.png`、`src/static/tab-todo-active.png`

- [x] **Step 1: 编写图标生成脚本**

`scripts/gen-tab-icons.cjs`：

```js
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 81
const STROKE = 5
const NORMAL = [107, 114, 128]
const ACTIVE = [67, 97, 238]

const CRC_TABLE = (() => {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const rowSize = SIZE * 4 + 1
  const raw = Buffer.alloc(rowSize * SIZE)
  for (let y = 0; y < SIZE; y++) {
    raw[y * rowSize] = 0
    rgba.copy(raw, y * rowSize + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function roundedRectDistance(px, py, cx, cy, size, radius) {
  const qx = Math.abs(px - cx) - (size / 2 - radius)
  const qy = Math.abs(py - cy) - (size / 2 - radius)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
}

function circleDistance(px, py, cx, cy, radius) {
  return Math.hypot(px - cx, py - cy) - radius
}

function segmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function strokeCoverage(distance) {
  return Math.max(0, Math.min(1, 0.5 + (STROKE / 2 - distance)))
}

function toolsCoverage(x, y) {
  const centers = [[24, 24], [57, 24], [24, 57], [57, 57]]
  let best = 0
  for (const [cx, cy] of centers) {
    best = Math.max(best, strokeCoverage(Math.abs(roundedRectDistance(x, y, cx, cy, 22, 6))))
  }
  return best
}

function todoCoverage(x, y) {
  const ring = strokeCoverage(Math.abs(circleDistance(x, y, 40.5, 40.5, 25)))
  const check = Math.max(
    strokeCoverage(segmentDistance(x, y, 28, 42, 37, 51)),
    strokeCoverage(segmentDistance(x, y, 37, 51, 55, 32)),
  )
  return Math.max(ring, check)
}

function paint(coverageFn, color) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const alpha = coverageFn(x + 0.5, y + 0.5)
      if (alpha <= 0) continue
      const index = (y * SIZE + x) * 4
      rgba[index] = color[0]
      rgba[index + 1] = color[1]
      rgba[index + 2] = color[2]
      rgba[index + 3] = Math.round(alpha * 255)
    }
  }
  return rgba
}

const outDir = path.join(__dirname, '..', 'src', 'static')
const outputs = [
  ['tab-tools.png', paint(toolsCoverage, NORMAL)],
  ['tab-tools-active.png', paint(toolsCoverage, ACTIVE)],
  ['tab-todo.png', paint(todoCoverage, NORMAL)],
  ['tab-todo-active.png', paint(todoCoverage, ACTIVE)],
]

for (const [name, rgba] of outputs) {
  fs.writeFileSync(path.join(outDir, name), encodePng(rgba))
}

console.log(`generated ${outputs.map(([name]) => name).join(', ')}`)
```

- [x] **Step 2: 生成并校验文件**

```bash
node scripts/gen-tab-icons.cjs && node -e "const fs=require('fs');const files=['tab-tools.png','tab-tools-active.png','tab-todo.png','tab-todo-active.png'];const sig=Buffer.from([137,80,78,71,13,10,26,10]);for(const f of files){const b=fs.readFileSync('src/static/'+f);console.log(f,b.subarray(0,8).equals(sig)?'valid':'invalid',b.length)}"
```

Expected: 四行均为 `valid`，文件大小大于 0。

- [x] **Step 3: 提交**

```bash
git add scripts/gen-tab-icons.cjs src/static/tab-tools.png src/static/tab-tools-active.png src/static/tab-todo.png src/static/tab-todo-active.png
git commit -m "feat 生成 tab 图标"
```

---

### Task 11: 应用外壳（主题、路由、工具页与占位面板）

**Files:**
- Modify: `src/App.vue`
- Modify: `src/pages.json`
- Create: `src/pages/tools/index.vue`
- Create: `src/pages/todo/index.vue`（占位，Task 19 替换）
- Create: `src/components/tools/{Vat,Unit,Text,Encode,Radix,Timestamp,Json}Panel.vue`（占位）

- [x] **Step 1: 全局主题样式**

`src/App.vue`：

```vue
<script>
export default {
  onLaunch() {},
}
</script>

<style>
page {
  --bg: #F7F8FA;
  --surface: #FFFFFF;
  --primary: #4361EE;
  --primary-soft: #EEF2FF;
  --text: #1F2937;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
  --danger: #EF4444;
  --success: #10B981;
  background-color: var(--bg);
  color: var(--text);
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
text,
input,
textarea,
picker {
  box-sizing: border-box;
}

.panel {
  padding: 32rpx 32rpx 48rpx;
}

.panel-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.panel-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}

.card {
  margin-top: 24rpx;
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.06);
}

.label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--text);
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: var(--text);
}

.picker-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
}

.picker-arrow {
  color: var(--text-secondary);
  font-size: 28rpx;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
  margin-right: -16rpx;
}

.chip {
  margin-right: 16rpx;
  margin-bottom: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: #F3F4F6;
  color: var(--text-secondary);
  font-size: 26rpx;
}

.chip.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.btn-row {
  display: flex;
  justify-content: space-between;
  margin-top: 32rpx;
}

.btn {
  width: 48%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 28rpx;
}

.btn-primary {
  background: var(--primary);
  color: #FFFFFF;
}

.btn-ghost {
  background: #FFFFFF;
  border: 1rpx solid var(--primary);
  color: var(--primary);
}

.btn:active {
  opacity: 0.8;
}

.result-box {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.result-label {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.result-value {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
  word-break: break-all;
}

.error {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: var(--danger);
}

.empty-tip {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.disclaimer {
  margin-top: 24rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}

.stats {
  display: flex;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.stats text {
  margin-right: 24rpx;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.switch-label {
  font-size: 26rpx;
  color: var(--text);
}
</style>
```

- [x] **Step 2: 路由与 tabBar**

`src/pages.json`：

```json
{
  "pages": [
    {
      "path": "pages/tools/index",
      "style": {
        "navigationBarTitleText": "工具箱"
      }
    },
    {
      "path": "pages/todo/index",
      "style": {
        "navigationBarTitleText": "待办"
      }
    },
    {
      "path": "pages/about/about",
      "style": {
        "navigationBarTitleText": "关于"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "工具箱",
    "navigationBarBackgroundColor": "#F7F8FA",
    "backgroundColor": "#F7F8FA"
  },
  "tabBar": {
    "color": "#6B7280",
    "selectedColor": "#4361EE",
    "borderStyle": "white",
    "backgroundColor": "#FFFFFF",
    "list": [
      {
        "pagePath": "pages/tools/index",
        "iconPath": "static/tab-tools.png",
        "selectedIconPath": "static/tab-tools-active.png",
        "text": "工具"
      },
      {
        "pagePath": "pages/todo/index",
        "iconPath": "static/tab-todo.png",
        "selectedIconPath": "static/tab-todo-active.png",
        "text": "待办"
      }
    ]
  }
}
```

- [x] **Step 3: 工具页**

`src/pages/tools/index.vue`：

```vue
<template>
  <view class="tools-page">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: active === tab.key }"
        @click="active = tab.key"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="tab-line"></view>
      </view>
    </view>

    <VatPanel v-show="active === 'vat'" />
    <UnitPanel v-show="active === 'unit'" />
    <TextPanel v-show="active === 'text'" />
    <EncodePanel v-show="active === 'encode'" />
    <RadixPanel v-show="active === 'radix'" />
    <TimestampPanel v-show="active === 'timestamp'" />
    <JsonPanel v-show="active === 'json'" />

    <view class="about-link" @click="openAbout">关于与免责声明</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import VatPanel from '../../components/tools/VatPanel.vue'
import UnitPanel from '../../components/tools/UnitPanel.vue'
import TextPanel from '../../components/tools/TextPanel.vue'
import EncodePanel from '../../components/tools/EncodePanel.vue'
import RadixPanel from '../../components/tools/RadixPanel.vue'
import TimestampPanel from '../../components/tools/TimestampPanel.vue'
import JsonPanel from '../../components/tools/JsonPanel.vue'

const tabs = [
  { key: 'vat', label: '增值税' },
  { key: 'unit', label: '单位换算' },
  { key: 'text', label: '文本处理' },
  { key: 'encode', label: '编码' },
  { key: 'radix', label: '进制' },
  { key: 'timestamp', label: '时间戳' },
  { key: 'json', label: 'JSON' },
]

const active = ref('vat')

onLoad((options) => {
  if (options && tabs.some((tab) => tab.key === options.tool)) {
    active.value = options.tool
  }
})

onShareAppMessage(() => ({
  title: '计算工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
}))

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
</script>

<style>
.tools-page {
  padding-bottom: 48rpx;
}

.tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  background: var(--surface);
  border-bottom: 1rpx solid var(--border);
}

.tab {
  flex: 1;
  height: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tab-text {
  font-size: 24rpx;
  color: var(--text-secondary);
  white-space: nowrap;
}

.tab-line {
  width: 32rpx;
  height: 4rpx;
  margin-top: 8rpx;
  border-radius: 2rpx;
  background: transparent;
}

.tab.active .tab-text {
  color: var(--primary);
  font-weight: 600;
}

.tab.active .tab-line {
  background: var(--primary);
}

.about-link {
  margin: 48rpx 32rpx 0;
  padding: 24rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: var(--text-secondary);
}
</style>
```

- [x] **Step 4: 创建 7 个占位面板**

`src/components/tools/VatPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">增值税计算</view>
  </view>
</template>
```

`src/components/tools/UnitPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">单位换算</view>
  </view>
</template>
```

`src/components/tools/TextPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">文本处理</view>
  </view>
</template>
```

`src/components/tools/EncodePanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">Base64 / URL 编码</view>
  </view>
</template>
```

`src/components/tools/RadixPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">进制转换</view>
  </view>
</template>
```

`src/components/tools/TimestampPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">时间戳转换</view>
  </view>
</template>
```

`src/components/tools/JsonPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">JSON 格式化</view>
  </view>
</template>
```

- [x] **Step 5: 待办占位页**

`src/pages/todo/index.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">待办</view>
    <view class="empty-tip">待办清单建设中</view>
  </view>
</template>
```

- [x] **Step 6: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`，且 `dist/build/mp-weixin/pages/tools/index.js` 存在。

- [x] **Step 7: 提交**

```bash
git add src/App.vue src/pages.json src/pages/tools/index.vue src/pages/todo/index.vue src/components/tools
git commit -m "feat 新增工具页外壳与主题样式"
```

---

### Task 12: 增值税面板

**Files:**
- Modify: `src/components/tools/VatPanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/VatPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">增值税计算</view>
    <view class="panel-desc">输入金额并选择税率，自动换算含税与不含税金额</view>

    <view class="card">
      <view class="chip-row">
        <view class="chip" :class="{ active: mode === 'excluded' }" @click="mode = 'excluded'">不含税 → 含税</view>
        <view class="chip" :class="{ active: mode === 'included' }" @click="mode = 'included'">含税 → 不含税</view>
      </view>

      <view class="label">{{ mode === 'excluded' ? '不含税金额' : '含税金额' }}</view>
      <input class="input" type="digit" v-model="amount" placeholder="请输入金额" />

      <view class="label">税率</view>
      <view class="chip-row">
        <view
          v-for="rateItem in RATE_PRESETS"
          :key="rateItem"
          class="chip"
          :class="{ active: rateMode === 'preset' && rate === rateItem }"
          @click="pickPreset(rateItem)"
        >{{ rateItem }}%</view>
        <view class="chip" :class="{ active: rateMode === 'custom' }" @click="rateMode = 'custom'">自定义</view>
      </view>
      <input
        v-if="rateMode === 'custom'"
        class="input"
        type="digit"
        v-model="customRate"
        placeholder="请输入税率（0–100）"
      />

      <view v-if="state.error" class="error">{{ state.error }}</view>
      <view v-else-if="state.empty" class="empty-tip">输入金额后自动计算</view>
      <view v-else class="result-box">
        <view class="result-row">
          <text class="result-label">不含税金额</text>
          <text class="result-value">{{ state.net }}</text>
        </view>
        <view class="result-row">
          <text class="result-label">税额</text>
          <text class="result-value">{{ state.tax }}</text>
        </view>
        <view class="result-row">
          <text class="result-label">价税合计</text>
          <text class="result-value">{{ state.gross }}</text>
        </view>
      </view>

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="reset">清空</view>
      </view>
    </view>

    <view class="disclaimer">计算结果仅供参考，不构成税务建议</view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  RATE_PRESETS,
  validateAmount,
  validateRate,
  calcVat,
  formatCents,
  formatVatText,
} from '../../utils/vat.js'
import { readStorage, writeStorage } from '../../utils/storage.js'

const PREFS_KEY = 'tools.vat.prefs'
const amount = ref('')
const mode = ref('excluded')
const rate = ref(13)
const rateMode = ref('preset')
const customRate = ref('')

const state = computed(() => {
  if (!amount.value.trim()) return { empty: true }
  const amountCheck = validateAmount(amount.value)
  if (amountCheck.error) return { error: amountCheck.error }
  let bp
  if (rateMode.value === 'custom') {
    if (!customRate.value.trim()) return { error: '请输入税率' }
    const rateCheck = validateRate(customRate.value)
    if (rateCheck.error) return { error: rateCheck.error }
    bp = rateCheck.bp
  } else {
    bp = rate.value * 100
  }
  const result = calcVat(amountCheck.cents, bp, mode.value)
  return {
    net: formatCents(result.netCents),
    tax: formatCents(result.taxCents),
    gross: formatCents(result.grossCents),
  }
})

function pickPreset(value) {
  rateMode.value = 'preset'
  rate.value = value
}

function copyResult() {
  if (state.value.empty || state.value.error) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: formatVatText({
      net: state.value.net,
      tax: state.value.tax,
      gross: state.value.gross,
    }),
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

function reset() {
  amount.value = ''
}

onMounted(() => {
  const prefs = readStorage(PREFS_KEY, null)
  if (!prefs) return
  if (prefs.mode === 'included' || prefs.mode === 'excluded') mode.value = prefs.mode
  if (typeof prefs.rate === 'number' && RATE_PRESETS.includes(prefs.rate)) rate.value = prefs.rate
  if (prefs.rateMode === 'custom') rateMode.value = 'custom'
  if (typeof prefs.customRate === 'string') customRate.value = prefs.customRate
})

watch([mode, rate, rateMode, customRate], () => {
  writeStorage(PREFS_KEY, {
    mode: mode.value,
    rate: rate.value,
    rateMode: rateMode.value,
    customRate: customRate.value,
  })
})
</script>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/VatPanel.vue
git commit -m "feat 完成增值税计算面板"
```

---

### Task 13: 单位换算面板

**Files:**
- Modify: `src/components/tools/UnitPanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/UnitPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">单位换算</view>
    <view class="panel-desc">选择类别与单位，输入数值实时换算</view>

    <view class="card">
      <view class="chip-row">
        <view
          v-for="(group, key) in UNIT_GROUPS"
          :key="key"
          class="chip"
          :class="{ active: groupKey === key }"
          @click="selectGroup(key)"
        >{{ group.label }}</view>
      </view>

      <view class="label">数值</view>
      <input class="input" type="digit" v-model="value" placeholder="请输入数值" />

      <view class="label">从</view>
      <picker mode="selector" :range="unitLabels" :value="fromIndex" @change="fromIndex = Number($event.detail.value)">
        <view class="picker-field">
          <text>{{ unitLabels[fromIndex] }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>

      <view class="label">到</view>
      <picker mode="selector" :range="unitLabels" :value="toIndex" @change="toIndex = Number($event.detail.value)">
        <view class="picker-field">
          <text>{{ unitLabels[toIndex] }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>

      <view class="btn-row">
        <view class="btn btn-ghost" @click="swap">互换单位</view>
      </view>

      <view v-if="state.error" class="error">{{ state.error }}</view>
      <view v-else-if="state.empty" class="empty-tip">输入数值后自动换算</view>
      <view v-else class="result-box">
        <view class="result-row">
          <text class="result-label">{{ value }} {{ unitLabels[fromIndex] }} =</text>
          <text class="result-value">{{ state.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UNIT_GROUPS, convertUnit, formatUnitValue } from '../../utils/units.js'

const groupKey = ref('length')
const value = ref('')
const fromIndex = ref(0)
const toIndex = ref(1)

const units = computed(() => UNIT_GROUPS[groupKey.value].units)
const unitLabels = computed(() => units.value.map((unit) => unit.label))

const state = computed(() => {
  if (!value.value.trim()) return { empty: true }
  const num = Number(value.value)
  if (!Number.isFinite(num)) return { error: '请输入有效数字' }
  const fromUnit = units.value[fromIndex.value]
  const toUnit = units.value[toIndex.value]
  const result = convertUnit(groupKey.value, num, fromUnit.key, toUnit.key)
  if (result === null) return { error: '无法换算' }
  return { text: `${formatUnitValue(result)} ${toUnit.label}` }
})

function selectGroup(key) {
  groupKey.value = key
  fromIndex.value = 0
  toIndex.value = 1
}

function swap() {
  const temp = fromIndex.value
  fromIndex.value = toIndex.value
  toIndex.value = temp
}
</script>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/UnitPanel.vue
git commit -m "feat 完成单位换算面板"
```

---

### Task 14: 文本处理面板

**Files:**
- Modify: `src/components/tools/TextPanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/TextPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">文本处理</view>
    <view class="panel-desc">按行去重、大小写转换，所有处理仅在本机完成</view>

    <view class="card">
      <view class="label">原文</view>
      <textarea class="textarea" v-model="input" maxlength="-1" placeholder="粘贴或输入文本" />
      <view v-if="truncated" class="error">原文超过 100,000 字符，仅处理前 100,000 字符</view>
      <view class="stats">
        <text>行数 {{ inputStats.lines }}</text>
        <text>字符数 {{ inputStats.chars }}</text>
        <text>结果行数 {{ resultStats.lines }}</text>
      </view>

      <view class="switch-row">
        <text class="switch-label">去重时忽略大小写</text>
        <switch :checked="ignoreCase" color="#4361EE" @change="ignoreCase = $event.detail.value" />
      </view>
      <view class="switch-row">
        <text class="switch-label">去重时忽略首尾空白</text>
        <switch :checked="trimLines" color="#4361EE" @change="trimLines = $event.detail.value" />
      </view>

      <view class="chip-row">
        <view class="chip" @click="runDedupe">去重</view>
        <view class="chip" @click="runCase('upper')">全大写</view>
        <view class="chip" @click="runCase('lower')">全小写</view>
        <view class="chip" @click="runCase('title')">首字母大写</view>
      </view>

      <view class="label">结果</view>
      <textarea class="textarea" :value="result" disabled placeholder="处理结果将显示在这里" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="useResult">替换原文</view>
      </view>
      <view class="btn-row">
        <view class="btn btn-ghost" @click="clearAll">清空</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  dedupeLines,
  toUpperCaseText,
  toLowerCaseText,
  toTitleCaseText,
  countText,
} from '../../utils/text.js'

const LIMIT = 100000
const input = ref('')
const result = ref('')
const ignoreCase = ref(false)
const trimLines = ref(false)

const truncated = computed(() => input.value.length > LIMIT)
const safeInput = computed(() => input.value.slice(0, LIMIT))
const inputStats = computed(() => countText(safeInput.value))
const resultStats = computed(() => countText(result.value))

function runDedupe() {
  result.value = dedupeLines(safeInput.value, {
    ignoreCase: ignoreCase.value,
    trim: trimLines.value,
  })
}

function runCase(type) {
  const text = safeInput.value
  if (type === 'upper') result.value = toUpperCaseText(text)
  else if (type === 'lower') result.value = toLowerCaseText(text)
  else result.value = toTitleCaseText(text)
}

function copyResult() {
  if (!result.value) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: result.value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

function useResult() {
  if (!result.value) return
  input.value = result.value
  result.value = ''
}

function clearAll() {
  input.value = ''
  result.value = ''
}
</script>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/TextPanel.vue
git commit -m "feat 完成文本处理面板"
```

---

### Task 15: 编码面板

**Files:**
- Modify: `src/components/tools/EncodePanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/EncodePanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">Base64 / URL 编码</view>
    <view class="panel-desc">支持中文内容，编解码仅在本机完成</view>

    <view class="card">
      <view class="chip-row">
        <view class="chip" :class="{ active: mode === 'base64' }" @click="switchMode('base64')">Base64</view>
        <view class="chip" :class="{ active: mode === 'url' }" @click="switchMode('url')">URL</view>
      </view>

      <view class="label">输入</view>
      <textarea class="textarea" v-model="input" maxlength="-1" placeholder="请输入要处理的内容" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="run('encode')">编码</view>
        <view class="btn btn-ghost" @click="run('decode')">解码</view>
      </view>

      <view class="label">结果</view>
      <textarea class="textarea" :value="result" disabled placeholder="结果显示在这里" />

      <view v-if="error" class="error">{{ error }}</view>

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="clearAll">清空</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { base64Encode, base64Decode, urlEncode, urlDecode } from '../../utils/encode.js'

const mode = ref('base64')
const input = ref('')
const result = ref('')
const error = ref('')

function switchMode(next) {
  mode.value = next
  result.value = ''
  error.value = ''
}

function run(action) {
  error.value = ''
  if (!input.value) {
    result.value = ''
    error.value = '请输入内容'
    return
  }
  if (action === 'encode') {
    result.value = mode.value === 'base64' ? base64Encode(input.value) : urlEncode(input.value)
    return
  }
  const decoded = mode.value === 'base64' ? base64Decode(input.value) : urlDecode(input.value)
  if (decoded.error) {
    result.value = ''
    error.value = decoded.error
    return
  }
  result.value = decoded.text
}

function copyResult() {
  if (!result.value) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: result.value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

function clearAll() {
  input.value = ''
  result.value = ''
  error.value = ''
}
</script>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/EncodePanel.vue
git commit -m "feat 完成编码工具面板"
```

---

### Task 16: 进制面板

**Files:**
- Modify: `src/components/tools/RadixPanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/RadixPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">进制转换</view>
    <view class="panel-desc">支持 2–36 进制、负数与超大整数，暂不支持小数</view>

    <view class="card">
      <view class="label">数值</view>
      <input class="input" v-model="input" placeholder="请输入整数" />

      <view class="label">源进制</view>
      <picker mode="selector" :range="baseOptions" :value="baseIndex" @change="baseIndex = Number($event.detail.value)">
        <view class="picker-field">
          <text>{{ baseOptions[baseIndex] }} 进制</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>

      <view v-if="state.error" class="error">{{ state.error }}</view>
      <view v-else-if="state.empty" class="empty-tip">输入数值后自动转换</view>
      <view v-else class="result-box">
        <view v-for="row in rows" :key="row.label" class="result-row">
          <text class="result-label">{{ row.label }}</text>
          <view class="value-copy">
            <text class="result-value">{{ row.value }}</text>
            <text class="copy-link" @click="copyValue(row.value)">复制</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { convertRadix } from '../../utils/radix.js'

const baseOptions = Array.from({ length: 35 }, (_, index) => String(index + 2))
const input = ref('')
const baseIndex = ref(8)

const state = computed(() => {
  if (!input.value.trim()) return { empty: true }
  return convertRadix(input.value, baseIndex.value + 2)
})

const rows = computed(() => {
  if (state.value.empty || state.value.error) return []
  return [
    { label: '二进制', value: state.value.bin },
    { label: '八进制', value: state.value.oct },
    { label: '十进制', value: state.value.dec },
    { label: '十六进制', value: state.value.hex },
  ]
})

function copyValue(value) {
  uni.setClipboardData({
    data: value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}
</script>

<style scoped>
.value-copy {
  display: flex;
  align-items: center;
}

.copy-link {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: var(--primary);
}
</style>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/RadixPanel.vue
git commit -m "feat 完成进制转换面板"
```

---

### Task 17: 时间戳面板

**Files:**
- Modify: `src/components/tools/TimestampPanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/TimestampPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">时间戳转换</view>
    <view class="panel-desc">时间戳与日期时间双向转换，使用本机时区</view>

    <view class="card">
      <view class="chip-row">
        <view class="chip" :class="{ active: mode === 'toDate' }" @click="mode = 'toDate'">时间戳 → 日期时间</view>
        <view class="chip" :class="{ active: mode === 'toTs' }" @click="mode = 'toTs'">日期时间 → 时间戳</view>
      </view>

      <template v-if="mode === 'toDate'">
        <view class="label">时间戳</view>
        <input class="input" type="number" v-model="tsInput" placeholder="请输入时间戳" />

        <view class="label">单位</view>
        <view class="chip-row">
          <view class="chip" :class="{ active: unit === 's' }" @click="unit = 's'">秒</view>
          <view class="chip" :class="{ active: unit === 'ms' }" @click="unit = 'ms'">毫秒</view>
        </view>

        <view class="chip-row">
          <view class="chip" @click="fillNow">使用当前时间</view>
        </view>

        <view v-if="dateState.error" class="error">{{ dateState.error }}</view>
        <view v-else-if="dateState.empty" class="empty-tip">输入时间戳后自动转换</view>
        <view v-else class="result-box">
          <view class="result-row">
            <text class="result-label">本地时间</text>
            <view class="value-copy">
              <text class="result-value">{{ dateState.local }}</text>
              <text class="copy-link" @click="copyValue(dateState.local)">复制</text>
            </view>
          </view>
          <view class="result-row">
            <text class="result-label">UTC</text>
            <view class="value-copy">
              <text class="result-value">{{ dateState.utc }}</text>
              <text class="copy-link" @click="copyValue(dateState.utc)">复制</text>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="label">日期</view>
        <picker mode="date" :value="dateValue" @change="dateValue = $event.detail.value">
          <view class="picker-field">
            <text>{{ dateValue }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>

        <view class="label">时间</view>
        <picker mode="time" :value="timeValue" @change="timeValue = $event.detail.value">
          <view class="picker-field">
            <text>{{ timeValue }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>

        <view class="chip-row">
          <view class="chip" @click="fillNow">使用当前时间</view>
        </view>

        <view v-if="tsState.error" class="error">{{ tsState.error }}</view>
        <view v-else class="result-box">
          <view class="result-row">
            <text class="result-label">秒级时间戳</text>
            <view class="value-copy">
              <text class="result-value">{{ tsState.seconds }}</text>
              <text class="copy-link" @click="copyValue(tsState.seconds)">复制</text>
            </view>
          </view>
          <view class="result-row">
            <text class="result-label">毫秒时间戳</text>
            <view class="value-copy">
              <text class="result-value">{{ tsState.milliseconds }}</text>
              <text class="copy-link" @click="copyValue(tsState.milliseconds)">复制</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  timestampToDate,
  dateToTimestamp,
  nowTimestamp,
  formatDateValue,
  formatTimeValue,
} from '../../utils/timestamp.js'

const mode = ref('toDate')
const unit = ref('s')
const tsInput = ref('')
const now = new Date()
const dateValue = ref(formatDateValue(now))
const timeValue = ref(formatTimeValue(now))

const dateState = computed(() => {
  if (!tsInput.value.trim()) return { empty: true }
  return timestampToDate(tsInput.value, unit.value)
})

const tsState = computed(() => dateToTimestamp(dateValue.value, timeValue.value))

function fillNow() {
  const current = new Date()
  if (mode.value === 'toDate') {
    tsInput.value = String(nowTimestamp(unit.value))
  } else {
    dateValue.value = formatDateValue(current)
    timeValue.value = formatTimeValue(current)
  }
}

function copyValue(value) {
  uni.setClipboardData({
    data: String(value),
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}
</script>

<style scoped>
.value-copy {
  display: flex;
  align-items: center;
}

.copy-link {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: var(--primary);
}

.result-row {
  align-items: flex-start;
}
</style>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/TimestampPanel.vue
git commit -m "feat 完成时间戳转换面板"
```

---

### Task 18: JSON 面板

**Files:**
- Modify: `src/components/tools/JsonPanel.vue`

- [ ] **Step 1: 实现面板**

`src/components/tools/JsonPanel.vue`：

```vue
<template>
  <view class="panel">
    <view class="panel-title">JSON 格式化</view>
    <view class="panel-desc">格式化、压缩与校验，支持不超过 100,000 字符的内容</view>

    <view class="card">
      <view class="label">输入</view>
      <textarea class="textarea" v-model="input" maxlength="-1" placeholder="粘贴 JSON 内容" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="run('format')">格式化</view>
        <view class="btn btn-ghost" @click="run('minify')">压缩</view>
      </view>
      <view class="btn-row">
        <view class="btn btn-ghost" @click="run('validate')">校验</view>
      </view>

      <view v-if="error" class="error">{{ error }}</view>
      <view v-else-if="message" class="empty-tip">{{ message }}</view>

      <view class="label">结果</view>
      <textarea class="textarea" :value="result" disabled placeholder="结果显示在这里" />

      <view class="btn-row">
        <view class="btn btn-primary" @click="copyResult">复制结果</view>
        <view class="btn btn-ghost" @click="clearAll">清空</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { formatJson, minifyJson, validateJson } from '../../utils/json.js'

const LIMIT = 100000
const input = ref('')
const result = ref('')
const error = ref('')
const message = ref('')

function run(action) {
  error.value = ''
  message.value = ''
  if (input.value.length > LIMIT) {
    result.value = ''
    error.value = '输入过长（上限 100,000 字符）'
    return
  }
  if (action === 'validate') {
    const checked = validateJson(input.value)
    if (checked.error) error.value = checked.error
    else message.value = 'JSON 格式正确'
    return
  }
  const output = action === 'format' ? formatJson(input.value) : minifyJson(input.value)
  if (output.error) {
    result.value = ''
    error.value = output.error
    return
  }
  result.value = output.text
}

function copyResult() {
  if (!result.value) {
    uni.showToast({ title: '暂无可复制结果', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: result.value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

function clearAll() {
  input.value = ''
  result.value = ''
  error.value = ''
  message.value = ''
}
</script>
```

- [ ] **Step 2: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`。

- [ ] **Step 3: 提交**

```bash
git add src/components/tools/JsonPanel.vue
git commit -m "feat 完成 JSON 格式化面板"
```

---

### Task 19: 日历封装与待办页面

**Files:**
- Create: `src/utils/calendar.js`
- Create: `src/components/tools/TodoItem.vue`
- Modify: `src/pages/todo/index.vue`
- Modify: `src/pages/tools/index.vue`

- [ ] **Step 1: 日历封装**

`src/utils/calendar.js`：

```js
export function canAddCalendar() {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

export function addTodoToCalendar({ title, dueAt, description = '来自工具箱待办清单' }) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    wx.addPhoneCalendar({
      title: `待办：${title}`,
      startTime: Math.floor(dueAt / 1000),
      endTime: Math.floor(dueAt / 1000) + 1800,
      alarm: true,
      alarmOffset: 0,
      description,
      success: resolve,
      fail: reject,
    })
  })
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('仅微信小程序支持日历提醒'))
  // #endif
}
```

- [ ] **Step 2: 待办条目组件**

`src/components/tools/TodoItem.vue`：

```vue
<template>
  <view class="todo-item">
    <view v-if="!editing" class="todo-main" @click="$emit('edit', todo.id)">
      <view class="checkbox" :class="{ checked: todo.done }" @click.stop="$emit('toggle', todo.id)">
        <text v-if="todo.done" class="check-mark">✓</text>
      </view>
      <view class="todo-content">
        <view class="todo-title" :class="{ done: todo.done }">{{ todo.title }}</view>
        <view v-if="dueLabel" class="todo-due" :class="{ overdue }">{{ dueLabel }}</view>
      </view>
      <view class="more" @click.stop="$emit('more', todo.id)">⋯</view>
    </view>

    <view v-else class="edit-box">
      <input class="input" v-model="draftTitle" maxlength="60" placeholder="待办内容" />
      <view class="label">截止时间（可选）</view>
      <view class="edit-row">
        <picker mode="date" :value="draftDate" @change="draftDate = $event.detail.value">
          <view class="picker-field">
            <text>{{ draftDate || '选择日期' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
        <picker mode="time" :value="draftTime" @change="draftTime = $event.detail.value">
          <view class="picker-field">
            <text>{{ draftTime || '选择时间' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view v-if="showRemind" class="switch-row">
        <text class="switch-label">日历提醒</text>
        <switch :checked="draftRemind" color="#4361EE" @change="draftRemind = $event.detail.value" />
      </view>
      <view v-else class="empty-tip">仅微信小程序支持日历提醒</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="save">保存</view>
        <view class="btn btn-ghost" @click="$emit('cancel')">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatDueLabel, isOverdue } from '../../utils/todo.js'
import { dateToTimestamp, formatDateValue, formatTimeValue } from '../../utils/timestamp.js'
import { canAddCalendar } from '../../utils/calendar.js'

const props = defineProps({
  todo: { type: Object, required: true },
  editing: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'edit', 'save', 'cancel', 'more'])

const showRemind = canAddCalendar()
const draftTitle = ref('')
const draftDate = ref('')
const draftTime = ref('')
const draftRemind = ref(false)

const dueLabel = computed(() => formatDueLabel(props.todo.dueAt))
const overdue = computed(() => isOverdue(props.todo))

watch(
  () => props.editing,
  (editing) => {
    if (!editing) return
    draftTitle.value = props.todo.title
    if (props.todo.dueAt) {
      const date = new Date(props.todo.dueAt)
      draftDate.value = formatDateValue(date)
      draftTime.value = formatTimeValue(date)
    } else {
      draftDate.value = ''
      draftTime.value = ''
    }
    draftRemind.value = !!props.todo.remind
  },
  { immediate: true },
)

function save() {
  const title = draftTitle.value.trim()
  if (!title) {
    uni.showToast({ title: '请输入待办内容', icon: 'none' })
    return
  }
  let dueAt = null
  if (draftDate.value || draftTime.value) {
    if (!draftDate.value || !draftTime.value) {
      uni.showToast({ title: '请选择完整的日期和时间', icon: 'none' })
      return
    }
    const converted = dateToTimestamp(draftDate.value, draftTime.value)
    if (converted.error) {
      uni.showToast({ title: converted.error, icon: 'none' })
      return
    }
    dueAt = converted.milliseconds
  }
  emit('save', {
    id: props.todo.id,
    title,
    dueAt,
    remind: dueAt ? draftRemind.value : false,
  })
}
</script>

<style scoped>
.todo-item {
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
  background: var(--surface);
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.06);
}

.todo-main {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.check-mark {
  color: #FFFFFF;
  font-size: 24rpx;
  line-height: 1;
}

.todo-content {
  flex: 1;
  margin-left: 20rpx;
}

.todo-title {
  font-size: 28rpx;
  color: var(--text);
  word-break: break-all;
}

.todo-title.done {
  color: var(--text-secondary);
  text-decoration: line-through;
}

.todo-due {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.todo-due.overdue {
  color: var(--danger);
}

.more {
  padding: 8rpx 0 8rpx 24rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}

.edit-row {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.edit-row picker {
  width: 48%;
}
</style>
```

- [ ] **Step 3: 待办页面**

`src/pages/todo/index.vue`：

```vue
<template>
  <view class="todo-page">
    <view class="card add-card">
      <view class="add-row">
        <input
          class="input"
          v-model="newTitle"
          maxlength="60"
          confirm-type="done"
          placeholder="添加待办..."
          @confirm="add"
        />
        <view class="add-btn" @click="add">添加</view>
      </view>
    </view>

    <view class="chip-row filters">
      <view
        v-for="item in filters"
        :key="item.key"
        class="chip"
        :class="{ active: filter === item.key }"
        @click="filter = item.key"
      >{{ item.label }}（{{ counts[item.key] }}）</view>
    </view>

    <view v-if="!visibleTodos.length" class="empty-state">暂无待办</view>

    <TodoItem
      v-for="item in visibleTodos"
      :key="item.id"
      :todo="item"
      :editing="editingId === item.id"
      @toggle="toggle"
      @edit="startEdit"
      @save="saveEdit"
      @cancel="editingId = ''"
      @more="showMore"
    />

    <view class="note">
      <view>日历事件写入后无法由小程序删除或更新，修改或删除待办不会同步系统日历，旧事件需手动删除。</view>
      <view>提醒依赖用户授权系统日历，请到系统设置中开启日历权限。</view>
      <view>H5 端不支持日历提醒。</view>
      <view>数据仅保存在本机，清理小程序缓存或卸载后会丢失。</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TodoItem from '../../components/tools/TodoItem.vue'
import {
  createTodo,
  sortTodos,
  filterTodos,
  activeCount,
  toggleTodo,
  loadTodos,
  saveTodos,
  updateTabBadge,
} from '../../utils/todo.js'
import { addTodoToCalendar } from '../../utils/calendar.js'

const filters = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'done', label: '已完成' },
]

const todos = ref(loadTodos())
const newTitle = ref('')
const filter = ref('all')
const editingId = ref('')

const counts = computed(() => {
  const active = activeCount(todos.value)
  return { all: todos.value.length, active, done: todos.value.length - active }
})

const visibleTodos = computed(() => filterTodos(sortTodos(todos.value), filter.value))

function persist() {
  const saved = saveTodos(todos.value)
  updateTabBadge(activeCount(todos.value))
  if (!saved) uni.showToast({ title: '保存失败', icon: 'none' })
}

function add() {
  const title = newTitle.value.trim()
  if (!title) {
    uni.showToast({ title: '请输入待办内容', icon: 'none' })
    return
  }
  todos.value = [...todos.value, createTodo(title)]
  newTitle.value = ''
  persist()
}

function toggle(id) {
  todos.value = toggleTodo(todos.value, id)
  persist()
}

function startEdit(id) {
  editingId.value = id
}

function saveEdit(payload) {
  todos.value = todos.value.map((item) => {
    if (item.id !== payload.id) return item
    return {
      ...item,
      title: payload.title,
      dueAt: payload.dueAt,
      remind: payload.dueAt ? payload.remind : false,
    }
  })
  editingId.value = ''
  persist()
  if (payload.remind && payload.dueAt) {
    addTodoToCalendar({ title: payload.title, dueAt: payload.dueAt })
      .then(() => uni.showToast({ title: '已添加到手机日历', icon: 'none' }))
      .catch(() => uni.showToast({ title: '添加日历失败，请检查日历权限', icon: 'none' }))
  }
}

function showMore(id) {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return
  uni.showActionSheet({
    itemList: ['删除'],
    success: () => {
      uni.showModal({
        title: '删除待办',
        content: `确定删除「${todo.title}」吗？`,
        success: (res) => {
          if (!res.confirm) return
          todos.value = todos.value.filter((item) => item.id !== id)
          persist()
        },
      })
    },
  })
}

onShow(() => {
  updateTabBadge(activeCount(todos.value))
})
</script>

<style scoped>
.todo-page {
  padding: 32rpx 32rpx 64rpx;
}

.add-card {
  margin-top: 0;
}

.add-row {
  display: flex;
  align-items: center;
}

.add-row .input {
  flex: 1;
}

.add-btn {
  width: 140rpx;
  height: 80rpx;
  margin-left: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: var(--primary);
  color: #FFFFFF;
  font-size: 28rpx;
}

.filters {
  margin-top: 24rpx;
}

.empty-state {
  margin-top: 96rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.note {
  margin-top: 48rpx;
  font-size: 22rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 4: 工具页同步 tab 徽标**

修改 `src/pages/tools/index.vue` 的 `<script setup>`：

将

```js
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
```

改为

```js
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { loadTodos, activeCount, updateTabBadge } from '../../utils/todo.js'
```

在 `onLoad(...)` 之后添加：

```js
onShow(() => {
  updateTabBadge(activeCount(loadTodos()))
})
```

- [ ] **Step 5: 构建验证**

```bash
yarn build:mp-weixin
```

Expected: `DONE Build complete.`，`dist/build/mp-weixin/pages/todo/index.js` 存在。

- [ ] **Step 6: 提交**

```bash
git add src/utils/calendar.js src/components/tools/TodoItem.vue src/pages/todo/index.vue src/pages/tools/index.vue
git commit -m "feat 完成待办清单与日历提醒"
```

---

### Task 20: 关于页、manifest 与博客遗留清理

**Files:**
- Modify: `src/pages/about/about.vue`（整体替换）
- Modify: `src/manifest.json`
- Delete: 博客页面、组件、服务、配置、旧静态资源、`public/` 遗留

- [ ] **Step 1: 重写关于页**

`src/pages/about/about.vue`：

```vue
<template>
  <view class="about">
    <view class="hero">
      <image class="logo" src="../../static/logo.png" mode="aspectFit" />
      <view class="app-name">工具箱</view>
      <view class="version">v1.0.0</view>
    </view>

    <view class="card">
      <view class="section-title">功能</view>
      <view class="text">增值税计算 · 单位换算 · 文本处理</view>
      <view class="text">编码工具 · 进制转换 · 时间戳转换</view>
      <view class="text">JSON 格式化 · 待办清单</view>
    </view>

    <view class="card">
      <view class="section-title">免责声明</view>
      <view class="text">所有计算均在本地完成，结果仅供参考，不构成税务、财务或其他专业建议。</view>
    </view>

    <view class="card">
      <view class="section-title">开源</view>
      <view class="text link" @click="copyRepo">github.com/HerryLo/uniapp-wxapp</view>
    </view>
  </view>
</template>

<script setup>
const repo = 'https://github.com/HerryLo/uniapp-wxapp'

function copyRepo() {
  uni.setClipboardData({
    data: repo,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}
</script>

<style scoped>
.about {
  padding: 32rpx 32rpx 64rpx;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 16rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
}

.app-name {
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text);
}

.version {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.section-title {
  margin-bottom: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text);
}

.text {
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}

.link {
  color: var(--primary);
}
</style>
```

- [ ] **Step 2: 更新 manifest**

修改 `src/manifest.json` 顶部：

```json
  "name": "工具箱",
  "appid": "wx51b1f4f41c89ec6f",
  "description": "计算工具与待办清单小程序",
```

- [ ] **Step 3: 删除博客遗留文件**

```bash
git rm -r src/pages/index src/pages/article src/pages/detail
git rm -r src/components/ArticleCard src/components/SliderCard src/components/YuqueRichtext
git rm src/service/index.js src/utils/constant.js src/utils/util.js src/yuque.json
git rm src/static/about.png src/static/aboutactive1.png src/static/art.png src/static/artactive.png
git rm src/static/gh_wxcode.jpg src/static/img.png src/static/index.png src/static/indexactive.png
git rm src/static/indexactive1.png src/static/look.png src/static/qyz.png src/static/xing.png
git rm public/index.html public/static/gh_4766a66c7f8e_258\ \(2\).jpg
```

Expected: 每个文件显示 `rm '...'`，无报错。

- [ ] **Step 4: 构建验证**

```bash
yarn build:mp-weixin && yarn build:h5
```

Expected: 两次均 `DONE Build complete.`，无 `Cannot find module` 或缺失页面错误。

- [ ] **Step 5: 提交**

```bash
git add -A src public
git commit -m "refactor 移除博客功能并重写关于页"
```

---

### Task 21: README 与项目元信息

**Files:**
- Modify: `README.md`（整体替换）
- Modify: `package.json`（`name`）

- [ ] **Step 1: 更新 package.json 名称**

将 `"name": "uniapp-blog1"` 改为 `"name": "toolbox-miniapp"`。

- [ ] **Step 2: 重写 README**

`README.md`：

```markdown
# 计算工具小程序

基于 uni-app + Vue 3 + Vite 的微信小程序工具箱，所有计算与数据均在本机完成，无后端依赖。

## 功能

- 增值税计算：含税/不含税双向换算，支持常用税率与自定义税率
- 单位换算：长度、重量、温度、存储、面积
- 文本处理：按行去重、大小写转换
- 编码工具：Base64、URL 编解码
- 进制转换：2–36 进制，支持负数与超大整数
- 时间戳转换：时间戳与日期时间双向转换
- JSON 格式化：格式化、压缩、校验
- 待办清单：本地存储、筛选排序、tab 徽标、系统日历提醒（仅微信小程序）

## 运行

```bash
yarn install

# 微信小程序开发
yarn dev:mp-weixin

# H5 开发（仅用于本地调试）
yarn dev:h5

# 单元测试
yarn test
```

微信小程序：使用微信开发者工具导入 `dist/dev/mp-weixin`。

## 构建

```bash
yarn build:mp-weixin
yarn build:h5
```

## 目录结构

- `src/pages/tools/index.vue`：工具页与标签切换
- `src/pages/todo/index.vue`：待办清单
- `src/components/tools/*Panel.vue`：各工具面板
- `src/utils/*.js`：纯函数计算逻辑与本地存储
- `tests/*.test.js`：Vitest 单元测试

## 说明

- 所有数据仅保存在本机，清理小程序缓存或卸载后会丢失。
- 日历提醒依赖系统日历授权，修改或删除待办不会同步已写入的日历事件。
- 增值税计算结果仅供参考，不构成税务建议。

## License

[MIT](./LICENSE)
```

- [ ] **Step 3: 提交**

```bash
git add README.md package.json
git commit -m "docs 更新项目说明与元信息"
```

---

### Task 22: 全量验证

**Files:** 无新增

- [ ] **Step 1: 运行全部单元测试**

```bash
yarn test
```

Expected: `Test Files  9 passed (9)`，`Tests  42 passed (42)`。

- [ ] **Step 2: 构建两个平台**

```bash
yarn build:mp-weixin && yarn build:h5
```

Expected: 两次均 `DONE Build complete.`。

- [ ] **Step 3: 检查构建产物已清理**

```bash
grep -r "yuque" dist/build/mp-weixin || echo "no yuque"
grep -r "uni-stat" dist/build/mp-weixin || echo "no uni-stat"
```

Expected: 分别输出 `no yuque` 与 `no uni-stat`。

- [ ] **Step 4: 手动验收清单（执行者逐项确认并在结果中列出）**

微信开发者工具导入 `dist/dev/mp-weixin`（先运行 `yarn dev:mp-weixin`）：

- 首页为工具页，默认选中「增值税」，7 个标签一行全部可见。
- 切换标签后返回，输入内容保留。
- 7 个工具分别输入正常值与非法值，结果与错误提示符合设计。
- 待办：新增、完成、编辑、删除、筛选、排序、tab 徽标。
- 重启小程序后待办数据仍在。
- H5 运行 `yarn dev:h5`，验证工具页与待办页，确认待办编辑态显示「仅微信小程序支持日历提醒」。
- 真机验证日历提醒授权与事件写入（开发者工具可能不支持 `wx.addPhoneCalendar`）。

- [ ] **Step 5: 汇报结果**

将手动验收结果、失败项与剩余风险（日历真机未验证等）汇报给协调者。不要为未验证项声称通过。

