import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './candidateScrollMotion.css';

export default function useHomeMotion() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!['/', '/employers'].includes(pathname)) return;
    const tracked = new Set<HTMLElement>();
    const candidateItems = new Set<HTMLElement>();
    const tiltCards = new Set<HTMLElement>();
    const removers: (() => void)[] = [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target.classList.contains('candidate-scroll-item')) {
          if (entry.isIntersecting) {
            entry.target.classList.add('candidate-scroll-visible');
            observer.unobserve(entry.target);
          }
          return;
        }
        if (entry.isIntersecting) entry.target.classList.add('home-motion-visible');
        else if (entry.boundingClientRect.top > window.innerHeight) entry.target.classList.remove('home-motion-visible');

      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const scan = () => {
      const root = document.querySelector<HTMLElement>('.zync-home, .employer-home');
      if (!root) return;
      if (root.classList.contains('zync-home')) {
        const groups = [
          '.home-existing-hero .hero-main-copy > *, .home-existing-hero .home-existing-robot',
          '.home-company-strip > div',
          '.home-latest-jobs .home-section-heading, .home-latest-jobs .portal-job-card, .home-latest-jobs .text-center',
          '.career-tools-section .mb-12, .career-tools-grid > .career-tool-card',
          '.career-journey .journey-header, .career-journey .journey-step-list, .career-journey .journey-preview',
          'section[aria-labelledby="candidate-job-tools-title"] > div > .flex',
          'section[aria-labelledby="candidate-job-tools-title"] .grid > div',
          '.home-categories .max-w-2xl, .home-categories .interactive-category-card',
          '.home-career-feature .career-role-introduction, .home-career-feature .career-role-panel',
          '.home-final-cta .candidate-opportunity-copy, .home-final-cta .candidate-opportunity-art',
          '.portal-footer .portal-footer-main > *, .portal-footer .portal-footer-bottom',
        ];
        groups.forEach(selector => {
          root.querySelectorAll<HTMLElement>(selector).forEach((item, index) => {
            if (candidateItems.has(item)) return;
            candidateItems.add(item);
            item.style.setProperty('--candidate-reveal-delay', `${Math.min(index % 4, 3) * 65}ms`);
            item.classList.add('candidate-scroll-item');
            // Previously visited content stays visible when lazy data arrives.
            if (item.getBoundingClientRect().bottom < 0 || item.contains(document.activeElement)) {
              item.classList.add('candidate-scroll-visible');
            } else observer.observe(item);
          });
        });
      }
      root.querySelectorAll<HTMLElement>('.home-latest-jobs, .home-categories, .home-career-feature, .home-final-cta, .employer-segments, .employer-callback, .employer-faq, .employer-final-cta, .employer-solution-section, .employer-features').forEach(el => {
        if (root.classList.contains('zync-home')) return;
        if (tracked.has(el)) return;
        tracked.add(el);
        // Reveal the inner content, keeping section backgrounds and scroll measurements stable.
        const content = el.querySelector<HTMLElement>(':scope > .portal-page-container, :scope > .max-w-7xl') || el;
        content.classList.add('home-motion-reveal');
        observer.observe(content);
      });
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
    return () => {
      observer.disconnect(); mutations.disconnect();
      removers.forEach(remove => remove());
      tracked.forEach(el => { const content = el.querySelector('.home-motion-reveal') || el; content.classList.remove('home-motion-reveal', 'home-motion-visible'); });
      candidateItems.forEach(item => {
        item.classList.remove('candidate-scroll-item', 'candidate-scroll-visible');
        item.style.removeProperty('--candidate-reveal-delay');
      });
    };
  }, [pathname]);
}
