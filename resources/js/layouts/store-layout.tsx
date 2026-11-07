import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import type { Shared } from '../types/store';
import Wordmark from '../components/wordmark';
import RecentlyViewed from '../components/recently-viewed';

type NavigationItem = { label: string; href: string };
type Props = PropsWithChildren<{ announcement?: string; navigation?: NavigationItem[] }>;
const foundationNavigation: NavigationItem[] = [{ label: 'Shop', href: '/shop' }, { label: 'Men', href: '/collections/men' }, { label: 'Women', href: '/collections/women' }, { label: 'Technology', href: '/technology' }];

export default function StoreLayout({ children, announcement, navigation = foundationNavigation }: Props) {
    const page = usePage<Shared>();
    const shared = page.props;
    const menu = useRef<HTMLDialogElement>(null);
    const menuButton = useRef<HTMLButtonElement>(null);
    const homeLink = useRef<HTMLAnchorElement>(null);
    const header = useRef<HTMLElement>(null);
    const cartCount = shared.cartCount ?? 0;
    const previousCount = useRef(cartCount);
    const path = page.url.split(/[?#]/)[0];
    function current(href: string): 'page' | 'location' | undefined {
        if (path === href) return 'page';
        if (href === '/shop' && (path.startsWith('/products/') || (path.startsWith('/collections/') && !['/collections/men', '/collections/women'].includes(path)))) return 'location';
        return undefined;
    }
    useEffect(() => {
        const increased = cartCount > previousCount.current;
        previousCount.current = cartCount;
        if (!increased || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const animations = [...(header.current?.querySelectorAll('.bag-count') ?? [])].map(badge => badge.animate([
            { transform: 'scale(1)', backgroundColor: 'transparent' },
            { transform: 'scale(1.22)', backgroundColor: '#dce7ff', offset: .4 },
            { transform: 'scale(1)', backgroundColor: 'transparent' },
        ], { duration: 480, easing: 'cubic-bezier(.2,.65,.3,1)' }));
        return () => animations.forEach(animation => animation.cancel());
    }, [cartCount]);
    useEffect(() => {
        // Keep this boundary aligned with the 767px compact-header CSS rules.
        const desktop = window.matchMedia('(min-width: 768px)');
        const closeCompactMenu = () => { if (desktop.matches && menu.current?.open) menu.current.close(); };
        desktop.addEventListener('change', closeCompactMenu);
        return () => desktop.removeEventListener('change', closeCompactMenu);
    }, []);
    function closeMenu() {
        menu.current?.close();
    }

    return <>
        <Head><meta name="description" head-key="description" content="Explore FORM/TECH, a fictional apparel collection. Portfolio demo with no payments or fulfillment." />{shared.storeUrl && <link rel="canonical" href={`${shared.storeUrl}${page.url.split('?')[0]}`} />}</Head>
        <a className="skip-link" href="#main">Skip to content</a>
        <div className="announcement"><p>{(announcement ?? shared.announcement ?? 'PORTFOLIO DEMO · NO PAYMENTS OR FULFILLMENT').replaceAll(' · ', '  |  ')}</p></div>
        <header ref={header} className="store-header">
            <nav className="desktop-navigation" aria-label="Main navigation">
                {navigation.map(item => <Link key={item.href} href={item.href} aria-current={current(item.href)}>{item.label}</Link>)}
            </nav>
            <button ref={menuButton} className="menu-button" aria-label="Menu" aria-haspopup="dialog" aria-controls="mobile-navigation" onClick={() => menu.current?.showModal()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
            <Link ref={homeLink} href="/" className="wordmark" aria-label="FORM TECH home"><Wordmark /></Link>
            <nav className="brand-navigation" aria-label="Brand navigation"><Link href="/about" aria-current={current('/about')}>About</Link><Link href="/search" className="icon-link" aria-label="Open search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg></Link><Link href="/cart" className="icon-link" aria-label={`View bag, ${shared.cartCount ?? 0} items`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></svg><span className="bag-count" aria-hidden="true">({cartCount})</span></Link></nav>
            <nav className="header-actions" aria-label="Mobile store tools"><Link href="/search" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg></Link><Link href="/cart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></svg><span className="sr-only">Bag </span><span className="bag-count">({cartCount})</span></Link></nav>
        </header>
        <dialog id="mobile-navigation" ref={menu} className="mobile-navigation" aria-labelledby="menu-title" onClose={() => {
            if (menuButton.current?.getClientRects().length) menuButton.current.focus();
            else homeLink.current?.focus();
        }} onClick={event => { if (event.target === menu.current) closeMenu(); }} onKeyDown={event => {
            if (event.key !== 'Tab') return;
            const controls = menu.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
            if (!controls?.length) return;
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}>
            <div className="mobile-navigation-panel">
                <div className="mobile-menu-heading"><h2 id="menu-title">Explore FORM/TECH</h2><button type="button" onClick={closeMenu} aria-label="Close navigation" autoFocus>Close ×</button></div>
                <nav aria-label="Mobile navigation"><Link href="/" onClick={closeMenu}>Home</Link>{navigation.map(item => <Link key={item.href} href={item.href} aria-current={current(item.href)} onClick={closeMenu}>{item.label}</Link>)}<Link href="/about" aria-current={current('/about')} onClick={closeMenu}>About</Link></nav>
                <nav aria-label="Mobile store tools"><Link href="/search" onClick={closeMenu}>Search</Link><Link href="/cart" onClick={closeMenu}>Bag ({shared.cartCount ?? 0})</Link>{shared.auth?.isAdmin && <Link href="/admin" onClick={closeMenu}>Admin</Link>}</nav>
                <p>Portfolio demonstration.<br />No payments or fulfillment.</p>
            </div>
        </dialog>
        {shared.flash?.success && <div className="flash-message" role="status">{shared.flash.success}</div>}
        <main id="main" tabIndex={-1}>{children}{/^\/(?:$|shop$|search$|collections\/|products\/)/.test(path) && <RecentlyViewed currentSlug={path.startsWith('/products/') ? path.slice('/products/'.length) : undefined} />}</main>
        <footer className="site-footer"><div><Link href="/" className="wordmark" aria-label="FORM TECH home"><Wordmark /></Link><p>Fictional apparel. A real engineering project.<br />Portfolio demo — no purchases, payments or fulfillment.<br />Sample prices in USD.</p></div><nav aria-label="Footer shop navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={current(item.href)}>{item.label}</Link>)}</nav><nav aria-label="Footer information">{[{label:'About',href:'/about'},{label:'Contact',href:'/contact'},{label:'Size guide',href:'/size-guide'},{label:'Demo shipping & returns',href:'/shipping-returns'},{label:'Staff sign in',href:'/login'}].map(item => <Link key={item.href} href={item.href} aria-current={current(item.href)}>{item.label}</Link>)}</nav></footer>
    </>;
}
