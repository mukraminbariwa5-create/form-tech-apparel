export type Card = { id: number; slug: string; title: string; image: { url: string; alt: string } | null; price: number | null; priceVaries: boolean; available: boolean; colors: string[]; initialColor?: string | null; colorOptions?: { color: string; image: { url: string; alt: string } | null; price: number | null; priceVaries: boolean }[] };
export type Collection = { slug: string; title: string; description?: string; image_url?: string | null };
export type Variant = { id: number; size: string; color: string; price_cents: number; stock: number; sku: string };
export type CartLine = { id: number; title: string; slug: string | null; quantity: number; size: string | null; color: string | null; price: number | null; stock: number; available: boolean; image: { url: string; alt: string } | null };
export type Shared = { auth: { isAdmin: boolean }; storeUrl: string; cartCount: number; announcement: string; flash: { success: string | null }; errors: Record<string,string> };
export function money(cents: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100); }
