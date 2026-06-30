import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromBuffer } from '../api/upload_file.js';

test('extracts text from simple text files', async () => {
  const text = 'Halo dunia\nIni adalah file uji.';
  const buffer = Buffer.from(text, 'utf8');
  const result = await extractTextFromBuffer(buffer, 'notes.txt', 'text/plain');
  assert.equal(result, text);
});

test('rejects unsupported file types', async () => {
  const buffer = Buffer.from('abc', 'utf8');
  await assert.rejects(() => extractTextFromBuffer(buffer, 'archive.bin', 'application/octet-stream'), /Unsupported file type/);
});
