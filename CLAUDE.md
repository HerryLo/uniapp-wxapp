# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

uni-app + Vue 3 + Vite mini-program ("垣计算"): a local-first baby log plus a small calculator toolbox. There is no backend — every record is stored in `uni` local storage and every calculation runs on-device. WeChat mini-program is the primary target; H5 exists only for local debugging and file export.

## Commands

```bash
npm install

# 微信小程序开发（产物在 dist/dev/mp-weixin，用微信开发者工具导入）
npm run dev:mp-weixin

# H5 本地调试（http://localhost:5173）
npm run dev:h5

# 单元测试
npm test
# 单个测试文件
npx vitest run tests/baby-records.test.js
# 按用例名过滤
npx vitest run -t "adds, groups and summarizes a day"

# 生产构建
npm run build:mp-weixin
npm run build:h5
```

The scripts are plain npm scripts; `yarn` works as an equivalent and `README.md` notes that. `npm test` maps to `vitest run` (single pass, not watch mode). Bare `npm run build` / `npm run serve` alias the **H5** targets — use the `:mp-weixin` variants for the mini-program. `dist/` is gitignored but the WeChat devtools project points at `dist/dev/mp-weixin`.

`package.json` has no lint/format/typecheck scripts — do not invent one. `jsconfig.json` only enables `@dcloudio/types` for editor IntelliSense.

## Architecture

### App shell and routing

- `src/main.js` uses `createSSRApp` (uni-app requirement); `src/App.vue` holds global CSS variables, `page` background, and shared `.card` / `.btn` / form classes. The pink/cream theme (`--primary`, `--surface`, …) and `rpx` units are used throughout.
- `src/pages.json` defines the whole route tree: two tabBar pages (`pages/baby/index`, `pages/mine/index`), the non-tab `pages/tools/index`, `pages/about/about`, and a `package-baby` subpackage containing all baby sub-pages. WeChat subpackage optimization is enabled in `manifest.json`. Add new baby pages under `package-baby/` and register them in `pages.json`.
- Platform-specific code uses uni-app conditional compilation (`// #ifdef MP-WEIXIN`, `// #ifdef H5`) in both templates and scripts — e.g. share menus, file export/restore, ads. Keep H5 paths working for local debugging.

### Baby data layer (the core abstraction)

- `src/utils/storage.js` is the only storage gateway: JSON-serialized `uni.getStorageSync`/`setStorageSync` wrapped in try/catch, returning fallbacks instead of throwing. It supports a swappable driver (`setStorageDriver`), a change-listener bus (`onStorageChange`), and a one-time "corrupt data skipped" toast. All feature modules must go through it, not call `uni.getStorageSync` directly.
- `src/utils/baby/keys.js` is the single source of storage key names, all prefixed `baby.`: one key per singleton feature (profile, growth, vaccines, milestones, moods, notes, mom, travel, backup) and monthly buckets for daily records (`baby.records.v1.YYYY-MM`) plus an index key (`baby.records.index.v1`) so backups can enumerate months without scanning unrelated storage.
- Most of `src/utils/baby/*` is pure, synchronous domain logic (date parsing, age, record validation, growth, vaccine status, sidebar state); `avatar.js` is the async, platform-dependent exception. `src/package-baby/utils/*` contains feature logic tied to the subpackage (backup/restore, sync wrapper, journal, mom, travel). Every persistence function follows the same contract: validate → read → transform → write, returning `{ ok: true, ... }` or `{ ok: false, error: '…' }` with a Chinese user-facing message. Keep this shape when adding features.
- `profile.avatar` stores a compressed base64 data URL (max `MAX_AVATAR_CHARS` in `src/utils/baby/avatar.js`); `saveAvatar()` updates only the avatar so the home page can change it before birth date is filled. Avatars travel inside the existing backup payload.
- Records: `records.js` keeps six kinds (`milk`, `sleep`, `diaper`, `food`, `medicine`, `supplement`) grouped by day inside a monthly object. `normalizeDay` must stay backward-compatible with older data missing newer arrays. Deleting the last record of a day drops the day and updates the month index. Note the UI only edits **today's** records (`useDayRecords` hardcodes `todayKey()`); monthly buckets exist for trend summaries and backups, not for browsing history.
- Vaccines: built-in entries are seeded from `src/data/vaccinePlan.js` on first load; `loadVaccines` re-adds any missing built-ins while preserving user state. Items carry `done`, `date`, `skipped`, `builtin`. Optional (二类) vaccines can be skipped one-by-one or in bulk; built-ins cannot be deleted, only custom ones.
- Static reference content lives in data files, not components: `src/data/vaccinePlan.js` (immunization reference) and `src/package-baby/data/referenceMilestones.js` (developmental milestones). Both are explicitly framed as non-medical-advice; keep the disclaimer wording when editing them.
- Backup/restore (`src/package-baby/utils/backup.js`): payload shape is `{ app: 'toolbox-baby', schemaVersion: 1, exportedAt, data }`, max 2 MB. `restoreData` always snapshots current data to `BACKUP_KEY` first and rolls back if any write fails. `sync.js` wraps the same payload as a versioned sync snapshot — a seam for future sync, not an implemented sync feature.

