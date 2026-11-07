<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Services\AddCatalogColorways;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ColorwaysTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        $this->seed();
    }

    public function test_every_product_has_two_real_colors_with_matching_images_and_sizes(): void
    {
        foreach (Product::with(['variants', 'images'])->get() as $product) {
            $colors = $product->variants->groupBy('color');
            $this->assertCount(2, $colors, $product->slug);
            $sizes = null;
            foreach ($colors as $color => $variants) {
                $this->assertNotNull($product->images->firstWhere('color', $color), $product->slug.' '.$color);
                $current = $variants->pluck('size')->sort()->values()->all();
                if ($sizes !== null) $this->assertSame($sizes, $current);
                $sizes = $current;
            }
        }
    }

    public function test_addition_is_idempotent_and_preserves_merchant_stock_prices_and_copy(): void
    {
        $product = Product::where('slug', 'aeroshell-jacket')->firstOrFail();
        $variant = $product->variants()->where('color', 'Charcoal')->firstOrFail();
        $variant->update(['stock' => 3, 'price_cents' => 34500, 'active' => false, 'sku' => 'MERCHANT-COLOR-SKU']);
        $product->update(['description' => 'Merchant copy must stay intact.']);
        $result = app(AddCatalogColorways::class)->apply();
        $this->assertSame(0, $result['variants']);
        $this->assertSame(0, $result['images']);
        $this->assertDatabaseCount('variants', 218);
        $this->assertSame(3, $variant->fresh()->stock);
        $this->assertSame(34500, $variant->fresh()->price_cents);
        $this->assertFalse($variant->fresh()->active);
        $this->assertSame('MERCHANT-COLOR-SKU', $variant->fresh()->sku);
        $this->assertSame('Merchant copy must stay intact.', $product->fresh()->description);
    }

    public function test_filtered_cards_and_deep_links_use_the_real_color_image(): void
    {
        $this->get('/shop?q=AeroShell&color=Charcoal')->assertInertia(fn (Assert $page) => $page
            ->where('products.0.colors', ['Charcoal'])
            ->where('products.0.colorOptions.0.image.url', '/images/products/aeroshell-jacket-charcoal.png'));
        $this->get('/products/aeroshell-jacket?color=Charcoal')->assertInertia(fn (Assert $page) => $page
            ->where('product.initialColor', 'Charcoal')->where('product.images.1.color', 'Charcoal'));
        $this->get('/products/aeroshell-jacket?color=Unknown')->assertInertia(fn (Assert $page) => $page->where('product.initialColor', null));
    }

    public function test_bag_uses_selected_variant_color_image_and_checkout_keeps_that_variant(): void
    {
        $product = Product::where('slug', 'aeroshell-jacket')->firstOrFail();
        $variant = $product->variants()->where('color', 'Charcoal')->where('size', 'M')->firstOrFail();
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 1])->assertSessionHasNoErrors();
        $this->get('/cart')->assertInertia(fn (Assert $page) => $page
            ->where('lines.0.id', $variant->id)->where('lines.0.color', 'Charcoal')
            ->where('lines.0.image.url', '/images/products/aeroshell-jacket-charcoal.png'));
        $this->get('/checkout')->assertInertia(fn (Assert $page) => $page->where('lines.0.id', $variant->id)->where('lines.0.color', 'Charcoal'));
    }
}
