<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\CartRequest;
use App\Models\Variant;
use App\Services\CartSnapshot;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CartController extends Controller
{
    public function show(Request $request, CartSnapshot $snapshot)
    {
        return Inertia::render('storefront/cart', $snapshot->get($request->session()->get('cart', [])));
    }

    public function add(CartRequest $request)
    {
        $cart = $request->session()->get('cart', []);
        $id = $request->integer('variant_id');
        $quantity = ($cart[$id] ?? 0) + $request->integer('quantity');
        $variant = $this->validateStock($id, $quantity);
        $cart[$id] = $quantity;
        $request->session()->put('cart', $cart);
        $request->session()->forget('checkout');
        return to_route('products.show', ['slug' => $variant->product->slug])->with('success', 'Added to your demo bag.');
    }

    public function update(CartRequest $request)
    {
        $id = $request->integer('variant_id');
        $cart = $request->session()->get('cart', []);
        abort_unless(array_key_exists($id, $cart), 404);
        $this->validateStock($id, $request->integer('quantity'));
        $cart[$id] = $request->integer('quantity');
        $request->session()->put('cart', $cart);
        $request->session()->forget('checkout');
        return to_route('cart')->with('success', 'Demo bag updated.');
    }

    public function remove(Request $request, int $variant)
    {
        $cart = $request->session()->get('cart', []);
        unset($cart[$variant]);
        $request->session()->put('cart', $cart);
        $request->session()->forget('checkout');
        return to_route('cart')->with('success', 'Item removed.');
    }

    private function validateStock(int $id, int $quantity): Variant
    {
        $variant = Variant::with('product')->where('active', true)->whereHas('product', fn ($q) => $q->where('active', true))->find($id);
        if (! $variant || $quantity > $variant->stock) {
            throw ValidationException::withMessages(['quantity' => 'This quantity is unavailable. Check the current variant and stock.'])->redirectTo('/cart');
        }
        return $variant;
    }
}
