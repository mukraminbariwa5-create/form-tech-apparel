import { Link } from '@inertiajs/react';
import AdminLayout from '../../layouts/admin-layout';
import { money } from '../../types/store';

export default function Dashboard({ metrics }: { metrics: { products: number; active_products: number; low_stock: number; orders: number; order_value: number } }) {
    return <AdminLayout title="Store overview"><p className="policy-disclaimer">This is a fictional store. All order values are demo amounts; no payments or fulfillment.</p><dl className="admin-metrics">{[['Products',metrics.products],['Active products',metrics.active_products],['Low-stock variants (≤5)',metrics.low_stock],['Demo orders',metrics.orders],['Demo order value',money(metrics.order_value)]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="admin-note">Demo order value excludes cancelled orders. Low-stock counts include active variants of active products.</p><div className="admin-actions"><Link className="button" href="/admin/products">Manage products →</Link><Link className="button button-light" href="/admin/orders">Review demo orders →</Link></div></AdminLayout>;
}
