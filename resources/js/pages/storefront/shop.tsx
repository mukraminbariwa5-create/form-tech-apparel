import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import StoreLayout from '../../layouts/store-layout';
import ProductCard from '../../components/product-card';
import Breadcrumbs from '../../components/breadcrumbs';
import type { Card, Collection } from '../../types/store';
import { money } from '../../types/store';
import SearchSuggestions from '../../components/search-suggestions';

type Filters = { q?: string; collection?: string; size?: string; color?: string; availability?: string; min_price?: string | number | null; max_price?: string | number | null; sort?: string };
type Props = { curated?: boolean; heading: string; description: string; products: Card[]; filters: Filters; facets: { sizes: string[]; colors: string[] }; collections: Collection[]; pagination: { current: number; last: number; total: number; previous: string | null; next: string | null } };

export default function Shop({ heading, description, products, filters, facets, collections, pagination, curated = false }: Props) {
    const [state, setState] = useState({ q: filters.q ?? '', collection: filters.collection ?? '', size: filters.size ?? '', color: filters.color ?? '', availability: filters.availability ?? '', sort: filters.sort ?? 'newest', min: filters.min_price != null && filters.min_price !== '' ? String(Number(filters.min_price)/100) : '', max: filters.max_price != null && filters.max_price !== '' ? String(Number(filters.max_price)/100) : '' });
    const [pending, setPending] = useState(false);
    const filterPanel = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 641px)');
        const syncPanel = () => { if (filterPanel.current) filterPanel.current.open = desktop.matches; };
        syncPanel();
        desktop.addEventListener('change', syncPanel);
        return () => desktop.removeEventListener('change', syncPanel);
    }, []);
    const basePath = (usePage().url ?? '/shop').split(/[?#]/)[0];
    const chips: { key: keyof Filters; label: string }[] = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}` });
    if (filters.collection) chips.push({ key: 'collection', label: collections.find(item => item.slug === filters.collection)?.title ?? filters.collection });
    if (filters.size) chips.push({ key: 'size', label: `Size: ${filters.size}` });
    if (filters.color) chips.push({ key: 'color', label: `Color: ${filters.color}` });
    if (filters.availability) chips.push({ key: 'availability', label: filters.availability === 'in-stock' ? 'In stock' : 'Unavailable' });
    if (filters.min_price != null && filters.min_price !== '') chips.push({ key: 'min_price', label: `From ${money(Number(filters.min_price))}` });
    if (filters.max_price != null && filters.max_price !== '') chips.push({ key: 'max_price', label: `Up to ${money(Number(filters.max_price))}` });
    function filterHref(remove: keyof Filters | 'all') {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (key === 'page' || key === remove || (remove === 'all' && key !== 'sort') || value == null || value === '') continue;
            query.set(key, String(value));
        }
        return `${basePath}${query.size ? `?${query}` : ''}`;
    }
    const clearHref = filterHref('all');
    const focusResults = () => document.getElementById('catalog-results-summary')?.focus({ preventScroll: true });
    function submit(event: FormEvent) {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        router.get(window.location.pathname, { q: state.q || undefined, collection: state.collection || undefined, size: state.size || undefined, color: state.color || undefined, availability: state.availability || undefined, sort: state.sort, min_price: state.min ? Math.round(Number(state.min)*100) : undefined, max_price: state.max ? Math.round(Number(state.max)*100) : undefined }, {
            preserveScroll: true,
            onSuccess: () => {
                if (window.matchMedia('(max-width: 640px)').matches) {
                    if (filterPanel.current) filterPanel.current.open = false;
                    document.getElementById('catalog-results-summary')?.focus();
                }
            },
            onFinish: () => setPending(false),
        });
    }
    return <StoreLayout><Head title={heading}><meta name="description" head-key="description" content={description} /></Head>
        <header className="page-heading"><Breadcrumbs items={heading === 'All Products' ? [{ label: 'Shop' }] : [{ label: 'Shop', href: '/shop' }, { label: heading }]} /><p className="eyebrow">THE FORM/TECH COLLECTION</p><h1>{heading}</h1><p>{description}</p></header>
        <div className="shop-layout">
            <details className="catalog-filters" ref={filterPanel}>
                <summary>Filters &amp; sort{chips.length > 0 && <span className="filter-count">{chips.length} applied</span>}<span className="filter-toggle-icon" aria-hidden="true">+</span></summary>
            <form className="filter-form" onSubmit={submit} aria-label="Product filters">
                <label htmlFor="search">Search products</label><SearchSuggestions value={state.q} onChange={q => setState({...state,q})} />
                <label htmlFor="collection">Collection</label><select id="collection" value={state.collection} onChange={e => setState({...state,collection:e.target.value})}><option value="">All collections</option>{collections.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
                <label htmlFor="size">Size</label><select id="size" value={state.size} onChange={e => setState({...state,size:e.target.value})}><option value="">All sizes</option>{facets.sizes.map(s => <option key={s}>{s}</option>)}</select>
                <label htmlFor="color">Color</label><select id="color" value={state.color} onChange={e => setState({...state,color:e.target.value})}><option value="">All colors</option>{facets.colors.map(c => <option key={c}>{c}</option>)}</select>
                <label htmlFor="availability">Availability</label><select id="availability" value={state.availability} onChange={e => setState({...state,availability:e.target.value})}><option value="">All products</option><option value="in-stock">In stock</option><option value="out-of-stock">Unavailable</option></select>
                <fieldset><legend>Price range (USD)</legend><div className="price-inputs"><label>From<input aria-label="Minimum price in USD" type="number" min="0" max="100000" step="0.01" value={state.min} onChange={e => setState({...state,min:e.target.value})} /></label><label>To<input aria-label="Maximum price in USD" type="number" min="0" max="100000" step="0.01" value={state.max} onChange={e => setState({...state,max:e.target.value})} /></label></div></fieldset>
                <label htmlFor="sort">Sort by</label><select id="sort" value={state.sort} onChange={e => setState({...state,sort:e.target.value})}>{curated && <option value="curated">Collection edit</option>}<option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A–Z</option></select>
                <button className="button" type="submit" disabled={pending}>{pending ? 'Applying…' : 'Apply filters'}</button><Link href={clearHref} className="text-link" preserveScroll>Clear filters</Link>
            </form>
            </details>
            <section aria-label="Products" aria-busy={pending}><div className="results-heading"><p id="catalog-results-summary" tabIndex={-1} role="status">{pending ? 'Updating products…' : `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}`}</p><span>Sample prices in USD</span></div>
                {chips.length > 0 && <nav className="active-filters" aria-label="Active filters">
                    <span className="active-filters-label">Applied filters</span>
                    <ul>{chips.map(chip => <li key={chip.key}><Link href={filterHref(chip.key)} preserveScroll onSuccess={focusResults} aria-label={`Remove ${chip.label}`}><span>{chip.label}</span><span aria-hidden="true">×</span></Link></li>)}</ul>
                    <Link href={clearHref} preserveScroll onSuccess={focusResults} className="clear-active-filters">Clear all</Link>
                </nav>}
                {products.length ? <div className="product-grid shop-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No products found</h2><p>Try a broader product name or remove an applied filter. Your current collection stays selected when you clear filters.</p><Link className="button" href={clearHref}>Clear filters and try again →</Link><div className="empty-state-links"><Link href="/shop">Browse all products →</Link><Link href="/collections/new-arrivals">Explore new arrivals →</Link></div></div>}
                {pagination.last > 1 && <nav className="pagination" aria-label="Product pages">{pagination.previous ? <Link href={pagination.previous}>← Previous</Link> : <span>First page</span>}<span>Page {pagination.current} of {pagination.last}</span>{pagination.next ? <Link href={pagination.next}>Next →</Link> : <span>Last page</span>}</nav>}
            </section>
        </div>
    </StoreLayout>;
}
