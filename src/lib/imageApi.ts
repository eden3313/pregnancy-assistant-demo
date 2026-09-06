export type ImageKind = "report" | "medicine";
export interface ImageResult {
  kind: ImageKind;
  mode: "live" | "demo";
  summary: string;
  indicators: { name: string; value: number | null; unit: string; reference: string; flag: string }[];
  medicines: { name: string; ingredients: string; strength: string; labelDirections: string; warnings: string }[];
  notes: string[];
  questions: string[];
}

export function readImage(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return Promise.reject(new Error("请选择 JPG、PNG 或 WebP 图片。"));
  if (file.size > 6 * 1024 * 1024) return Promise.reject(new Error("图片不能超过 6 MB。"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("无法读取图片，请重新选择。"));
    reader.readAsDataURL(file);
  });
}

export async function parseImageRequest(input: { kind: ImageKind; imageDataUrl?: string; demo?: boolean }, onStatus: (message: string) => void, signal: AbortSignal): Promise<ImageResult> {
  const response = await fetch("/api/parse-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "本地后端不可用，请确认服务已启动。");
  }
  if (!response.body) throw new Error("后端未返回解析结果。");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result: ImageResult | undefined;
  const processLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "status") onStatus(event.message);
    if (event.type === "result") result = event.result;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split("\n");
      pending = lines.pop() || "";
      lines.forEach(processLine);
      if (done) break;
    }
    processLine(pending);
  } finally { await reader.cancel(); reader.releaseLock(); }
  if (!result) throw new Error("解析连接中断，请重试。");
  return result;
}
