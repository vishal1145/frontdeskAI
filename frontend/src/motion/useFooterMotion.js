// Footer reveal (the footer is shared by every route, so it owns its own scoped motion).
import { useLayoutEffect } from 'react';
import { gsap, ScrollTrigger, EASE } from './core';

export default function useFooterMotion(ref) {
  useLayoutEffect(() => {
    const footer = ref.current;
    if (!footer) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const card = footer.firstElementChild;
      const columns = card?.querySelectorAll(':scope > .grid > div');
      if (!card) return;
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.reveal } });
      tl.fromTo(card, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 1.3 })
        .enter(columns, { autoAlpha: 0, y: 24, duration: 1, stagger: 0.1 }, 0.25);
      const st = ScrollTrigger.create({
        trigger: footer,
        start: 'top 95%',
        onEnter: () => tl.play(),
        onEnterBack: () => tl.play(),
      });
      tl.eventCallback('onComplete', () => st.kill());
      if (st.scroll() >= st.start) tl.play();
    });
    return () => mm.revert();
  }, [ref]);
}
