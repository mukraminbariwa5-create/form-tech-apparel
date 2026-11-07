// Read-only checks against the running local store, including SSR/no-JS.
// Run in Sail with PLAYWRIGHT_BROWSERS_PATH=/opt/form-tech-browser.
import { chromium, expect } from '@playwright/test';
const baseURL = process.env.FORM_TECH_QA_URL ?? 'http://localhost:80';
const prefix = process.env.FORM_TECH_QA_PREFIX ?? 'refinement-live';
const browser = await chromium.launch({ headless: true });
try {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const response = await page.goto('/');
    const html = await response.text();
    expect(html).toContain('<h1 id="hero-title">');
    expect(html).toContain('AeroShell Jacket');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('name="description"');
    expect(html).toContain('srcSet=');
    for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
        await page.evaluate(() => scrollTo(0, 0));
        // Capture the settled layout rather than an intermediate entrance frame.
        await page.evaluate(async () => {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await Promise.all(document.getAnimations()
                .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
                .map(animation => animation.finished.catch(() => {})));
        });
        await expect.poll(() => page.locator('.hero-copy').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `docs/screenshots/${prefix}-${width}.jpg`, fullPage: true });
        for (const path of ['/shop', '/search', '/collections/men', '/collections/women', '/products/aeroshell-jacket', '/about', '/technology']) {
            await page.goto(path);
            await expect(page.locator('h1')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home', exact: true })).toBeInViewport();
        }
        console.log(`${width}px: SSR/hydration, image loading, homepage and seven public routes passed.`);
    }
    await page.goto('/');
    const photo = page.locator('.collection-tile').first();
    await photo.focus();
    await expect.poll(() => photo.locator('img').evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => photo.locator('img').evaluate(el => getComputedStyle(el).transform)).toBe('none');
    await page.locator('.featured-section .product-card-photo').first().focus();
    await expect.poll(() => page.locator('.featured-section .product-card-photo img').first().evaluate(el => getComputedStyle(el).transform)).toBe('none');
    await page.goto('/collections/technical-jackets');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    expect(await page.locator('#main').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    await context.close();
    const noJS = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const native = await noJS.newPage();
    await native.goto('/');
    await expect(native.locator('#hero-title')).toBeVisible();
    await native.getByRole('link', { name: /Explore Collections/ }).click();
    await expect(native).toHaveURL(/#collections$/);
    await expect(native.locator('#collections')).toBeInViewport();
    const top = await native.locator('#collections').evaluate(el => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(await native.locator('.store-header').evaluate(el => el.getBoundingClientRect().bottom));
    await native.goto('/collections/new-arrivals');
    await native.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home', exact: true }).click();
    await expect(native.locator('#hero-title')).toBeInViewport();
    console.log('Public SSR metadata, responsive images, keyboard card/reduced-motion states, skip link, no-JS anchor and Home navigation passed. No browser errors.');
    await noJS.close();
} finally { await browser.close(); }
