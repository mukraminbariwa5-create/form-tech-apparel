import { test, expect } from '@playwright/test';

test('all 30 catalog cards offer working available-color previews and color-specific destinations', async ({ page }) => {
    test.setTimeout(90000);
    let count = 0;
    for (const number of [1, 2, 3]) {
        await page.goto(`/shop?page=${number}`);
        await expect(page.locator('.product-card')).toHaveCount(number === 3 ? 6 : 12);
        for (const card of await page.locator('.product-card').all()) {
            const buttons = card.getByRole('button');
            // The original Module Sling Bag is intentionally sold out; do not replenish it for this update.
            const soldOutOriginal = await card.getByRole('link', { name: 'Module Sling Bag', exact: true }).count();
            await expect(buttons).toHaveCount(soldOutOriginal ? 1 : 2);
            const alternate = buttons.last();
            const color = await alternate.getAttribute('title');
            await alternate.click();
            await expect(alternate).toHaveAttribute('aria-pressed', 'true');
            await expect(card.locator('img')).toHaveAttribute('alt', new RegExp(`in ${color}`, 'i'));
            await expect(card.locator('.product-card-photo')).toHaveAttribute('href', new RegExp(`color=${encodeURIComponent(color!)}`));
            await expect.poll(() => card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
            count++;
        }
    }
    expect(count).toBe(30);
});

for (const width of [390, 1440]) test(`alternate color persists through product refresh, bag and checkout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const card = page.locator('.featured-section .product-card').filter({ has: page.getByRole('link', { name: 'AeroShell Jacket', exact: true }) });
    await card.getByRole('button', { name: 'Charcoal', exact: true }).click();
    await card.getByRole('link', { name: 'View AeroShell Jacket', exact: true }).click();
    await expect(page).toHaveURL(/color=Charcoal/);
    await page.reload();
    await expect(page.locator('.product-purchase').getByRole('button', { name: 'Charcoal', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.main-product-image')).toHaveAttribute('alt', /in charcoal/i);
    await page.getByRole('radio', { name: 'M', exact: true }).check();
    await page.getByRole('button', { name: 'Add to demo bag', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Added');
    await page.locator('.store-header a[href="/cart"]:visible').click();
    await expect(page.locator('.cart-line img')).toHaveAttribute('alt', /in charcoal/i);
    await expect(page.getByText('M / Charcoal', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: /Proceed to demo checkout/ }).click();
    await expect(page.getByText(/M \/ Charcoal/)).toBeVisible();
    for (const [label, value] of [['Full name', 'Fictional Color Visitor'], ['Email', 'color-demo@example.test'], ['Address line 1', '123 Fictional Street'], ['City', 'Demo City'], ['Province / state', 'Demo Province'], ['Postal code', '00000'], ['Country', 'Demo Country']]) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Place Demo Order', exact: true }).click();
    await expect(page).toHaveURL(/\/order-confirmation\/[a-f0-9-]{36}$/);
    await expect(page.getByText(/M \/ Charcoal/)).toBeVisible();
});
