import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { parseImage, validateInput } from './parser.mjs';

export function createApiServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    if (req.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)) return send(403, { error: '仅允许本地页面访问。' });
    if (req.method === 'GET' && req.url === '/api/health') return send(200, { ok: true, configured: Boolean(process.env.OPENAI_API_KEY) });
    if (req.method !== 'POST' || req.url !== '/api/parse-report') return send(404, { error: '接口不存在。' });
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
      validateInput(input);
    } catch (error) { return send(400, { error: error instanceof SyntaxError ? '请求格式错误。' : error.message }); }
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
  const server = createApiServer();
  server.listen(Number(process.env.API_PORT || 8787), '127.0.0.1', () => console.log('Local API: http://127.0.0.1:' + server.address().port));
}
