import { Head, Link } from '@inertiajs/react';
import OrderTotals from '../../components/order-totals';
import StoreLayout from '../../layouts/store-layout';
import { money } from '../../types/store';

type Order = { public_reference: string; subtotal_cents: number; total_cents: number; status: string; items: { id: number; title: string; size: string; color: string; quantity: number; price_cents: number }[] };

export default function Confirmation({ order }: { order: Order }) {
    return <StoreLayout><Head title="Demo order saved"><meta name="robots" content="noindex, nofollow" /></Head><section className="information-page order-confirmation">
        <p className="eyebrow">DEMO ORDER SAVED</p><h1>Your next chapter, imagined.</h1><p className="policy-disclaimer">No payment was made. These fictional items will not be shipped. No confirmation email is sent.</p>
        <p>Demo reference <strong className="order-reference">{order.public_reference}</strong></p><p>Status: {order.status === 'new' ? 'New demo order' : order.status === 'reviewed' ? 'Reviewed demo order' : 'Cancelled demo order'}</p>
        <ul className="checkout-items">{order.items.map(item => <li key={item.id}><span>{item.title}<small>{item.size} / {item.color} · Qty {item.quantity}</small></span><strong>{money(item.price_cents * item.quantity)}</strong></li>)}</ul>
        <div className="order-summary"><OrderTotals subtotal={order.subtotal_cents} /></div><p className="demo-note">Keep this page to revisit the demo order summary. Contact details and address are kept private.</p><Link className="button" href="/shop">Back to the collection →</Link>
    </section></StoreLayout>;
}
