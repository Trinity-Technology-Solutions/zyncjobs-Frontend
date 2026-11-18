import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './homeScrollMotion.css';

export default function useHomeMotion() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!/^\/(?:employers\/*)?$/i.test(pathname)) return;
    const revealItems = new Set<HTMLElement>();
    const tiltCards = new Set<HTMLElement>();
    const removers: (() => void)[] = [];
    let scrollFrame = 0;
    const updateProgress = () => {
      scrollFrame = 0;
      const viewport = window.innerHeight;
      const positions = Array.from(revealItems, item => {
        const { top, height } = item.getBoundingClientRect();
        const travel = Math.min(viewport * 0.62, Math.max(height, viewport * 0.36));
        const progress = Math.max(0, Math.min(1, (viewport - top) / travel));
        return { item, progress };
      });
      for (const { item, progress } of positions) {
        const remaining = (1 - progress).toFixed(3);
        if (item.style.getPropertyValue('--home-slide-remaining') !== remaining) {
          item.style.setProperty('--home-slide-remaining', remaining);
          item.classList.toggle('home-scroll-moving', remaining !== '0.000');
        }
      }
    };
    const scheduleProgress = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress);
    };
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const scan = () => {
      const root = document.querySelector<HTMLElement>('.zync-home, .employer-home');
      if (!root) return;
      for (const item of revealItems) {
        if (!root.contains(item)) revealItems.delete(item);
      }
      const groups = root.classList.contains('zync-home')
        ? [
          '.home-existing-hero .hero-main-copy > *, .home-existing-hero .home-existing-robot',
          '.home-company-strip > div',
          '.home-latest-jobs .home-section-heading, .home-latest-jobs .portal-job-card, .home-latest-jobs .text-center',
          '.career-tools-section .mb-12',
          '.career-tools-grid > .career-tool-card',
          '.career-journey .journey-header, .career-journey .journey-step-list',
          '.career-journey .journey-panel',
          'section[aria-labelledby="candidate-job-tools-title"] > div > .flex',
          'section[aria-labelledby="candidate-job-tools-title"] .grid > div',
          '.home-categories .max-w-2xl, .home-categories .interactive-category-card',
          '.home-career-feature .career-role-introduction, .home-career-feature .career-role-panel',
          '.home-final-cta .candidate-opportunity-copy, .home-final-cta .candidate-opportunity-art',
        ]
        : [
          '.employer-hero-copy, .employer-hero-form',
          '.employer-job-ticker',
          '.employer-trusted > *',
          '.employer-solution-section .career-discovery-art, .employer-category-panel',
          '.reveal',
        ];
      groups.push('.portal-footer .portal-footer-main > *, .portal-footer .portal-footer-bottom');
      groups.forEach(selector => {
        root.querySelectorAll<HTMLElement>(selector).forEach((item, index) => {
          if (revealItems.has(item)) return;
          revealItems.add(item);
          item.style.setProperty('--home-slide-direction', index % 2 === 0 ? '-1' : '1');
          item.classList.add('home-scroll-item');
        });
      });
      scheduleProgress();
      if (!finePointer) return;
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
    window.addEventListener('scroll', scheduleProgress, { passive: true, capture: true });
    window.addEventListener('resize', scheduleProgress);
    return () => {
      mutations.disconnect();
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener('scroll', scheduleProgress, true);
      window.removeEventListener('resize', scheduleProgress);
      removers.forEach(remove => remove());
      revealItems.forEach(item => {
        item.classList.remove('home-scroll-item', 'home-scroll-moving');
        item.style.removeProperty('--home-slide-remaining');
        item.style.removeProperty('--home-slide-direction');
      });
    };
  }, [pathname]);
}
