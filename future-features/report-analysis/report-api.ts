// Recovery reference only. This file is intentionally outside miniprogramRoot.
import type { ExtractedReportDraft } from "../../miniprogram/types/domain";

function readImageDataUrl(path: string): Promise<string> {
  const extension = path.split(".").pop()?.toLowerCase() === "jpg" ? "jpeg" : path.split(".").pop()?.toLowerCase();
  return new Promise((resolve, reject) => wx.getFileSystemManager().readFile({
    filePath: path,
    encoding: "base64",
    success: (result: any) => resolve(`data:image/${extension};base64,${result.data}`),
    fail: reject,
  }));
}

export async function extractReportForRecord(path: string, apiBaseUrl: string): Promise<ExtractedReportDraft> {
  const imageDataUrl = await readImageDataUrl(path);
  return new Promise((resolve, reject) => wx.request({
    url: `${apiBaseUrl}/api/extract-report`,
    method: "POST",
    timeout: 90000,
    header: { "Content-Type": "application/json" },
    data: { mode: "record_only", imageDataUrl },
    success: (response: any) => response.statusCode >= 200 && response.statusCode < 300 ? resolve(response.data) : reject(new Error(response.data?.error || `服务返回 ${response.statusCode}`)),
    fail: () => reject(new Error("无法连接文字整理服务。")),
  }));
}
