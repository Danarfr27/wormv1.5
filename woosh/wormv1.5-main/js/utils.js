// fungsi utilitas

export function detectCodeBlocks(text) {
    let result = [];
    let remainingText = text;
    const codeBlockPattern = /```([a-zA-Z0-9_]+)?\s*([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
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

    if (lastIndex < text.length) {
        result.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return result.length > 0 ? result : [{ type: 'text', content: text }];
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

export function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
