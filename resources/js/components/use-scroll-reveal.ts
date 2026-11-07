import { useEffect, useRef } from 'react';

export default function useScrollReveal() {
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const container = root.current;
        if (!container || typeof IntersectionObserver === 'undefined') return;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (motion.matches) return;
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                if (!motion.matches) entry.target.classList.add('scroll-revealed');
            }
        }, { threshold: 0.12 });
        container.querySelectorAll<HTMLElement>('[data-scroll-reveal]').forEach(element => observer.observe(element));
        const stopMotion = () => {
            if (motion.matches) {
                observer.disconnect();
                container.querySelectorAll('.scroll-revealed').forEach(element => element.classList.remove('scroll-revealed'));
            }
        };
        motion.addEventListener('change', stopMotion);
        return () => { observer.disconnect(); motion.removeEventListener('change', stopMotion); };
    }, []);
    return root;
}
