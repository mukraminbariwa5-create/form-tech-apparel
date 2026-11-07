<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustHosts(at: fn () => ['^'.preg_quote(parse_url(config('app.url'), PHP_URL_HOST) ?? '', '/').'$', '^localhost$'], subdomains: false);
        $middleware->prependToPriorityList(\Illuminate\Routing\Middleware\SubstituteBindings::class, \App\Http\Middleware\EnsureAdmin::class);
        $middleware->web(append: [
            \App\Http\Middleware\ProtectPrivateResponses::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Illuminate\Database\QueryException $exception) {
            // QueryException messages can contain submitted address/email bindings. Log only a diagnostic code.
            \Illuminate\Support\Facades\Log::error('Database operation failed.', ['sqlstate' => $exception->errorInfo[0] ?? 'unknown']);
            return false;
        });
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, Request $request) {
            $status = $response->getStatusCode();
            $messages = [403 => 'This page is for authorized staff.', 404 => 'This page could not be found.', 419 => 'Your session expired. Please refresh and try again.', 429 => 'Too many requests. Please try again shortly.'];
            if (isset($messages[$status]) || ($status >= 500 && ! config('app.debug'))) {
                return \Inertia\Inertia::render('storefront/error', ['status' => $status, 'message' => $messages[$status] ?? 'Something went wrong. Please try again later.'])
                    ->toResponse($request)->setStatusCode($status);
            }
            return $response;
        });
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
