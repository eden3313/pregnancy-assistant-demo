import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../config", () => ({ API_BASE_URL: "https://api.example.com" }));
import { recognizeImage } from "./image-ai";

afterEach(() => vi.unstubAllGlobals());
describe("mini program image API", () => {
  it("sends only the selected image to the correct backend and exposes cancellation", async () => {
    const task = { abort: vi.fn() };
    const result = { sourceText: "样例药 早餐前30分钟", name: "样例药", timingText: "早餐前30分钟" };
    const request = vi.fn(options => { options.success({ statusCode: 200, data: result }); return task; });
    const readFile = vi.fn(options => options.success({ data: "/9j/" }));
    vi.stubGlobal("wx", { getFileSystemManager: () => ({ readFile }), request });
    const onTask = vi.fn();
    expect(await recognizeImage("local.jpg", "medicine", onTask)).toEqual(result);
    expect(request.mock.calls[0][0]).toMatchObject({ url: "https://api.example.com/api/extract-medication", data: { imageDataUrl: "data:image/jpeg;base64,/9j/" } });
    expect(onTask).toHaveBeenCalledWith(task);
    expect(JSON.stringify(request.mock.calls)).not.toContain("OPENAI_API_KEY");
  });
  it("rejects backend failures without substituting demo data", async () => {
    vi.stubGlobal("wx", { getFileSystemManager: () => ({ readFile: (o: any) => o.success({ data: "/9j/" }) }), request: (o: any) => { o.success({ statusCode: 502, data: { error: "AI暂不可用" } }); } });
    await expect(recognizeImage("local.jpg", "report")).rejects.toThrow("AI暂不可用");
  });
});
