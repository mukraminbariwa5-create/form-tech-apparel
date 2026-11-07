<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContentRequest;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\Variant;
use App\Services\UpdateDemoOrder;
use App\Services\RecordRevision;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ManagementController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('admin/dashboard', ['metrics' => [
            'products' => Product::count(), 'active_products' => Product::where('active', true)->count(),
            'low_stock' => Variant::where('active', true)->where('stock', '<=', 5)->whereHas('product', fn ($q) => $q->where('active', true))->count(),
            'orders' => Order::count(), 'order_value' => (int) Order::where('status', '!=', 'cancelled')->sum('total_cents'),
        ]]);
    }

    public function orders(Request $request)
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:120'], 'status' => ['nullable', Rule::in(['new', 'reviewed', 'cancelled'])], 'page' => ['nullable', 'integer', 'between:1,10000']]);
        $query = Order::query();
        if ($q = $filters['q'] ?? null) {
            $term = '%'.addcslashes($q, '\\%_').'%';
            $query->where(fn ($q) => $q->where('customer_name', 'ilike', $term)->orWhere('customer_email', 'ilike', $term)->orWhereRaw('public_reference::text ILIKE ?', [$term]));
        }
        if ($status = $filters['status'] ?? null) { $query->where('status', $status); }
        return Inertia::render('admin/orders', ['orders' => $query->orderByDesc('id')->paginate(15)->withQueryString(), 'filters' => ['q' => $filters['q'] ?? '', 'status' => $filters['status'] ?? '']]);
    }

    public function order(Order $order)
    {
        return Inertia::render('admin/order', ['order' => [...$order->only(['id', 'public_reference', 'customer_name', 'customer_email', 'address', 'notes', 'subtotal_cents', 'shipping_cents', 'tax_cents', 'total_cents', 'status', 'created_at']), 'items' => $order->items()->get()]]);
    }

    public function updateOrder(Request $request, Order $order, UpdateDemoOrder $service)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['new', 'reviewed', 'cancelled'])]]);
        $service->update($order, $data['status']);
        return redirect('/admin/orders/'.$order->id)->with('success', 'Demo order status saved. Cancellation restores stock once; nothing is shipped.');
    }

    public function content()
    {
        $home = SiteContent::where('key', 'home')->firstOrFail();
        return Inertia::render('admin/content', ['content' => [...$home->value, 'revision' => RecordRevision::of($home)],
            'destinations' => ContentRequest::destinations(), 'products' => Product::where('active', true)->orderBy('title')->get(['id', 'title'])]);
    }

    public function updateContent(ContentRequest $request)
    {
        DB::transaction(function () use ($request) {
            \App\Models\Collection::orderBy('id')->sharedLock()->get();
            $home = SiteContent::where('key', 'home')->lockForUpdate()->firstOrFail();
            if (RecordRevision::of($home) !== $request->validated('revision')) {
                throw ValidationException::withMessages(['conflict' => 'Homepage content changed. Reload the editor before saving.']);
            }
            $links = [$request->validated('hero.primary_href'), $request->validated('hero.secondary_href'), $request->validated('editorial.cta_href')];
            if (array_diff($links, ContentRequest::destinations())) {
                throw ValidationException::withMessages(['conflict' => 'A linked collection changed. Reload the content editor.']);
            }
            $home->update(['value' => $request->safe()->except('revision')]);
        });
        return redirect('/admin/content')->with('success', 'Homepage content saved.');
    }

    public function contacts(Request $request)
    {
        $request->validate(['page' => ['nullable', 'integer', 'between:1,10000']]);
        return Inertia::render('admin/contacts', ['messages' => ContactMessage::orderByDesc('id')->paginate(15)]);
    }
}
