import { test, expect } from '@playwright/test';

test('hero sequence, card feedback and current navigation preserve shopping destinations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    const timings = await page.locator('.hero-copy > *').evaluateAll(elements => elements.map(el => ({ name: getComputedStyle(el).animationName, delay: getComputedStyle(el).animationDelay })));
    expect(timings.map(item => item.name)).toEqual(Array(4).fill('campaign-enter'));
    expect(new Set(timings.map(item => item.delay)).size).toBe(4);
    const card = page.locator('.product-card').first();
    const photo = card.locator('.product-card-photo');
    await photo.hover();
    await expect(card.locator('.product-card-cue')).toHaveCSS('opacity', '1');
    await card.getByRole('button', { name: 'Charcoal', exact: true }).click();
    await expect(card.locator('.selected-color')).toHaveText('Color: Charcoal');
    await expect(photo).toHaveAttribute('href', /color=Charcoal$/);
    await expect(photo.locator('img')).toHaveClass(/color-image-ready/);
    await photo.click();
    await expect(page).toHaveURL(/aeroshell-jacket\?color=Charcoal$/);
    await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Shop', exact: true })).toHaveAttribute('aria-current', 'location');
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`bag feedback respects motion preference: ${reducedMotion}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        // Record actual animation starts so the assertion does not race a short effect.
        await page.addInitScript(() => {
            const animate = Element.prototype.animate;
            Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
                if (this.matches('.bag-count')) document.documentElement.dataset.bagPulses = String(Number(document.documentElement.dataset.bagPulses ?? 0) + 1);
                return animate.apply(this, args);
            };
        });
        await page.goto('/products/aeroshell-jacket');
        await page.getByRole('radio', { name: 'M', exact: true }).check();
        await page.getByRole('button', { name: 'Add to demo bag', exact: true }).click();
        await expect(page.getByRole('status')).toContainText('Added');
        await expect(page.locator('.bag-count:visible')).toHaveText('(1)');
        const starts = Number(await page.locator('html').getAttribute('data-bag-pulses') ?? 0);
        expect(starts > 0).toBe(reducedMotion === 'no-preference');
        if (reducedMotion === 'reduce') {
            await expect(page.getByRole('status')).toHaveCSS('animation-name', 'none');
            await page.goto('/');
            await expect(page.locator('.hero h1')).toHaveCSS('animation-name', 'none');
            await page.locator('.product-card-photo').first().hover();
            await expect(page.locator('.product-card-photo img').first()).toHaveCSS('transform', 'none');
        }
    });
}
