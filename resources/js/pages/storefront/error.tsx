import { Head, Link } from '@inertiajs/react';
import StoreLayout from '../../layouts/store-layout';

export default function StoreError({ status, message, details = [] }: { status: number; message: string; details?: string[] }) {
    return <StoreLayout><Head title={`${status} — ${message}`} /><section className="empty-state"><p className="eyebrow">FORM / TECH · {status}</p><h1>{message}</h1>{details.length > 0 && <ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul>}<Link className="button" href="/shop">Return to the collection →</Link></section></StoreLayout>;
}
