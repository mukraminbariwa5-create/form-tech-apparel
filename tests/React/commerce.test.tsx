import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';

const requests=vi.hoisted(()=>({post:vi.fn(),get:vi.fn(),patch:vi.fn(),delete:vi.fn()}));
vi.mock('@inertiajs/react',async()=>{
    const React=await import('react');
    return {Head:()=>null,Link:({children,href,preserveScroll:_,onSuccess:__,...props}:PropsWithChildren<{href:string;preserveScroll?:boolean;onSuccess?:unknown}>)=><a href={href} {...props}>{children}</a>,router:requests,usePage:()=>({props:{errors:{},auth:{isAdmin:false},cartCount:0,flash:{success:null}}}),useForm:(initial:Record<string,unknown>)=>{
        const [data,setData]=React.useState(initial);
        const transform=React.useRef<(value:Record<string,unknown>)=>unknown>(value=>value);
        return {data,errors:{},processing:false,setData:(key:string,value:unknown)=>setData(current=>({...current,[key]:value})),transform:(fn:(value:Record<string,unknown>)=>unknown)=>{transform.current=fn;},post:(url:string)=>requests.post(url,transform.current(data)),reset:()=>setData(initial)};
    }};
});
vi.mock('../../resources/js/layouts/store-layout',()=>({default:({children}:PropsWithChildren)=><main>{children}</main>}));
import ProductPage from '../../resources/js/pages/storefront/product';
import Cart from '../../resources/js/pages/storefront/cart';
import Shop from '../../resources/js/pages/storefront/shop';
import { money } from '../../resources/js/types/store';

