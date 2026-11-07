import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { renderToString } from 'react-dom/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType } from 'react';

createServer(page => createInertiaApp({
    page,
    render: renderToString,
    title: title => title ? `${title} — FORM/TECH` : 'FORM/TECH',
    resolve: async name => (await resolvePageComponent<{ default: ComponentType }>(`./pages/${name}.tsx`, import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx'))).default,
    setup: ({ App, props }) => <App {...props} />,
}));
