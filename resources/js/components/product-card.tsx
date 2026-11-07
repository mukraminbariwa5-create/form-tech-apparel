import ResponsiveImage from './responsive-image';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import ColorSwatches from './color-swatches';
import type { Card } from '../types/store';
import { money } from '../types/store';
import { rememberResults } from '../types/browsing';

export default function ProductCard({ product, reveal = false }: { product: Card; reveal?: boolean }) {
    const [color, setColor] = useState(product.initialColor && product.colors?.includes(product.initialColor) ? product.initialColor : product.colors?.[0] ?? '');
    const activeColor = product.colors?.includes(color) ? color : product.colors?.[0] ?? '';
    const selected = product.colorOptions?.find(option => option.color === activeColor);
    const image = selected ? selected.image : product.image;
    const price = selected ? selected.price : product.price;
    const varies = selected ? selected.priceVaries : product.priceVaries;
    const href = `/products/${product.slug}${activeColor ? `?color=${encodeURIComponent(activeColor)}` : ''}`;
    return <article className="product-card" data-scroll-reveal={reveal ? '' : undefined}>
        <Link href={href} onClick={rememberResults} className="product-card-photo" aria-label={`View ${product.title}`}>
            {image ? <ResponsiveImage key={image.url} onLoad={event => event.currentTarget.classList.add('color-image-ready')} src={image.url} alt={image.alt} sizes="(max-width: 640px) 50vw, (max-width: 1023px) 40vw, 25vw" width="1122" height="1402" loading="lazy" /> : <span className="image-unavailable">Image unavailable</span>}
            <span className="product-card-cue" aria-hidden="true">Explore <span>↗</span></span>
        </Link>
        <div className="product-card-info"><Link href={href} onClick={rememberResults}>{product.title}</Link><span>{price === null ? 'Unavailable' : `${varies ? 'From ' : ''}${money(price)}`}</span></div>
        {product.colors?.length > 0 && <ColorSwatches compact colors={product.colors} value={activeColor} onChange={setColor} label={`Colors for ${product.title}`} />}
        {activeColor && <p className="selected-color">Color: {activeColor}</p>}
        {!product.available && <p className="availability-note">Currently unavailable</p>}
    </article>;
}
