import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
vi.mock('@inertiajs/react', () => ({ Link: ({ children, href }: PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));
import Breadcrumbs from '../../resources/js/components/breadcrumbs';
import CollectionAnchor from '../../resources/js/components/collection-anchor';
import ProductCard from '../../resources/js/components/product-card';

afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });

describe('refined navigation and truthful cards', () => {
    it('provides real Home and Shop links with a labeled current collection', () => {
        render(<Breadcrumbs items={[{label:'Shop',href:'/shop'},{label:'Technical Jackets'}]} />);
        expect(screen.getByRole('navigation',{name:'Breadcrumb'})).toBeVisible();
        expect(screen.getByRole('link',{name:'Home'})).toHaveAttribute('href','/');
        expect(screen.getByRole('link',{name:'Shop'})).toHaveAttribute('href','/shop');
        expect(screen.getByText('Technical Jackets')).toHaveAttribute('aria-current','page');
    });
    it.each([false,true])('scrolls intentionally, focuses the tiles and avoids duplicate history (reduced motion: %s)', async reduced => {
        const user = userEvent.setup();
        vi.stubGlobal('matchMedia', () => ({matches:reduced}));
        render(<><CollectionAnchor>Explore Collections</CollectionAnchor><section id="collections" tabIndex={-1} aria-label="Shop collections" /></>);
        const target = screen.getByRole('region',{name:'Shop collections'});
        const scroll = vi.fn(); target.scrollIntoView = scroll;
        const initial = window.history.length;
        await user.click(screen.getByRole('link',{name:'Explore Collections'}));
        expect(scroll).toHaveBeenCalledWith({behavior:reduced ? 'instant' : 'smooth',block:'start'});
        expect(target).toHaveFocus();
        expect(window.location.hash).toBe('#collections');
        await user.click(screen.getByRole('link',{name:'Explore Collections'}));
        expect(window.history.length).toBe(initial+1);
    });
    it('keeps actual color names accessible, including custom staff colors', () => {
        const product = {id:1,slug:'shell',title:'Shell',image:null,price:32000,priceVaries:false,available:true,colors:['Silver','Custom staff color']};
        render(<ProductCard product={product} />);
        expect(screen.getByRole('group',{name:'Colors for Shell'})).toBeVisible();
        expect(screen.getByText('Silver')).toBeInTheDocument();
        expect(screen.getByText('Custom staff color')).toBeVisible();
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });
    it('preserves the selected swatch even for a single remaining available color', () => {
        render(<ProductCard product={{id:1,slug:'shell',title:'Shell',image:null,price:32000,priceVaries:false,available:true,colors:['Silver']}} />);
        expect(screen.getByRole('button',{name:'Silver'})).toHaveAttribute('aria-pressed','true');
    });
    it('keeps the selected dot and destination valid when filters change available colors', async () => {
        const product = {id:1,slug:'shell',title:'Shell',image:null,price:32000,priceVaries:false,available:true,colors:['Silver','Charcoal']};
        const {rerender} = render(<ProductCard product={product} />);
        await userEvent.setup().click(screen.getByRole('button',{name:'Charcoal'}));
        rerender(<ProductCard product={{...product,colors:['Silver']}} />);
        expect(screen.getByRole('button',{name:'Silver'})).toHaveAttribute('aria-pressed','true');
        expect(screen.getByRole('link',{name:'Shell',exact:true})).toHaveAttribute('href','/products/shell?color=Silver');
    });
    it('updates the card image, price and product destination when choosing a color', async () => {
        const user=userEvent.setup();
        render(<ProductCard product={{id:1,slug:'shell',title:'Shell',image:null,price:32000,priceVaries:true,available:true,colors:['Silver','Charcoal'],colorOptions:[
            {color:'Silver',image:{url:'/silver.png',alt:'Silver Shell'},price:32000,priceVaries:false},
            {color:'Charcoal',image:{url:'/charcoal.png',alt:'Charcoal Shell'},price:34000,priceVaries:false},
        ]}} />);
        expect(screen.getByAltText('Silver Shell')).toBeVisible();
        await user.click(screen.getByRole('button',{name:'Charcoal'}));
        expect(screen.getByRole('button',{name:'Charcoal'})).toHaveAttribute('aria-pressed','true');
        expect(screen.getByAltText('Charcoal Shell')).toBeVisible();
        expect(screen.getByText('Color: Charcoal')).toBeVisible();
        expect(screen.getByText('$340')).toBeVisible();
        expect(screen.getByRole('link',{name:'Shell',exact:true})).toHaveAttribute('href','/products/shell?color=Charcoal');
    });
});
