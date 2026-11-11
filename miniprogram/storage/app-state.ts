import type { PersonalProfile, PersonalRecord, ScheduleItem } from "../types/domain";

export const STATE_KEY = "pregnancy-assistant-state-v1";
export interface AppStateV2 { version: 2; privacyAcceptedAt: string; profile: PersonalProfile | null; schedule: ScheduleItem[]; records: PersonalRecord[]; }
export interface KeyValueStorage { get(key: string): string | undefined; set(key: string, value: string): void; remove(key: string): void; }
export const createEmptyState = (): AppStateV2 => ({ version: 2, privacyAcceptedAt: "", profile: null, schedule: [], records: [] });

function isStateV2(value: unknown): value is AppStateV2 {
  const state = value as AppStateV2;
  return Boolean(state && state.version === 2 && Array.isArray(state.schedule) && Array.isArray(state.records) &&
    (!state.profile || (Array.isArray(state.profile.medications) && typeof state.profile.legacyMedicationNotes === "string")));
}

function migrateV1(value: any): AppStateV2 | null {
  if (!value || value.version !== 1 || !Array.isArray(value.schedule) || !Array.isArray(value.records)) return null;
  const profile = value.profile && typeof value.profile === "object" ? {
    ...value.profile,
    medications: [],
    legacyMedicationNotes: typeof value.profile.medications === "string" ? value.profile.medications : "",
  } as PersonalProfile : null;
  return { version: 2, privacyAcceptedAt: typeof value.privacyAcceptedAt === "string" ? value.privacyAcceptedAt : "", profile, schedule: value.schedule, records: value.records };
}

export function loadAppState(storage: KeyValueStorage): AppStateV2 {
  try {
    const raw = storage.get(STATE_KEY); if (!raw) return createEmptyState();
    const parsed = JSON.parse(raw);
    if (isStateV2(parsed)) return parsed;
    return migrateV1(parsed) || createEmptyState();
  }
  catch { return createEmptyState(); }
}
export function saveAppState(storage: KeyValueStorage, state: AppStateV2): void { storage.set(STATE_KEY, JSON.stringify(state)); }
export function clearAppState(storage: KeyValueStorage): void { storage.remove(STATE_KEY); }
