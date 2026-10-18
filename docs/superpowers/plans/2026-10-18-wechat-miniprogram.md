# 孕期助手微信小程序实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有仓库中新增可由微信开发者工具导入、预览并提交审核的个人主体原生小程序，同时保留现有 Web Demo。

**Architecture:** 小程序使用原生 WXML、WXSS 和 TypeScript，孕期资料、日程和记录保存在微信本地。照片经用户单次确认后发送到新增的受限报告整理接口；接口只返回 OCR 原文、摘要和通用术语释义，并拒绝医学判断或建议内容。

**Tech Stack:** 微信原生小程序、TypeScript、Vitest、Node.js `node:test`、现有原生 HTTP 服务、OpenAI Responses API。

**Spec:** `docs/superpowers/specs/2026-10-18-wechat-miniprogram-design.md`

## Global Constraints

- 保留现有 React Web Demo、`/api/parse-report` 和本地开发流程。
- 小程序首版不登录、不云同步、不发送订阅消息。
- 数据默认只保存在本机；原始照片不在服务端持久化。
- 小程序报告能力只能做 OCR 原文、原文摘要和通用术语释义。
- 禁止正常/异常判断、风险推断、诊断、医学建议、就医建议和药物建议。
- 仓库不得包含 AppSecret、OpenAI API Key、真实报告照片或其他敏感数据。
- 小程序代码使用 ASCII 文件名；用户界面使用简体中文。

## Review Focus

- 末次月经为空、无效、未来日期或超过 43 周时必须阻止保存并显示明确错误；Task 2 的资料测试覆盖。
- 本地存储内容损坏或版本未知时必须恢复为空状态而非让小程序崩溃；Task 2 的存储测试覆盖。
- 图片过大、格式不支持、压缩失败或本地附件丢失时必须保留可编辑文字记录；Task 5 和 Task 7 覆盖。
- 模型在摘要或术语释义中返回异常判断、风险或建议时，后端必须拒绝整个结果；Task 6 覆盖。
- 网络超时、API 未配置或配额不足时不得返回演示数据或保存半成品；Task 6 和 Task 7 覆盖。

---

### Task 1: 创建可导入的小程序骨架与共享领域模型

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.ts`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/sitemap.json`
- Create: `miniprogram/tsconfig.json`
- Create: `miniprogram/types/domain.ts`
- Create: `miniprogram/domain/profile.ts`
- Create: `miniprogram/domain/pregnancy.ts`
- Create: `miniprogram/domain/schedule.ts`
- Test: `miniprogram/domain/profile.test.ts`
- Test: `miniprogram/domain/pregnancy.test.ts`
- Test: `miniprogram/domain/schedule.test.ts`

**Interfaces:**
- Produces: `PersonalProfile`, `PregnancyOverview`, `ScheduleItem`, `validateProfile()`, `buildPregnancyOverview()` and `buildDefaultSchedule()` for later pages.

- [ ] **Step 1: Write failing parity tests**

Add tests asserting the existing Web behavior for due date, `week/day` label, invalid profile dates, meal ordering and the general checkup task for representative weeks.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run miniprogram/domain`

Expected: FAIL because the mini-program domain modules do not exist.

- [ ] **Step 3: Implement the mini-program project and pure domain modules**

Use `touristappid` in committed `project.config.json`, set `miniprogramRoot` to `./`, configure the three Tab pages, and keep the actual AppID in ignored `project.private.config.json`. Port only the pure calculation logic needed by the approved scope; remove report trend and medical-analysis logic.

- [ ] **Step 4: Add type-check and test scripts**

Add `typecheck:miniprogram` and include the mini-program domain tests in the existing test command. Add `miniprogram-api-typings` as a development dependency and generate the lockfile change.

- [ ] **Step 5: Verify Task 1**

Run: `npm test`

Run: `npm run typecheck:miniprogram`

Expected: all existing and new tests pass; TypeScript reports no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore miniprogram
git commit -m "feat: scaffold native WeChat mini program"
```

### Task 2: 本地状态、隐私确认与孕期资料引导

