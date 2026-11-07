<?php

namespace App\Services;

use App\Models\Variant;

class CartSnapshot
{
    public function get(array $cart): array
    {
        $variants = Variant::with('product.images')->whereIn('id', array_keys($cart))->get()->keyBy('id');
        $lines = collect($cart)->map(function ($quantity, $id) use ($variants) {
            $variant = $variants->get($id);
            $product = $variant?->product;

            return [
                'id' => (int) $id, 'quantity' => $quantity, 'title' => $product?->title ?? 'Unavailable item',
                'slug' => $product?->active ? $product->slug : null, 'size' => $variant?->size, 'color' => $variant?->color,
                'price' => $variant?->price_cents, 'stock' => $variant?->stock ?? 0,
                'image' => ($product?->images->firstWhere('color', $variant?->color) ?? $product?->images->firstWhere('color', null))?->only(['url', 'alt']),
                'available' => $variant && $variant->active && $product?->active && $variant->stock >= $quantity,
            ];
        })->values();

        return ['lines' => $lines->all(), 'subtotal' => $lines->sum(fn ($line) => ($line['price'] ?? 0) * $line['quantity'])];
    }
}
