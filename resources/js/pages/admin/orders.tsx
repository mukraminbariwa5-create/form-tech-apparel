import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Field, Pagination } from '../../components/admin-fields';
import AdminLayout from '../../layouts/admin-layout';
import type { Page } from '../../types/admin';
import { money } from '../../types/store';

type Row = { id: number; public_reference: string; customer_name: string; total_cents: number; status: string; created_at: string };
export default function Orders({ orders, filters }: { orders: Page<Row>; filters: { q: string; status: string } }) {
    const [q,setQ]=useState(filters.q); const [status,setStatus]=useState(filters.status);
    return <AdminLayout title="Demo orders"><p className="policy-disclaimer">No payments or shipping. Cancellation restores sample stock once and cannot be undone.</p><form className="admin-toolbar" onSubmit={e=>{e.preventDefault();router.get('/admin/orders',{q,status});}}><Field label="Search name, email or demo reference" value={q} onChange={setQ} required={false} maxLength={120} /><div className="form-field"><label htmlFor="order-status">Demo order status</label><select id="order-status" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option value="new">New</option><option value="reviewed">Reviewed</option><option value="cancelled">Cancelled</option></select></div><button className="button" type="submit">Apply filters</button></form><p className="admin-note">{orders.total} demo orders</p><div className="admin-table-wrap"><table><caption className="sr-only">Demo orders</caption><thead><tr><th scope="col">Reference / visitor</th><th scope="col">Demo status</th><th scope="col">Demo value USD</th><th scope="col">Action</th></tr></thead><tbody>{orders.data.map(order=><tr key={order.id}><th scope="row"><span className="order-reference">{order.public_reference}</span><small>{order.customer_name}</small></th><td>{order.status}</td><td>{money(order.total_cents)}</td><td><Link href={`/admin/orders/${order.id}`}>Review order {order.id} →</Link></td></tr>)}</tbody></table></div>{!orders.data.length && <p className="empty-state">No demo orders match these filters.</p>}<Pagination page={orders} /></AdminLayout>;
}
