<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" href="{{ asset('favicon.ico') }}?v=form-tech-1" sizes="16x16 32x32 48x48">
    <link rel="icon" type="image/png" href="{{ asset('form-tech-icon-32.png') }}?v=1" sizes="32x32">
    <link rel="icon" type="image/svg+xml" href="{{ asset('form-tech-icon.svg') }}?v=1" sizes="any">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
