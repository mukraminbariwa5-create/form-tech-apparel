<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Variant extends Model
{
    protected $fillable = ['product_id', 'sku', 'size', 'color', 'price_cents', 'stock', 'active'];
    protected function casts(): array { return ['active' => 'boolean', 'stock' => 'integer', 'price_cents' => 'integer']; }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