const product={id:1,title:'Demo Shell',slug:'demo-shell',description:'A fictional shell.',images:[],sizeGuide:{label:'Demo chest',measurements:{S:'80–90'}},variants:[
    {id:10,sku:'FT-S',size:'S',color:'Silver',price_cents:32000,stock:1},
    {id:11,sku:'FT-M',size:'M',color:'Silver',price_cents:33050,stock:3},
    {id:12,sku:'FT-XL',size:'XL',color:'Silver',price_cents:32000,stock:0},
]};
beforeEach(()=>vi.clearAllMocks());
describe('money and variant interaction',()=>{
    it('moves between real gallery entries with keyboard and pressed thumbnail state',async()=>{
        const user=userEvent.setup(); render(<ProductPage product={{...product,images:[{id:1,url:'/test-front.png',alt:'Demo front view'},{id:2,url:'/test-back.png',alt:'Demo back view'}]}}/>);
        screen.getByRole('region',{name:'Product gallery'}).focus();
        await user.keyboard('{ArrowRight}');
        expect(screen.getByAltText('Demo back view')).toBeVisible();
        expect(screen.getByRole('button',{name:'View image 2'})).toHaveAttribute('aria-pressed','true');
        await user.keyboard('{ArrowLeft}');
        expect(screen.getByAltText('Demo front view')).toBeVisible();
    });
    it('formats integer USD minor units without dropping cents',()=>{
        expect(money(0)).toBe('$0'); expect(money(32000)).toBe('$320'); expect(money(33050)).toBe('$330.50');
    });
    it('uses the selected variant price and bounds quantity by actual stock',async()=>{
        const user=userEvent.setup(); render(<ProductPage product={product}/>);
        expect(screen.getByRole('button',{name:'Increase quantity'})).toBeDisabled();
        await user.click(screen.getByRole('radio',{name:'M',exact:true}));
        expect(screen.getByText('$330.50 USD')).toBeVisible();
        await user.click(screen.getByRole('button',{name:'Increase quantity'}));
        await user.click(screen.getByRole('button',{name:'Increase quantity'}));
        expect(screen.getByRole('spinbutton',{name:'Quantity'})).toHaveValue(3);
        expect(screen.getByRole('button',{name:'Increase quantity'})).toBeDisabled();
        await user.click(screen.getByRole('button',{name:'Add to demo bag'}));
        expect(requests.post).toHaveBeenCalledWith('/cart',{variant_id:11,quantity:3});
    });
    it('shows a single product color as a labeled selected swatch',()=>{
        render(<ProductPage product={product}/>);
        expect(screen.queryByRole('combobox',{name:'Color'})).not.toBeInTheDocument();
        expect(screen.getByText('Silver')).toBeVisible();
        expect(screen.getByRole('button',{name:'Silver'})).toHaveAttribute('aria-pressed','true');
    });
    it('keeps actual multiple-color selection connected to the correct variant',async()=>{
        const user=userEvent.setup();
        render(<ProductPage product={{...product,images:[{id:1,url:'/silver.png',alt:'Silver Shell',color:'Silver'},{id:2,url:'/black.png',alt:'Black Shell',color:'Black'}],variants:[...product.variants,{id:13,sku:'FT-B-S',size:'S',color:'Black',price_cents:34000,stock:2}]}}/>);
        await user.click(screen.getByRole('button',{name:'Black',exact:true}));
        expect(screen.getByText('$340 USD')).toBeVisible();
        expect(screen.getByAltText('Black Shell')).toBeVisible();
        expect(screen.queryByAltText('Silver Shell')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button',{name:'Add to demo bag'}));
        expect(requests.post).toHaveBeenCalledWith('/cart',{variant_id:13,quantity:1});
    });
    it('disables adding unavailable variants and clamps after changing selection',async()=>{
        const user=userEvent.setup(); render(<ProductPage product={product}/>);
        await user.click(screen.getByRole('radio',{name:/XL/}));
        expect(screen.getByRole('button',{name:'Unavailable'})).toBeDisabled();
        expect(screen.getByRole('spinbutton',{name:'Quantity'})).toBeDisabled();
        await user.click(screen.getByRole('radio',{name:'M',exact:true}));
        await user.clear(screen.getByRole('spinbutton',{name:'Quantity'})); await user.type(screen.getByRole('spinbutton',{name:'Quantity'}),'99');
        expect(screen.getByRole('spinbutton',{name:'Quantity'})).toHaveValue(3);
        await user.click(screen.getByRole('radio',{name:'S',exact:true}));
        expect(screen.getByRole('spinbutton',{name:'Quantity'})).toHaveValue(1);
    });
});
describe('bag and query controls',()=>{
    it('removes one applied filter while retaining sorting and a zero-dollar price boundary',()=>{
        render(<Shop heading="All Products" description="Demo" products={[]} collections={[]} filters={{color:'Silver',size:'M',sort:'price-asc',min_price:0}} facets={{sizes:['M'],colors:['Silver']}} pagination={{current:1,last:1,total:0,previous:null,next:null}}/>);
        expect(screen.getByRole('link',{name:'Remove Color: Silver'})).toHaveAttribute('href','/shop?size=M&sort=price-asc&min_price=0');
        expect(screen.getByRole('link',{name:'Remove From $0'})).toHaveAttribute('href','/shop?color=Silver&size=M&sort=price-asc');
        expect(screen.getByRole('link',{name:'Clear all'})).toHaveAttribute('href','/shop?sort=price-asc');
        expect(screen.getByRole('spinbutton',{name:'Minimum price in USD'})).toHaveValue(0);
    });
    const line={id:10,title:'Demo Shell',slug:'demo-shell',quantity:2,size:'S',color:'Silver',price:32000,stock:3,available:true,image:null};
    it('shows server totals and connects quantity/remove and checkout',async()=>{
        const user=userEvent.setup(); render(<Cart lines={[line]} subtotal={64000}/>);
        expect(screen.getAllByText('$640')).toHaveLength(2);
        expect(screen.getByRole('link',{name:/Proceed to demo checkout/})).toHaveAttribute('href','/checkout');
        await user.click(screen.getByRole('button',{name:'Decrease Demo Shell quantity'}));
        expect(requests.patch).toHaveBeenCalledWith('/cart',{variant_id:10,quantity:1},expect.any(Object));
    });
    it('blocks checkout for stale inventory and provides a removal action',async()=>{
        const user=userEvent.setup(); render(<Cart lines={[{...line,available:false,stock:0}]} subtotal={64000}/>);
        expect(screen.queryByRole('link',{name:/Proceed to demo checkout/})).not.toBeInTheDocument();
        await user.click(screen.getByRole('button',{name:'Remove Demo Shell'}));
        expect(requests.delete).toHaveBeenCalledWith('/cart/10',expect.any(Object));
    });
    it('submits Enter search with default sort and converts USD range to integer cents',async()=>{
        const user=userEvent.setup(); render(<Shop heading="Search" description="Demo" products={[]} collections={[]} filters={{q:'',collection:'',size:'',color:'',availability:'',sort:'newest',min_price:null,max_price:null}} facets={{sizes:[],colors:[]}} pagination={{current:1,last:1,total:0,previous:null,next:null}}/>);
        await user.type(screen.getByRole('spinbutton',{name:'Minimum price in USD'}),'1.25');
        await user.type(screen.getByRole('spinbutton',{name:'Maximum price in USD'}),'4.99');
        await user.type(screen.getByRole('combobox',{name:'Search products'}),'no-such-item{Enter}');
        expect(requests.get).toHaveBeenCalledWith(expect.any(String),{q:'no-such-item',sort:'newest',min_price:125,max_price:499},expect.any(Object));
        expect(screen.getByRole('heading',{name:'No products found'})).toBeVisible();
    });
});
