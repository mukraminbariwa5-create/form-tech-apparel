import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import OrderTotals from '../../components/order-totals';
import StoreLayout from '../../layouts/store-layout';
import { money } from '../../types/store';
import type { CartLine } from '../../types/store';

const addressFields = [
    { key: 'line1', label: 'Address line 1', autocomplete: 'address-line1', max: 200 },
    { key: 'city', label: 'City', autocomplete: 'address-level2', max: 100 },
    { key: 'province', label: 'Province / state', autocomplete: 'address-level1', max: 100 },
    { key: 'postal_code', label: 'Postal code', autocomplete: 'postal-code', max: 24 },
    { key: 'country', label: 'Country', autocomplete: 'country-name', max: 80 },
] as const;

export default function Checkout({ lines, subtotal, checkoutKey }: { lines: CartLine[]; subtotal: number; checkoutKey: string }) {
    const form = useForm({ key: checkoutKey, name: '', email: '', address: { line1: '', city: '', province: '', postal_code: '', country: '' }, notes: '' });
    const errors = form.errors as Record<string, string>;
    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform(data => ({ ...data, key: checkoutKey }));
        form.post('/checkout', { preserveScroll: true, onError: () => document.getElementById('checkout-errors')?.focus() });
    }
    return <StoreLayout><Head title="Demo checkout"><meta name="robots" content="noindex, nofollow" /></Head>
        <header className="page-heading"><p className="eyebrow">SIMULATED ORDER</p><h1>Demo checkout</h1><p className="checkout-warning">NO PAYMENT WILL BE CHARGED</p><p>No payment details, deliveries or emails. Shipping and tax are zero demo charges.</p></header>
        <div className="cart-layout checkout-layout"><form className="checkout-form" onSubmit={submit}>
            <p className="policy-disclaimer">Use fictional details to try this portfolio demo. Your submitted details are saved for staff review. Never enter a real address or sensitive information.</p>
            {Object.keys(errors).length > 0 && <div id="checkout-errors" className="form-errors" role="alert" tabIndex={-1}><h2>Check your demo order</h2>{Object.entries(errors).map(([key, message]) => <p key={key}>{message}</p>)}<Link href="/cart">Review your bag →</Link></div>}
            <h2>Demo contact</h2>
            <div className="form-field"><label htmlFor="checkout-name">Full name</label><input id="checkout-name" autoComplete="name" required maxLength={120} value={form.data.name} onChange={event => form.setData('name', event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'error-name' : undefined} />{errors.name && <p className="form-errors" id="error-name">{errors.name}</p>}</div>
            <div className="form-field"><label htmlFor="checkout-email">Email</label><input id="checkout-email" type="email" autoComplete="email" required maxLength={254} value={form.data.email} onChange={event => form.setData('email', event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'error-email' : undefined} />{errors.email && <p className="form-errors" id="error-email">{errors.email}</p>}</div>
            <h2>Demo shipping address</h2>
            <div className="checkout-address">{addressFields.map(field => <div className="form-field" key={field.key}><label htmlFor={`checkout-${field.key}`}>{field.label}</label><input id={`checkout-${field.key}`} autoComplete={field.autocomplete} required maxLength={field.max} value={form.data.address[field.key]} onChange={event => form.setData('address', { ...form.data.address, [field.key]: event.target.value })} aria-invalid={!!errors[`address.${field.key}`]} aria-describedby={errors[`address.${field.key}`] ? `error-${field.key}` : undefined} />{errors[`address.${field.key}`] && <p className="form-errors" id={`error-${field.key}`}>{errors[`address.${field.key}`]}</p>}</div>)}</div>
            <div className="form-field"><label htmlFor="checkout-notes">Notes (optional)</label><textarea id="checkout-notes" rows={3} maxLength={1000} value={form.data.notes} onChange={event => form.setData('notes', event.target.value)} aria-invalid={!!errors.notes} /></div>
            <p className="demo-note">Placing a demo order reduces sample stock. No payment is made and nothing will be delivered.</p>
            <button className="button" disabled={form.processing} type="submit">{form.processing ? 'Saving demo order…' : 'Place Demo Order'}</button>
        </form><aside className="order-summary"><h2>Your demo order</h2><ul className="checkout-items">{lines.map(line => <li key={line.id}><span>{line.title}<small>{line.size} / {line.color} · Qty {line.quantity}</small></span><strong>{money((line.price ?? 0) * line.quantity)}</strong></li>)}</ul><OrderTotals subtotal={subtotal} /><p>Zero demo shipping and tax. No real tax calculation or fulfillment.</p><Link href="/cart">Edit your bag →</Link></aside></div>
    </StoreLayout>;
}
