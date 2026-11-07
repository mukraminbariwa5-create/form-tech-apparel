import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Field, Pagination } from '../../components/admin-fields';
import AdminLayout from '../../layouts/admin-layout';
import type { Option, Page } from '../../types/admin';

export default function Products({ products, query }: { products: Page<Option & { slug: string; variants_count: number }>; query: string }) {
    const [q,setQ] = useState(query);
    return <AdminLayout title="Products"><div className="admin-toolbar"><form onSubmit={e => { e.preventDefault(); router.get('/admin/products',{q}); }}><Field label="Search products" value={q} onChange={setQ} required={false} maxLength={120} /><button className="button" type="submit">Search</button></form><Link className="button" href="/admin/products/create">Create product →</Link></div><p className="admin-note">{products.total} products. To archive a product, open its editor and turn off Active.</p><div className="admin-table-wrap"><table><caption className="sr-only">Products</caption><thead><tr><th scope="col">Product</th><th scope="col">Status</th><th scope="col">Variants</th><th scope="col">Action</th></tr></thead><tbody>{products.data.map(product => <tr key={product.id}><th scope="row">{product.title}<small>{product.slug}</small></th><td>{product.active ? 'Active' : 'Archived'}</td><td>{product.variants_count}</td><td><Link href={`/admin/products/${product.id}/edit`}>Edit {product.title} →</Link></td></tr>)}</tbody></table></div>{!products.data.length && <p className="empty-state">No products match this search.</p>}<Pagination page={products} /></AdminLayout>;
}
