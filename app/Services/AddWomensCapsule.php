<?php

namespace App\Services;

use App\Models\Collection;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AddWomensCapsule
{
    public function entries(): array
    {
        return json_decode(file_get_contents(database_path('seeders/data/womens-capsule.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    public function apply(): array
    {
        $entries = $this->entries();
        foreach ($entries as $entry) {
            foreach ($entry['colors'] as $color) {
                if (!is_file(public_path('images/products/'.$entry['slug'].'-'.Str::slug($color).'.png'))) {
                    throw new RuntimeException('Missing capsule color image: '.$entry['slug'].' '.$color);
                }
            }
        }
        return DB::transaction(function () use ($entries) {
            $result = ['products' => 0, 'variants' => 0, 'images' => 0, 'collections' => 0, 'descriptions' => 0];
            $women = Collection::where('slug', 'women')->lockForUpdate()->firstOrFail();
            $arrivals = Collection::where('slug', 'new-arrivals')->firstOrFail();
            $capsule = Collection::firstOrCreate(['slug' => 'womens-capsule'], [
                'title' => 'Women’s Capsule', 'description' => 'Six new women’s silhouettes, each in two colors. Explore cropped and longline layers, a utility skirt and wide-leg trousers. Check the capsule-specific measurements on each product.', 'active' => true,
            ]);
            $result['collections'] += (int) $capsule->wasRecentlyCreated;
            foreach ($entries as $index => $entry) {
                $prefix = sprintf('FT-WC-%02d-', $index + 1);
                $product = Product::where('slug', $entry['slug'])->lockForUpdate()->first();
                $originalImage = '/images/products/'.$entry['slug'].'-'.Str::slug($entry['colors'][0]).'.png';
                $renamed = Product::where(fn ($q) => $q->whereHas('variants', fn ($variants) => $variants->where('sku', 'like', $prefix.'%'))
                    ->orWhereHas('images', fn ($images) => $images->where('url', $originalImage)))->lockForUpdate()->first();
                if ($product && $renamed && $product->id !== $renamed->id) throw new RuntimeException('Capsule slug conflicts with a renamed product: '.$entry['slug']);
                $product ??= $renamed;
                if ($product && !$renamed) throw new RuntimeException('Existing non-capsule product uses slug: '.$entry['slug']);
                $created = !$product;
                if ($created) {
                    $measurements = $entry['kind'] === 'upper'
                        ? ['XS' => '78–84', 'S' => '85–91', 'M' => '92–98', 'L' => '99–105', 'XL' => '106–112']
                        : ['XS' => '60–66', 'S' => '67–73', 'M' => '74–80', 'L' => '81–87', 'XL' => '88–94'];
                    $product = Product::create([
                        'slug' => $entry['slug'], 'title' => $entry['title'], 'description' => $entry['description'], 'active' => true, 'featured' => false,
                        'size_guide' => ['label' => 'Women’s capsule · illustrative body '.($entry['kind'] === 'upper' ? 'chest' : 'waist').' measurements (cm)', 'measurements' => $measurements],
                    ]);
                    $result['products']++;
                }
                if (!$created) continue;
                foreach ($entry['colors'] as $colorIndex => $color) {
                    foreach (['XS', 'S', 'M', 'L', 'XL'] as $size) {
                        $variant = $product->variants()->firstOrCreate(['sku' => $prefix.($colorIndex + 1).'-'.$size], [
                            'size' => $size, 'color' => $color, 'price_cents' => $entry['price_cents'], 'stock' => 12, 'active' => true,
                        ]);
                        $result['variants'] += (int) $variant->wasRecentlyCreated;
                    }
                    $image = $product->images()->firstOrCreate(['url' => '/images/products/'.$entry['slug'].'-'.Str::slug($color).'.png'], [
                        'alt' => $entry['title'].' in '.Str::lower($color).', front studio view', 'color' => $color, 'position' => $colorIndex,
                    ]);
                    $result['images'] += (int) $image->wasRecentlyCreated;
                }
                // Existing associations, names, activity, prices and stock remain staff-owned.
                if ($created) {
                    $groups = [$women->id, $capsule->id, $arrivals->id];
                    if ($entry['category']) $groups[] = Collection::where('slug', $entry['category'])->firstOrFail()->id;
                    $product->collections()->attach($groups);
                }
            }
            $legacy = 'Longer shells, clean tapered trousers, drawstring shapes and lighter layers, finished with shared essentials. This is a curated edit with shared sizing; check each product’s measurements for fit.';
            if (in_array($women->description, [$legacy, 'A curation of shared technical silhouettes and layering pieces.'], true)) {
                $women->update(['description' => app(CurateStorefrontCollections::class)->definitions()['women']['description']]);
                $result['descriptions']++;
            }
            return $result;
        }, attempts: 3);
    }
}
