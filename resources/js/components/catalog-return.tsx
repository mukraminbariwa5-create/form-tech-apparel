import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { readResults } from '../types/browsing';

export default function CatalogReturn() {
    const [result, setResult] = useState<ReturnType<typeof readResults>>(null);
    useEffect(() => setResult(readResults()), []);
    return <Link className="catalog-return text-link" href={result?.url ?? '/shop'} onClick={event => {
        if (!result || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        router.visit(result.url, { onSuccess: () => {
            requestAnimationFrame(() => window.scrollTo({ top: result.scroll, behavior: 'instant' }));
        } });
    }}>← {result ? 'Back to your results' : 'Explore all products'}</Link>;
}
