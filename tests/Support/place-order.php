<?php

use App\Services\PlaceDemoOrder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Validation\ValidationException;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.connections.pgsql.database') !== 'form_tech_testing') {
    exit(3);
}
$id = (int) $argv[1];
echo "ready\n";
try {
    $order = app(PlaceDemoOrder::class)->place($argv[2], [$id => 1], [$id => ['quantity' => 1, 'price' => 32000]], [
        'name' => 'Concurrency Demo', 'email' => 'concurrency@example.test',
        'address' => ['line1' => 'Fictional', 'city' => 'Demo', 'province' => 'Demo', 'postal_code' => '00000', 'country' => 'Demo'],
    ]);
    echo $order->public_reference;
} catch (ValidationException) {
    echo 'stock-conflict';
    exit(2);
}
