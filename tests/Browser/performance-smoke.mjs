// Read-only local measurements. These are not field Core Web Vitals or a Lighthouse score.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch({ headless: true });
const results = [];
try {
    for (const path of ['/', '/shop', '/products/aeroshell-jacket']) {
        const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
        const page = await context.newPage();
        await page.addInitScript(() => {
            window.qaMetrics = { lcp: 0, cls: 0 };
            new PerformanceObserver(list => { for (const entry of list.getEntries()) window.qaMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
            new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.qaMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
        });
        const response = await page.goto(`http://localhost:80${path}`);
        await page.waitForLoadState('networkidle');
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const resources = performance.getEntriesByType('resource');
            return {
                ttfbMs: Math.round(navigation.responseStart - navigation.requestStart),
                domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
                lcpMs: Math.round(window.qaMetrics.lcp), cls: Number(window.qaMetrics.cls.toFixed(4)),
                transferredBytes: resources.reduce((sum, item) => sum + item.transferSize, 0),
                brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).length,
                heroPriority: document.querySelector('.hero img')?.fetchPriority,
                thirdPartyRequests: resources.filter(item => new URL(item.name).origin !== location.origin).length,
            };
        });
        results.push({ path, status: response.status(), ...metrics });
        await context.close();
    }
    writeFileSync('docs/LOCAL_PERFORMANCE_2026-11-05.json', JSON.stringify({
        context: 'Local Docker development server, Chromium, 1366x768, fresh browser context per route; no CPU/network throttling. Single samples, not production/field scores.', results,
    }, null, 2));
    console.log(JSON.stringify(results));
} finally { await browser.close(); }
