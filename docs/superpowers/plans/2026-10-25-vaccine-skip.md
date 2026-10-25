# 疫苗提示与二类跳过 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** 首页只提示一类疫苗，二类疫苗可标记/恢复「暂不接种」。

**Architecture:** 在疫苗数据中增加 `skipped` 字段；扩展 `nextVaccine` 类型过滤和 `vaccineStatus`；首页只查询一类；疫苗页给二类增加跳过/恢复操作。

**Tech Stack:** uni-app 3 + Vue 3 `<script setup>` + Vitest。

## Global Constraints

- 不改存储 key 和导出格式，`skipped` 随疫苗数组保存
- 一类疫苗不提供跳过
- 使用「暂不接种」「恢复参考」文案，不做医疗建议
- 现有测试和双端构建保持通过

---

### Task 1: 疫苗跳过逻辑

**Files:**
- Modify: `src/utils/baby/vaccines.js`
- Test: `tests/baby-vaccines.test.js`

**Interfaces:**
- Produces: `setVaccineSkipped(list, id, skipped)`
- `nextVaccine(list, totalMonths, options?)` 支持 `options.type`
- `vaccineStatus` 返回 `{ key: 'skipped', label: '暂不接种' }`

- [ ] **Step 1: Write failing tests**

在 `tests/baby-vaccines.test.js` 中 import 加入 `setVaccineSkipped`，并追加：

```js
  it('skips and restores optional vaccines', () => {
    const list = createBuiltinVaccines()
    const target = list.find((item) => item.type === '二类')
    const skipped = setVaccineSkipped(list, target.id, true)
    expect(skipped.find((item) => item.id === target.id)).toMatchObject({
      skipped: true,
      done: false,
      date: '',
    })
    expect(vaccineStatus(skipped.find((item) => item.id === target.id), 12)).toMatchObject({
      key: 'skipped',
      label: '暂不接种',
    })

    const restored = setVaccineSkipped(skipped, target.id, false)
    expect(restored.find((item) => item.id === target.id).skipped).toBe(false)
  })

  it('only returns the requested type and ignores skipped vaccines', () => {
    const list = [
      { id: 'a', name: 'A', month: 6, type: '二类', done: false, skipped: false },
      { id: 'b', name: 'B', month: 3, type: '一类', done: false, skipped: false },
      { id: 'c', name: 'C', month: 2, type: '一类', done: false, skipped: true },
    ]
    expect(nextVaccine(list, 4, { type: '一类' }).id).toBe('b')
    expect(nextVaccine(list, 4, { type: '二类' }).id).toBe('a')
    expect(nextVaccine(list, 4)).toBeDefined()
  })

  it('clears skipped when marked as done', () => {
    const list = [
      {
        id: 'a',
        name: 'A',
        month: 6,
        type: '二类',
        done: false,
        skipped: true,
        date: '',
      },
    ]
    expect(setVaccineDone(list, 'a', true, '2026-10-24')[0]).toMatchObject({
      done: true,
      skipped: false,
      date: '2026-10-24',
    })
  })

  it('keeps skipped state from stored data and defaults it for old data', () => {
    store[VACCINES_KEY] = JSON.stringify([
      {
        id: 'builtin-hep-b-1',
        name: '乙肝疫苗（第1剂）',
        month: 0,
        type: '一类',
        done: false,
        date: '',
        builtin: true,
      },
      {
        id: 'custom-1',
        name: '自费疫苗',
        month: 12,
        type: '二类',
        done: false,
        date: '',
        skipped: true,
        builtin: false,
      },
    ])
    const list = loadVaccines()
    const custom = list.find((item) => item.id === 'custom-1')
    expect(custom.skipped).toBe(true)
    expect(list.find((item) => item.id === 'builtin-hep-b-1').skipped).toBe(false)
  })
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run tests/baby-vaccines.test.js`

Expected: FAIL，`setVaccineSkipped` 未导出。

- [ ] **Step 3: Implement logic**

在 `src/utils/baby/vaccines.js` 中：

1. `createBuiltinVaccines` 每项增加 `skipped: false`。
2. `normalize` 返回值增加 `skipped: !!item.skipped`。
3. `addCustomVaccine` 的 vaccine 增加 `skipped: false`。
4. 把 `setVaccineDone` 改为：

```js
export function setVaccineDone(list, id, done, date = '') {
  return list.map((item) => {
    if (item.id !== id) return item
    if (!done) return { ...item, done: false, date: '', skipped: false }
    return { ...item, done: true, date: date || item.date, skipped: false }
  })
}
```

5. 新增：

```js
export function setVaccineSkipped(list, id, skipped) {
  return list.map((item) => {
    if (item.id !== id) return item
    if (!skipped) return { ...item, skipped: false }
    return { ...item, done: false, date: '', skipped: true }
  })
}
```

6. `vaccineStatus` 开头增加：

