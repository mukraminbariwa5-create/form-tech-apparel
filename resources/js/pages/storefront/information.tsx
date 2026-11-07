import ResponsiveImage from '../../components/responsive-image';
import Breadcrumbs from '../../components/breadcrumbs';
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import StoreLayout from '../../layouts/store-layout';
import SizeGuideDirectory from '../../components/size-guide-directory';
import type { ProductGuide } from '../../components/size-guide-directory';

type Guide = ProductGuide;
const titles: Record<string,string> = { technology: 'Designed for a more open world', about: 'A study in form and function', contact: 'Get in touch', 'size-guide': 'Size guide', 'shipping-returns': 'Demo shipping & returns' };

export default function Information({ page, guides }: { page: string; guides: Guide[] }) {
    const form = useForm({ name:'', email:'', message:'' });
    function submit(event: FormEvent) { event.preventDefault(); form.post('/contact',{preserveScroll:true,onSuccess:()=>form.reset(),onError:()=>document.getElementById('contact-errors')?.focus()}); }
    return <StoreLayout><Head title={titles[page]} /><article className="information-page"><Breadcrumbs items={[{ label: page === 'technology' ? 'Technology' : page === 'about' ? 'About' : titles[page] }]} /><p className="eyebrow">FORM / TECH</p><h1>{titles[page]}</h1>
        {page === 'technology' && <><ResponsiveImage className="information-image" src="/images/campaign/mountain-editorial.png" alt="Technical apparel in an imagined mountain and concrete setting" width="1916" height="821" /><h2>Clothing as an architectural idea.</h2><p>FORM/TECH explores the relationship between a garment's shape and the spaces we move through. Quiet palettes, articulated silhouettes and considered pockets shape this fictional wardrobe.</p><h2>Concepts, not certified performance.</h2><p>The products and campaign imagery are created for a portfolio demonstration. No waterproofing, insulation, sustainability or durability claims have been independently tested. Materials and design descriptions illustrate a concept rather than a real manufactured product.</p><Link className="text-link" href="/shop">Explore the collection →</Link></>}
        {page === 'about' && <><h2>Fictional apparel. Real engineering.</h2><p>FORM/TECH is a full-stack apparel commerce portfolio project built with Laravel, Inertia, React and PostgreSQL. The visual direction brings technical fashion together with concrete architecture and open landscapes.</p><p>All products, prices and inventory are sample data. Campaign and catalog images are AI-generated. This site is not a real merchant, and demo orders do not create purchases or delivery obligations.</p><Link href="/technology">Explore our approach →</Link></>}
        {page === 'shipping-returns' && <><div className="policy-disclaimer">ILLUSTRATIVE DEMO POLICY — NO REAL SALES OR DELIVERIES</div><p>No shipping service, delivery window, return label or refund service is provided. Products cannot be purchased through this portfolio project.</p><h2>What a demo order means</h2><p>A simulated checkout records sample order information for demonstration. It does not charge a payment method or arrange delivery. Use invented details when testing.</p><h2>Privacy for demo submissions</h2><p>Do not submit sensitive or real shipping information. Staff can access demo order and contact details. Demo data should be removed after testing under the project's documented retention procedure.</p></>}
        {page === 'size-guide' && <><p>These measurements are illustrative sample data, not a fit guarantee for real garments. Check the guide for the exact fictional product and choose a size on its product page.</p><SizeGuideDirectory guides={guides} /></>}
        {page === 'contact' && <><p>This form saves a message for a portfolio demo. It does not contact a real apparel company or send email. Use invented details; do not submit sensitive information.</p><form className="contact-form" onSubmit={submit}>
            <label htmlFor="contact-name">Name</label><input id="contact-name" aria-invalid={!!form.errors.name} aria-describedby={form.errors.name ? 'contact-errors' : undefined} autoComplete="name" required maxLength={120} value={form.data.name} onChange={e=>form.setData('name',e.target.value)} />
            <label htmlFor="contact-email">Email</label><input id="contact-email" aria-invalid={!!form.errors.email} aria-describedby={form.errors.email ? 'contact-errors' : undefined} type="email" autoComplete="email" required maxLength={254} value={form.data.email} onChange={e=>form.setData('email',e.target.value)} />
            <label htmlFor="contact-message">Message</label><textarea id="contact-message" aria-invalid={!!form.errors.message} aria-describedby={form.errors.message ? 'contact-errors' : undefined} required minLength={10} maxLength={3000} rows={6} value={form.data.message} onChange={e=>form.setData('message',e.target.value)} />
            {Object.values(form.errors).length > 0 && <div id="contact-errors" className="form-errors" role="alert" tabIndex={-1}>{Object.values(form.errors).map(error=><p key={error}>{error}</p>)}</div>}
            <button type="submit" className="button" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save demo message'}</button>
        </form></>}
    </article></StoreLayout>;
}
