import { Link } from '@inertiajs/react';
import AdminLayout from '../../layouts/admin-layout';
import type { AdminCollection } from '../../types/admin';

export default function Collections({ collections }: { collections: AdminCollection[] }) {
    return <AdminLayout title="Collections"><Link className="button" href="/admin/collections/create">Create collection →</Link><div className="admin-table-wrap"><table><caption className="sr-only">Collections</caption><thead><tr><th scope="col">Collection</th><th scope="col">Status</th><th scope="col">Products</th><th scope="col">Action</th></tr></thead><tbody>{collections.map(c => <tr key={c.id}><th scope="row">{c.title}<small>{c.slug}</small></th><td>{c.active ? 'Active' : 'Archived'}</td><td>{c.products_count}</td><td><Link href={`/admin/collections/${c.id}/edit`}>Edit {c.title} →</Link></td></tr>)}</tbody></table></div></AdminLayout>;
}