```js
  if (vaccine.skipped) return { key: 'skipped', label: '暂不接种' }
```

7. `nextVaccine` 改为：

```js
export function nextVaccine(list, totalMonths, options = {}) {
  if (totalMonths == null) return null
  const type = options.type || null
  const candidates = list.filter(
    (item) =>
      !item.done &&
      !item.skipped &&
      item.month != null &&
      (!type || item.type === type)
  )
  if (!candidates.length) return null
  candidates.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month
    if (a.type !== b.type) return a.type === '一类' ? -1 : 1
    return a.name.localeCompare(b.name, 'zh')
  })
  return candidates[0]
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/baby-vaccines.test.js`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/utils/baby/vaccines.js tests/baby-vaccines.test.js
git commit -m "feat: add optional vaccine skip state"
```

---

### Task 2: 首页只提示一类疫苗

**Files:**
- Modify: `src/pages/baby/index.vue`

**Interfaces:**
- Consumes: `nextVaccine(list, months, { type: '一类' })`

- [ ] **Step 1: Update the query**

把：

```js
  nextVaccineItem.value = nextVaccine(
    loadVaccines(),
    age.value ? age.value.totalMonths : null
  )
```

改为：

```js
  nextVaccineItem.value = nextVaccine(
    loadVaccines(),
    age.value ? age.value.totalMonths : null,
    { type: '一类' }
  )
```

- [ ] **Step 2: Update copy**

把卡片标题：

```vue
      <view class="card-title">💉 下一条疫苗参考</view>
```

改为：

```vue
      <view class="card-title">💉 下一条一类疫苗参考</view>
```

把空状态：

```vue
      <view v-else class="empty-tip">暂无待接种参考</view>
```

改为：

```vue
      <view v-else class="empty-tip">一类疫苗已按参考程序完成</view>
```

- [ ] **Step 3: Build**

Run: `npm run build:mp-weixin`

- [ ] **Step 4: Commit**

```bash
git add src/pages/baby/index.vue
git commit -m "feat: show only class one vaccines on baby home"
```

---

### Task 3: 疫苗页跳过/恢复操作

**Files:**
- Modify: `src/package-baby/health/index.vue`

**Interfaces:**
- Consumes: `setVaccineSkipped`、`vaccineStatus` 的 `skipped` 状态

- [ ] **Step 1: Add the action link**

在疫苗名称单元格中，`overdue-note` 之后加入：

```vue
              <text
                v-if="item.type === '二类' && !item.done"
                class="skip-link"
                @click.stop="toggleSkip(item)"
              >{{ item.skipped ? '恢复参考' : '暂不接种' }}</text>
```

- [ ] **Step 2: Add the handler**

在 import 中加入 `setVaccineSkipped`，并加入：

```js
function toggleSkip(item) {
  if (item.skipped) {
    persist(setVaccineSkipped(list.value, item.id, false))
    return
  }
  uni.showModal({
    title: '暂不接种',
    content: `确定将「${item.name}」标记为暂不接种吗？之后可恢复参考。`,
    success: (res) => {
      if (!res.confirm) return
      persist(setVaccineSkipped(list.value, item.id, true))
    },
  })
}
```

- [ ] **Step 3: Add styles**

```css
.skip-link {
  display: inline-block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--primary-strong);
}
.status.skipped {
  color: var(--text-secondary);
}
```

- [ ] **Step 4: Update the 二类 note**

把分组说明改为：

```vue
          <view v-if="group.type === '二类'" class="group-note">
            二类疫苗为自费自愿接种，请咨询接种门诊。如不计划接种，可标记为暂不接种。
          </view>
```

- [ ] **Step 5: Validate and build**

Run:

```bash
node -e "const fs=require('fs');const {parse,compileScript,compileTemplate}=require('@vue/compiler-sfc');const file='src/package-baby/health/index.vue';const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});if(errors.length)throw errors[0];compileScript(descriptor,{id:'check'});const t=compileTemplate({source:descriptor.template.content,filename:file,id:'check'});if(t.errors.length)throw t.errors[0];console.log(file,'OK')"
npm run build:mp-weixin
```

- [ ] **Step 6: Commit**

```bash
git add src/package-baby/health/index.vue
git commit -m "feat: allow skipping optional vaccines"
```

---

### Task 4: 整体验证

- [ ] `npm test`
- [ ] `npm run build:mp-weixin`
- [ ] `npm run build:h5`
- [ ] 开发者工具检查：
  - 首页只出现一类疫苗提示
  - 一类全部完成后显示完成文案
  - 二类可标记/恢复「暂不接种」
  - 跳过项不再显示待接种/超期
  - 勾选已接种会清除跳过状态
  - 导出/恢复保留跳过状态

## Self-Review Notes

- Spec coverage: 数据字段、首页过滤、疫苗页操作、测试均覆盖
- No placeholders
- `skipped` 在 builtins/custom/normalize/setDone/setSkipped 中保持一致
