<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\PlaceDemoOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        $this->seed();
    }

    private function customer(): array
    {
        return ['name' => 'Demo Visitor', 'email' => 'visitor@example.test', 'address' => [
            'line1' => '123 Fictional Avenue', 'city' => 'Sample City', 'province' => 'Demo Province', 'postal_code' => '00000', 'country' => 'Demo Country',
        ], 'notes' => 'Fictional test details'];
    }

    public function test_catalog_browsing_cannot_exhaust_checkout_or_contact_limits(): void
    {
        for ($index = 0; $index < 25; $index++) {
            $this->getJson('/catalog/recent?slugs[]=halo-cropped-shell')->assertOk();
        }
        $this->postJson('/checkout', [])->assertUnprocessable();
        $this->postJson('/contact', [])->assertUnprocessable();
        for ($index = 1; $index < 20; $index++) {
            $this->postJson('/checkout', [])->assertUnprocessable();
        }
        $this->postJson('/checkout', [])->assertStatus(429);
    }

    private function prepareCheckout(): array
    {
        $variant = Product::where('slug', 'aeroshell-jacket')->firstOrFail()->variants()->where('size', 'M')->firstOrFail();
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 2]);
        $this->get('/checkout')->assertOk()->assertInertia(fn (Assert $page) => $page->component('storefront/checkout')->where('subtotal', 64000));

        return [$variant, session('checkout.key')];
    }

    public function test_guest_order_uses_server_snapshots_clears_bag_and_retries_once(): void
    {
        [$variant, $key] = $this->prepareCheckout();
        $stock = $variant->stock;
        $payload = [...$this->customer(), 'key' => $key, 'total_cents' => 1, 'status' => 'cancelled'];
        $this->post('/checkout', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $order = Order::sole();
        $this->assertSame(64000, $order->total_cents);
        $this->assertSame('new', $order->status);
        $this->assertSame($stock - 2, $variant->fresh()->stock);
        $this->assertSame('AeroShell Jacket', $order->items()->sole()->title);
        $this->assertSame(2, $order->items()->sole()->quantity);
        $this->assertEmpty(session('cart'));
        $this->assertNull(session('checkout'));
        // Retrying the old form must not clear a new bag or place another order.
        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 1]);
        $this->post('/checkout', $payload)->assertRedirect('/order-confirmation/'.$order->public_reference);
        $this->assertDatabaseCount('orders', 1);
        $this->assertSame($stock - 2, $variant->fresh()->stock);
        $this->assertSame(1, session('cart.'.$variant->id));
        $variant->product->update(['title' => 'Edited after checkout']);
        $this->get('/order-confirmation/'.$order->public_reference)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('storefront/confirmation')->where('order.items.0.title', 'AeroShell Jacket')
            ->missing('order.customer_name')->missing('order.customer_email')->missing('order.address')->missing('order.notes')->missing('order.checkout_idempotency_key'));
        $this->get('/order-confirmation/1')->assertNotFound();
        $this->get('/order-confirmation/'.Str::uuid())->assertNotFound();
    }

    public function test_empty_bag_invalid_customer_and_foreign_key_are_rejected(): void
    {
        $this->get('/checkout')->assertRedirect('/cart');
        [$variant, $key] = $this->prepareCheckout();
        $this->from('/checkout')->post('/checkout', ['key' => $key])->assertSessionHasErrors(['name', 'email', 'address']);
        $this->post('/checkout', [...$this->customer(), 'key' => (string) Str::uuid()])->assertSessionHasErrors('checkout');
        $this->post('/checkout', [...$this->customer(), 'key' => $key, 'email' => 'invalid'])->assertSessionHasErrors('email');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(2, session('cart.'.$variant->id));
    }

    public function test_price_change_requires_review_and_rotates_the_checkout_key(): void
    {
        [$variant, $key] = $this->prepareCheckout();
        $stock = $variant->stock;
        $variant->update(['price_cents' => 33000]);
        $this->from('/checkout')->post('/checkout', [...$this->customer(), 'key' => $key])->assertSessionHasErrors('checkout');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame($stock, $variant->fresh()->stock);
        $this->get('/checkout')->assertInertia(fn (Assert $page) => $page->where('subtotal', 66000));
        $newKey = session('checkout.key');
        $this->assertNotSame($key, $newKey);
        $this->post('/checkout', [...$this->customer(), 'key' => $key])->assertSessionHasErrors('checkout');
        $this->post('/checkout', [...$this->customer(), 'key' => $newKey])->assertSessionHasNoErrors();
        $this->assertSame(66000, Order::sole()->total_cents);
    }

    public function test_stock_or_archiving_failure_preserves_cart_and_rejects_all_lines(): void
    {
        [$variant, $key] = $this->prepareCheckout();
        $other = Product::where('slug', 'vector-cargo-pant')->firstOrFail()->variants()->where('size', 'M')->firstOrFail();
        $stock = $variant->stock;
        $this->post('/cart', ['variant_id' => $other->id, 'quantity' => 1]);
        $this->post('/checkout', [...$this->customer(), 'key' => $key])->assertSessionHasErrors('checkout');
        $this->get('/checkout');
        $key = session('checkout.key');
        $other->update(['stock' => 0]);
        $this->post('/checkout', [...$this->customer(), 'key' => $key])->assertSessionHasErrors('checkout');
        $this->assertSame($stock, $variant->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame(2, session('cart.'.$variant->id));
        $this->get('/checkout')->assertRedirect('/cart');
        $other->update(['stock' => 2]);
        $variant->product->update(['active' => false]);
        $this->post('/checkout', [...$this->customer(), 'key' => $key])->assertSessionHasErrors('checkout');
    }

    public function test_transaction_rolls_back_order_and_stock_if_snapshot_write_fails(): void
    {
        [$variant, $key] = $this->prepareCheckout();
        $stock = $variant->stock;
        OrderItem::creating(function () { throw new \RuntimeException('Simulated snapshot write failure'); });
        try {
            app(PlaceDemoOrder::class)->place($key, session('cart'), session('checkout.quote'), $this->customer());
            $this->fail('Expected simulated failure');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated snapshot write failure', $exception->getMessage());
        } finally {
            OrderItem::flushEventListeners();
        }
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame($stock, $variant->fresh()->stock);
        $this->assertSame(2, session('cart.'.$variant->id));
    }
}
