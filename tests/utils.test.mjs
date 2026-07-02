import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackAiReply, detectCodeBlocks, extractAiReplyText, parseUploadFileText } from '../js/utils.js';

test('detectCodeBlocks handles null or undefined input without throwing', () => {
  assert.doesNotThrow(() => detectCodeBlocks(null));
  assert.doesNotThrow(() => detectCodeBlocks(undefined));
  assert.deepEqual(detectCodeBlocks(null), [{ type: 'text', content: '' }]);
  assert.deepEqual(detectCodeBlocks(undefined), [{ type: 'text', content: '' }]);
});

test('extractAiReplyText reads common AI response payloads', () => {
  assert.equal(
    extractAiReplyText({ candidates: [{ content: { parts: [{ text: 'Halo dari bot' }] } }] }),
    'Halo dari bot'
  );
  assert.equal(extractAiReplyText({ text: 'Balasan langsung' }), 'Balasan langsung');
  assert.equal(extractAiReplyText({ reply: 'Balasan reply' }), 'Balasan reply');
  assert.equal(extractAiReplyText({ message: 'Balasan message' }), 'Balasan message');
  assert.equal(extractAiReplyText({}), '');
});

test('buildFallbackAiReply creates a readable fallback message', () => {
  assert.match(buildFallbackAiReply('halo'), /halo/);
  assert.match(buildFallbackAiReply(''), /Backend AI/);
});

test('parseUploadFileText reads text files locally', async () => {
  const file = {
    name: 'notes.txt',
    type: 'text/plain',
    text: async () => 'Halo upload'
  };

  const result = await parseUploadFileText(file);
  assert.equal(result.text, 'Halo upload');
  assert.equal(result.error, '');
});
