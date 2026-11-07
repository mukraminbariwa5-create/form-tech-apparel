<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        $this->seed();
    }

    public function test_server_cart_ignores_client_price_persists_and_updates(): void
    {
        $variant = Product::where('slug', 'aeroshell-jacket')->firstOrFail()->variants()->where('size', 'M')->firstOrFail();
        $this->from('/products/aeroshell-jacket')->post('/cart', ['variant_id' => $variant->id, 'quantity' => 2, 'price_cents' => 1])->assertRedirect()->assertSessionHas('cart.'.$variant->id, 2);
        $this->get('/cart')->assertOk()->assertInertia(fn (Assert $page) => $page->where('subtotal', 64000)->where('lines.0.quantity', 2));
        $variant->update(['price_cents' => 33000]);
        $this->get('/cart')->assertInertia(fn (Assert $page) => $page->where('subtotal', 66000));
        $this->patch('/cart', ['variant_id' => $variant->id, 'quantity' => 1])->assertRedirect()->assertSessionHas('cart.'.$variant->id, 1);
        $this->delete('/cart/'.$variant->id)->assertRedirect()->assertSessionMissing('cart.'.$variant->id);
    }

    public function test_cart_rejects_invalid_and_excess_stock_and_flags_stale_stock(): void
    {
        $product = Product::where('slug', 'aeroshell-jacket')->firstOrFail();
        $variant = $product->variants()->where('size', 'M')->firstOrFail();
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => $variant->stock + 1])->assertSessionHasErrors('quantity');
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 0])->assertSessionHasErrors('quantity');
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 2])->assertSessionHasNoErrors();
        $variant->update(['stock' => 0]);
        $this->get('/cart')->assertInertia(fn (Assert $page) => $page->where('lines.0.available', false));
        $product->update(['active' => false]);
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 1])->assertSessionHasErrors('quantity');
    }
}
