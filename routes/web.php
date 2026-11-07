<?php

use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use App\Http\Controllers\Storefront\StorefrontController;
use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Admin\CatalogController;
use App\Http\Controllers\Admin\ManagementController;
use App\Http\Controllers\Storefront\SeoController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:login')->name('login.store');
});
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth')->name('logout');

Route::get('/', [StorefrontController::class, 'home'])->name('home');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/shop', [StorefrontController::class, 'shop'])->name('shop');
Route::get('/search', [StorefrontController::class, 'shop'])->name('search');
// Independent counters keep catalog browsing from consuming write-action budgets.
Route::get('/search/suggestions', [StorefrontController::class, 'suggestions'])->middleware('throttle:120,1,catalog-suggestions');
Route::get('/catalog/recent', [StorefrontController::class, 'recent'])->middleware('throttle:120,1,catalog-recent');
Route::get('/collections/{slug}', [StorefrontController::class, 'shop'])->name('collections.show');
Route::get('/products/{slug}', [StorefrontController::class, 'product'])->name('products.show');
foreach (['technology', 'about', 'contact', 'size-guide', 'shipping-returns'] as $page) {
    Route::get('/'.$page, [StorefrontController::class, 'information'])->name($page);
}
Route::post('/contact', [StorefrontController::class, 'contact'])->middleware('throttle:5,1,contact');
Route::get('/cart', [CartController::class, 'show'])->name('cart');
Route::post('/cart', [CartController::class, 'add'])->block();
Route::patch('/cart', [CartController::class, 'update'])->block();
Route::delete('/cart/{variant}', [CartController::class, 'remove'])->whereNumber('variant')->block();
Route::get('/checkout', [CheckoutController::class, 'show'])->block()->name('checkout');
Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('throttle:20,1,demo-checkout')->block();
Route::get('/order-confirmation/{reference}', [CheckoutController::class, 'confirmation'])->whereUuid('reference')->name('order-confirmation');
Route::middleware(['auth', EnsureAdmin::class])->group(function () {
    Route::get('/admin', [ManagementController::class, 'dashboard'])->name('admin');
    Route::get('/admin/products', [CatalogController::class, 'products']);
    Route::get('/admin/products/create', [CatalogController::class, 'productForm']);
    Route::get('/admin/products/{product}/edit', [CatalogController::class, 'productForm'])->whereNumber('product');
    Route::post('/admin/products', [CatalogController::class, 'saveProduct']);
    Route::put('/admin/products/{product}', [CatalogController::class, 'saveProduct'])->whereNumber('product');
    Route::get('/admin/collections', [CatalogController::class, 'collections']);
    Route::get('/admin/collections/create', [CatalogController::class, 'collectionForm']);
    Route::get('/admin/collections/{collection}/edit', [CatalogController::class, 'collectionForm'])->whereNumber('collection');
    Route::post('/admin/collections', [CatalogController::class, 'saveCollection']);
    Route::put('/admin/collections/{collection}', [CatalogController::class, 'saveCollection'])->whereNumber('collection');
    Route::get('/admin/orders', [ManagementController::class, 'orders']);
    Route::get('/admin/orders/{order}', [ManagementController::class, 'order'])->whereNumber('order');
    Route::patch('/admin/orders/{order}', [ManagementController::class, 'updateOrder'])->whereNumber('order');
    Route::get('/admin/content', [ManagementController::class, 'content']);
    Route::put('/admin/content', [ManagementController::class, 'updateContent']);
    Route::get('/admin/contacts', [ManagementController::class, 'contacts']);
});
