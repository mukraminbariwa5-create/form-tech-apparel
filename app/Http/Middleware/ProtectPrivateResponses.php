<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ProtectPrivateResponses
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        if ($request->is('admin', 'admin/*', 'login', 'cart', 'checkout', 'order-confirmation/*')) {
            $response->headers->set('Cache-Control', 'no-store, private');
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
            $response->headers->set('Referrer-Policy', 'no-referrer');
        }
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        return $response;
    }
}
