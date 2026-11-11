import { describe, expect, it } from "vitest";
import { createEmptyState, loadAppState, saveAppState, type KeyValueStorage } from "./app-state";

function memoryStorage(initial?: string): KeyValueStorage {
  let value = initial;
  return { get: () => value, set: (_key, next) => { value = next; }, remove: () => { value = undefined; } };
}

describe("mini program local state", () => {
  it("recovers from malformed or unknown state", () => {
    expect(loadAppState(memoryStorage("{"))).toEqual(createEmptyState());
    expect(loadAppState(memoryStorage(JSON.stringify({ version: 99 })))).toEqual(createEmptyState());
  });

  it("round trips valid state", () => {
    const storage = memoryStorage();
    const state = { ...createEmptyState(), privacyAcceptedAt: "2026-11-09T00:00:00.000Z" };
    saveAppState(storage, state);
    expect(loadAppState(storage)).toEqual(state);
  });

  it("migrates version 1 medication text without generating structured plans", () => {
    const v1 = {
      version: 1,
      privacyAcceptedAt: "2026-11-09T00:00:00.000Z",
      profile: { lastPeriod: "2026-08-01", babies: "single", risk: "no", riskDetails: "", medications: "叶酸，每天一次" },
      schedule: [{ id: "breakfast-2026-11-09", date: "2026-11-09", time: "07:30", type: "meal", title: "早餐", note: "", completed: true }],
      records: [{ id: "r1", date: "2026-11-09", title: "记录", body: "正文", tags: [], photoPath: "", createdAt: "2026-11-09", updatedAt: "2026-11-09" }],
    };
    const migrated = loadAppState(memoryStorage(JSON.stringify(v1)));
    expect(migrated.version).toBe(2);
    expect(migrated.profile?.medications).toEqual([]);
    expect(migrated.profile?.legacyMedicationNotes).toBe("叶酸，每天一次");
    expect(migrated.schedule).toEqual(v1.schedule);
    expect(migrated.records).toEqual(v1.records);
    expect(migrated.privacyAcceptedAt).toBe(v1.privacyAcceptedAt);
  });
});
