<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class OrderConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    public static function keys(): array { return ['competing orders' => [false], 'duplicate submission' => [true]]; }

    #[DataProvider('keys')]
    public function test_concurrent_checkouts_do_not_oversell_or_duplicate(bool $sameKey): void
    {
        $this->assertSame('form_tech_testing', DB::connection()->getDatabaseName());
        $this->seed();
        $variant = Product::where('slug', 'aeroshell-jacket')->firstOrFail()->variants()->where('size', 'M')->firstOrFail();
        $variant->update(['stock' => 1]);
        $key = (string) Str::uuid();
        $connection = config('database.connections.pgsql');
        $environment = ['APP_ENV' => 'testing', 'DB_CONNECTION' => 'pgsql', 'DB_URL' => '', 'DB_DATABASE' => 'form_tech_testing',
            'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'], 'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password']];
        $processes = [
            new Process([PHP_BINARY, base_path('tests/Support/place-order.php'), (string) $variant->id, $key], base_path(), $environment),
            new Process([PHP_BINARY, base_path('tests/Support/place-order.php'), (string) $variant->id, $sameKey ? $key : (string) Str::uuid()], base_path(), $environment),
        ];
        DB::beginTransaction();
        $variant->product()->lockForUpdate()->first();
        try {
            foreach ($processes as $process) { $process->setTimeout(20)->start(); }
            $deadline = microtime(true) + 10;
            do {
                $ready = collect($processes)->every(fn ($process) => str_contains($process->getOutput(), 'ready'));
                if (! $ready) { usleep(20000); }
            } while (! $ready && microtime(true) < $deadline);
            $this->assertTrue($ready, 'Both isolated workers must reach checkout.');
        } finally {
            DB::commit();
        }
        foreach ($processes as $process) { $process->wait(); }
        $codes = array_map(fn ($process) => $process->getExitCode(), $processes);
        sort($codes);
        $this->assertSame($sameKey ? [0, 0] : [0, 2], $codes);
        $this->assertSame(0, $variant->fresh()->stock);
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 1);
        if ($sameKey) {
            $this->assertSame(trim($processes[0]->getOutput()), trim($processes[1]->getOutput()));
        }
        $this->assertSame(32000, Order::sole()->total_cents);
    }
}
