<?php

// Add the owner-approved colorways without reseeding/resetting a working store.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo json_encode(app(\App\Services\AddCatalogColorways::class)->apply(), JSON_PRETTY_PRINT)."\n";
