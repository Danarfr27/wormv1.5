import { PERSONA } from './config.js';

// conversations: array of { id, title, createdAt, messages: [{role, parts:[{text}]}] }
let conversations = [];
let currentConversationId = null;
let currentUsername = 'guest';

// persistence key
function historyKeyFor(user) {
    return `worm_v1.6_conversations::${user || 'guest'}`;
}

export function setUsername(username) {
    currentUsername = username || 'guest';
}

export function getUsername() {
    return currentUsername;
}

export function getConversations() {
    return conversations;
}

export function getCurrentConversation() {
    if (!currentConversationId && conversations.length > 0) currentConversationId = conversations[0].id;
    return conversations.find(c => c.id === currentConversationId) || null;
}

export function createConversation(title, initialMessages = null) {
    const id = String(Date.now());
    const conv = {
        id,
        title: title || `Chat ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        messages: Array.isArray(initialMessages) ? initialMessages : []
    };
    conversations.unshift(conv);
    currentConversationId = id;
    saveHistory();
    return conv;
}

export function switchConversation(id) {
    if (!id) return null;
    const found = conversations.find(c => c.id === id);
    if (found) currentConversationId = id;
    return getCurrentConversation();
}

export function addToConversation(role, text) {
    if (!text) return;
    let conv = getCurrentConversation();
    if (!conv) conv = createConversation();
    conv.messages.push({ role: role, parts: [{ text: text }] });
    // update title/snippet
    try { conv.title = (text || '').replace(/\s+/g,' ').trim().slice(0, 60) || conv.title; } catch(e){}
    saveHistory();
}

export function resetConversation() {
    // create a fresh conversation seeded with persona + greeting
    const personaMsg = { role: 'user', parts: [{ text: PERSONA }] };
    const greetMsg = { role: 'model', parts: [{ text: "Hallo bro, welcome to Tools V1.6 WORM GPT BY Firdhan. Apakah ada yang bisa saya bantu?" }] };
    const conv = createConversation('New chat', [personaMsg, greetMsg]);
    saveHistory();
    return conv;
}

// Ensure a conversation (by id) contains at least one model greeting message
export function ensureConversationHasGreeting(id) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return false;
    const hasModel = conv.messages && conv.messages.some(m => m.role === 'model');
    if (!hasModel) {
        const greetMsg = { role: 'model', parts: [{ text: "" }] };
        conv.messages.push(greetMsg);
        try { saveHistory(); } catch (e) { }
        return true;
    }
    return false;
}

export function saveHistory() {
    try {
        const key = historyKeyFor(currentUsername);
        localStorage.setItem(key, JSON.stringify(conversations));
    } catch (e) { console.warn('Failed saving history', e); }
}

export function loadHistory() {
    try {
        const key = historyKeyFor(currentUsername);
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            // already in new format
            conversations = data;
            if (conversations.length > 0) currentConversationId = conversations[0].id;
            return true;
        }

        // If not an array, treat as unknown/new format (handled by catch)
        return false;
    } catch (e) {
        console.warn('Failed loading history', e);
        // try legacy keys
        try {
            const legacyKey = `worm_v2_history::${currentUsername}`;
            const raw2 = localStorage.getItem(legacyKey);
            if (!raw2) return false;
            const hist = JSON.parse(raw2);
            if (!Array.isArray(hist)) return false;
            // migrate
            const conv = { id: String(Date.now()), title: 'Migrated chat', createdAt: new Date().toISOString(), messages: hist };
            conversations = [conv];
            currentConversationId = conv.id;
            saveHistory();
            return true;
        } catch (e2) {
            return false;
        }
    }
}

export function isPersonaMessage(text) {
    if (!text) return false;
    try {
        const a = text.trim();
        const b = PERSONA.trim();
        if (a === b) return true;
        if (a.indexOf('Lo adalah WormGPT') !== -1) return true;
        return false;
    } catch (e) { return false; }
}

export function deleteConversation(id) {
    if (!id) return false;
    const idx = conversations.findIndex(c => c.id === id);
    if (idx === -1) return false;
    conversations.splice(idx, 1);
    if (currentConversationId === id) {
        currentConversationId = conversations.length > 0 ? conversations[0].id : null;
    }
    saveHistory();
    return true;
}
