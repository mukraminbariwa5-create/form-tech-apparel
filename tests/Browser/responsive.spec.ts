import { test, expect, type Page } from '@playwright/test';

const widths = [320, 360, 375, 390, 414, 540, 640, 766, 767, 768, 769, 800, 858, 900, 901, 1024, 1280, 1440, 1920];
const mainLinks = ['Shop', 'Men', 'Women', 'Technology'];

test('homepage sections reveal once while normal navigation stays usable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const story = page.locator('.editorial-story > div');
    await expect(story).not.toHaveClass(/scroll-revealed/);
    expect(await story.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await story.evaluate(el => {
        el.setAttribute('data-animation-starts', '0');
        el.addEventListener('animationstart', () => el.setAttribute('data-animation-starts', String(Number(el.getAttribute('data-animation-starts')) + 1)));
    });
    await page.locator('.editorial-story').scrollIntoViewIfNeeded();
    await expect(story).toHaveClass(/scroll-revealed/);
    await story.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    await expect(story).toHaveAttribute('data-animation-starts', '1');
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await page.locator('.editorial-story').scrollIntoViewIfNeeded();
    await expect(story).toHaveAttribute('data-animation-starts', '1');
    await expect(page.locator('.editorial-story a')).toBeVisible();
});

test('scroll content stays visible with reduced motion and without an observer', async ({ page }) => {
    for (const mode of ['reduce', 'unsupported'] as const) {
        await page.emulateMedia({ reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
        if (mode === 'unsupported') await page.addInitScript(() => Object.defineProperty(window, 'IntersectionObserver', { value: undefined }));
        await page.goto('/');
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        await expect(page.locator('.scroll-revealed')).toHaveCount(0);
        const visible = await page.locator('[data-scroll-reveal]').evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === '1' && getComputedStyle(el).transform === 'none'));
        expect(visible).toBe(true);
    }
});

async function checkGeometry(page: Page) {
    const geometry = await page.locator('.store-header').evaluate(header => {
        const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
        const visible = [...header.querySelectorAll('a, button')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        return { overflow: document.documentElement.scrollWidth > innerWidth, controls: visible.map(rect), header: rect(header) };
    });
    expect(geometry.overflow).toBe(false);
    for (const [index, control] of geometry.controls.entries()) {
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(geometry.header.right + 1);
        expect(control.top).toBeGreaterThanOrEqual(geometry.header.top);
        expect(control.bottom).toBeLessThanOrEqual(geometry.header.bottom);
        for (const other of geometry.controls.slice(index + 1)) {
            expect(Math.min(control.right, other.right) - Math.max(control.left, other.left)).toBeLessThanOrEqual(0);
        }
    }
}

test('navigation stays available across phone, tablet, preview and desktop widths', async ({ page, browserName }) => {
    test.setTimeout(90000);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        const menu = page.getByRole('button', { name: /Menu/ });
        const main = page.getByRole('navigation', { name: 'Main navigation', exact: true });
        const brand = page.getByRole('navigation', { name: 'Brand navigation', exact: true });
        if (width >= 768) {
            await expect(menu).toBeHidden();
            for (const name of mainLinks) await expect(main.getByRole('link', { name, exact: true })).toBeInViewport();
            for (const name of ['About', 'Open search', 'View bag, 0 items']) await expect(brand.getByRole('link', { name, exact: true })).toBeInViewport();
        } else {
            await expect(main).toBeHidden(); await expect(brand).toBeHidden();
            await expect(menu).toBeInViewport();
            await expect(menu.locator('svg')).toBeVisible();
            await expect(menu).toHaveText('');
            await expect(page.locator('.header-actions').getByRole('link', { name: 'Search', exact: true })).toBeInViewport();
            await expect(page.locator('.header-actions').getByRole('link', { name: 'Bag (0)', exact: true })).toBeInViewport();
            await menu.click();
            const dialog = page.getByRole('dialog');
            for (const name of ['Home', ...mainLinks, 'About', 'Search', 'Bag (0)']) await expect(dialog.getByRole('link', { name, exact: true })).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(menu).toBeFocused();
        }
        await expect(page.locator('.announcement a')).toHaveCount(0);
        await checkGeometry(page);
        if ([320, 390, 767, 768, 858, 1024, 1440, 1920].includes(width)) await page.screenshot({ path: `docs/screenshots/responsive-header-${browserName}-${width}.png`, clip: { x: 0, y: 0, width, height: 180 } });
    }
});

test('rotation closes the mobile dialog and keeps focus on visible navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /Menu/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('.store-header .wordmark')).toBeFocused();
    await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toBeVisible();
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).overflow)).not.toBe('hidden');
    await expect(page.locator('.announcement a')).toHaveCount(0);
    await checkGeometry(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: /Menu/ }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Women', exact: true }).click();
    await expect(page).toHaveURL(/\/collections\/women$/);
    await expect(page.getByRole('dialog')).not.toBeVisible();
});

for (const [name, viewport, isMobile] of [
    ['phone', { width: 390, height: 844 }, true],
    ['tablet', { width: 820, height: 1180 }, true],
    ['landscape phone', { width: 844, height: 390 }, true],
    ['desktop', { width: 1440, height: 900 }, false],
] as const) test(`${name}: public pages, bag and checkout retain navigation and fit the viewport`, async ({ browser, browserName }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ viewport, hasTouch: isMobile, isMobile: browserName === 'firefox' ? false : isMobile, deviceScaleFactor: isMobile ? 2 : 1 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/products/aeroshell-jacket');
    await page.getByRole('radio', { name: 'M', exact: true }).check();
    await page.getByRole('button', { name: 'Add to demo bag', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Added');
    for (const path of ['/', '/collections/new-arrivals', '/collections/technical-jackets', '/collections/tech-pants', '/collections/layering-systems', '/search', '/about', '/technology', '/cart', '/checkout']) {
        await page.goto(path);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('.announcement a')).toHaveCount(0);
        await checkGeometry(page);
        if (viewport.width >= 768) await expect(page.getByRole('link', { name: 'View bag, 1 items', exact: true })).toBeVisible();
        else await expect(page.locator('.header-actions').getByRole('link', { name: 'Bag (1)', exact: true })).toBeVisible();
    }
    await page.screenshot({ path: `docs/screenshots/responsive-checkout-${browserName}-${name.replaceAll(' ', '-')}.jpg`, fullPage: true });
    expect(errors).toEqual([]);
    await context.close();
});
