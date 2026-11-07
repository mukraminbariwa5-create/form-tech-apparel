import { Link } from '@inertiajs/react';

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
    return <nav className="breadcrumb" aria-label="Breadcrumb"><ol>
        <li><Link href="/">Home</Link></li>
        {items.map((item, index) => <li key={`${item.label}-${index}`}><span aria-hidden="true">/</span>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}
    </ol></nav>;
}
