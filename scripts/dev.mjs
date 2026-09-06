import { createServer } from 'vite';
import { createApiServer } from '../server/index.mjs';

try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const api = createApiServer();
const port = Number(process.env.API_PORT || 8787);
api.on('error', error => { console.error(`API startup failed: ${error.message}`); process.exit(1); });
api.listen(port, '127.0.0.1', async () => {
  try {
    const vite = await createServer({ server: { host: '127.0.0.1', proxy: { '/api': `http://127.0.0.1:${port}` } } });
    await vite.listen();
    vite.printUrls();
    console.log(`Local API: http://127.0.0.1:${port}`);
    const close = async () => { await vite.close(); api.close(); api.closeAllConnections(); process.exit(0); };
    process.on('SIGINT', close);
    process.on('SIGTERM', close);
  } catch (error) { console.error(error.message); api.close(); process.exit(1); }
});
