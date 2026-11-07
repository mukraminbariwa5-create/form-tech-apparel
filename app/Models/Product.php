<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'size_guide', 'active', 'featured'];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'featured' => 'boolean', 'size_guide' => 'array'];
    }

    public function variants(): HasMany { return $this->hasMany(Variant::class); }
    public function images(): HasMany { return $this->hasMany(ProductImage::class)->orderBy('position'); }
    public function collections(): BelongsToMany { return $this->belongsToMany(Collection::class); }
}
