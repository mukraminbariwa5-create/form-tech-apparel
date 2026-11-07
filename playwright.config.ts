import { defineConfig } from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/form-tech-browser';

export default defineConfig({
    testDir:'tests/Browser',workers:1,fullyParallel:false,forbidOnly:!!process.env.CI,
    timeout:45000,expect:{timeout:10000},reporter:'list',
    globalSetup:'./tests/Browser/setup.ts',
    use:{baseURL:'http://localhost:8081',browserName:'chromium',trace:'retain-on-failure',screenshot:'only-on-failure'},
    webServer:{command:'php artisan serve --host=0.0.0.0 --port=8081 --no-reload',url:'http://localhost:8081/up',reuseExistingServer:false,timeout:30000,
        env:{APP_ENV:'testing',APP_URL:'http://localhost:8081',DB_CONNECTION:'pgsql',DB_DATABASE:'form_tech_e2e',DB_URL:'',SESSION_COOKIE:'form_tech_e2e',INERTIA_SSR_ENABLED:'false'}},
});
