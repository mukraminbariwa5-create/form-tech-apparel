import ResponsiveImage from '../../components/responsive-image';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import StoreLayout from '../../layouts/store-layout';
import { money } from '../../types/store';
import type { Shared, CartLine as Line } from '../../types/store';


export default function Cart({ lines, subtotal }: { lines: Line[]; subtotal: number }) {
    const { errors } = usePage<Shared>().props;
    const [pending, setPending] = useState(false);
    function update(line: Line, quantity: number) {
        if (pending) return;
        setPending(true);
        router.patch('/cart', { variant_id: line.id, quantity }, { preserveScroll: true, onFinish: () => setPending(false) });
    }
    function remove(line: Line) {
        if (pending) return;
        setPending(true);
        router.delete(`/cart/${line.id}`, { preserveScroll: true, onFinish: () => setPending(false) });
    }
    return <StoreLayout><Head title="Your demo bag"><meta name="robots" content="noindex, nofollow" /></Head><header className="page-heading"><p className="eyebrow">YOUR SELECTION</p><h1>Demo Bag</h1><p>No payments or fulfillment. Sample prices in USD.</p></header>
        {!lines.length && Object.values(errors).length > 0 && <div className="form-errors information-page" role="alert">{Object.values(errors).map(error => <p key={error}>{error}</p>)}</div>}
        {!lines.length ? <section className="empty-state"><h2>Your bag is empty</h2><p>Explore the fictional collection to find your next layer.</p><Link className="button" href="/shop">Explore the collection →</Link><div className="empty-state-links"><Link href="/collections/technical-jackets">Technical jackets →</Link><Link href="/collections/tech-pants">Tech pants →</Link><Link href="/collections/layering-systems">Layering systems →</Link></div></section> : <div className="cart-layout"><section aria-label="Bag items">{Object.values(errors).length > 0 && <div className="form-errors" role="alert">{Object.values(errors).map(error => <p key={error}>{error}</p>)}</div>}{lines.map(line => <article className="cart-line" key={line.id}>
            {line.image && <ResponsiveImage src={line.image.url} alt={line.image.alt} sizes="120px" width="160" height="200" />}
            <div><h2>{line.slug ? <Link href={`/products/${line.slug}${line.color ? `?color=${encodeURIComponent(line.color)}` : ''}`}>{line.title}</Link> : line.title}</h2><p>{line.size} / {line.color}</p><p>{line.price === null ? 'Price unavailable' : `${money(line.price)} each`}</p>{!line.available && <p className="form-errors">The current selection exceeds stock or is unavailable. Update or remove it.</p>}
            <div className="quantity-controls"><button type="button" aria-label={`Decrease ${line.title} quantity`} disabled={pending || line.quantity <= 1} onClick={() => update(line,line.quantity-1)}>−</button><output aria-label={`${line.title} quantity`}>{line.quantity}</output><button type="button" aria-label={`Increase ${line.title} quantity`} disabled={pending || line.quantity >= line.stock} onClick={() => update(line,line.quantity+1)}>+</button></div>
            <button className="text-link" type="button" disabled={pending} onClick={() => remove(line)}>Remove {line.title}</button></div><p>{line.price === null ? '—' : money(line.price*line.quantity)}</p>
        </article>)}</section><aside className="order-summary"><h2>Demo summary</h2><dl><div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div><div><dt>Currency</dt><dd>USD</dd></div></dl><p>These are fictional products and demo amounts. No payment is taken and nothing will be delivered.</p>{lines.every(line => line.available) ? <Link className="button checkout-link" href="/checkout">Proceed to demo checkout →</Link> : <p role="status">Update unavailable items to continue.</p>}<Link href="/shop">Continue exploring →</Link></aside></div>}
    </StoreLayout>;
}
