import { API_BASE_URL } from "../config";
import type { ExtractedReportDraft } from "../types/domain";
import { readImageDataUrl } from "./local-files";

function requestReport(imageDataUrl: string): Promise<ExtractedReportDraft> {
  return new Promise((resolve, reject) => wx.request({
    url: `${API_BASE_URL}/api/extract-report`, method: "POST", timeout: 90000,
    header: { "Content-Type": "application/json" }, data: { mode: "record_only", imageDataUrl },
    success: (response: any) => response.statusCode >= 200 && response.statusCode < 300 ? resolve(response.data) : reject(new Error(response.data?.error || `服务返回 ${response.statusCode}`)),
    fail: (error: any) => reject(new Error(error.errMsg?.includes("timeout") ? "解析超时，请重试。" : "无法连接文字整理服务。")),
  }));
}

export async function extractReportForRecord(path: string): Promise<ExtractedReportDraft> {
  if (API_BASE_URL.includes("replace-with")) throw new Error("请先在 config.ts 配置线上 API 域名。");
  return requestReport(await readImageDataUrl(path));
}
