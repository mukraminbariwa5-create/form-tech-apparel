export type Option = { id: number; title: string; active: boolean };
export type Page<T> = { data: T[]; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null; total: number };
export type AdminVariant = { id: number | null; sku: string; size: string; color: string; price_cents: number; stock: number; active: boolean };
export type AdminProduct = Option & { slug: string; description: string; size_guide: { label: string; measurements: Record<string,string> }; images: { url: string; alt: string; color?: string | null }[]; variants: AdminVariant[]; collections: Option[] };
export type AdminCollection = Option & { slug: string; description: string; image_url: string | null; products: Option[]; products_count: number };
