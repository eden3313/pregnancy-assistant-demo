import type { PersonalProfile, PersonalRecord, ScheduleItem } from "../types/domain";

export const STATE_KEY = "pregnancy-assistant-state-v1";
export interface AppStateV1 { version: 1; privacyAcceptedAt: string; profile: PersonalProfile | null; schedule: ScheduleItem[]; records: PersonalRecord[]; }
export interface KeyValueStorage { get(key: string): string | undefined; set(key: string, value: string): void; remove(key: string): void; }
export const createEmptyState = (): AppStateV1 => ({ version: 1, privacyAcceptedAt: "", profile: null, schedule: [], records: [] });

function isState(value: unknown): value is AppStateV1 {
  const state = value as AppStateV1;
  return Boolean(state && state.version === 1 && Array.isArray(state.schedule) && Array.isArray(state.records));
}
export function loadAppState(storage: KeyValueStorage): AppStateV1 {
  try { const raw = storage.get(STATE_KEY); if (!raw) return createEmptyState(); const parsed = JSON.parse(raw); return isState(parsed) ? parsed : createEmptyState(); }
  catch { return createEmptyState(); }
}
export function saveAppState(storage: KeyValueStorage, state: AppStateV1): void { storage.set(STATE_KEY, JSON.stringify(state)); }
export function clearAppState(storage: KeyValueStorage): void { storage.remove(STATE_KEY); }
