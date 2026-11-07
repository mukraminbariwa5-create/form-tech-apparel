import { useEffect, useRef, useState } from 'react';
import ProductCard from './product-card';
import { RECENT_KEY, readRecent } from '../types/browsing';
import type { Card } from '../types/store';

export default function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
    const [products, setProducts] = useState<Card[]>([]);
    const [failed, setFailed] = useState(false);
    const [retry, setRetry] = useState(0);
    const request = useRef<AbortController | null>(null);
    useEffect(() => {
        const previous = readRecent();
        if (currentSlug) {
            try { sessionStorage.setItem(RECENT_KEY, JSON.stringify([currentSlug, ...previous.filter(slug => slug !== currentSlug)].slice(0, 8))); } catch { /* Storage is optional. */ }
        }
        const slugs = previous.filter(slug => slug !== currentSlug);
        if (!slugs.length) return;
        const controller = new AbortController();
        request.current = controller;
        const query = new URLSearchParams();
        slugs.forEach(slug => query.append('slugs[]', slug));
        fetch(`/catalog/recent?${query}`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' })
            .then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json() as Promise<{ products: Card[] }>; })
            .then(data => { if (!controller.signal.aborted) { setProducts(data.products); setFailed(false); } })
            .catch(() => { if (!controller.signal.aborted) setFailed(true); });
        return () => controller.abort();
    }, [currentSlug, retry]);
    if (!products.length && !failed) return null;
    return <section className="recently-viewed browse-section" aria-labelledby="recent-title">
        <div className="section-heading"><h2 id="recent-title">RECENTLY VIEWED</h2><button className="text-link" type="button" onClick={() => {
            request.current?.abort();
            try { sessionStorage.removeItem(RECENT_KEY); } catch { /* Storage is optional. */ }
            setProducts([]); setFailed(false);
        }}>Clear history</button></div>
        <p className="browse-section-note">Your viewing history stays in this browser tab. Prices and availability are refreshed from the catalog.</p>
        {failed ? <p role="status">Recently viewed products couldn’t load. <button type="button" className="text-link" onClick={() => setRetry(value => value + 1)}>Try again</button></p> : <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>}
    </section>;
}
