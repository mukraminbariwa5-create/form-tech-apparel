<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CollectionRequest;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Collection;
use App\Models\Product;
use App\Models\SiteContent;
use App\Services\RecordRevision;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CatalogController extends Controller
{
    private const CORE_COLLECTIONS = ['men', 'women', 'new-arrivals', 'technical-jackets', 'tech-pants', 'layering-systems'];

    public function products(Request $request)
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:120'], 'page' => ['nullable', 'integer', 'between:1,10000']]);
        $query = Product::query()->withCount('variants');
        if ($q = $filters['q'] ?? null) { $query->where('title', 'ilike', '%'.addcslashes($q, '\\%_').'%'); }
        return Inertia::render('admin/products', ['products' => $query->orderBy('id')->paginate(15)->withQueryString(), 'query' => $filters['q'] ?? '']);
    }

    public function productForm(?Product $product = null)
    {
        return Inertia::render('admin/product-form', ['product' => $product?->load(['images', 'variants', 'collections']), 'revision' => $product ? RecordRevision::of($product) : null,
            'collections' => Collection::orderBy('title')->get(['id', 'title', 'active'])]);
    }

    public function saveProduct(ProductRequest $request, ?Product $product = null)
    {
        $data = $request->validated();
        $id = DB::transaction(function () use ($data, $product) {
            $locked = $product ? Product::whereKey($product->id)->lockForUpdate()->firstOrFail() : new Product;
            if ($product && RecordRevision::of($locked) !== ($data['revision'] ?? null)) {
                $this->stale();
            }
            $existing = $locked->exists ? $locked->variants()->orderBy('id')->lockForUpdate()->get()->keyBy('id') : collect();
            $locked->fill(collect($data)->only(['title', 'slug', 'description', 'active', 'size_guide'])->all())->save();
            foreach ($data['variants'] as $variant) {
                $values = collect($variant)->only(['sku', 'size', 'color', 'price_cents', 'stock', 'active'])->all();
                if (! empty($variant['id'])) { $existing->get($variant['id'])->update($values); }
                else { $locked->variants()->create($values); }
            }
            $existingImages = $locked->images()->get()->keyBy('url');
            $locked->images()->delete();
            foreach ($data['images'] as $position => $image) {
                $color = array_key_exists('color', $image) ? $image['color'] : $existingImages->get($image['url'])?->color;
                $locked->images()->create([...$image, 'color' => $color, 'position' => $position]);
            }
            $locked->collections()->sync($data['collection_ids']);
            return $locked->id;
        }, attempts: 3);
        return redirect('/admin/products/'.$id.'/edit')->with('success', 'Product, variants and images saved.');
    }

    public function collections()
    {
        return Inertia::render('admin/collections', ['collections' => Collection::withCount('products')->orderBy('title')->get()]);
    }

    public function collectionForm(?Collection $collection = null)
    {
        return Inertia::render('admin/collection-form', ['collection' => $collection?->load('products'),
            'core' => in_array($collection?->slug, self::CORE_COLLECTIONS, true), 'revision' => $collection ? RecordRevision::of($collection) : null,
            'products' => Product::orderBy('title')->get(['id', 'title', 'active'])]);
    }

    public function saveCollection(CollectionRequest $request, ?Collection $collection = null)
    {
        $data = $request->validated();
        $id = DB::transaction(function () use ($data, $collection) {
            $locked = $collection ? Collection::whereKey($collection->id)->lockForUpdate()->firstOrFail() : new Collection;
            if ($collection && RecordRevision::of($locked) !== ($data['revision'] ?? null)) { $this->stale(); }
            if ($collection && in_array($locked->slug, self::CORE_COLLECTIONS, true) && (! $data['active'] || $data['slug'] !== $locked->slug)) {
                throw ValidationException::withMessages(['active' => 'This collection is used by site navigation. Keep it active and keep its existing slug.']);
            }
            $home = SiteContent::where('key', 'home')->lockForUpdate()->first();
            $links = [$home?->value['hero']['primary_href'] ?? '', $home?->value['hero']['secondary_href'] ?? '', $home?->value['editorial']['cta_href'] ?? ''];
            if ($collection && in_array('/collections/'.$locked->slug, $links, true) && (! $data['active'] || $data['slug'] !== $locked->slug)) {
                throw ValidationException::withMessages(['active' => 'Update the homepage link before archiving or renaming this collection.']);
            }
            $locked->fill(collect($data)->only(['title', 'slug', 'description', 'image_url', 'active'])->all())->save();
            $locked->products()->sync($data['product_ids']);
            return $locked->id;
        }, attempts: 3);
        return redirect('/admin/collections/'.$id.'/edit')->with('success', 'Collection saved.');
    }

    private function stale(): never
    {
        throw ValidationException::withMessages(['conflict' => 'This record or its inventory changed since you opened it. Reload the editor before saving to avoid overwriting newer data.']);
    }
}
