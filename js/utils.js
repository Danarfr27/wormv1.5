// fungsi utilitas

export function detectCodeBlocks(text) {
    const safeText = typeof text === 'string' ? text : '';
    let result = [];
    const codeBlockPattern = /```([a-zA-Z0-9_]+)?\s*([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockPattern.exec(safeText)) !== null) {
        if (match.index > lastIndex) {
            result.push({
                type: 'text',
                content: safeText.substring(lastIndex, match.index)
            });
        }
        const language = match[1] || 'text';
        const codeContent = match[2].trim();

        result.push({
            type: 'code',
            language: language,
            content: codeContent
        });
        lastIndex = codeBlockPattern.lastIndex;
    }

    if (lastIndex < safeText.length) {
        result.push({
            type: 'text',
            content: safeText.substring(lastIndex)
        });
    }

    return result.length > 0 ? result : [{ type: 'text', content: safeText }];
}

export function copyToClipboard(text, message) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        // We might need a way to show notification from here, or return success
        return successful;
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
}

export function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeUploadText(text) {
    return String(text || '')
        .replace(/\u0000/g, '')
        .replace(/\r\n/g, '\n')
        .trim();
}

function isTextLikeUpload(file) {
    const filename = (file && file.name) || '';
    const mimetype = (file && file.type) || '';
    const ext = filename.toLowerCase();
    const mime = mimetype.toLowerCase();
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

export async function parseUploadFileText(file) {
    if (!file) {
        return { text: '', error: 'No file selected' };
    }

    if (!isTextLikeUpload(file)) {
        return { text: '', error: 'Unsupported file type for local parsing' };
    }

    try {
        if (typeof file.text === 'function') {
            const text = await file.text();
            return { text: normalizeUploadText(text), error: '' };
        }

        if (typeof FileReader !== 'undefined') {
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
            return { text: normalizeUploadText(text), error: '' };
        }

        return { text: '', error: 'File reading API is not available in this environment' };
    } catch (error) {
        return { text: '', error: error && error.message ? error.message : 'Failed to read file' };
    }
}

function normalizeText(text) {
    return typeof text === 'string' ? text.trim() : '';
}

function extractTextFromObject(obj) {
    if (!obj || typeof obj !== 'object') return '';

    if (typeof obj.text === 'string' && obj.text.trim()) return obj.text.trim();
    if (typeof obj.generatedText === 'string' && obj.generatedText.trim()) return obj.generatedText.trim();
    if (typeof obj.generated_text === 'string' && obj.generated_text.trim()) return obj.generated_text.trim();
    if (typeof obj.output_text === 'string' && obj.output_text.trim()) return obj.output_text.trim();

    if (Array.isArray(obj.parts) && obj.parts.length > 0) {
        return obj.parts.map(extractTextFromObject).filter(Boolean).join(' ').trim();
    }

    if (Array.isArray(obj.output) && obj.output.length > 0) {
        return obj.output.map(extractTextFromObject).filter(Boolean).join(' ').trim();
    }

    if (obj.content) {
        return extractTextFromObject(obj.content);
    }

    if (obj.response) {
        return extractTextFromObject(obj.response);
    }

    return '';
}

export function extractAiReplyText(payload) {
    if (!payload || typeof payload !== 'object') return '';

    if (Array.isArray(payload.candidates) && payload.candidates.length > 0) {
        const candidate = payload.candidates[0];
        const candidateText = extractTextFromObject(candidate);
        if (candidateText) return candidateText;
    }

    const objectText = extractTextFromObject(payload);
    if (objectText) return objectText;

    if (payload.response && typeof payload.response === 'object') {
        return extractAiReplyText(payload.response);
    }

    return '';
}

export function buildFallbackAiReply(userMessage) {
    const cleaned = normalizeText(userMessage);
    if (!cleaned) {
        return 'AI backend sedang sibuk. Coba lagi sebentar lagi.';
    }
    return 'Maaf, AI tidak memberi jawaban. Coba ulang sekali lagi atau cek koneksi API.';
}