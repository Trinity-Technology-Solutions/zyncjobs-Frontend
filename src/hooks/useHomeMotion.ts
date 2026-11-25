import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useHomeMotion() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!/^\/(?:employers\/*)?$/i.test(pathname)) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const tiltCards = new Set<HTMLElement>();
    const removers: (() => void)[] = [];
    const scan = () => {
      const root = document.querySelector<HTMLElement>('.zync-home, .employer-home');
      if (!root) return;
      root.querySelectorAll<HTMLElement>('.business-segment-card, .employer-offering-card, .home-latest-jobs .portal-job-card').forEach(card => {
        if (tiltCards.has(card)) return;
        tiltCards.add(card);
        card.classList.add('home-motion-card');
        let frame = 0;
        const reset = () => { cancelAnimationFrame(frame); card.style.removeProperty('--motion-rx'); card.style.removeProperty('--motion-ry'); };
        const move = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return;
          const rect = card.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
          const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            card.style.setProperty('--motion-rx', `${-y * 1.6}deg`);
            card.style.setProperty('--motion-ry', `${x * 1.6}deg`);
          });
        };
        card.addEventListener('pointermove', move);
        card.addEventListener('pointerleave', reset);
        removers.push(() => { reset(); card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', reset); card.classList.remove('home-motion-card'); });
      });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById('main-content') || document.body, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      removers.forEach(remove => remove());
    };
  }, [pathname]);
}
