import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInput, parseImage } from './parser.mjs';

const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
test('rejects unsupported images and invalid kinds', () => {
  assert.throws(() => validateInput({ kind: 'report', imageDataUrl: 'data:text/html;base64,YQ==' }));
  assert.throws(() => validateInput({ kind: 'other', imageDataUrl }));
});
test('missing credentials do not silently produce demo results', async () => {
  await assert.rejects(parseImage({ kind: 'report', imageDataUrl }, { apiKey: '' }), /OPENAI_API_KEY/);
});
test('explicit demo supports both kinds', async () => {
  for (const kind of ['report', 'medicine']) {
    const result = await parseImage({ kind, demo: true }, { apiKey: '' });
    assert.equal(result.mode, 'demo');
    assert.equal(result.kind, kind);
    assert.ok(kind === 'report' ? result.indicators.length : result.medicines.length);
    if (kind === 'report') {
      assert.match(result.summary, /胚芽长 16 mm/);
      assert.deepEqual(result.conclusions, ['宫内妊娠（57天左右）', '孕囊旁积液可能']);
      assert.equal(result.gestationalWeek, 8);
    }
  }
});
test('real request sends image and preserves missing values', async () => {
  const result = await parseImage({ kind: 'report', imageDataUrl }, {
    apiKey: 'test-key',
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.input[0].content[1].image_url, imageDataUrl);
      assert.equal(body.store, false);
      return new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ kind: 'report', summary: '未读清', indicators: [], medicines: [], notes: ['请重新拍摄'], questions: [] }) }] }] }));
    },
  });
  assert.deepEqual(result.indicators, []);
  assert.equal(result.mode, 'live');
});
