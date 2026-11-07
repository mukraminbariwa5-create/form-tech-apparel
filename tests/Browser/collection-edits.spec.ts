import { test, expect } from '@playwright/test';

test('Men and Women show distinct selections, truthful sizing and working product journeys', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/collections/men');
    await expect(page.getByRole('status')).toHaveText('18 products');
    await expect(page.getByLabel('Sort by', { exact: true })).toHaveValue('curated');
    await expect(page.locator('.shop-grid .product-card-info > a').first()).toHaveText('AeroShell Jacket');
    await expect(page.locator('.page-heading')).toContainText('shared sizing');
    await expect(page.locator('.shop-grid').getByRole('link', { name: 'AeroShell Jacket', exact: true })).toBeVisible();
    await expect(page.locator('.shop-grid').getByRole('link', { name: 'Strata Rain Shell', exact: true })).toHaveCount(0);
    await page.screenshot({ path: 'docs/screenshots/curated-men-1440.png', fullPage: false });
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Women', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('20 products');
    await expect(page.locator('.shop-grid .product-card-info > a').first()).toHaveText('Halo Cropped Shell');
    await expect(page.locator('.shop-grid').getByRole('link', { name: 'Halo Cropped Shell', exact: true })).toBeVisible();
    await expect(page.locator('.shop-grid').getByRole('link', { name: 'Arc Utility Skirt', exact: true })).toBeVisible();
    await expect(page.locator('.shop-grid').getByRole('link', { name: 'AeroShell Jacket', exact: true })).toHaveCount(0);
    await page.screenshot({ path: 'docs/screenshots/curated-women-1440.png', fullPage: false });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'docs/screenshots/curated-women-390.png' });
    await page.locator('.shop-grid').getByRole('link', { name: 'Halo Cropped Shell', exact: true }).click();
    await expect(page).toHaveURL(/\/products\/halo-cropped-shell/);
    await expect(page.getByRole('button', { name: 'Add to demo bag', exact: true })).toBeEnabled();
});
