<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Fortify::ignoreRoutes();
    }

    public function boot(): void
    {
        Fortify::loginView(fn () => Inertia::render('auth/login'));
        Fortify::authenticateUsing(function (Request $request) {
            $user = User::where('email', Str::lower($request->string('email')->toString()))->first();
            return $user && $user->is_admin && Hash::check($request->string('password')->toString(), $user->password)
                ? $user : null;
        });
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by(Str::lower($request->string('email')->toString()).'|'.$request->ip()));
    }
}
