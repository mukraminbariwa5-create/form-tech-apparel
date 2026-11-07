import { test,expect,type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function checkout(page:Page) {
    await page.locator('.store-header a[href="/cart"]:visible').click();
    await expect(page).toHaveURL(/\/cart$/);
    await page.reload();
    await expect(page.getByLabel('AeroShell Jacket quantity',{exact:true})).toHaveText('1');
    await page.getByRole('link',{name:/Proceed to demo checkout/}).click();
    const fields=[['Full name','Fictional Browser Visitor'],['Email','demo-order@example.test'],['Address line 1','123 Fictional Street'],['City','Demo City'],['Province / state','Demo Province'],['Postal code','00000'],['Country','Demo Country']];
    for(const [name,value] of fields) await page.getByLabel(name,{exact:true}).fill(value);
    await page.getByRole('button',{name:'Place Demo Order',exact:true}).click();
    await expect(page).toHaveURL(/\/order-confirmation\/[a-f0-9-]{36}$/);
}

test('guest collection to saved demo order, private summary and refreshed empty bag',async({page})=>{
    await page.goto('/');
    await page.getByRole('link',{name:/Technical Jackets campaign/}).click();
    await expect(page.getByText('7 products',{exact:true})).toBeVisible();
    await page.getByRole('link',{name:'View AeroShell Jacket',exact:true}).click();
    await page.getByRole('radio',{name:'M',exact:true}).check();
    await page.getByRole('button',{name:'Add to demo bag',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Added');
    await checkout(page);
    await expect(page.getByText(/No payment was made/)).toBeVisible();
    await expect(page.getByText('demo-order@example.test')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.store-header a[href="/cart"]:visible')).toBeVisible();
});

test('Enter search has an honest empty state',async({page})=>{
    await page.goto('/search');
    await page.getByLabel('Search products',{exact:true}).fill('no-such-fabric-xyz');
    await page.getByLabel('Search products',{exact:true}).press('Enter');
    await expect(page).toHaveURL(/sort=newest/);
    await expect(page.getByRole('heading',{name:'No products found'})).toBeVisible();
});

test('staff sign-in, edit product, storefront change and cancellation',async({page})=>{
    const credentials=JSON.parse(readFileSync('.setup/browser-credentials.json','utf8'));
    await page.goto('/products/aeroshell-jacket');
    await page.getByRole('radio',{name:'M',exact:true}).check();
    await page.getByRole('button',{name:'Add to demo bag',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Added');
    await checkout(page);
    await page.goto('/admin'); await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email',{exact:true}).fill(credentials.email);
    await page.getByLabel('Password',{exact:true}).fill(credentials.password);
    await page.getByRole('button',{name:/sign in/i}).click();
    await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible();
    await page.getByRole('link',{name:'Products',exact:true}).click();
    await page.getByRole('link',{name:'Edit Ridge Pullover →',exact:true}).click();
    await page.getByLabel('Product title',{exact:true}).fill('Ridge Pullover — Staff edit');
    await page.getByRole('button',{name:'Save product',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('saved');
    await page.getByRole('link',{name:'View product →',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Ridge Pullover — Staff edit',exact:true})).toBeVisible();
    await page.goto('/admin/orders');
    await page.getByRole('link',{name:/Review order \d/}).first().click();
    await page.getByLabel('Demo status',{exact:true}).selectOption('cancelled');
    await page.getByRole('button',{name:'Save demo status',exact:true}).click();
    await expect(page.getByText('Cancelled. Stock has been restored. This order cannot be reopened.')).toBeVisible();
    for(const path of ['/admin','/admin/products','/admin/collections','/admin/content','/admin/contacts']) {
        await page.goto(path); await expect(page.locator('#admin-main h1')).toBeVisible();
        for(const width of [360,390,768,1024,1440]) {
            await page.setViewportSize({width,height:900});
            expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        }
    }
    await page.goto('/admin'); await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible();
    await page.screenshot({path:'docs/screenshots/admin-overview.jpg',fullPage:true,type:'jpeg'});
    await page.getByRole('button',{name:'Sign out',exact:true}).click();
    await page.goto('/admin/products'); await expect(page).toHaveURL(/\/login$/);
});

test('mobile menu keyboard behavior and planned viewport widths',async({page})=>{
    for(const width of [360,390,768,1024,1440]) {
        await page.setViewportSize({width,height:900}); await page.goto('/');
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await page.setViewportSize({width:390,height:900});
    await page.getByRole('button',{name:/Menu/}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button',{name:/Menu/})).toBeFocused();
});
