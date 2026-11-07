<?php

namespace App\Services;

use App\Models\Collection;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CurateStorefrontCollections
{
    public function definitions(): array
    {
        return json_decode(file_get_contents(database_path('seeders/data/collection-edits.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    public function apply(): array
    {
        $definitions = array_intersect_key($this->definitions(), array_flip(['men', 'women']));
        $knownSlugs = collect(json_decode(file_get_contents(database_path('seeders/data/catalog.json')), true, flags: JSON_THROW_ON_ERROR))
            ->map(fn ($entry) => Str::slug($entry['title']));
        $oldDescriptions = [
            'men' => 'A curation of shared technical silhouettes and utility pieces.',
            'women' => 'A curation of shared technical silhouettes and layering pieces.',
        ];

        return DB::transaction(function () use ($definitions, $knownSlugs, $oldDescriptions) {
            // Match only original slugs. Renamed/custom products and other collections stay staff-owned.
            $products = Product::whereIn('slug', $knownSlugs)->get(['id', 'slug'])->keyBy('slug');
            $result = [];
            foreach ($definitions as $slug => $definition) {
                $collection = Collection::where('slug', $slug)->lockForUpdate()->firstOrFail();
                $desired = collect($definition['products'])->filter(fn ($item) => $products->has($item))->map(fn ($item) => $products[$item]->id);
                $before = $collection->products()->pluck('products.id');
                $remove = $products->pluck('id')->diff($desired)->intersect($before)->values();
                $add = $desired->diff($before)->values();
                $collection->products()->detach($remove);
                $collection->products()->syncWithoutDetaching($add->all());
                $descriptionUpdated = $collection->description === $oldDescriptions[$slug];
                if ($descriptionUpdated) $collection->update(['description' => $definition['description']]);
                $result[$slug] = [
                    'added' => $add->count(), 'removed' => $remove->count(),
                    'total' => $collection->products()->count(), 'description_updated' => $descriptionUpdated,
                    'unmatched_original_slugs' => $knownSlugs->diff($products->keys())->values()->all(),
                ];
            }
            return $result;
        });
    }
}
