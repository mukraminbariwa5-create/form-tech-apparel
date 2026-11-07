<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Product;
use App\Models\SiteContent;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeding_is_repeatable_and_preserves_admin_edits_and_inventory(): void
    {
        $this->seed();
        $this->assertDatabaseCount('products', 30);
        $this->assertDatabaseCount('collections', 8);
        $this->assertDatabaseCount('product_images', 60);
        $this->assertDatabaseCount('variants', 218);
        $this->assertSame(4, Product::where('featured', true)->count());
        foreach (['technical-jackets' => 7, 'tech-pants' => 7, 'layering-systems' => 9, 'accessories' => 6] as $slug => $count) {
            $this->assertSame($count, Collection::where('slug', $slug)->firstOrFail()->products()->count());
        }
        $product = Product::where('slug', 'aeroshell-jacket')->firstOrFail();
        $variant = $product->variants()->firstOrFail();
        $variant->update(['stock' => 2, 'sku' => 'STAFF-EDITED-SKU']);
        $product->update(['title' => 'Staff edited title', 'slug' => 'staff-renamed-aeroshell', 'active' => false]);
        $content = SiteContent::where('key', 'home')->firstOrFail();
        $value = $content->value;
        $value['announcement'] = 'Staff edited announcement';
        $content->update(['value' => $value]);
        $this->seed();
        $this->assertDatabaseCount('products', 30);
        $this->assertSame(2, $variant->fresh()->stock);
        $this->assertSame('STAFF-EDITED-SKU', $variant->fresh()->sku);
        $this->assertSame('staff-renamed-aeroshell', $product->fresh()->slug);
        $this->assertSame('Staff edited title', $product->fresh()->title);
        $this->assertFalse($product->fresh()->active);
        $this->assertSame('Staff edited announcement', $content->fresh()->value['announcement']);
    }

    public function test_postgresql_rejects_negative_inventory(): void
    {
        $this->seed();
        $variant = Product::firstOrFail()->variants()->firstOrFail();
        $this->expectException(QueryException::class);
        $variant->update(['stock' => -1]);
    }

    public function test_men_and_women_are_distinct_edits_with_shared_essentials(): void
    {
        $this->seed();
        $men = Collection::where('slug', 'men')->firstOrFail()->products()->pluck('slug');
        $women = Collection::where('slug', 'women')->firstOrFail()->products()->pluck('slug');
        $this->assertCount(18, $men);
        $this->assertCount(20, $women);
        $this->assertCount(8, $men->intersect($women));
        $this->assertCount(30, $men->merge($women)->unique());
        $this->assertContains('strata-rain-shell', $women);
        $this->assertContains('contour-tapered-pant', $women);
        $this->assertNotContains('aeroshell-jacket', $women);
        $this->assertContains('aeroshell-jacket', $men);
        $this->assertNotContains('strata-rain-shell', $men);
        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
        $this->get('/collections/women')->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('filters.sort', 'curated')->where('products.0.slug', 'halo-cropped-shell')->where('products.1.slug', 'linea-longline-vest'));
        $this->get('/collections/men')->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('filters.sort', 'curated')->where('products.0.slug', 'aeroshell-jacket'));
        $this->get('/collections/women?sort=price-asc')->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('filters.sort', 'price-asc')->where('products.0.slug', 'fold-beanie'));
    }

    public function test_explicit_curation_is_repeatable_and_preserves_other_catalog_data(): void
    {
        $this->seed();
        $products = Product::whereDoesntHave('collections', fn ($q) => $q->where('slug', 'womens-capsule'))->pluck('id');
        $men = Collection::where('slug', 'men')->firstOrFail();
        $women = Collection::where('slug', 'women')->firstOrFail();
        $men->products()->sync($products);
        $women->products()->sync($products);
        $men->update(['description' => 'A curation of shared technical silhouettes and utility pieces.']);
        $women->update(['description' => 'Staff curated collection description.']);
        $custom = Product::create(['title' => 'Staff piece', 'slug' => 'staff-piece', 'description' => 'Staff-owned', 'size_guide' => [], 'active' => false]);
        $men->products()->attach($custom);
        $variant = Product::where('slug', 'aeroshell-jacket')->firstOrFail()->variants()->firstOrFail();
        $variant->update(['stock' => 3, 'sku' => 'STAFF-CURATION-CHECK']);
        $primary = Collection::where('slug', 'technical-jackets')->firstOrFail()->products()->pluck('products.id')->all();
        $curator = app(\App\Services\CurateStorefrontCollections::class);
        $result = $curator->apply();
        $this->assertSame(6, $result['men']['removed']);
        $this->assertSame(10, $result['women']['removed']);
        $this->assertSame(19, $result['men']['total']);
        $this->assertTrue($men->products()->whereKey($custom->id)->exists());
        $this->assertStringContainsString('shared sizing', $men->fresh()->description);
        $this->assertSame('Staff curated collection description.', $women->fresh()->description);
        $again = $curator->apply();
        $this->assertSame(0, $again['men']['removed']);
        $this->assertSame(0, $again['women']['added']);
        $this->assertSame(3, $variant->fresh()->stock);
        $this->assertSame('STAFF-CURATION-CHECK', $variant->fresh()->sku);
        $this->assertSame($primary, Collection::where('slug', 'technical-jackets')->firstOrFail()->products()->pluck('products.id')->all());
    }
}
