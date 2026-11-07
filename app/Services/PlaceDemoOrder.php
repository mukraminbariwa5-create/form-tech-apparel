<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PlaceDemoOrder
{
    public function place(string $key, array $cart, array $quote, array $customer): Order
    {
        return DB::transaction(function () use ($key, $cart, $quote, $customer) {
            // Serialize this checkout key even before an order row exists. Hash collisions only serialize unrelated orders.
            DB::select('SELECT pg_advisory_xact_lock(hashtext(?))', [$key]);
            if ($existing = Order::where('checkout_idempotency_key', $key)->first()) {
                return $existing;
            }
            if (! $cart) {
                $this->invalid('Your demo bag is empty.');
            }

            // Stable lock order prevents overselling and coordinates with catalog archiving/edits.
            $productIds = Variant::whereIn('id', array_keys($cart))->pluck('product_id');
            $products = Product::whereIn('id', $productIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $variants = Variant::whereIn('id', array_keys($cart))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $items = [];
            $subtotal = 0;
            foreach ($cart as $id => $quantity) {
                $variant = $variants->get($id);
                $product = $variant ? $products->get($variant->product_id) : null;
                if (! is_int($quantity) || $quantity < 1 || ! $variant?->active || ! $product?->active || $quantity > $variant->stock) {
                    $this->invalid('An item is unavailable or its stock changed. Return to your bag and update it.');
                }
                if (($quote[$id]['quantity'] ?? null) !== $quantity || ($quote[$id]['price'] ?? null) !== $variant->price_cents) {
                    $this->invalid('Your bag or a price changed. Review the updated checkout before submitting again.');
                }
                $subtotal += $variant->price_cents * $quantity;
                if ($subtotal > 2147483647) {
                    $this->invalid('This demo order exceeds the supported total. Reduce the quantities in your bag.');
                }
                $items[] = ['variant_id' => $variant->id, 'title' => $product->title, 'sku' => $variant->sku,
                    'size' => $variant->size, 'color' => $variant->color, 'price_cents' => $variant->price_cents, 'quantity' => $quantity];
            }
            $order = Order::create([
                'public_reference' => (string) Str::uuid(), 'checkout_idempotency_key' => $key,
                'customer_name' => $customer['name'], 'customer_email' => $customer['email'],
                'address' => $customer['address'], 'notes' => $customer['notes'] ?? null,
                'subtotal_cents' => $subtotal, 'shipping_cents' => 0, 'tax_cents' => 0, 'total_cents' => $subtotal,
                'currency' => 'USD', 'status' => 'new', 'demo' => true,
            ]);
            foreach ($items as $item) {
                $variants->get($item['variant_id'])->decrement('stock', $item['quantity']);
                $order->items()->create($item);
            }

            return $order;
        }, attempts: 3);
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['checkout' => $message]);
    }
}
