<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Collection extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'image_url', 'active'];
    protected function casts(): array { return ['active' => 'boolean']; }
    public function products(): BelongsToMany { return $this->belongsToMany(Product::class); }
}
