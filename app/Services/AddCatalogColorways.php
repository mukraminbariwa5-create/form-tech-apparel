<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AddCatalogColorways
{
    public function apply(): array
    {
        $entries = json_decode(file_get_contents(database_path('seeders/data/colorways.json')), true, flags: JSON_THROW_ON_ERROR);
        $catalog = collect(json_decode(file_get_contents(database_path('seeders/data/catalog.json')), true, flags: JSON_THROW_ON_ERROR))->keyBy(fn ($entry) => Str::slug($entry['title']));
        // Validate every asset before any writes; never leave a partial catalog.
        foreach ($entries as $entry) {
            $file = 'images/products/'.$entry['slug'].'-'.Str::slug($entry['color']).'.png';
            if (! is_file(public_path($file))) { throw new RuntimeException('Colorway asset missing: '.$file); }
        }
        return DB::transaction(function () use ($entries, $catalog) {
            $result = ['variants' => 0, 'images' => 0, 'descriptions' => 0, 'skipped' => []];
            foreach ($entries as $entry) {
                $product = Product::where('slug', $entry['slug'])->lockForUpdate()->first();
                $base = $catalog->get($entry['slug']);
                if (! $product || ! $base) { $result['skipped'][] = $entry['slug']; continue; }
                $variants = $product->variants()->where('color', $base['color'])->where('active', true)->orderBy('id')->lockForUpdate()->get();
                if ($variants->isEmpty()) { $result['skipped'][] = $entry['slug']; continue; }
                foreach ($variants as $variant) {
                    $added = $product->variants()->firstOrCreate(['size' => $variant->size, 'color' => $entry['color']], [
                        'sku' => 'FT-CW-'.$product->id.'-'.strtoupper(substr(hash('sha256', $entry['color'].'|'.$variant->size), 0, 10)),
                        'price_cents' => $variant->price_cents, 'stock' => 12, 'active' => true,
                    ]);
                    $result['variants'] += (int) $added->wasRecentlyCreated;
                }
                // Tag only the known original image; keep merchant-added/shared images intact.
                $product->images()->where('url', '/images/products/'.$entry['slug'].'.png')->whereNull('color')->update(['color' => $base['color']]);
                $url = '/images/products/'.$entry['slug'].'-'.Str::slug($entry['color']).'.png';
                $image = $product->images()->firstOrCreate(['url' => $url], [
                    'alt' => $product->title.' in '.Str::lower($entry['color']).', front studio view', 'color' => $entry['color'],
                    'position' => ((int) $product->images()->max('position')) + 1,
                ]);
                $result['images'] += (int) $image->wasRecentlyCreated;
                if (isset($entry['description']) && $product->description === $base['description']) {
                    $product->update(['description' => $entry['description']]);
                    $result['descriptions']++;
                }
            }
            return $result;
        }, attempts: 3);
    }
}
