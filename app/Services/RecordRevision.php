<?php

namespace App\Services;

use App\Models\Collection;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

class RecordRevision
{
    public static function of(Model $record): string
    {
        $values = [$record->getRawOriginal()];
        if ($record instanceof Product) {
            $values[] = $record->variants()->orderBy('id')->get()->map->getRawOriginal()->all();
            $values[] = $record->images()->get()->map->getRawOriginal()->all();
            $values[] = $record->collections()->orderBy('collections.id')->pluck('collections.id')->all();
        } elseif ($record instanceof Collection) {
            $values[] = $record->products()->orderBy('products.id')->pluck('products.id')->all();
        }
        return hash('sha256', serialize($values));
    }
}
