<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Product;

class SeoController extends Controller
{
    public function sitemap()
    {
        $base = rtrim(config('app.url'), '/');
        $urls = collect(['/', '/shop', '/technology', '/about', '/contact', '/size-guide', '/shipping-returns'])
            ->map(fn ($path) => ['loc' => $base.$path, 'modified' => null]);
        foreach (Product::where('active', true)->get(['slug', 'updated_at']) as $product) {
            $urls->push(['loc' => $base.'/products/'.$product->slug, 'modified' => $product->updated_at->toAtomString()]);
        }
        foreach (Collection::where('active', true)->get(['slug', 'updated_at']) as $collection) {
            $urls->push(['loc' => $base.'/collections/'.$collection->slug, 'modified' => $collection->updated_at->toAtomString()]);
        }
        return response()->view('sitemap', ['urls' => $urls])->header('Content-Type', 'application/xml; charset=UTF-8');
    }
    public function robots()
    {
        return response("User-agent: *\nDisallow: /admin\nDisallow: /login\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order-confirmation/\nDisallow: /search\nSitemap: ".rtrim(config('app.url'), '/')."/sitemap.xml\n")
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
