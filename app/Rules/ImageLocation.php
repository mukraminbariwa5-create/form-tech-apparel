<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ImageLocation implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) { $fail('Choose a valid image location.'); return; }
        if (preg_match('~^/images/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|avif)$~D', $value)) {
            $root = realpath(public_path('images'));
            $path = realpath(public_path(ltrim($value, '/')));
            if ($root && $path && str_starts_with($path, $root.DIRECTORY_SEPARATOR) && is_file($path)) { return; }
        } else {
            $parts = parse_url($value);
            $host = strtolower($parts['host'] ?? '');
            if (filter_var($value, FILTER_VALIDATE_URL) && ($parts['scheme'] ?? '') === 'https'
                && ! isset($parts['user'], $parts['pass']) && ! isset($parts['user']) && ! isset($parts['pass'])
                && ! isset($parts['port']) && ! isset($parts['fragment'])
                && ! filter_var($host, FILTER_VALIDATE_IP)
                && preg_match('/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/D', $host)
                && ! preg_match('/\.(localhost|local|internal|test|invalid)$/D', $host)) { return; }
        }
        $fail('Use an existing /images/ demo asset or a public HTTPS image URL without credentials, custom ports or fragments.');
    }
}
