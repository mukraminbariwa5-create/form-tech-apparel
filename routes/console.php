<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

Artisan::command('app:bootstrap-admin', function () {
    $email = config('form-tech.admin_email');
    $password = config('form-tech.admin_password');
    if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)
        || ! is_string($password) || strlen($password) < 16) {
        $this->error('Set ADMIN_EMAIL and a password of at least 16 characters securely in the environment.');
        return 1;
    }
    $email = Str::lower($email);
    if (User::where('email', $email)->exists()) {
        $this->error('This account already exists; bootstrap does not overwrite credentials.');
        return 1;
    }
    User::create(['name' => 'Administrator', 'email' => $email, 'password' => $password, 'is_admin' => true]);
    $this->info('Administrator created. Remove ADMIN_PASSWORD from the environment after bootstrap.');
    return 0;
})->purpose('Create a staff administrator from secure environment configuration');

Artisan::command('app:recover-admin', function () {
    $email = config('form-tech.admin_email');
    $password = config('form-tech.admin_password');
    if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)
        || ! is_string($password) || strlen($password) < 16) {
        $this->error('Set ADMIN_EMAIL and a new password of at least 16 characters securely in the environment.');
        return 1;
    }
    $user = User::where('email', Str::lower($email))->where('is_admin', true)->first();
    if (! $user) { $this->error('No existing administrator matches this email.'); return 1; }
    \Illuminate\Support\Facades\DB::transaction(function () use ($user, $password) {
        $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
        \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->delete();
    });
    $this->info('Administrator password recovered and existing sessions invalidated. Remove ADMIN_PASSWORD and clear cached configuration.');
    return 0;
})->purpose('Recover an existing administrator through secure server environment configuration');
