import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApiServer } from './index.mjs';

test('API streams progress and result, rejects bad uploads and foreign origins', async () => {
  const server = createApiServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(base + '/api/parse-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'medicine', demo: true }) });
    const events = (await response.text()).trim().split('\n').map(JSON.parse);
    assert.deepEqual(events.map(item => item.type), ['status', 'status', 'result']);
    assert.equal(events[2].result.kind, 'medicine');
    const bad = await fetch(base + '/api/parse-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(bad.status, 400);
    const badExtract = await fetch(base + '/api/extract-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(badExtract.status, 400);
    const foreign = await fetch(base + '/api/parse-report', { method: 'POST', headers: { Origin: 'https://example.com' } });
    assert.equal(foreign.status, 403);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('production server serves the built app and accepts same-origin API calls', async () => {
  const staticDir = await mkdtemp(path.join(os.tmpdir(), 'pregnancy-assistant-'));
  await mkdir(path.join(staticDir, 'assets'));
  await writeFile(path.join(staticDir, 'index.html'), '<main>孕期助手</main>');
  await writeFile(path.join(staticDir, 'assets', 'app.js'), 'console.log("ready")');
  const server = createApiServer({ staticDir });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(base + '/');
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /^text\/html/);
    assert.match(await home.text(), /孕期助手/);

    const route = await fetch(base + '/profile');
    assert.equal(route.status, 200);
    assert.match(await route.text(), /孕期助手/);

    const asset = await fetch(base + '/assets/app.js');
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /^text\/javascript/);

    const api = await fetch(base + '/api/parse-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ kind: 'report', demo: true }),
    });
    assert.equal(api.status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(staticDir, { recursive: true, force: true });
  }
});
