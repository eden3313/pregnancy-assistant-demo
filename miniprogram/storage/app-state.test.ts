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
});
