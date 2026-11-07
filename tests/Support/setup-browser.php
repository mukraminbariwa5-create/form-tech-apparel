<?php

// Disposable browser-test database only. Never point this fixture at the app database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! app()->environment('testing') || config('database.connections.pgsql.database') !== 'form_tech_e2e') {
    fwrite(STDERR, "Browser setup requires APP_ENV=testing and DB_DATABASE=form_tech_e2e.\n");
    exit(1);
}
\Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
\Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
$directory = base_path('.setup');
if (! is_dir($directory)) { mkdir($directory, 0700, true); }
$credentials = ['email' => 'browser-staff@example.test', 'password' => bin2hex(random_bytes(24))];
\App\Models\User::create(['name' => 'Disposable Browser Staff', ...$credentials, 'is_admin' => true]);
file_put_contents($directory.'/browser-credentials.json', json_encode($credentials));
chmod($directory.'/browser-credentials.json', 0600);
echo "Disposable browser fixtures ready. No app data changed.\n";
