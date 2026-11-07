<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\SiteContent;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['isAdmin' => (bool) $request->user()?->is_admin],
            'storeUrl' => rtrim(config('app.url'), '/'),
            'cartCount' => fn () => array_sum($request->session()->get('cart', [])),
            'announcement' => fn () => SiteContent::where('key', 'home')->first()?->value['announcement'] ?? 'PORTFOLIO DEMO · NO PAYMENTS OR FULFILLMENT',
            'flash' => ['success' => fn () => $request->session()->get('success')],
        ];
    }
}
