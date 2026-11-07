import { test, expect } from '@playwright/test';

test('all six capsule products offer matching images and five sizes in both colors', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/collections/womens-capsule');
    await expect(page.locator('.shop-grid .product-card')).toHaveCount(6);
    const products = await page.locator('.shop-grid .product-card-photo').evaluateAll(elements => elements.map(el => el.getAttribute('href')!));
    for (let index = 0; index < products.length; index++) {
        await page.goto('/collections/womens-capsule');
        const card = page.locator('.shop-grid .product-card').nth(index);
        await expect(card.getByRole('button')).toHaveCount(2);
        const alternate = card.getByRole('button').last();
        const color = (await alternate.getAttribute('title'))!;
        await alternate.click();
        await expect(card.locator('img')).toHaveAttribute('alt', new RegExp(`in ${color}`, 'i'));
        await card.locator('.product-card-photo').click();
        const purchase = page.locator('.product-purchase');
        await expect(purchase.getByRole('button', { name: color, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect(purchase.getByRole('radio')).toHaveCount(5);
        for (const button of await purchase.locator('.color-options button').all()) {
            const name = (await button.getAttribute('title'))!;
            await button.click();
            await expect(page.locator('.main-product-image')).toHaveAttribute('alt', new RegExp(`in ${name}`, 'i'));
            await expect.poll(() => page.locator('.main-product-image').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
        }
        await purchase.getByRole('button', { name: 'Size guide & measurements →' }).click();
        await expect(page.getByRole('dialog')).toContainText('Women’s capsule');
        await page.keyboard.press('Escape');
    }
    await page.goto('/collections/womens-capsule');
    await page.getByRole('button', { name: 'Clear history', exact: true }).click();
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: 'docs/screenshots/womens-capsule-1440.jpg', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'docs/screenshots/womens-capsule-390.jpg', fullPage: true });
    expect(errors).toEqual([]);
});

for (const [width, slug, color, size] of [
    [390, 'halo-cropped-shell', 'Charcoal', 'M'],
    [1440, 'arc-utility-skirt', 'Olive', 'S'],
] as const) test(`capsule alternate color survives demo checkout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/products/${slug}?color=${color}`);
    await page.reload();
    await expect(page.locator('.main-product-image')).toHaveAttribute('alt', new RegExp(`in ${color}`, 'i'));
    await page.locator('.product-purchase').getByRole('radio', { name: size, exact: true }).check();
    await page.getByRole('button', { name: 'Add to demo bag', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Added');
    await page.locator('.store-header a[href="/cart"]:visible').click();
    await expect(page.locator('.cart-line')).toContainText(`${size} / ${color}`);
    await expect(page.locator('.cart-line img')).toHaveAttribute('alt', new RegExp(`in ${color}`, 'i'));
    await page.getByRole('link', { name: /Proceed to demo checkout/ }).click();
    for (const [label, value] of [['Full name', 'Fictional Capsule Visitor'], ['Email', 'capsule@example.test'], ['Address line 1', '123 Fictional Street'], ['City', 'Demo City'], ['Province / state', 'Demo Province'], ['Postal code', '00000'], ['Country', 'Demo Country']]) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Place Demo Order', exact: true }).click();
    await expect(page).toHaveURL(/\/order-confirmation\/[a-f0-9-]{36}$/);
    await expect(page.getByText(new RegExp(`${size} / ${color}`))).toBeVisible();
});
