import type { MouseEvent, PropsWithChildren } from 'react';

// Native hash navigation is the fallback. Enhance only this intentional scroll;
// route restoration and browser history keep their normal instant behavior.
export default function CollectionAnchor({ children }: PropsWithChildren) {
    function navigate(event: MouseEvent<HTMLAnchorElement>) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = document.getElementById('collections');
        if (!target) return;
        event.preventDefault();
        if (window.location.hash !== '#collections') window.history.pushState(window.history.state, '', '#collections');
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
    }
    return <a href="#collections" className="button button-light" onClick={navigate}>{children}</a>;
}
