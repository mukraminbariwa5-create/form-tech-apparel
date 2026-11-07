import { test, expect } from '@playwright/test';

test('product size dialog converts units, keeps selection and restores keyboard focus', async ({ page }) => {
    await page.goto('/products/aeroshell-jacket');
    await page.getByRole('radio', { name: 'M', exact: true }).check();
    const trigger = page.getByRole('button', { name: 'Size guide & measurements →', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Size guide · AeroShell Jacket' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.selected-measurement')).toContainText('M');
    await dialog.getByRole('button', { name: 'Inches', exact: true }).click();
    await expect(dialog.getByText('37.4–39.8 in')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('radio', { name: 'M', exact: true })).toBeChecked();
    await expect(page.locator('.related-products .product-card')).toHaveCount(4);
    await expect(page.locator('.related-products a[href*="aeroshell-jacket"]')).toHaveCount(0);
    await page.goto('/size-guide');
    await page.getByLabel('Find a product guide').fill('AeroShell');
    await expect(page.locator('.information-page details')).toHaveCount(1);
    await page.locator('.information-page summary').click();
    await expect(page.getByRole('link', { name: 'View AeroShell Jacket →' })).toBeVisible();
});

test('recent history uses real products, survives navigation and can be cleared', async ({ page }) => {
    await page.goto('/products/aeroshell-jacket');
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('form-tech:recent-products'))).toContain('aeroshell-jacket');
    await page.goto('/products/vector-cargo-pant');
    const recent = page.getByRole('region', { name: 'RECENTLY VIEWED', exact: true });
    await expect(recent.getByRole('link', { name: 'AeroShell Jacket', exact: true })).toBeVisible();
    await expect(recent.getByRole('link', { name: 'Vector Cargo Pant', exact: true })).toHaveCount(0);
    await page.goto('/shop');
    await expect(recent.getByRole('link', { name: 'Vector Cargo Pant', exact: true })).toBeVisible();
    await recent.getByRole('button', { name: 'Clear history' }).click();
    await expect(recent).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem('form-tech:recent-products'))).toBeNull();
});

test('return to results restores filters and the listing scroll position', async ({ page }) => {
    await page.goto('/collections/technical-jackets?size=M&sort=price-asc');
    await page.locator('.product-card-photo').nth(3).scrollIntoViewIfNeeded();
    await page.locator('.product-card-photo').nth(3).click();
    const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('form-tech:catalog-return') ?? 'null'));
    expect(saved.url).toBe('/collections/technical-jackets?size=M&sort=price-asc');
    await page.getByRole('link', { name: '← Back to your results' }).click();
    await expect(page).toHaveURL(/technical-jackets\?size=M&sort=price-asc$/);
    await expect(page.getByLabel('Size', { exact: true })).toHaveValue('M');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(saved.scroll - 30);
});

test('guidance, forms and browsing sections reflow at narrow and enlarged text sizes', async ({ page }) => {
    for (const width of [320, 390, 683, 1366, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/products/aeroshell-jacket');
        await page.getByRole('button', { name: 'Size guide & measurements →' }).click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const dialog = page.getByRole('dialog');
        expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
        await page.screenshot({ path: `docs/screenshots/polish-size-guide-${width}.png` });
        await page.keyboard.press('Escape');
    }
    await page.setViewportSize({ width: 683, height: 450 });
    await page.goto('/contact');
    // Text enlargement and narrow reflow supplement actual browser zoom review.
    await page.addStyleTag({ content: ':root { font-size: 200%; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
});

test('effective 200 percent desktop zoom layout keeps public routes usable', async ({ browser }) => {
    // 1366 physical pixels at 2x scale yields a 683 CSS-pixel layout viewport.
    const context = await browser.newContext({ viewport: { width: 683, height: 384 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    for (const path of ['/', '/shop', '/products/aeroshell-jacket', '/size-guide', '/contact', '/cart']) {
        await page.goto(path);
        await expect(page.locator('h1')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await context.close();
});
