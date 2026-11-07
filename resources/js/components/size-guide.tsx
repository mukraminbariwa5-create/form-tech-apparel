import { useId, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

export type SizeGuideData = { label: string; measurements: Record<string, string> };

export function inInches(value: string, label: string): string {
    if (!/\bcm\b/i.test(`${label} ${value}`)) return value;
    const range = value.match(/^\s*(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*$/i);
    return range ? `${(Number(range[1]) / 2.54).toFixed(1)}–${(Number(range[2]) / 2.54).toFixed(1)} in` : value;
}

export function SizeMeasurements({ guide, selected }: { guide: SizeGuideData; selected?: string }) {
    const [unit, setUnit] = useState<'cm' | 'in'>('cm');
    const convertible = Object.values(guide.measurements).some(value => inInches(value, guide.label) !== value);
    const apparelSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const measurements = Object.entries(guide.measurements).sort(([a], [b]) => {
        const first = apparelSizes.indexOf(a), second = apparelSizes.indexOf(b);
        return first >= 0 && second >= 0 ? first - second : a.localeCompare(b, undefined, { numeric: true });
    });
    return <div className="size-guide-content">
        <p>{guide.label}</p>
        {convertible && <div className="measurement-units" role="group" aria-label="Measurement units"><button type="button" aria-pressed={unit === 'cm'} onClick={() => setUnit('cm')}>Centimetres</button><button type="button" aria-pressed={unit === 'in'} onClick={() => setUnit('in')}>Inches</button></div>}
        <table className="measurement-table"><caption>Illustrative measurements{unit === 'in' ? ' · converted to inches' : ''}</caption><thead><tr><th scope="col">Size</th><th scope="col">Measurement</th></tr></thead><tbody>{measurements.map(([size, value]) => <tr key={size} className={selected === size ? 'selected-measurement' : undefined}><th scope="row">{size}{selected === size && <span className="sr-only"> — selected size</span>}</th><td>{unit === 'in' ? inInches(value, guide.label) : value}</td></tr>)}</tbody></table>
        <p className="measurement-help">{/chest/i.test(guide.label) ? 'For a body chest measurement, measure around the fullest part of your chest with the tape level.' : /waist/i.test(guide.label) ? 'For a body waist measurement, measure around your waist with the tape level and comfortably snug.' : 'Use the product’s stated measurement type. One-size labels are not converted.'} These are fictional sample measurements, not a fit guarantee. Size names stay as listed in the catalog.</p>
    </div>;
}

export default function ProductSizeGuide({ guide, selected, title }: { guide: SizeGuideData; selected: string; title: string }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();
    return <>
        <button ref={trigger} type="button" className="text-link size-guide-trigger" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Size guide & measurements →</button>
        <dialog ref={dialog} className="size-guide-dialog" aria-labelledby={id} onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
            <div className="size-guide-dialog-heading"><h2 id={id}>Size guide · {title}</h2><button type="button" className="text-link" onClick={() => dialog.current?.close()} autoFocus>Close ×</button></div>
            <SizeMeasurements guide={guide} selected={selected} />
            <Link href="/size-guide">Explore all product size guides →</Link>
        </dialog>
    </>;
}
