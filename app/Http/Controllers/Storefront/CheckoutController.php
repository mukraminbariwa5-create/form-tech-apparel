<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Order;
use App\Services\CartSnapshot;
use App\Services\PlaceDemoOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function show(Request $request, CartSnapshot $snapshot)
    {
        $cart = $request->session()->get('cart', []);
        $summary = $snapshot->get($cart);
        if (! $cart || collect($summary['lines'])->contains(fn ($line) => ! $line['available'])) {
            return to_route('cart')->withErrors(['checkout' => 'Update your demo bag before continuing to checkout.']);
        }
        $quote = collect($summary['lines'])->mapWithKeys(fn ($line) => [$line['id'] => ['quantity' => $line['quantity'], 'price' => $line['price']]])->all();
        $key = $request->session()->get('checkout.quote') === $quote
            ? $request->session()->get('checkout.key') : (string) Str::uuid();
        $request->session()->put('checkout', ['key' => $key, 'quote' => $quote]);

        return Inertia::render('storefront/checkout', [...$summary, 'checkoutKey' => $key]);
    }

    public function store(CheckoutRequest $request, PlaceDemoOrder $service)
    {
        $key = $request->validated('key');
        $completed = $request->session()->get('completed_checkouts', []);
        if (isset($completed[$key])) {
            return to_route('order-confirmation', ['reference' => $completed[$key]]);
        }
        if ($key !== $request->session()->get('checkout.key')) {
            throw ValidationException::withMessages(['checkout' => 'This checkout expired or your bag changed. Reload checkout to review it again.'])->redirectTo('/checkout');
        }
        try {
            $order = $service->place($key, $request->session()->get('cart', []), $request->session()->get('checkout.quote', []), $request->safe()->except('key'));
        } catch (ValidationException $exception) {
            throw $exception->redirectTo('/checkout');
        }
        // The transaction has committed. Failed submissions preserve the bag and all form input.
        $request->session()->forget(['cart', 'checkout']);
        $completed[$key] = $order->public_reference;
        $request->session()->put('completed_checkouts', array_slice($completed, -10, null, true));

        return to_route('order-confirmation', ['reference' => $order->public_reference]);
    }

    public function confirmation(string $reference)
    {
        $order = Order::with('items')->where('public_reference', $reference)->firstOrFail();

        return Inertia::render('storefront/confirmation', ['order' => [
            ...$order->only(['public_reference', 'subtotal_cents', 'shipping_cents', 'tax_cents', 'total_cents', 'currency', 'status']),
            'items' => $order->items->map(fn ($item) => $item->only(['id', 'title', 'size', 'color', 'price_cents', 'quantity'])),
        ]]);
    }
}
