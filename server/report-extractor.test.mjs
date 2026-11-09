import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractReport, validateRecordOnlyResult } from './report-extractor.mjs';

const clean = {
  sourceText: '检查项目：头臀长 16 mm', reportTitle: '超声报告', reportDate: '2026-07-09',
  items: [{ name: '头臀长', value: '16', unit: 'mm', sourceText: '头臀长 16 mm' }],
  summary: '报告记录了检查日期及一项测量值。',
  terms: [{ term: '头臀长', definition: '胚胎或胎儿头顶到臀部的长度名称。' }],
  limitations: '仅用于文字整理，请以原报告和医生解释为准。',
};

test('accepts neutral record-only extraction and rejects medical judgement', () => {
  assert.deepEqual(validateRecordOnlyResult(clean), clean);
  assert.throws(() => validateRecordOnlyResult({ ...clean, summary: '该数值异常，建议尽快就医。' }), /超出文字整理范围/);
  assert.throws(() => validateRecordOnlyResult({ ...clean, terms: [{ term: '头臀长', definition: '偏低，存在发育风险。' }] }), /超出文字整理范围/);
});

test('redacts phone and identity numbers from extracted source text', async () => {
  const withPii = { ...clean, sourceText: '联系电话 13812345678 身份证 310101199001011234' };
  const fetchImpl = async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(withPii) }] }] }) });
  const result = await extractReport({ mode: 'record_only', imageDataUrl: 'data:image/jpeg;base64,/9j/' }, { apiKey: 'test', fetchImpl });
  assert.doesNotMatch(result.sourceText, /13812345678|310101199001011234/);
});

test('extractReport returns strict model output without storing images', async () => {
  let request;
  const fetchImpl = async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(clean) }] }] }) };
  };
  const result = await extractReport({ mode: 'record_only', imageDataUrl: 'data:image/jpeg;base64,/9j/' }, { apiKey: 'test', fetchImpl });
  assert.equal(result.reportTitle, '超声报告');
  assert.equal(request.store, false);
});
