const SUPPORTED = ["jpg", "jpeg", "png", "webp"];

function extension(path: string): string { return path.split(".").pop()?.toLowerCase() || ""; }
function info(path: string): Promise<any> { return new Promise((resolve, reject) => wx.getFileInfo({ filePath: path, success: resolve, fail: reject })); }
function compress(path: string): Promise<string> { return new Promise((resolve, reject) => wx.compressImage({ src: path, quality: 72, compressedWidth: 1600, success: (result: any) => resolve(result.tempFilePath), fail: reject })); }
function persist(path: string): Promise<string> { return new Promise((resolve, reject) => wx.saveFile({ tempFilePath: path, success: (result: any) => resolve(result.savedFilePath), fail: reject })); }

export async function chooseAndSavePhoto(): Promise<string> {
  const selected: any = await new Promise((resolve, reject) => wx.chooseMedia({ count: 1, mediaType: ["image"], sourceType: ["album", "camera"], success: resolve, fail: reject }));
  let path = selected.tempFiles[0].tempFilePath;
  if (!SUPPORTED.includes(extension(path))) throw new Error("仅支持 JPG、PNG 或 WebP 图片。");
  let metadata = await info(path);
  if (metadata.size > 6 * 1024 * 1024) { path = await compress(path); metadata = await info(path); }
  if (metadata.size > 6 * 1024 * 1024) throw new Error("图片压缩后仍超过 6 MB，请重新选择。");
  return persist(path);
}

export function removeSavedFile(path: string): Promise<void> {
  if (!path) return Promise.resolve();
  return new Promise((resolve) => wx.removeSavedFile({ filePath: path, complete: resolve }));
}

export function readImageDataUrl(path: string): Promise<string> {
  const ext = extension(path) === "jpg" ? "jpeg" : extension(path);
  return new Promise((resolve, reject) => wx.getFileSystemManager().readFile({ filePath: path, encoding: "base64", success: (result: any) => resolve(`data:image/${ext};base64,${result.data}`), fail: reject }));
}
