import { API_BASE_URL } from "../config";

export function aiConfigured(): boolean { return /^https:\/\/[^/]+$/.test(API_BASE_URL); }

export async function recognizeImage(filePath: string, kind: "medicine" | "report", onTask?: (task: any) => void): Promise<any> {
  if (!aiConfigured()) throw new Error("尚未配置正式识别服务域名，请联系开发者。");
  const base64: string = await new Promise((resolve, reject) => wx.getFileSystemManager().readFile({ filePath, encoding: "base64", success: (result: any) => resolve(result.data), fail: reject }));
  if (base64.length > 8 * 1024 * 1024) throw new Error("图片不能超过6MB。");
  const mime = base64.startsWith("iVBOR") ? "png" : base64.startsWith("/9j/") ? "jpeg" : base64.startsWith("UklGR") ? "webp" : "";
  if (!mime) throw new Error("仅支持JPG、PNG或WebP图片。");
  return new Promise((resolve, reject) => { const task = wx.request({
    url: `${API_BASE_URL}/api/${kind === "medicine" ? "extract-medication" : "extract-report"}`,
    method: "POST", timeout: 100000, header: { "content-type": "application/json" },
    data: { imageDataUrl: `data:image/${mime};base64,${base64}`, ...(kind === "report" ? { mode: "record_only" } : {}) },
    success: (response: any) => {
      if (response.statusCode !== 200) return reject(new Error(response.data?.error || "识别失败，请重试。"));
      const result = response.data;
      if (!result || typeof result.sourceText !== "string" || result.sourceText.length > 6000 ||
          (kind === "medicine" && (typeof result.name !== "string" || typeof result.timingText !== "string"))) return reject(new Error("识别结果不完整，请重试。"));
      resolve(result);
    },
    fail: () => reject(new Error("识别请求失败，请检查网络或稍后重试。")),
  }); onTask?.(task); });
}
