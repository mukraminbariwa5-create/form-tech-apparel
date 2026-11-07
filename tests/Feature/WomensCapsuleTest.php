<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Product;
use App\Models\Variant;
use App\Services\AddWomensCapsule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WomensCapsuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_six_distinct_products_have_two_images_and_five_sizes_per_color(): void
    {
        $this->seed();
        $capsule = Collection::where('slug', 'womens-capsule')->firstOrFail();
        $this->assertSame(6, $capsule->products()->count());
        foreach ($capsule->products()->with(['images', 'variants', 'collections'])->get() as $product) {
            $this->assertCount(10, $product->variants);
            $this->assertCount(2, $product->images);
            $this->assertContains('women', $product->collections->pluck('slug'));
            $this->assertNotContains('men', $product->collections->pluck('slug'));
            $this->assertStringContainsString('Women’s capsule', $product->size_guide['label']);
            foreach ($product->variants->groupBy('color') as $color => $variants) {
                $this->assertSame(['XS', 'S', 'M', 'L', 'XL'], $variants->pluck('size')->values()->all());
                $image = $product->images->firstWhere('color', $color);
                $this->assertNotNull($image);
                $this->assertFileExists(public_path(ltrim($image->url, '/')));
            }
        }
    }

    public function test_existing_store_addition_preserves_original_stock_prices_and_merchandising(): void
    {
        // Reproduce the pre-capsule store using the real base seeder with its extension disabled.
        $this->app->instance(AddWomensCapsule::class, new class extends AddWomensCapsule {
            public function apply(): array { return []; }
        });
        $this->seed();
        $this->app->forgetInstance(AddWomensCapsule::class);
        $originalIds = Variant::pluck('id');
        $variant = Variant::firstOrFail();
        $variant->update(['stock' => 3, 'price_cents' => 33333, 'sku' => 'ORIGINAL-STAFF-SKU']);
        $before = Variant::whereIn('id', $originalIds)->orderBy('id')->get()->toArray();
        $result = app(AddWomensCapsule::class)->apply();
        $this->assertSame(6, $result['products']);
        $this->assertSame(60, $result['variants']);
        $this->assertSame(12, $result['images']);
        $this->assertDatabaseCount('products', 30);
        $this->assertSame($before, Variant::whereIn('id', $originalIds)->orderBy('id')->get()->toArray());
        $this->assertSame(18, Collection::where('slug', 'men')->firstOrFail()->products()->count());
        $this->assertSame(20, Collection::where('slug', 'women')->firstOrFail()->products()->count());
    }

    public function test_repeat_does_not_restore_stock_or_overwrite_staff_edits_and_renamed_product(): void
    {
        $this->seed();
        $product = Product::where('slug', 'halo-cropped-shell')->firstOrFail();
        $variant = $product->variants()->firstOrFail();
        $variant->update(['stock' => 2, 'price_cents' => 27123, 'sku' => 'STAFF-CAPSULE-SKU', 'active' => false]);
        $product->update(['slug' => 'staff-renamed-halo', 'description' => 'Staff capsule description.', 'active' => false]);
        $women = Collection::where('slug', 'women')->firstOrFail();
        $women->products()->detach($product->id);
        $women->update(['description' => 'Staff collection description.']);
        $result = app(AddWomensCapsule::class)->apply();
        $this->assertSame(0, array_sum($result));
        $this->assertDatabaseCount('products', 30);
        $this->assertDatabaseCount('variants', 218);
        $this->assertSame(2, $variant->fresh()->stock);
        $this->assertSame(27123, $variant->fresh()->price_cents);
        $this->assertSame('STAFF-CAPSULE-SKU', $variant->fresh()->sku);
        $this->assertFalse($variant->fresh()->active);
        $this->assertFalse($product->fresh()->active);
        $this->assertSame('Staff capsule description.', $product->fresh()->description);
        $this->assertSame('Staff collection description.', $women->fresh()->description);
        $this->assertFalse($women->products()->whereKey($product->id)->exists());
    }
}
