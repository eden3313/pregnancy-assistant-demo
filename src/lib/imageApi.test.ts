import { afterEach, expect, it, vi } from "vitest";
import { parseImageRequest, readImage } from "./imageApi";

afterEach(() => vi.unstubAllGlobals());
it("rejects unsupported files before upload", async () => {
  await expect(readImage(new File(["text"], "test.txt", { type: "text/plain" }))).rejects.toThrow("JPG");
});
it("reads fragmented status and result events", async () => {
  const result = { kind: "report", mode: "live", indicators: [] };
  const wire = new TextEncoder().encode(JSON.stringify({ type: "status", message: "正在识别" }) + "\n" + JSON.stringify({ type: "result", result }) + "\n");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream({ start(controller) { for (let i = 0; i < wire.length; i += 7) controller.enqueue(wire.slice(i, i + 7)); controller.close(); } }))));
  const onStatus = vi.fn();
  expect(await parseImageRequest({ kind: "report" }, onStatus, new AbortController().signal)).toEqual(result);
  expect(onStatus).toHaveBeenCalledWith("正在识别");
});
it("surfaces server errors without a fabricated result", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response('{"type":"error","message":"密钥未配置"}\n')));
  await expect(parseImageRequest({ kind: "report" }, () => {}, new AbortController().signal)).rejects.toThrow("密钥未配置");
});