**Files:**
- Create: `miniprogram/storage/app-state.ts`
- Create: `miniprogram/storage/wx-storage.ts`
- Create: `miniprogram/storage/app-state.test.ts`
- Create: `miniprogram/pages/onboarding/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/pages/profile/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/pages/privacy/index.{json,ts,wxml,wxss}`
- Modify: `miniprogram/app.ts`
- Modify: `miniprogram/app.json`

**Interfaces:**
- Consumes: `PersonalProfile` and `validateProfile()` from Task 1.
- Produces: `AppStateV1`, `loadAppState()`, `saveAppState()`, `clearAppState()` and the stable storage key `pregnancy-assistant-state-v1`.

- [ ] **Step 1: Write failing storage tests**

Test default state, valid round trip, malformed JSON recovery, unknown version recovery, profile update, privacy version acceptance and clear-all behavior through an injected `KeyValueStorage` interface.

- [ ] **Step 2: Run the storage tests and confirm RED**

Run: `npx vitest run miniprogram/storage/app-state.test.ts`

Expected: FAIL because the state module does not exist.

- [ ] **Step 3: Implement storage and startup routing**

Implement `AppStateV1` with `profile`, `schedule`, `records` and `privacy`. On launch, route to privacy/onboarding when required, otherwise open Today. Wrap `wx` calls in `wx-storage.ts`; keep state logic testable without `wx`.

- [ ] **Step 4: Implement privacy, onboarding and profile pages**

Use native date picker, segmented radio controls and text areas. Require privacy acceptance before profile entry. Show validation errors inline and provide a destructive clear-data action with confirmation.

- [ ] **Step 5: Verify Task 2**

Run: `npx vitest run miniprogram/storage miniprogram/domain/profile.test.ts`

Run: `npm run typecheck:miniprogram`

Expected: all tests and type-check pass.

- [ ] **Step 6: Commit**

```bash
git add miniprogram
git commit -m "feat: add local profile and privacy flow"
```

### Task 3: 今日页面

**Files:**
- Create: `miniprogram/pages/today/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/components/progress-ring/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/components/task-row/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/pages/today/model.ts`
- Test: `miniprogram/pages/today/model.test.ts`
- Add: `miniprogram/assets/clay-garden.png`

**Interfaces:**
- Consumes: `buildPregnancyOverview()`, `AppStateV1` and `ScheduleItem`.
- Produces: `buildTodayViewModel(state, now)` returning display-only pregnancy and pending-task data.

- [ ] **Step 1: Write failing Today view-model tests**

Assert no-profile state, pregnancy label, due date, next checkup, pending item filtering and high-risk/medication copy that only asks the user to bring original information to a clinician.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run miniprogram/pages/today/model.test.ts`

Expected: FAIL because `buildTodayViewModel()` does not exist.

- [ ] **Step 3: Implement the Today model and page**

Create a compact mobile page matching the approved soft clay visual direction. Reuse the existing approved clay image asset, keep headings sized for a utility interface, and link profile editing from the header.

- [ ] **Step 4: Verify Task 3**

Run: `npx vitest run miniprogram/pages/today/model.test.ts`

Run: `npm run typecheck:miniprogram`

Expected: tests and type-check pass.

- [ ] **Step 5: Commit**

```bash
git add miniprogram
git commit -m "feat: add pregnancy today view"
```

### Task 4: 可编辑日程页面

**Files:**
- Create: `miniprogram/pages/schedule/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/pages/schedule/editor.{json,ts,wxml,wxss}`
- Create: `miniprogram/domain/schedule-actions.ts`
- Test: `miniprogram/domain/schedule-actions.test.ts`
- Modify: `miniprogram/storage/app-state.ts`

**Interfaces:**
- Consumes: `ScheduleItem`, `buildDefaultSchedule()` and state persistence.
- Produces: `addScheduleItem()`, `updateScheduleItem()`, `deleteScheduleItem()` and `toggleScheduleItem()` as pure state transitions.

- [ ] **Step 1: Write failing schedule action tests**

Cover add, edit, delete, complete/uncomplete, stable sorting, duplicate IDs, invalid times and persistence after reloading state.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run miniprogram/domain/schedule-actions.test.ts`

Expected: FAIL because schedule actions do not exist.

- [ ] **Step 3: Implement schedule actions and UI**

