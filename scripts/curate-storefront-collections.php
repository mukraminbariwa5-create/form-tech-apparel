<?php

// Explicit one-time merchandising update; never reset or reseed an existing store.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (!in_array('--apply', $argv, true)) {
    echo json_encode(app(\App\Services\CurateStorefrontCollections::class)->definitions(), JSON_PRETTY_PRINT)."\n";
    exit;
}

$snapshot = [];
foreach (\App\Models\Collection::whereIn('slug', ['men', 'women'])->with('products:id,slug')->get() as $collection) {
    $snapshot[$collection->slug] = ['id' => $collection->id, 'description' => $collection->description, 'product_ids' => $collection->products->pluck('id')->all()];
}
$directory = base_path('.setup');
if (!is_dir($directory)) mkdir($directory, 0700, true);
$backup = $directory.'/collection-curation-before-2026-11-05.json';
if (!file_exists($backup) && file_put_contents($backup, json_encode($snapshot, JSON_PRETTY_PRINT), LOCK_EX) === false) {
    throw new RuntimeException('Could not save collection association snapshot. No changes applied.');
}
echo json_encode(app(\App\Services\CurateStorefrontCollections::class)->apply(), JSON_PRETTY_PRINT)."\n";
