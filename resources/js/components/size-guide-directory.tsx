import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { SizeMeasurements } from './size-guide';
import type { SizeGuideData } from './size-guide';

export type ProductGuide = { title: string; slug?: string; size_guide: SizeGuideData };

export default function SizeGuideDirectory({ guides }: { guides: ProductGuide[] }) {
    const [search, setSearch] = useState('');
    const filtered = guides.filter(guide => guide.title.toLowerCase().includes(search.trim().toLowerCase()));
    return <section aria-label="Product size guides">
        <label htmlFor="guide-search">Find a product guide</label><input id="guide-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by product name" className="guide-search" />
        <p role="status">{filtered.length} {filtered.length === 1 ? 'guide' : 'guides'}</p>
        {filtered.map(guide => <details key={guide.slug ?? guide.title}><summary>{guide.title}</summary><SizeMeasurements guide={guide.size_guide} />{guide.slug && <Link className="text-link" href={`/products/${guide.slug}`}>View {guide.title} →</Link>}</details>)}
        {!filtered.length && <div className="guide-empty"><p>No size guides match “{search}”. Try another product name.</p><button className="text-link" type="button" onClick={() => setSearch('')}>Show all guides</button></div>}
    </section>;
}
