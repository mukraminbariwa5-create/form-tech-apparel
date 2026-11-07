<?php

// Add the approved capsule without resetting or reseeding existing records.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo json_encode(app(\App\Services\AddWomensCapsule::class)->apply(), JSON_PRETTY_PRINT)."\n";
