import { Link, router } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';
import { money } from '../types/store';

type Suggestion = { title: string; href: string; price: number };
type Result = { query: string; products: Suggestion[]; status: 'loading' | 'ready' | 'error' };

export default function SearchSuggestions({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [result, setResult] = useState<Result>({ query: '', products: [], status: 'ready' });
    const query = value.trim();
    const current = result.query === query ? result : undefined;
    const products = current?.products ?? [];
    const expanded = open && query.length >= 2;
    const activeId = expanded && active >= 0 && products[active] ? `${id}-${active}` : undefined;

    useEffect(() => {
        if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
    }, [activeId]);

    useEffect(() => {
        if (!open || query.length < 2) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setResult({ query, products: [], status: 'loading' });
            try {
                const response = await fetch(`/search/suggestions?q=${encodeURIComponent(query)}`, {
                    signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store',
                });
                if (!response.ok) throw new Error('Suggestions unavailable');
                const data: { products: Suggestion[] } = await response.json();
                if (!controller.signal.aborted) setResult({ query, products: data.products, status: 'ready' });
            } catch {
                if (!controller.signal.aborted) setResult({ query, products: [], status: 'error' });
            }
        }, 250);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [query, open]);

    return <div className="search-suggestions">
        <input id="search" type="search" role="combobox" autoComplete="off" maxLength={100}
            aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-results` : undefined}
            aria-activedescendant={activeId}
            value={value} placeholder="Jackets, cargo, layers…"
            onChange={event => { onChange(event.target.value); setActive(-1); setOpen(true); }}
            onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setActive(-1); }}
            onKeyDown={event => {
                if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1); }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault(); setOpen(true);
                    setActive(index => products.length ? (index < 0 ? (event.key === 'ArrowDown' ? 0 : products.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + products.length) % products.length) : -1);
                }
                if (event.key === 'Enter') {
                    if (expanded && active >= 0 && products[active]) { event.preventDefault(); router.visit(products[active].href); }
                    setOpen(false); setActive(-1);
                }
            }} />
        {expanded && <div className="search-suggestions-panel">
            <p className="suggestions-caption">Matching products · all collections</p>
            <ul id={`${id}-results`} role="listbox" aria-label="Suggested products">
                {products.map((product, index) => <li key={product.href} role="presentation"><Link
                    id={`${id}-${index}`} href={product.href} role="option" aria-selected={index === active} tabIndex={-1}
                    onMouseDown={event => event.preventDefault()} onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(index)}>
                    <span>{product.title}</span><small>From {money(product.price)}</small>
                </Link></li>)}
            </ul>
            <p className="suggestions-help" role="status">{!current || current.status === 'loading' ? 'Finding products…' : current.status === 'error' ? 'Suggestions unavailable. Press Enter to search.' : products.length ? '↑ ↓ to explore · Enter to open. Or press Enter without a selection to search.' : 'No matching products. Press Enter to search with your filters.'}</p>
        </div>}
    </div>;
}