### UI composition

- `src/components/baby/BabyPage.vue` is the standard shell for all baby pages: a content area plus `BabySidebar` (fixed left rail, collapsible to a draggable floating button). Pass `active="<sidebar key>"`. Sidebar navigation uses `switchTab` for home, `redirectTo` between subpackage pages, and `navigateTo` when coming from a tab page. Collapse state and floating-button position are module-level in-memory state (`src/utils/baby/sidebar.js`), not persisted.
- `src/utils/baby/sidebar.js` also owns `SIDEBAR_ITEMS`; a new baby page usually needs an entry there **and** in `pages.json`. Settings is intentionally not in the sidebar — it is reached from the 「我的」 tab or the baby home profile card.
- The six daily-record pages are thin wrappers around `src/package-baby/components/records/RecordPage.vue`, which combines `useDayRecords(kind)` (state + add/remove/refresh), `RecordList`, and `RecordForm`. To add a record kind: extend `KINDS`, validation/creation in `records.js`, the form branches in `RecordForm.vue`, the list rendering in `RecordList.vue`, and, if the kind should appear in the top switcher, the switch items in `RecordPage.vue`.
- Toolbox: `pages/tools/index.vue` is opened from the 「我的」 tab (not a tabBar page) and keeps all four panels mounted, toggling them with `v-show`; a floating button opens a bottom sheet to switch tools. Calculations live in `src/utils/{vat,units,text,radix}.js` and must stay UI-free.
- Shared chrome: `ShareButton.vue` (WeChat `open-type="share"`, H5 copies the link), `AdBanner.vue` (WeChat `ad-custom`, two unit ids selected by the `unit` prop; renders nothing on H5), `Disclaimer.vue`.
- Canvas chart: `src/package-baby/components/LineChart.vue` initializes a `type="2d"` canvas with retries and redraws on prop changes. It is used by growth and the 7-day milk trend.

### Tests

Vitest runs in a `node` environment over `tests/**/*.test.js` (see `vitest.config.js`). There is no jsdom and no component mounting: tests stub the global `uni` object with `vi.stubGlobal` and exercise pure modules plus the Vue composable directly (`useDayRecords`). When adding logic, put it in a pure module and test it there; avoid requiring `uni` at module import time so tests can stub it.

## Conventions and constraints

- UI copy, comments, and validation messages are Chinese; keep that.
- Product boundary: everything is local-only. Do not add network calls, login, or cloud sync — `sync.js` is a payload seam only.
- Storage compatibility matters: users may have old local data, and backups embed `schemaVersion: 1`. Do not rename/remove storage keys or payload fields without a migration path.
- Mini-program limits: 2 MB import cap, package size/subpackage split, WeChat ad component only inside `#ifdef MP-WEIXIN`.
- The displayed version is duplicated in `src/manifest.json` (`versionName`/`versionCode`) and `src/pages/about/about.vue`; update both together.
- `scripts/gen-tab-icons.cjs` is a standalone Node script that generates the four tabBar PNGs in `src/static/`; it is not part of the build.
- Design specs and implementation plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/` (date-prefixed Markdown). Read the relevant spec before changing behavior it covers.
