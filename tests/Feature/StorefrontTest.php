<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        $this->seed();
    }

    public function test_homepage_contains_real_seeded_featured_products_and_collection_tiles(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('storefront/home')->has('featured', 4)->has('collections', 3)
            ->where('featured.0.slug', 'aeroshell-jacket')->where('featured.1.slug', 'vector-cargo-pant')
            ->where('featured.2.slug', 'ridge-pullover')->where('featured.3.slug', 'transit-vest')->where('featured.0.colors', ['Silver', 'Charcoal']));
    }

    public function test_card_colors_only_include_active_in_stock_variants_and_preserve_content_order(): void
    {
        $product = Product::where('slug', 'aeroshell-jacket')->firstOrFail();
        $product->variants()->update(['stock' => 0]);
        $product->variants()->first()->update(['stock' => 2, 'active' => false, 'color' => 'Cobalt']);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featured.0.colors', []));
        $home = \App\Models\SiteContent::where('key', 'home')->firstOrFail();
        $value = $home->value;
        $value['featured_product_ids'] = array_reverse($value['featured_product_ids']);
        $home->update(['value' => $value]);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('featured.0.slug', 'transit-vest')->where('featured.3.slug', 'aeroshell-jacket'));
    }

    public function test_collection_filter_search_and_price_sort_are_database_backed(): void
    {
        $this->get('/search')->assertOk()->assertInertia(fn (Assert $page) => $page->where('filters.sort', 'newest')->where('filters.q', ''));
        $this->get('/collections/technical-jackets?sort=price-asc')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('storefront/shop')->where('pagination.total', 7)->where('products.0.title', 'Horizon Windbreaker')->where('products.0.price', 18500));
        $this->get('/shop?q=AeroShell&color=Silver&size=M&min_price=30000&max_price=33000')->assertOk()->assertInertia(fn (Assert $page) => $page->where('pagination.total', 1)->where('products.0.slug', 'aeroshell-jacket'));
        $this->get('/shop?max_price=4000')->assertOk()->assertInertia(fn (Assert $page) => $page->where('pagination.total', 2));
        $this->get('/search?q=nonexistent-xyz')->assertOk()->assertInertia(fn (Assert $page) => $page->has('products', 0));
    }

    public function test_availability_filters_respect_the_actual_selected_size(): void
    {
        $this->get('/shop?collection=technical-jackets&color=Silver&size=XL&availability=out-of-stock')->assertOk()->assertInertia(fn (Assert $page) => $page->where('pagination.total', 1)->where('products.0.slug', 'aeroshell-jacket')->where('products.0.available', false));
    }

    public function test_invalid_filter_and_archived_products_are_handled(): void
    {
        $this->get('/shop?sort=malicious-value')->assertStatus(422);
        $this->get('/shop?min_price=5000&max_price=2000')->assertStatus(422);
        Product::where('slug', 'aeroshell-jacket')->update(['active' => false]);
        $this->get('/products/aeroshell-jacket')->assertNotFound();
        $this->get('/shop?q=AeroShell')->assertOk()->assertInertia(fn (Assert $page) => $page->where('pagination.total', 0));
    }

    public function test_search_suggestions_are_bounded_and_do_not_expose_archived_or_variantless_products(): void
    {
        $this->getJson('/search/suggestions?q=AeroShell')->assertOk()->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.href', '/products/aeroshell-jacket')->assertJsonPath('products.0.price', 32000);
        Product::where('slug', 'aeroshell-jacket')->update(['active' => false]);
        $this->getJson('/search/suggestions?q=AeroShell')->assertJsonCount(0, 'products');
        Product::where('slug', 'ridge-pullover')->firstOrFail()->variants()->update(['active' => false]);
        $this->getJson('/search/suggestions?q=Ridge')->assertJsonCount(0, 'products');
        Product::query()->update(['description' => 'A shared search match.']);
        $this->getJson('/search/suggestions?q=shared')->assertJsonCount(5, 'products');
        $this->getJson('/search/suggestions?q=a')->assertJsonCount(0, 'products');
        $this->getJson('/search/suggestions?q=%25%25')->assertJsonCount(0, 'products');
        $this->getJson('/search/suggestions?q='.str_repeat('a', 101))->assertUnprocessable();
    }

    public function test_related_products_and_recent_history_resolve_only_public_catalog_data(): void
    {
        $this->get('/products/aeroshell-jacket')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('related', 4)->where('related.0.slug', 'ridge-pullover')
            ->where('product.collections', fn ($collections) => count($collections) > 0));
        Product::where('slug', 'ridge-pullover')->update(['active' => false]);
        $this->getJson('/catalog/recent?slugs[]=ridge-pullover&slugs[]=vector-cargo-pant&slugs[]=aeroshell-jacket&slugs[]=vector-cargo-pant')
            ->assertOk()->assertJsonCount(2, 'products')->assertJsonPath('products.0.slug', 'vector-cargo-pant')->assertJsonPath('products.1.slug', 'aeroshell-jacket');
        $this->get('/products/aeroshell-jacket')->assertInertia(fn (Assert $page) => $page
            ->where('related', fn ($items) => collect($items)->every(fn ($item) => !in_array($item['slug'], ['aeroshell-jacket', 'ridge-pullover']) && $item['available'])));
        $this->getJson('/catalog/recent?slugs=invalid')->assertUnprocessable();
        $this->getJson('/catalog/recent?'.http_build_query(['slugs' => array_fill(0, 9, 'aeroshell-jacket')]))->assertUnprocessable();
        $this->get('/size-guide')->assertInertia(fn (Assert $page) => $page->has('guides', 29)->has('guides.0.slug'));
    }

    public function test_contact_is_validated_saved_and_acknowledged_as_demo(): void
    {
        $this->from('/contact')->post('/contact', ['name' => 'Demo visitor', 'email' => 'visitor@example.test', 'message' => 'A fictional message for testing.'])->assertRedirect('/contact')->assertSessionHas('success');
        $this->assertDatabaseCount('contact_messages', 1);
        $this->post('/contact', ['name' => '', 'email' => 'invalid', 'message' => 'short'])->assertSessionHasErrors(['name', 'email', 'message']);
        $this->assertDatabaseCount('contact_messages', 1);
    }
}
