<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoPrivacyTest extends TestCase
{
    use RefreshDatabase;
    public function test_sitemap_includes_only_public_active_catalog_and_private_pages_are_no_store(): void
    {
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite(); $this->seed();
        Product::where('slug', 'aeroshell-jacket')->update(['active'=>false]);
        $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type','application/xml; charset=UTF-8')
            ->assertSee('/products/ridge-pullover')->assertDontSee('/products/aeroshell-jacket')->assertDontSee('/checkout')->assertDontSee('/admin');
        $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /order-confirmation/')->assertSee('/sitemap.xml');
        foreach (['/cart','/login'] as $path) {
            $response=$this->get($path)->assertOk()->assertHeader('X-Robots-Tag','noindex, nofollow')->assertHeader('Referrer-Policy','no-referrer');
            $this->assertStringContainsString('no-store',$response->headers->get('Cache-Control'));
        }
    }
}
