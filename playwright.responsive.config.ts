import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
    ...base,
    // Cases use independent guest sessions and never mutate catalog/inventory.
    workers: 3,
    testMatch: 'responsive.spec.ts',
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
});
