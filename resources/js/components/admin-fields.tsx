import { Link } from '@inertiajs/react';
import { useId } from 'react';

export function Field({ label, value, onChange, type = 'text', area = false, required = true, disabled = false, maxLength, min, step }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; area?: boolean; required?: boolean; disabled?: boolean; maxLength?: number; min?: number; step?: string }) {
    const id = useId();
    return <div className="form-field"><label htmlFor={id}>{label}</label>{area ? <textarea id={id} rows={4} required={required} disabled={disabled} maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} /> : <input id={id} type={type} required={required} disabled={disabled} maxLength={maxLength} min={min} step={step} value={value} onChange={e => onChange(e.target.value)} />}</div>;
}
export function Check({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
    return <label className="admin-check"><input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />{label}</label>;
}
export function Pagination({ page }: { page: { current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null } }) {
    return <nav className="pagination" aria-label="Result pages">{page.prev_page_url && <Link href={page.prev_page_url}>← Previous</Link>}<span>Page {page.current_page} of {page.last_page}</span>{page.next_page_url && <Link href={page.next_page_url}>Next →</Link>}</nav>;
}
