import type { PersonalRecord } from "../types/domain";

export type RecordDraft = Pick<PersonalRecord, "date" | "title" | "body" | "tags" | "photoPath"> & Partial<Pick<PersonalRecord, "extracted">>;
export function validateRecord(value: RecordDraft): string {
  if (!value.title.trim()) return "请填写记录标题。";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return "请选择记录日期。";
  if (value.title.length > 80 || value.body.length > 6000) return "记录内容过长。";
  return "";
}
export function createRecord(value: RecordDraft, id = `${Date.now()}-${Math.random().toString(16).slice(2)}`): PersonalRecord {
  const error = validateRecord(value); if (error) throw new Error(error);
  const now = new Date().toISOString();
  return { ...value, title: value.title.trim(), id, createdAt: now, updatedAt: now };
}
export function updateRecord(records: PersonalRecord[], record: PersonalRecord): PersonalRecord[] {
  return records.map((item) => item.id === record.id ? { ...record, updatedAt: new Date().toISOString() } : item);
}
export function deleteRecord(records: PersonalRecord[], id: string): { records: PersonalRecord[]; deletedPhotoPath: string } {
  const target = records.find((record) => record.id === id);
  return { records: records.filter((record) => record.id !== id), deletedPhotoPath: target?.photoPath || "" };
}
