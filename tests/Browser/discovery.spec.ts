import { test, expect } from '@playwright/test';

test('suggestions support keyboard selection, Escape and ordinary Enter search', async ({ page }) => {
    await page.goto('/search');
    const search = page.getByRole('combobox', { name: 'Search products', exact: true });
    await search.fill('AeroShell');
    await expect(page.getByRole('option', { name: /AeroShell Jacket/ })).toBeVisible();
    await search.press('ArrowDown');
    await expect(search).toHaveAttribute('aria-activedescendant');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/products\/aeroshell-jacket$/);
    await page.goto('/search');
    await search.fill('AeroShell');
    await expect(page.getByRole('option', { name: /AeroShell Jacket/ })).toBeVisible();
    await search.press('Escape');
    await expect(search).toHaveAttribute('aria-expanded', 'false');
    await search.fill('no-such-product-xyz');
    await expect(page.getByText('No matching products. Press Enter to search with your filters.')).toBeVisible();
    await search.press('Enter');
    await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Remove Search: no-such-product-xyz' })).toBeVisible();
});

test('chip removal retains collection, sorting and other filters, and supports browser Back', async ({ page }) => {
    await page.goto('/collections/technical-jackets?color=Silver&size=M&min_price=0&sort=price-asc&page=1');
    await page.getByRole('link', { name: 'Remove Color: Silver', exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === '/collections/technical-jackets' && !url.searchParams.has('color') && !url.searchParams.has('page') && url.searchParams.get('size') === 'M' && url.searchParams.get('sort') === 'price-asc');
    await expect(page.getByLabel('Color', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Size', { exact: true })).toHaveValue('M');
    await page.goBack();
    await expect(page.getByRole('link', { name: 'Remove Color: Silver', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Clear all', exact: true }).click();
    await expect(page).toHaveURL(/\/collections\/technical-jackets\?sort=price-asc$/);
    await expect(page.getByRole('navigation', { name: 'Active filters' })).toHaveCount(0);
});

test('discovery UI fits phones and laptops; failed suggestions leave search usable', async ({ page }) => {
    await page.goto('/shop?color=Silver&size=M&min_price=0&sort=price-asc');
    const search = page.getByRole('combobox', { name: 'Search products', exact: true });
    for (const width of [320, 390, 768, 1366]) {
        await page.setViewportSize({ width, height: 900 });
        if (width <= 640 && !await page.locator('.catalog-filters').evaluate(panel => (panel as HTMLDetailsElement).open)) {
            await page.locator('.catalog-filters > summary').click();
        }
        await search.fill('shell');
        await search.press('ArrowDown');
        await expect(page.getByRole('listbox', { name: 'Suggested products' }).getByRole('option').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `docs/screenshots/discovery-${width}.png`, fullPage: false });
        await search.press('Escape');
    }
    await page.route('**/search/suggestions?*', route => route.fulfill({ status: 503, body: '{}' }));
    await search.fill('Ridge');
    await expect(page.getByText('Suggestions unavailable. Press Enter to search.')).toBeVisible();
    await search.press('Enter');
    await expect(page).toHaveURL(url => url.searchParams.get('q') === 'Ridge');
});
