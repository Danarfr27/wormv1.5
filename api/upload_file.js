import { Buffer } from 'node:buffer';

let mammoth = null;
let pdfParse = null;

try {
  mammoth = (await import('mammoth')).default;
} catch (e) {
  mammoth = null;
}

try {
  pdfParse = (await import('pdf-parse')).default;
} catch (e) {
  pdfParse = null;
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function isTextLike(filename, mimetype) {
  const ext = (filename || '').toLowerCase();
  const mime = (mimetype || '').toLowerCase();
  return [
    ext.endsWith('.txt'),
    ext.endsWith('.md'),
    ext.endsWith('.csv'),
    ext.endsWith('.json'),
    ext.endsWith('.xml'),
    ext.endsWith('.html'),
    ext.endsWith('.htm'),
    mime.startsWith('text/'),
    mime === 'application/json',
    mime === 'application/xml',
    mime === 'application/javascript',
    mime === 'application/x-javascript'
  ].some(Boolean);
}

export async function extractTextFromBuffer(buffer, filename = 'upload.bin', mimetype = '') {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer || '');
  }

  const ext = (filename || '').toLowerCase();
  const mime = (mimetype || '').toLowerCase();

  if (isTextLike(filename, mimetype)) {
    return normalizeText(buffer.toString('utf8'));
  }

  if ((ext.endsWith('.docx') || mime.includes('wordprocessingml')) && mammoth) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return normalizeText(result.value);
    } catch (error) {
      console.warn('DOCX parsing failed', error);
      throw new Error('Gagal membaca file DOCX. Coba kirim file teks atau DOCX yang lebih sederhana.');
    }
  }

  if ((ext.endsWith('.pdf') || mime === 'application/pdf') && pdfParse) {
    try {
      const data = await pdfParse(buffer);
      return normalizeText(data.text);
    } catch (error) {
      console.warn('PDF parsing failed', error);
      throw new Error('Gagal membaca file PDF. Coba kirim file teks atau DOCX.');
    }
  }

  if (ext.endsWith('.doc') || mime === 'application/msword') {
    throw new Error('File .doc legacy belum didukung. Silakan unggah .docx, PDF, atau file teks.');
  }

  throw new Error('Unsupported file type');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename = 'upload.bin', mimetype = '', contentBase64 = '' } = req.body || {};
    if (!contentBase64) {
      return res.status(400).json({ error: 'contentBase64 is required' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    const text = await extractTextFromBuffer(buffer, filename, mimetype);

    return res.status(200).json({ ok: true, text, filename });
  } catch (error) {
    console.error('Upload parse error', error);
    return res.status(400).json({ ok: false, error: error.message || 'Failed to parse file' });
  }
}
