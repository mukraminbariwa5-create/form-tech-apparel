<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\Product;
use App\Models\SiteContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // An initialized store is merchant-owned data. Do not recreate renamed
        // products/SKUs or restore associations that staff deliberately changed.
        if (SiteContent::where('key', 'home')->exists()) {
            return;
        }
        $catalog = json_decode(file_get_contents(__DIR__.'/data/catalog.json'), true, flags: JSON_THROW_ON_ERROR);
        foreach ($catalog as $entry) {
            if (! is_file(public_path('images/products/'.Str::slug($entry['title']).'.png'))) {
                throw new RuntimeException('Catalog image missing for '.$entry['title'].'. Complete assets before seeding.');
            }
        }
        foreach (['collections/technical-jackets.png', 'collections/tech-pants.png', 'collections/layering-systems.png', 'campaign/mountain-editorial.png'] as $image) {
            if (! is_file(public_path('images/'.$image))) {
                throw new RuntimeException('Campaign image missing: '.$image);
            }
        }

        DB::transaction(function () use ($catalog) {
            $edits = app(\App\Services\CurateStorefrontCollections::class)->definitions();
            $collections = [];
            foreach ([
                'technical-jackets' => ['Technical Jackets', 'Architectural shells, parkas and lighter outer layers.'],
                'tech-pants' => ['Tech Pants', 'Utility silhouettes for a considered daily wardrobe.'],
                'layering-systems' => ['Layering Systems', 'Tees, midlayers and vests to combine your own way.'],
                'accessories' => ['Accessories', 'Compact carry pieces and everyday finishing details.'],
                'new-arrivals' => ['New Arrivals', 'A curated introduction to the fictional FORM/TECH collection.'],
                'men' => ['Men', $edits['men']['description']],
                'women' => ['Women', $edits['women']['description']],
            ] as $slug => [$title, $description]) {
                $image = public_path('images/collections/'.$slug.'.png');
                $collections[$slug] = Collection::firstOrCreate(['slug' => $slug], [
                    'title' => $title, 'description' => $description,
                    'image_url' => is_file($image) ? '/images/collections/'.$slug.'.png' : null,
                    'active' => true,
                ]);
            }

            foreach ($catalog as $index => $entry) {
                $sizes = match ($entry['kind']) {
                    'one-size' => ['One size'], 'belt' => ['80–100 cm', '100–120 cm'],
                    default => ['S', 'M', 'L', 'XL'],
                };
                $guide = match ($entry['kind']) {
                    'upper' => ['label' => 'Illustrative body chest measurements (cm)', 'measurements' => ['S' => '88–94', 'M' => '95–101', 'L' => '102–108', 'XL' => '109–116']],
                    'lower' => ['label' => 'Illustrative body waist measurements (cm)', 'measurements' => ['S' => '72–78', 'M' => '79–85', 'L' => '86–92', 'XL' => '93–100']],
                    'belt' => ['label' => 'Illustrative adjustable waist range', 'measurements' => ['80–100 cm' => '80–100 cm', '100–120 cm' => '100–120 cm']],
                    default => ['label' => 'Single sample size; this is fictional merchandise.', 'measurements' => ['One size' => 'One size']],
                };
                $featured = in_array($entry['title'], ['AeroShell Jacket', 'Vector Cargo Pant', 'Ridge Pullover', 'Transit Vest'], true);
                $product = Product::firstOrCreate(['slug' => Str::slug($entry['title'])], [
                    'title' => $entry['title'], 'description' => $entry['description'],
                    'size_guide' => $guide, 'active' => true, 'featured' => $featured,
                ]);
                // Seeding creates missing demo products; it never resets existing products or inventory.
                if (! $product->wasRecentlyCreated) {
                    continue;
                }
                foreach ($sizes as $sizeIndex => $size) {
                    $product->variants()->create([
                        'sku' => sprintf('FT-%03d-%02d', $index + 1, $sizeIndex + 1),
                        'size' => $size, 'color' => $entry['color'], 'price_cents' => $entry['price_cents'],
                        'stock' => ($index % 6 === 0 && $sizeIndex === count($sizes) - 1) ? 0 : 8 + (($index + $sizeIndex) % 17),
                        'active' => true,
                    ]);
                }
                $product->images()->create([
                    'url' => '/images/products/'.$product->slug.'.png',
                    'alt' => $entry['title'].' in '.Str::lower($entry['color']).', front studio view',
                    'position' => 0,
                ]);
                $groups = [$collections[$entry['category']]->id];
                foreach ($edits as $slug => $edit) {
                    if (in_array($product->slug, $edit['products'], true)) $groups[] = $collections[$slug]->id;
                }
                if ($index < 3 || $featured) {
                    $groups[] = $collections['new-arrivals']->id;
                }
                $product->collections()->attach(array_unique($groups));
            }

            SiteContent::firstOrCreate(['key' => 'home'], ['value' => [
                'announcement' => 'PORTFOLIO DEMO · NO PAYMENTS OR FULFILLMENT',
                'hero' => [
                    'eyebrow' => 'FUNCTION SHAPES A BRIGHTER TOMORROW',
                    'headline' => 'APPAREL FOR A MORE OPEN WORLD',
                    'body' => 'Technical clothing for wherever next. Performance. Purpose. Perspective.',
                    'image' => '/images/campaign/form-tech-concrete-hero.png',
                    'primary_label' => 'Shop New Arrivals', 'primary_href' => '/collections/new-arrivals',
                    'secondary_label' => 'Explore Collections', 'secondary_href' => '/#collections',
                ],
                'editorial' => [
                    'headline' => 'DESIGNED FOR A MORE OPEN WORLD',
                    'body' => 'A fictional wardrobe exploring the space between city structure and open landscapes. Considered shapes. Everyday perspective.',
                    'image' => '/images/campaign/mountain-editorial.png',
                    'cta_label' => 'Explore Our Approach', 'cta_href' => '/technology',
                ],
                'brand_statement' => 'Form follows possibility. An imagined collection of technical clothing for wherever next.',
                'featured_product_ids' => collect(['aeroshell-jacket', 'vector-cargo-pant', 'ridge-pullover', 'transit-vest'])->map(fn ($slug) => Product::where('slug', $slug)->value('id'))->all(),
            ]]);
            app(\App\Services\AddCatalogColorways::class)->apply();
            app(\App\Services\AddWomensCapsule::class)->apply();
        });
    }
}
