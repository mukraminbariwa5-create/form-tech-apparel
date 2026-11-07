import { createInertiaApp } from '@inertiajs/react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType } from 'react';

void createInertiaApp({
    title: title => title ? `${title} — FORM/TECH` : 'FORM/TECH',
    resolve: async name => (await resolvePageComponent<{ default: ComponentType }>(`./pages/${name}.tsx`, import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx'))).default,
    setup({ el, App, props }) {
        if (el.hasChildNodes()) hydrateRoot(el, <App {...props} />);
        else createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#145DFF' },
});
