import ResponsiveImage from '../../components/responsive-image';
import Breadcrumbs from '../../components/breadcrumbs';
import ColorSwatches from '../../components/color-swatches';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import StoreLayout from '../../layouts/store-layout';
import { money } from '../../types/store';
import type { Card, Collection, Variant } from '../../types/store';
import ProductSizeGuide from '../../components/size-guide';
import ProductCard from '../../components/product-card';
import CatalogReturn from '../../components/catalog-return';

type Product = { collections?: Collection[]; id: number; title: string; description: string; slug: string; initialColor?: string | null; images: { id: number; url: string; alt: string; color?: string | null }[]; variants: Variant[]; sizeGuide: { label: string; measurements: Record<string,string> } };

export default function ProductPage({ product, related = [] }: { product: Product; related?: Card[] }) {
    const initial = product.variants.find(v => v.color === product.initialColor && v.stock > 0) ?? product.variants.find(v => v.color === product.initialColor) ?? product.variants.find(v => v.stock > 0) ?? product.variants[0];
    const [color, setColor] = useState(initial?.color ?? '');
    const [size, setSize] = useState(initial?.size ?? '');
    const [imageIndex, setImageIndex] = useState(0);
    const form = useForm({ variant_id: initial?.id ?? 0, quantity: 1 });
    const colors = [...new Set(product.variants.map(v => v.color))];
    const variants = product.variants.filter(v => v.color === color);
    const variant = variants.find(v => v.size === size);
    const quantity = Math.min(form.data.quantity, Math.max(1, variant?.stock ?? 1));
    const gallery = product.images.filter(photo => !photo.color || photo.color === color);
    const image = gallery[imageIndex] ?? gallery[0];
    function chooseColor(nextColor: string) {
        setColor(nextColor);
        const next = product.variants.find(v => v.color === nextColor && v.size === size) ?? product.variants.find(v => v.color === nextColor && v.stock > 0) ?? product.variants.find(v => v.color === nextColor);
        setSize(next?.size ?? '');
        setImageIndex(0);
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        if (!variant || variant.stock < quantity) return;
        form.transform(() => ({ variant_id: variant.id, quantity }));
        form.post('/cart', { preserveScroll: true });
    }
    return <StoreLayout><Head title={product.title}><meta name="description" head-key="description" content={product.description} /></Head>
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: product.title }]} />
        <CatalogReturn />
        <div className="product-detail">
            <section className="product-gallery" aria-label="Product gallery" tabIndex={gallery.length > 1 ? 0 : undefined} onKeyDown={e => { if (gallery.length > 1 && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); setImageIndex((imageIndex + (e.key === 'ArrowRight' ? 1 : -1) + gallery.length) % gallery.length); } }}>
                {image ? <ResponsiveImage key={image.url} onLoad={event => event.currentTarget.classList.add('color-image-ready')} className="main-product-image" sizes="(max-width: 640px) 100vw, 55vw" src={image.url} alt={image.alt} width="1122" height="1402" fetchPriority="high" /> : <p className="image-unavailable">Image unavailable</p>}
                {gallery.length > 1 && <div className="gallery-thumbnails">{gallery.map((photo,index) => <button key={photo.id} type="button" aria-label={`View image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><ResponsiveImage src={photo.url} alt="" sizes="80px" width="80" height="100" /></button>)}</div>}
            </section>
            <section className="product-purchase" aria-labelledby="product-title"><p className="eyebrow">FUNCTION / FORM</p><h1 id="product-title">{product.title}</h1><p className="product-price">{variant ? `${money(variant.price_cents)} USD` : 'Select a variant'}</p><p>{product.description}</p>
                <form onSubmit={submit}>
                    {colors.length ? <ColorSwatches colors={colors} value={color} onChange={chooseColor} /> : <p>Color unavailable</p>}
                    <fieldset className="size-options"><legend>Size</legend>{variants.map(v => <label key={v.id} className={`${v.size === size ? 'selected' : ''} ${v.stock === 0 ? 'sold-out-size' : ''}`}><input type="radio" name="size" value={v.size} checked={v.size === size} onChange={() => setSize(v.size)} /><span>{v.size}{v.stock === 0 && <span className="sr-only"> — unavailable</span>}</span></label>)}</fieldset>
                    <ProductSizeGuide guide={product.sizeGuide} selected={size} title={product.title} />
                    <p className="stock-status" aria-live="polite">{variant?.stock ? 'Available in the selected size and color' : 'This variant is currently unavailable'}</p>
                    <label htmlFor="quantity">Quantity</label><div className="quantity-controls"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1 || !variant?.stock} onClick={() => form.setData('quantity', quantity - 1)}>−</button><input id="quantity" type="number" min="1" max={Math.max(1,variant?.stock ?? 1)} value={quantity} disabled={!variant?.stock} onChange={e => form.setData('quantity', Math.max(1,Math.min(variant?.stock ?? 1,Math.trunc(Number(e.target.value)) || 1)))} /><button type="button" aria-label="Increase quantity" disabled={!variant || quantity >= variant.stock} onClick={() => form.setData('quantity', quantity + 1)}>+</button></div>
                    {Object.values(form.errors).length > 0 && <div className="form-errors" role="alert">{Object.values(form.errors).map(error => <p key={error}>{error}</p>)}</div>}
                    <button className="button add-to-bag" type="submit" disabled={!variant?.stock || form.processing} aria-busy={form.processing}>{form.processing ? 'Adding…' : variant?.stock ? 'Add to demo bag' : 'Unavailable'}</button>
                </form><p className="demo-note">Portfolio demo. No payment is taken and no merchandise will be delivered.</p>
                <details className="product-overview" open><summary>Catalog details</summary><dl className="product-facts"><div><dt>Color options</dt><dd>{colors.length} in this catalog</dd></div><div><dt>Sizes in this color</dt><dd>{variants.map(item => item.size).join(' / ') || 'No active sizes'}</dd></div><div><dt>Current selection</dt><dd>{color} / {size || 'Choose a size'}</dd></div><div><dt>Sizing reference</dt><dd>{product.sizeGuide.label}</dd></div></dl><p>Read the description and measurement guide for this fictional item. Material composition and tested performance specifications are not supplied.</p>{!!product.collections?.length && <div className="product-collection-links">{product.collections.map(collection => <Link key={collection.slug} href={`/collections/${collection.slug}`}>{collection.title} →</Link>)}</div>}</details>
            </section>
        </div>
        {related.length > 0 && <section className="related-products browse-section" aria-labelledby="related-title"><div className="section-heading"><h2 id="related-title">EXPLORE RELATED PIECES</h2><Link href="/shop">View all →</Link></div><p className="browse-section-note">Available pieces from shared collections, followed by other catalog selections.</p><div className="product-grid">{related.map(item => <ProductCard key={item.id} product={item} />)}</div></section>}
    </StoreLayout>;
}
