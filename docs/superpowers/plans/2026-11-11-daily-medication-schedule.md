# Daily Medication Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide report networking from the review package, add a gestational-age size comparison, and generate idempotent daily medication reminders from user-entered plans.

**Architecture:** Upgrade local state to version 2 with structured medication plans and a version-1 migration. Domain functions own validation, pregnancy comparison copy, and daily schedule synchronization; pages only edit profile data and persist synchronized state. Report parsing recovery code lives outside `miniprogram/`, so the review package remains local-only.

**Tech Stack:** TypeScript, native WeChat Mini Program WXML/WXSS, Vitest, local `wx` storage.

**Spec:** `docs/superpowers/specs/2026-11-11-daily-medication-schedule-design.md`

## Global Constraints

- Medication time and meal relation come only from user input; never infer dose, timing, safety, or interactions from a drug name.
- Completed same-day medication reminders remain unchanged after plan edits or deletion; new plan values apply from the next day.
- The upload package must contain no report API request, placeholder API domain, online-analysis button, or network-upload privacy copy.
- Existing manual schedules, records, photos, and privacy acceptance must survive the v1-to-v2 migration.

## Review Focus

- Loading valid v1 state with a free-text medication string preserves it as editable legacy notes and creates no reminder.
- Opening Today and Schedule repeatedly on one date creates exactly one reminder per medication plan.
- Editing or deleting a plan never rewrites or duplicates a completed same-day reminder.
- Invalid names, times, or relation values cannot be saved.
- The release ZIP contains no report-analysis API, placeholder domain, or online-processing copy.

---

### Task 1: Structured medication data and state migration

**Files:**
- Modify: `miniprogram/types/domain.ts`
- Modify: `miniprogram/domain/profile.ts`
- Modify: `miniprogram/domain/profile.test.ts`
- Modify: `miniprogram/storage/app-state.ts`
- Modify: `miniprogram/storage/app-state.test.ts`

**Interfaces:**
- Produces: `MedicationRelation`, `MedicationPlan`, v2 `PersonalProfile`, `AppStateV2`, and `loadAppState()` migration behavior.
- Consumes: existing v1 storage key and record/schedule shapes.

- [ ] Write failing tests for medication validation and v1 state migration, including invalid time/relation and preserved legacy notes.
- [ ] Run the focused tests and confirm failures are caused by missing v2 behavior.
- [ ] Implement the new types, profile validation, v2 state shape, and safe v1 migration.
- [ ] Run focused tests and then the full Vitest suite.
- [ ] Commit the task.

### Task 2: Idempotent daily schedule synchronization

**Files:**
- Modify: `miniprogram/domain/schedule.ts`
- Modify: `miniprogram/domain/schedule.test.ts`
- Modify: `miniprogram/pages/today/index.ts`
- Modify: `miniprogram/pages/schedule/index.ts`
- Modify: `miniprogram/pages/schedule/index.wxml`

**Interfaces:**
- Consumes: `MedicationPlan[]`, `ScheduleItem.sourceMedicationId`, v2 app state.
- Produces: `syncDailySchedule(items, date, plans)` and page persistence on `onShow`.

- [ ] Write failing tests for daily generation, idempotency, plan updates, completed-history preservation, and plan deletion.
- [ ] Run focused tests and confirm the new synchronization tests fail.
- [ ] Implement `syncDailySchedule`, medication relation labels, and stable automatic IDs.
- [ ] Integrate Today and Schedule pages; generated medication items can be completed but not edited/deleted in Schedule.
- [ ] Run focused tests and mini-program type checking.
- [ ] Commit the task.

### Task 3: Medication editor and baby size comparison UI

**Files:**
- Modify: `miniprogram/domain/profile.ts`
- Modify: `miniprogram/domain/profile.test.ts`
- Modify: `miniprogram/pages/onboarding/index.ts`
- Modify: `miniprogram/pages/onboarding/index.wxml`
- Modify: `miniprogram/pages/onboarding/index.wxss`
- Modify: `miniprogram/pages/profile/index.ts`
- Modify: `miniprogram/pages/profile/index.wxml`
- Modify: `miniprogram/pages/profile/index.wxss`
- Modify: `miniprogram/pages/today/index.wxml`
- Modify: `miniprogram/pages/today/index.wxss`

**Interfaces:**
- Consumes: v2 profile and `syncDailySchedule`.
- Produces: add/edit/remove medication-plan controls and `PregnancyOverview.babySizeComparison`.

- [ ] Write failing tests for representative baby-size comparison ranges and fixed disclaimer copy.
- [ ] Run focused tests and verify they fail before implementation.
- [ ] Implement comparison data and add it to `buildPregnancyOverview`.
- [ ] Replace both free-text medication editors with repeatable name/time/relation rows plus editable legacy notes.
- [ ] Synchronize today's schedule after onboarding/profile save and render the comparison card.
- [ ] Run focused tests and mini-program type checking.
- [ ] Commit the task.

### Task 4: Isolate report analysis and rebuild the review package

**Files:**
- Create: `future-features/report-analysis/README.md`
- Create: `future-features/report-analysis/report-api.ts`
- Modify: `miniprogram/pages/record-editor/index.ts`
- Modify: `miniprogram/pages/record-editor/index.wxml`
- Modify: `miniprogram/pages/privacy/index.wxml`
- Delete: `miniprogram/services/report-api.ts`
- Delete: `miniprogram/config.ts`
- Modify: `scripts/validate-miniprogram.mjs`

**Interfaces:**
- Produces: local-only review package and a repository-level recovery reference.

- [ ] Add a failing static validator check for report API paths, placeholder domain, online-analysis copy, and `wx.request` inside `miniprogram/`.
- [ ] Run validation and verify it fails against the current implementation.
- [ ] Move the recoverable API client outside `miniprogram/`, remove online parsing UI/logic, and update privacy copy.
- [ ] Run validation, type checking, all tests, production build, and package-size checks.
- [ ] Rebuild `release/pregnancy-assistant-miniprogram-source.zip`, extract it, and validate the extracted package.
- [ ] Commit the task.
