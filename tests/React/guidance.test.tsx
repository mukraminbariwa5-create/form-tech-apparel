import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { SizeMeasurements, inInches } from '../../resources/js/components/size-guide';
import { readResults, readRecent, RECENT_KEY } from '../../resources/js/types/browsing';

beforeEach(() => sessionStorage.clear());

describe('measurement guidance and local browsing state', () => {
    it('converts stated centimetre ranges without inventing units for custom data', async () => {
        expect(inInches('88–94', 'Body chest (cm)')).toBe('34.6–37.0 in');
        expect(inInches('One size', 'Sample size')).toBe('One size');
        expect(inInches('88–94', 'Custom scale')).toBe('88–94');
        render(<SizeMeasurements guide={{ label: 'Body chest (cm)', measurements: { L: '102–108', M: '95–101', S: '88–94' } }} selected="S" />);
        await userEvent.setup().click(screen.getByRole('button', { name: 'Inches', exact: true }));
        expect(screen.getByText('34.6–37.0 in')).toBeVisible();
        expect(screen.getByRole('rowheader', { name: /S.*selected size/ })).toBeVisible();
        expect(screen.getAllByRole('rowheader').map(header => header.textContent?.[0])).toEqual(['S', 'M', 'L']);
    });
    it('rejects external and private return destinations and bounds local history', () => {
        for (const url of ['https://example.com/shop', '/admin', '/checkout']) {
            sessionStorage.setItem('form-tech:catalog-return', JSON.stringify({ url, scroll: 100 }));
            expect(readResults()).toBeNull();
        }
        sessionStorage.setItem('form-tech:catalog-return', JSON.stringify({ url: '/shop?size=M', scroll: 1200 }));
        expect(readResults()).toEqual({ url: '/shop?size=M', scroll: 1200 });
        sessionStorage.setItem(RECENT_KEY, JSON.stringify(['aeroshell-jacket', 'aeroshell-jacket', '../admin', 12, 'ridge-pullover']));
        expect(readRecent()).toEqual(['aeroshell-jacket', 'ridge-pullover']);
    });
});
