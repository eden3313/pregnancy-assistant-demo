import { describe, expect, it } from "vitest";
import { createRecord, deleteRecord, validateRecord } from "./records";

describe("mini program records", () => {
  it("requires a title and preserves an optional local photo", () => {
    expect(validateRecord({ title: "", date: "2026-11-09", body: "", tags: [], photoPath: "" })).toContain("标题");
    const record = createRecord({ title: "早孕超声", date: "2026-11-09", body: "原文待核对", tags: ["产检"], photoPath: "wxfile://report.jpg" }, "record-1");
    expect(record.photoPath).toBe("wxfile://report.jpg");
  });

  it("returns the deleted attachment path", () => {
    const record = createRecord({ title: "记录", date: "2026-11-09", body: "", tags: [], photoPath: "wxfile://report.jpg" }, "record-1");
    expect(deleteRecord([record], "record-1")).toEqual({ records: [], deletedPhotoPath: "wxfile://report.jpg" });
  });
});
