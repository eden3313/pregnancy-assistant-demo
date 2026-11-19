import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractMedication, validateMedicationResult } from './medication-extractor.mjs';
import { createApiServer } from './index.mjs';

const input = { imageDataUrl: 'data:image/jpeg;base64,/9j/' };
const extracted = { sourceText: '示例药物\n早餐前30分钟', name: '示例药物', timingText: '早餐前30分钟' };

test('medication extraction requires verbatim evidence, not inferred timing', () => {
  assert.deepEqual(validateMedicationResult(extracted), extracted);
  assert.throws(() => validateMedicationResult({ ...extracted, timingText: '晚餐后30分钟' }), /原文依据/);
  assert.throws(() => validateMedicationResult({ ...extracted, diagnosis: '正常' }), /格式无效/);
  assert.deepEqual(validateMedicationResult({ sourceText: '模糊照片', name: '', timingText: '' }), { sourceText: '模糊照片', name: '', timingText: '' });
});

test('provider request uses strict image extraction and does not persist response', async () => {
  let request;
  const fetchImpl = async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(extracted) }] }] }) };
  };
  assert.deepEqual(await extractMedication(input, { apiKey: 'test', fetchImpl }), extracted);
  assert.equal(request.store, false);
  assert.equal(request.text.format.strict, true);
  assert.equal(request.input[0].content[1].image_url, input.imageDataUrl);
  await assert.rejects(extractMedication(input, { apiKey: '', fetchImpl }), /尚未配置/);
  await assert.rejects(extractMedication(input, { apiKey: 'test', fetchImpl: async () => ({ ok: false, status: 429 }) }), /配额/);
  await assert.rejects(extractMedication(input, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ status: 'incomplete', output: [] }) }) }), /未完成/);
});

test('medication API validates image, responds as JSON, and bounds request volume', async () => {
  let calls = 0;
  const server = createApiServer({ extractMedicationImpl: async () => { calls++; return extracted; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/extract-medication`;
  const post = value => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) });
  try {
    assert.equal((await post({})).status, 400);
    const response = await post(input);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), extracted);
    assert.equal(calls, 1);
    for (let i = 0; i < 28; i++) assert.equal((await post(input)).status, 200);
    assert.equal((await post(input)).status, 429);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
