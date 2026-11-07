import ResponsiveImage from '../../components/responsive-image';
import CollectionAnchor from '../../components/collection-anchor';
import useScrollReveal from '../../components/use-scroll-reveal';
import { Head, Link } from '@inertiajs/react';
import StoreLayout from '../../layouts/store-layout';
import ProductCard from '../../components/product-card';
import type { Card, Collection } from '../../types/store';

type Copy = { headline: string; body: string; image: string; cta_label: string; cta_href: string };
type Content = { announcement: string; hero: { eyebrow: string; headline: string; body: string; image: string; primary_label: string; primary_href: string; secondary_label: string; secondary_href: string }; editorial: Copy; brand_statement: string };

export default function Home({ content, collections, featured }: { content: Content; collections: Collection[]; featured: Card[] }) {
    const revealRoot = useScrollReveal();
    return <StoreLayout announcement={content.announcement}>
        <Head title="Technical clothing for wherever next"><meta name="description" head-key="description" content="Explore FORM/TECH, a fictional technical apparel collection and full-stack commerce portfolio demo." /></Head>
        <div ref={revealRoot} className="home-content">
        <section className="hero" aria-labelledby="hero-title">
            <ResponsiveImage src={content.hero.image} alt="Two models in silver and charcoal technical shells, framed by concrete architecture" sizes="(max-width: 640px) 1240px, (max-width: 1023px) 150vw, 100vw" width="1774" height="887" fetchPriority="high" />
            <div className="hero-copy"><p className="eyebrow">{content.hero.eyebrow}</p><h1 id="hero-title">{content.hero.headline.replace(' FOR A MORE ', '\nFOR A MORE\n')}</h1><p className="hero-description">{content.hero.body.replace(' Performance.', '\nPerformance.')}</p><div className="hero-actions"><Link href={content.hero.primary_href} className="button">{content.hero.primary_label} <span aria-hidden="true">→</span></Link>{['/#collections', '#collections'].includes(content.hero.secondary_href) ? <CollectionAnchor>{content.hero.secondary_label} <span aria-hidden="true">→</span></CollectionAnchor> : <Link href={content.hero.secondary_href} className="button button-light">{content.hero.secondary_label} <span aria-hidden="true">→</span></Link>}</div></div>
        </section>
        <section id="collections" className="collection-tiles" aria-label="Shop collections" tabIndex={-1}>{collections.map(collection => <Link href={`/collections/${collection.slug}`} key={collection.slug} className="collection-tile" data-scroll-reveal="">
            {collection.image_url && <ResponsiveImage src={collection.image_url} alt={`${collection.title} campaign`} sizes="(max-width: 640px) 50vw, 33vw" width="1536" height="1024" loading="lazy" />}
            <span>{collection.title}</span><small>Shop <span aria-hidden="true">→</span></small>
        </Link>)}</section>
        <section className="editorial-story" aria-labelledby="editorial-title"><ResponsiveImage src={content.editorial.image} sizes="(max-width: 640px) 1260px, 100vw" alt="A model in black technical clothing on a concrete terrace overlooking snow-covered mountains" width="1916" height="821" loading="lazy" /><div data-scroll-reveal=""><h2 id="editorial-title">{content.editorial.headline.replace(' FOR A MORE ', '\nFOR A MORE\n')}</h2><p>{content.editorial.body}</p><Link href={content.editorial.cta_href}>{content.editorial.cta_label} <span aria-hidden="true">→</span></Link></div></section>
        <section className="featured-section"><div className="section-heading" data-scroll-reveal=""><h2>FEATURED PRODUCTS</h2><Link href="/shop">View All <span aria-hidden="true">→</span></Link></div><div className="product-grid">{featured.map(product => <ProductCard key={product.id} product={product} reveal />)}</div></section>
        <section className="brand-statement"><p className="eyebrow">FORM / FUNCTION / PERSPECTIVE</p><h2>{content.brand_statement}</h2><p>A fictional collection. A portfolio exploration.</p></section>
        </div>
    </StoreLayout>;
}
