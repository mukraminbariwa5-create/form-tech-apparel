<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = ['public_reference', 'checkout_idempotency_key', 'customer_name', 'customer_email', 'address', 'notes', 'subtotal_cents', 'shipping_cents', 'tax_cents', 'total_cents', 'currency', 'status', 'demo'];
    protected $hidden = ['checkout_idempotency_key', 'customer_email', 'address', 'notes'];
    protected function casts(): array { return ['address' => 'array', 'demo' => 'boolean']; }
    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
}