Show date sections and fixed-height rows. Use icons or checkboxes for completion and deletion, a native time picker for time, and a menu for type. Include breakfast, lunch, dinner, optional snack, supplement, checkup and custom types. Keep food copy general and supplement text as user-entered reminders rather than dosage advice.

- [ ] **Step 4: Verify Task 4**

Run: `npx vitest run miniprogram/domain/schedule-actions.test.ts`

Run: `npm run typecheck:miniprogram`

Expected: tests and type-check pass.

- [ ] **Step 5: Commit**

```bash
git add miniprogram
git commit -m "feat: add editable pregnancy schedule"
```

### Task 5: 个人记录与本地照片附件

**Files:**
- Create: `miniprogram/domain/records.ts`
- Test: `miniprogram/domain/records.test.ts`
- Create: `miniprogram/services/local-files.ts`
- Create: `miniprogram/pages/records/index.{json,ts,wxml,wxss}`
- Create: `miniprogram/pages/record-editor/index.{json,ts,wxml,wxss}`
- Modify: `miniprogram/storage/app-state.ts`

**Interfaces:**
- Produces: `PersonalRecord`, `createRecord()`, `updateRecord()`, `deleteRecord()` and `LocalFilePort.save/delete/exists`.

- [ ] **Step 1: Write failing record tests**

