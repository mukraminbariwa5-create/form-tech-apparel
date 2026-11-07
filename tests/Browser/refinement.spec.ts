import { test, expect } from '@playwright/test';

const journeys = [
    ['Shop New Arrivals', '/collections/new-arrivals'],
    ['Technical Jackets campaign', '/collections/technical-jackets'],
    ['Tech Pants campaign', '/collections/tech-pants'],
    ['Layering Systems campaign', '/collections/layering-systems'],
];

for (const width of [390, 1440]) test(`visible Home journeys and direct loads at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, path] of journeys) {
        await page.goto('/');
        await page.getByRole('link', { name: new RegExp(label) }).click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        const home = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home', exact: true });
        await expect(home).toBeInViewport();
        await home.click();
        await expect(page).toHaveURL(/\/$/);
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
        await page.goto(path);
        await page.reload();
        await expect(home).toBeInViewport();
        await page.locator('.store-header').getByRole('link', { name: 'FORM TECH home' }).click();
        await expect(page.locator('#hero-title')).toBeInViewport();
    }
});

test('Home and browser history retain the filtered listing and scroll context', async ({ page }) => {
    await page.goto('/collections/technical-jackets?sort=price-asc&size=M');
    await page.locator('.product-grid').scrollIntoViewIfNeeded();
    const listingScroll = await page.evaluate(() => window.scrollY);
    await page.locator('.store-header').getByRole('link', { name: 'FORM TECH home' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.goBack();
    await expect(page).toHaveURL(url => url.searchParams.get('sort') === 'price-asc' && url.searchParams.get('size') === 'M');
    await expect(page.getByLabel('Sort by')).toHaveValue('price-asc');
    await expect(page.getByLabel('Size', { exact: true })).toHaveValue('M');
    await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - listingScroll)).toBeLessThan(8);
    await page.goForward();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) test(`Explore targets tiles with ${reducedMotion} and preserves history`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
        (window as unknown as { scrollSamples: number[] }).scrollSamples = [];
        window.addEventListener('scroll', () => (window as unknown as { scrollSamples: number[] }).scrollSamples.push(scrollY));
    });
    let requests = 0;
    page.on('request', request => { if (request.isNavigationRequest() || request.headers()['x-inertia']) requests++; });
    await page.getByRole('link', { name: /Explore Collections/ }).click();
    await expect(page).toHaveURL(/#collections$/);
    const target = page.getByRole('region', { name: 'Shop collections' });
    await expect(target).toBeFocused();
    await expect.poll(async () => Math.round(await target.evaluate(el => el.getBoundingClientRect().top))).toBe(106);
    const top = await target.evaluate(el => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(await page.locator('.store-header').evaluate(el => el.getBoundingClientRect().bottom));
    if (reducedMotion === 'no-preference') expect(await page.evaluate(() => new Set((window as unknown as { scrollSamples: number[] }).scrollSamples).size)).toBeGreaterThan(2);
    expect(requests).toBe(0);
    const historyLength = await page.evaluate(() => history.length);
    // Scroll back to the CTA, then intentionally follow the same anchor again.
    await page.getByRole('link', { name: /Explore Collections/ }).click();
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/#collections$/);
    await expect(target).toBeInViewport();
});

test('responsive screenshots, real color indicators and mobile keyboard navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode().catch(() => {}))); });
        await page.evaluate(() => scrollTo(0, 0));
        await expect.poll(() => page.locator('.hero-copy').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
        await page.screenshot({ path: `docs/screenshots/refinement-after-${width}.jpg`, fullPage: true });
        await page.goto('/collections/technical-jackets');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `docs/screenshots/refinement-collection-${width}.jpg`, fullPage: true });
    }
    await page.goto('/');
    await expect(page.locator('.featured-section .product-card-info > a')).toHaveText(['AeroShell Jacket', 'Vector Cargo Pant', /Ridge Pullover/, 'Transit Vest']);
    await expect(page.locator('.featured-section .compact-color-options')).toHaveCount(4);
    for (const colors of await page.locator('.featured-section .compact-color-options').all()) await expect(colors.getByRole('button')).toHaveCount(2);
    await page.setViewportSize({ width: 390, height: 900 });
    const menu = page.getByRole('button', { name: /Menu/ });
    await menu.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Search', exact: true })).toBeVisible();
    for (let index = 0; index < 15; index++) {
        await page.keyboard.press('Tab');
        expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(menu).toBeFocused();
    expect(errors).toEqual([]);
});
