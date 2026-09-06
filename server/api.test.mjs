import { test } from 'node:test';
import assert from 'node:assert/strict';
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
    const foreign = await fetch(base + '/api/parse-report', { method: 'POST', headers: { Origin: 'https://example.com' } });
    assert.equal(foreign.status, 403);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
