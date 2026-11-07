const tones: Record<string, string> = { silver: '#bfc4c8', charcoal: '#363c42', black: '#16191c', cobalt: '#145DFF', slate: '#697984', white: '#ffffff', stone: '#c6c2b6', olive: '#73765a' };

type Props = { colors: string[]; value: string; onChange: (color: string) => void; compact?: boolean; label?: string };
export default function ColorSwatches({ colors, value, onChange, compact = false, label = 'Color' }: Props) {
    return <fieldset className={`color-options${compact ? ' compact-color-options' : ''}`}>
        <legend className={compact ? 'sr-only' : undefined}>{label}</legend>
        <div>{colors.map(color => <button key={color} type="button" aria-pressed={value === color} title={color} onClick={() => onChange(color)}>
            <span className="color-dot" style={{ backgroundColor: tones[color.toLowerCase()] }} aria-hidden="true" />
            <span className={compact && tones[color.toLowerCase()] ? 'sr-only' : undefined}>{color}</span>
        </button>)}</div>
    </fieldset>;
}