Cover text-only records, optional attachment paths, update, delete, missing attachment marking, empty-title validation and deleting the local file when a record is removed.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run miniprogram/domain/records.test.ts`

Expected: FAIL because record actions do not exist.

- [ ] **Step 3: Implement records and local file adapter**

Use `wx.chooseMedia`, validate JPG/PNG/WebP, compress large images before saving, and persist through `wx.saveFile`. Keep file-system operations behind `LocalFilePort` so domain tests use an in-memory fake.

- [ ] **Step 4: Implement list and editor pages**

Allow date, title, body, tags and one optional photo. Missing photos must not block reading or editing the text record.

- [ ] **Step 5: Verify Task 5**

Run: `npx vitest run miniprogram/domain/records.test.ts`

Run: `npm run typecheck:miniprogram`

Expected: tests and type-check pass.

- [ ] **Step 6: Commit**

```bash
git add miniprogram
git commit -m "feat: add private records and photo attachments"
```

### Task 6: 新增受限报告文字整理 API

**Files:**
- Create: `server/report-extractor.mjs`
- Create: `server/report-extractor.test.mjs`
- Modify: `server/index.mjs`
- Modify: `server/api.test.mjs`
- Modify: `.env.example`

**Interfaces:**
- Produces: `validateExtractInput(input)`, `validateRecordOnlyResult(result)` and `extractReport(input, options)`.
- HTTP: `POST /api/extract-report` with `{ mode: "record_only", imageDataUrl }`, returning `{ sourceText, reportTitle, reportDate, items, summary, terms, limitations }`.

- [ ] **Step 1: Write failing extractor tests**

Test image signature/size validation, schema validation, successful neutral result, missing credentials, model refusal, malformed JSON, timeout, quota error and rejection when generated `summary` or `terms[].definition` includes abnormality, risk, diagnosis, treatment, dosage or medical advice.

- [ ] **Step 2: Verify RED**

Run: `node --test server/report-extractor.test.mjs server/api.test.mjs`

Expected: FAIL because the extractor and route do not exist.

- [ ] **Step 3: Implement strict extraction schema and prompt**

Use strings for extracted values so the service transcribes rather than evaluates numbers. Permit medical terms in `sourceText` because they come from the report, but apply the forbidden-content guard to generated `summary` and term definitions. Set `store: false` and keep the existing proxy support.

- [ ] **Step 4: Add the JSON API route**

Return conventional HTTP status codes and one JSON body. Do not return fixed demo content on any live-request failure. Keep `/api/parse-report` behavior unchanged for Web.

- [ ] **Step 5: Verify Task 6**

Run: `node --test server/*.test.mjs`

Expected: all server tests pass.

- [ ] **Step 6: Commit**

```bash
git add server .env.example
git commit -m "feat: add review-safe report text extraction"
```

### Task 7: 小程序照片整理流程

**Files:**
- Create: `miniprogram/config.ts`
- Create: `miniprogram/services/report-api.ts`
- Test: `miniprogram/services/report-api.test.ts`
- Modify: `miniprogram/pages/record-editor/index.{ts,wxml,wxss}`
- Create: `miniprogram/components/extraction-status/index.{json,ts,wxml,wxss}`
- Modify: `miniprogram/pages/privacy/index.wxml`

**Interfaces:**
- Consumes: `POST /api/extract-report`, `LocalFilePort` and record actions.
- Produces: `API_BASE_URL`, plus `extractReportForRecord(filePath, dependencies)` returning an editable `ExtractedReportDraft`.

- [ ] **Step 1: Write failing client tests**

With injected file and request adapters, test supported image conversion, size rejection, explicit consent requirement, success mapping, HTTP errors, timeout, missing fields and ensuring failed extraction never saves or mutates a record.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run miniprogram/services/report-api.test.ts`

Expected: FAIL because the report API client does not exist.

- [ ] **Step 3: Implement the API client and status flow**

Read the compressed file as Base64, call `API_BASE_URL` from `miniprogram/config.ts`, and expose `preparing`, `uploading`, `extracting`, `review` and `error` states. Commit an empty development placeholder rather than a production domain. Require a modal confirmation that the image is sent to the service and model provider.

- [ ] **Step 4: Implement result review and save**

Present original text, summary, items and term definitions in editable fields. Show the fixed limitation copy. Save only after explicit confirmation; never add flags, risk labels or recommendations.

- [ ] **Step 5: Verify Task 7**

Run: `npx vitest run miniprogram/services/report-api.test.ts`

Run: `npm run typecheck:miniprogram`

Expected: tests and type-check pass.

- [ ] **Step 6: Commit**

```bash
git add miniprogram
git commit -m "feat: add consented report text workflow"
```

### Task 8: 审核材料、开发者工具验收与发布检查

**Files:**
- Modify: `README.md`
- Create: `docs/wechat/release-checklist.md`
- Create: `docs/wechat/privacy-copy.md`
- Create: `docs/wechat/review-notes.md`
- Create: `scripts/validate-miniprogram.mjs`
- Test: `scripts/validate-miniprogram.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `validateMiniProgram(root, trackedFiles)`, `npm run validate:miniprogram` and user-facing release documents.

- [ ] **Step 1: Write failing validator tests**

Create fixture directories and assert that `validateMiniProgram(root, trackedFiles)` reports a declared page file missing, a committed AppID other than `touristappid`, a secret-like key in tracked mini-program files, and prohibited product copy in WXML/TS generated-output labels. Add one complete clean fixture that returns no findings.

- [ ] **Step 2: Run validation and confirm RED**

Run: `node --test scripts/validate-miniprogram.test.mjs`

Expected: FAIL because `validateMiniProgram()` does not exist.

- [ ] **Step 3: Add release documentation and validator**

Implement `validateMiniProgram(root, trackedFiles)` and its CLI wrapper. Document AppID setup, API base URL, legal domain, privacy declarations, service category selection, preview, upload, review notes and post-approval publishing. Include exact reviewer wording that describes OCR, summary and terminology without claiming diagnosis.

- [ ] **Step 4: Run the complete automated verification**

Run: `npm test`

Run: `npm run build`

Run: `npm run typecheck:miniprogram`

Run: `npm run validate:miniprogram`

Expected: every command exits 0 with no test failures.

- [ ] **Step 5: Perform WeChat Developer Tools verification**

Import `miniprogram/`, enter the user's AppID in the private project configuration, compile, preview on a phone, test profile/schedule/record/photo flows, test denied privacy consent, test offline behavior, and confirm the configured HTTPS domain works with domain checking enabled.

- [ ] **Step 6: Review tracked files and commit**

Run: `git status --short`

Run: `git grep -n -I -E "(sk-[A-Za-z0-9_-]{20,}|AppSecret|OPENAI_API_KEY=.+)"`

Expected: no secrets or real report images are staged.

```bash
git add README.md docs/wechat scripts/validate-miniprogram.mjs package.json
git commit -m "docs: add WeChat release checklist"
```

- [ ] **Step 7: Push the verified commits**

Run: `git push origin main`

Expected: the remote `main` SHA matches local `HEAD`.
