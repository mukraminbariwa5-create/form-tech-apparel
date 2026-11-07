<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateDemoOrder
{
    public function update(Order $order, string $status): void
    {
        DB::transaction(function () use ($order, $status) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === $status) { return; }
            if ($locked->status === 'cancelled') {
                throw ValidationException::withMessages(['status' => 'Cancelled demo orders cannot be reopened.']);
            }
            if (! in_array($status, ['new', 'reviewed', 'cancelled'], true)) {
                throw ValidationException::withMessages(['status' => 'Choose a valid demo order status.']);
            }
            if ($status === 'cancelled') {
                $items = $locked->items()->get();
                $ids = $items->pluck('variant_id')->filter();
                $productIds = Variant::whereIn('id', $ids)->pluck('product_id');
                Product::whereIn('id', $productIds)->orderBy('id')->lockForUpdate()->get();
                $variants = Variant::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
                foreach ($items as $item) {
                    if ($variant = $variants->get($item->variant_id)) { $variant->increment('stock', $item->quantity); }
                }
            }
            $locked->update(['status' => $status]);
        }, attempts: 3);
    }
}
