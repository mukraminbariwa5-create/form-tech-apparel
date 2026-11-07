import { money } from '../types/store';

export default function OrderTotals({ subtotal }: { subtotal: number }) {
    return <dl className="checkout-totals">
        <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
        <div><dt>Demo shipping</dt><dd>{money(0)}</dd></div>
        <div><dt>Demo tax</dt><dd>{money(0)}</dd></div>
        <div><dt>Total demo value</dt><dd>{money(subtotal)} USD</dd></div>
    </dl>;
}
