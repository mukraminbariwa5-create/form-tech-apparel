<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\CatalogFilterRequest;
use App\Http\Requests\ContactRequest;
use App\Models\Collection;
use App\Models\ContactMessage;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\Variant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function home(): Response
    {
        $content = SiteContent::where('key', 'home')->firstOrFail()->value;
        $ids = $content['featured_product_ids'];
        $products = Product::where('active', true)->whereIn('id', $ids)
            ->with(['images', 'variants' => fn ($q) => $q->where('active', true)->orderBy('id')])->get()->keyBy('id');
        return Inertia::render('storefront/home', [
            'content' => $content,
            'collections' => Collection::where('active', true)->whereIn('slug', ['technical-jackets', 'tech-pants', 'layering-systems'])->get()->sortBy(fn ($c) => array_search($c->slug, ['technical-jackets', 'tech-pants', 'layering-systems']))->values(),
            'featured' => collect($ids)->map(fn ($id) => $products->has($id) ? $this->card($products[$id]) : null)->filter()->values(),
        ]);
    }

    public function shop(CatalogFilterRequest $request, ?string $slug = null): Response
    {
        $filters = $request->validated();
        $collection = $slug ? Collection::where('slug', $slug)->where('active', true)->firstOrFail() : null;
        $edits = app(\App\Services\CurateStorefrontCollections::class)->definitions();
        $editSlug = isset($edits[$slug ?? '']) ? $slug : ($filters['collection'] ?? '');
        $curated = isset($edits[$editSlug]);
        $sort = $filters['sort'] ?? (isset($edits[$slug ?? '']) ? 'curated' : 'newest');
        if ($sort === 'curated' && !$curated) $sort = 'newest';
        $variantFilter = function ($query) use ($filters) {
            $query->where('active', true);
            foreach (['size', 'color'] as $field) {
                if (! empty($filters[$field])) $query->where($field, $filters[$field]);
            }
            if (isset($filters['min_price'])) $query->where('price_cents', '>=', $filters['min_price']);
            if (isset($filters['max_price'])) $query->where('price_cents', '<=', $filters['max_price']);
            if (($filters['availability'] ?? '') === 'in-stock') $query->where('stock', '>', 0);
        };
        $query = Product::where('active', true)->whereHas('variants', $variantFilter)
            ->with(['images', 'variants' => fn ($q) => $variantFilter($q->orderBy('id'))])->withMin(['variants as list_price' => $variantFilter], 'price_cents');
        foreach (array_filter([$collection?->slug, $filters['collection'] ?? null]) as $collectionSlug) {
            $query->whereHas('collections', fn ($q) => $q->where('slug', $collectionSlug)->where('active', true));
        }
        if (($filters['availability'] ?? '') === 'out-of-stock') {
            $query->whereDoesntHave('variants', fn ($q) => $variantFilter($q->where('stock', '>', 0)));
        }
        if (! empty($filters['q'])) {
            $term = '%'.addcslashes(trim($filters['q']), '\\%_').'%';
            $query->where(fn ($q) => $q->where('title', 'ilike', $term)->orWhere('description', 'ilike', $term));
        }
        $curatedOrder = $curated ? $edits[$editSlug]['products'] : [];
        $orderBindings = [];
        foreach ($curatedOrder as $position => $productSlug) { $orderBindings[] = $productSlug; $orderBindings[] = $position; }
        match ($sort) {
            'curated' => $query->orderByRaw('CASE products.slug '.implode(' ', array_fill(0, count($curatedOrder), 'WHEN ? THEN ?')).' ELSE '.count($curatedOrder).' END', $orderBindings),
            'price-asc' => $query->orderBy('list_price'),
            'price-desc' => $query->orderByDesc('list_price'),
            'name' => $query->orderBy('title'),
            default => $query->orderByDesc('created_at'),
        };
        $page = $query->orderBy('id')->paginate(12)->withQueryString();
        $facets = Variant::where('active', true)->whereHas('product', fn ($q) => $q->where('active', true));
        return Inertia::render('storefront/shop', [
            'heading' => $collection?->title ?? ($request->is('search') ? 'Search' : 'All Products'),
            'description' => $collection?->description ?? 'Technical clothing for wherever next. All products and prices are fictional demo data.',
            'products' => collect($page->items())->map(fn ($product) => $this->card($product)),
            'pagination' => ['current' => $page->currentPage(), 'last' => $page->lastPage(), 'total' => $page->total(), 'previous' => $page->previousPageUrl(), 'next' => $page->nextPageUrl()],
            'filters' => array_merge(['q' => '', 'collection' => '', 'size' => '', 'color' => '', 'availability' => '', 'min_price' => null, 'max_price' => null], $filters, ['sort' => $sort]),
            'curated' => $curated,
            'facets' => ['sizes' => (clone $facets)->distinct()->orderBy('size')->pluck('size'), 'colors' => (clone $facets)->distinct()->orderBy('color')->pluck('color')],
            'collections' => Collection::where('active', true)->orderBy('title')->get(['slug', 'title']),
        ]);
    }

    public function suggestions(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate(['q' => ['nullable', 'string', 'max:100']]);
        $term = trim($validated['q'] ?? '');
        if (mb_strlen($term) < 2) return response()->json(['products' => []])->header('Cache-Control', 'no-store');

        $pattern = '%'.addcslashes($term, '\\%_').'%';
        $products = Product::where('active', true)
            ->whereHas('variants', fn ($query) => $query->where('active', true))
            ->where(fn ($query) => $query->where('title', 'ilike', $pattern)->orWhere('description', 'ilike', $pattern))
            ->withMin(['variants as price' => fn ($query) => $query->where('active', true)], 'price_cents')
            ->orderBy('title')->orderBy('id')->limit(5)->get()
            ->map(fn ($product) => ['title' => $product->title, 'href' => '/products/'.$product->slug, 'price' => (int) $product->price]);

        return response()->json(['products' => $products])->header('Cache-Control', 'no-store');
    }

    public function product(Request $request, string $slug): Response
    {
        $product = Product::where('slug', $slug)->where('active', true)
            ->with(['images', 'collections' => fn ($q) => $q->where('active', true), 'variants' => fn ($q) => $q->where('active', true)->orderBy('id')])->firstOrFail();
        $collectionIds = $product->collections->whereNotIn('slug', ['men', 'women', 'new-arrivals'])->pluck('id');
        $related = Product::where('active', true)->whereKeyNot($product->id)
            ->whereHas('variants', fn ($q) => $q->where('active', true)->where('stock', '>', 0))
            ->with(['images', 'variants' => fn ($q) => $q->where('active', true)->orderBy('id')])
            ->withCount(['collections as shared_collections_count' => fn ($q) => $q->whereIn('collections.id', $collectionIds)])
            ->orderByDesc('shared_collections_count')->orderByDesc('featured')->orderBy('id')->limit(4)->get();
        return Inertia::render('storefront/product', ['product' => [
            'id' => $product->id, 'slug' => $product->slug, 'title' => $product->title, 'description' => $product->description,
            'sizeGuide' => $product->size_guide, 'images' => $product->images->map->only(['id', 'url', 'alt', 'color']),
            'initialColor' => is_string($request->query('color')) && $product->variants->contains('color', $request->query('color')) ? $request->query('color') : null,
            'variants' => $product->variants->map->only(['id', 'size', 'color', 'price_cents', 'stock', 'sku']),
            'collections' => $product->collections->map->only(['title', 'slug']),
        ], 'related' => $related->map(fn ($item) => $this->card($item))]);
    }

    public function recent(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate(['slugs' => ['required', 'array', 'max:8'], 'slugs.*' => ['required', 'string', 'max:160']]);
        $slugs = array_values(array_unique($data['slugs']));
        $products = Product::where('active', true)->whereIn('slug', $slugs)
            ->whereHas('variants', fn ($q) => $q->where('active', true))
            ->with(['images', 'variants' => fn ($q) => $q->where('active', true)->orderBy('id')])->get()->keyBy('slug');
        return response()->json(['products' => collect($slugs)->filter(fn ($slug) => $products->has($slug))
            ->take(4)->map(fn ($slug) => $this->card($products[$slug]))->values()])->header('Cache-Control', 'no-store');
    }

    public function information(Request $request): Response
    {
        return Inertia::render('storefront/information', [
            'page' => $request->path(),
            'guides' => $request->is('size-guide') ? Product::where('active', true)->orderBy('title')->get(['title', 'slug', 'size_guide']) : [],
        ]);
    }

    public function contact(ContactRequest $request)
    {
        ContactMessage::create($request->validated());
        return back()->with('success', 'Demo message saved. This fictional store does not provide customer support or send email replies.');
    }

    private function card(Product $product): array
    {
        return [
            'id' => $product->id, 'slug' => $product->slug, 'title' => $product->title,
            'image' => $product->images->first()?->only(['url', 'alt']),
            'initialColor' => $product->images->first()?->color,
            'price' => $product->variants->min('price_cents'),
            'priceVaries' => $product->variants->min('price_cents') !== $product->variants->max('price_cents'),
            'available' => $product->variants->contains(fn ($v) => $v->stock > 0),
            'colors' => $product->variants->filter(fn ($v) => $v->stock > 0)->pluck('color')->unique()->values(),
            'colorOptions' => $product->variants->filter(fn ($v) => $v->stock > 0)->groupBy('color')->map(function ($variants, $color) use ($product) {
                $image = $product->images->firstWhere('color', $color) ?? $product->images->firstWhere('color', null);
                return ['color' => $color, 'image' => $image?->only(['url', 'alt']), 'price' => $variants->min('price_cents'),
                    'priceVaries' => $variants->min('price_cents') !== $variants->max('price_cents')];
            })->values(),
        ];
    }
}
