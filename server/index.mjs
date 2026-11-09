import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseImage, validateInput } from './parser.mjs';
import { extractReport, validateExtractInput } from './report-extractor.mjs';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  const forwardedProto = req.headers['x-forwarded-proto']?.split(',')[0].trim();
  const forwardedHost = req.headers['x-forwarded-host']?.split(',')[0].trim();
  const host = forwardedHost || req.headers.host;
  return Boolean(host && origin === `${forwardedProto || 'http'}://${host}`);
}

async function serveStatic(req, res, staticDir) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const root = path.resolve(staticDir);
  const candidate = path.resolve(root, `.${requestedPath}`);
  const insideRoot = candidate === root || candidate.startsWith(root + path.sep);
  if (!insideRoot) return false;

  let filePath = candidate;
  try {
    const body = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
      'Cache-Control': requestedPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
  }

  if (path.extname(requestedPath)) return false;
  filePath = path.join(root, 'index.html');
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return false;
  }
}

export function createApiServer({ staticDir } = {}) {
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    if (!isAllowedOrigin(req)) return send(403, { error: '仅允许同域页面访问。' });
    if (req.method === 'GET' && staticDir && !req.url.startsWith('/api/')) {
      if (await serveStatic(req, res, staticDir)) return;
      return send(404, { error: '页面不存在。' });
    }
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET' && req.url === '/api/health') return send(200, { ok: true, configured: Boolean(process.env.OPENAI_API_KEY) });
    const isLegacyParse = req.method === 'POST' && req.url === '/api/parse-report';
    const isRecordExtract = req.method === 'POST' && req.url === '/api/extract-report';
    if (!isLegacyParse && !isRecordExtract) return send(404, { error: '接口不存在。' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: '请求必须为 JSON。' });
    let input;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 9 * 1024 * 1024) { send(413, { error: '图片不能超过 6 MB。' }); return; }
        chunks.push(chunk);
      }
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (isRecordExtract) validateExtractInput(input); else validateInput(input);
    } catch (error) { return send(400, { error: error instanceof SyntaxError ? '请求格式错误。' : error.message }); }
    if (isRecordExtract) {
      try { return send(200, await extractReport(input)); }
      catch (error) { return send(502, { error: ['TimeoutError', 'AbortError'].includes(error.name) ? '解析超时，请重试。' : error.message === 'fetch failed' ? '无法连接文字整理服务。' : error.message }); }
    }
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    const emit = (event) => { if (!res.destroyed) res.write(JSON.stringify(event) + '\n'); };
    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    emit({ type: 'status', stage: 'received', message: input.demo ? '已选择演示样例' : '后端已接收图片' });
    emit({ type: 'status', stage: 'parsing', message: input.demo ? '正在读取演示样例' : '正在识别图片并生成整理结果' });
    try {
      const result = await parseImage(input, { signal: controller.signal });
      emit({ type: 'result', result });
    } catch (error) {
      emit({ type: 'error', message: ['TimeoutError', 'AbortError'].includes(error.name) ? '解析超时或已取消，请重试。' : error.message === 'fetch failed' ? '无法连接解析服务，请检查后端网络连接。' : error.message });
    }
    res.end();
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const production = process.env.NODE_ENV === 'production';
  const server = createApiServer({ staticDir: production ? path.resolve('dist') : undefined });
  const port = Number(process.env.PORT || process.env.API_PORT || 8787);
  const host = production ? '0.0.0.0' : '127.0.0.1';
  server.listen(port, host, () => console.log(`${production ? 'Web app' : 'Local API'}: http://${host}:${server.address().port}`));
}
