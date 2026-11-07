export const RECENT_KEY = 'form-tech:recent-products';
const RESULTS_KEY = 'form-tech:catalog-return';
const catalogPath = /^(?:\/shop|\/search|\/collections\/[a-z0-9-]+)$/;

export function rememberResults() {
    if (!catalogPath.test(window.location.pathname)) return;
    try { sessionStorage.setItem(RESULTS_KEY, JSON.stringify({ url: window.location.pathname + window.location.search, scroll: window.scrollY })); } catch { /* Browsing works when tab storage is unavailable. */ }
}

export function readResults(): { url: string; scroll: number } | null {
    try {
        const value = JSON.parse(sessionStorage.getItem(RESULTS_KEY) ?? 'null');
        if (!value || typeof value.url !== 'string' || value.url.length > 2048) return null;
        const url = new URL(value.url, window.location.origin);
        if (url.origin !== window.location.origin || !catalogPath.test(url.pathname)) return null;
        return { url: url.pathname + url.search, scroll: Number.isFinite(value.scroll) ? Math.max(0, Math.min(value.scroll, 100000)) : 0 };
    } catch { return null; }
}

export function readRecent(): string[] {
    try {
        const value: unknown = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]');
        return Array.isArray(value) ? [...new Set(value.filter((slug): slug is string => typeof slug === 'string' && /^[a-z0-9-]{1,160}$/.test(slug)))].slice(0, 8) : [];
    } catch { return []; }
}
