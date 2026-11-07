<?php

// One-time local refinement: preserve staff merchandising and all other content.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\Illuminate\Support\Facades\DB::transaction(function () {
    $home = \App\Models\SiteContent::where('key', 'home')->lockForUpdate()->firstOrFail();
    $products = \App\Models\Product::whereIn('slug', ['aeroshell-jacket', 'ridge-pullover', 'vector-cargo-pant', 'transit-vest'])->get()->keyBy('slug');
    if ($products->count() !== 4) { throw new RuntimeException('Expected products missing; merchandising unchanged.'); }
    $original = collect(['aeroshell-jacket', 'ridge-pullover', 'vector-cargo-pant', 'transit-vest'])->map(fn ($slug) => $products[$slug]->id)->all();
    $target = collect(['aeroshell-jacket', 'vector-cargo-pant', 'ridge-pullover', 'transit-vest'])->map(fn ($slug) => $products[$slug]->id)->all();
    $value = $home->value;
    if ($value['featured_product_ids'] === $target) { echo "Featured order already aligned.\n"; return; }
    if ($value['featured_product_ids'] !== $original || $home->updated_at->ne($home->created_at)) {
        echo "Existing merchandising edits preserved; order unchanged.\n"; return;
    }
    $value['featured_product_ids'] = $target;
    $home->update(['value' => $value]);
    echo 'Featured product IDs aligned: '.implode(', ', $target).". All other content preserved.\n";
});
