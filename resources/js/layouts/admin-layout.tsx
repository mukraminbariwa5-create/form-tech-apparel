import { Head, Link, router, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import type { Shared } from '../types/store';
import Wordmark from '../components/wordmark';

const navigation = [['Overview','/admin'],['Products','/admin/products'],['Collections','/admin/collections'],['Demo orders','/admin/orders'],['Homepage content','/admin/content'],['Contact messages','/admin/contacts']];

export default function AdminLayout({ title, children }: PropsWithChildren<{ title: string }>) {
    const { props, url } = usePage<Shared>();
    return <div className="admin-shell"><Head title={`${title} · Staff`}><meta name="robots" content="noindex, nofollow" /></Head>
        <a className="skip-link" href="#admin-main">Skip to content</a><header className="admin-header"><Link className="wordmark" href="/"><Wordmark /></Link><span>STAFF · PORTFOLIO DEMO</span><button type="button" onClick={() => router.post('/logout')}>Sign out</button></header>
        <nav className="admin-nav" aria-label="Staff navigation">{navigation.map(([label,href]) => <Link key={href} href={href} aria-current={url.split('?')[0] === href || (href !== '/admin' && url.startsWith(href+'/')) ? 'page' : undefined}>{label}</Link>)}</nav>
        <main id="admin-main" className="admin-main"><div className="admin-page-title"><h1>{title}</h1><Link href="/">View storefront →</Link></div>
            {props.flash?.success && <div className="flash-message" role="status">{props.flash.success}</div>}
            {Object.keys(props.errors ?? {}).length > 0 && <div className="form-errors admin-errors" role="alert"><h2>Check the submitted details</h2>{Object.entries(props.errors).map(([key,message]) => <p key={key}>{message}</p>)}{props.errors.conflict && <a className="text-link" href={url}>Reload editor with current data →</a>}</div>}
            {children}
        </main></div>;
}
