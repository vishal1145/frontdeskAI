import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../motion/core';

// ─── Utility: check reduced-motion preference ────────────────────────────────
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The landing page owns its motion (src/motion/useHomeMotion.js). Global reveals skip that scope
// so no element is animated twice.
const outsideMotionScope = (el) => !el.closest('[data-motion-scope]');
const pick = (selector) => gsap.utils.toArray(selector).filter(outsideMotionScope);

export default function CustomCursorAndInteractions({ activePage = 'home' }) {
  const isNormalCursor =
    activePage === 'login' ||
    activePage === 'portal' ||
    activePage === 'dashboard' ||
    activePage === 'appointments' ||
    activePage === 'doctors' ||
    activePage === 'doctors-services' ||
    activePage === 'calendar' ||
    activePage === 'profile' ||
    activePage === 'admin' ||
    activePage === 'admin-create' ||
    (typeof window !== 'undefined' && (
      window.location.pathname.includes('/portal') ||
      window.location.pathname.includes('/admin')
    ));

  useEffect(() => {
    if (isNormalCursor) {
      document.body.classList.add('normal-cursor');
      document.body.style.cursor = 'auto';
      return () => {
        document.body.classList.remove('normal-cursor');
        document.body.style.cursor = '';
      };
    }
    document.body.classList.remove('normal-cursor');
    document.body.style.cursor = '';

    const cleanups = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    // 1. Lenis Smooth Scroll
    let lenis = null;
    if (window.innerWidth > 768 && !prefersReducedMotion()) {
      lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      const lenisTick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(lenisTick);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(lenisTick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      });
    }

    const ctx = gsap.context(() => {
      // 3. Character Flip Helper for Pill Buttons (.pill, .bf-btn) — only rewrites raw text nodes
      document.querySelectorAll('.pill, .bf-btn').forEach((b) => {
        if (b.querySelector('.bf')) return;
        const textNodes = [...b.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
        if (!textNodes.length) return;
        const txt = textNodes.map((n) => n.nodeValue).join('').trim();
        const icon = b.querySelector('svg, i');
        const iconHtml = icon ? icon.outerHTML : '';

        const makeLayer = (c) =>
          `<span class="l ${c}">${[...txt]
            .map((ch, i) => `<span class="ch" style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`)
            .join('')}</span>`;

        b.innerHTML = `<span class="bf">${makeLayer('l1')}${makeLayer('l2')}</span>${iconHtml ? ' ' + iconHtml : ''}`;
      });

      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      // 4. Magnetic Buttons (.magnetic, .pill, button) outside the landing-page scope
      if (finePointer && !prefersReducedMotion()) {
        pick('.magnetic, .pill, button').forEach((b) => {
          on(b, 'mousemove', (e) => {
            const r = b.getBoundingClientRect();
            gsap.to(b, {
              x: (e.clientX - r.left - r.width / 2) * 0.28,
              y: (e.clientY - r.top - r.height / 2) * 0.38,
              duration: 0.4,
              ease: 'power3.out',
            });
          });
          on(b, 'mouseleave', () => {
            gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
          });
        });

        // 5. 3D Tilt Cards with Gentle Lift (.tilt-card, .fc, .pc, .card-hover-lift)
        pick('.tilt-card, .fc, .pc, .card-hover-lift').forEach((c) => {
          on(c, 'mousemove', (e) => {
            const r = c.getBoundingClientRect();
            gsap.to(c, {
              rotateX: -((e.clientY - r.top) / r.height - 0.5) * 8,
              rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10,
              y: -5,
              transformPerspective: 1000,
              duration: 0.35,
              ease: 'power2.out',
            });
          });
          on(c, 'mouseleave', () => {
            gsap.to(c, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out' });
          });
        });
      }

      // 6. Particle Burst on Click
      const glyphs = ['✦', '⚡', '🩺', '⚕', '✳', '★'];
      on(window, 'pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const el = document.createElement('div');
        el.className = 'cb';
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;

        let innerHtml = '';
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 / 6) * i + Math.random() * 0.6;
          const d = 50 + Math.random() * 40;
          const dx = (Math.cos(ang) * d).toFixed(0);
          const dy = (Math.sin(ang) * d - 20).toFixed(0);
          const r = (Math.random() * 90 - 45) | 0;
          const g = glyphs[(Math.random() * glyphs.length) | 0];
          innerHtml += `<span class="cbp" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg;animation-delay:${i * 25}ms">${g}</span>`;
        }
        el.innerHTML = innerHtml;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
      });

      if (prefersReducedMotion()) return;

      // 7. Scroll Reveal Fade-Up Animations ([data-fade]) — inner pages
      pick('[data-fade]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
        );
      });

      // 8. Staggered Card Entrance Animations (.card-stagger)
      pick('.card-stagger').forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 45 },
          {
            opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: (i % 4) * 0.1,
            scrollTrigger: { trigger: card, start: 'top 90%', once: true },
          }
        );
      });

      // 9. Live Number Count-Up Animation ([data-count])
      pick('[data-count]').forEach((b) => {
        const original = b.textContent;
        const target = parseFloat(b.getAttribute('data-count'));
        const prefix = b.getAttribute('data-prefix') || '';
        const suffix = b.getAttribute('data-suffix') || '';
        const isDecimal = target.toString().includes('.');
        cleanups.push(() => { b.textContent = original; });
        ScrollTrigger.create({
          trigger: b,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            const obj = { v: 0 };
            gsap.to(obj, {
              v: target,
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: () => {
                const val = isDecimal ? obj.v.toFixed(1) : Math.round(obj.v);
                b.textContent = `${prefix}${val}${suffix}`;
              },
            });
          },
        });
      });

      // 10. Underline Draw Animations (.line-draw)
      pick('.line-draw').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('in') });
      });

      // 11. Generic [data-anim] reveals for any page outside the landing-page scope
      const reveal = (selector, from, opts = {}) => {
        pick(selector).forEach((el, i) => {
          gsap.fromTo(el, from, {
            opacity: 1, x: 0, y: 0, scale: 1, clipPath: 'inset(0 0 0% 0)',
            duration: opts.duration ?? 0.75,
            ease: 'power3.out',
            delay: opts.stagger ? i * opts.stagger : opts.delay ?? 0,
            scrollTrigger: { trigger: el, start: opts.start ?? 'top 88%', once: true },
          });
        });
      };
      reveal('[data-anim="eyebrow"]', { opacity: 0, x: -20 }, { duration: 0.65, start: 'top 90%' });
      reveal('[data-anim="heading"]', { opacity: 0, y: 30, clipPath: 'inset(0 0 100% 0)' }, { duration: 0.85 });
      reveal('[data-anim="para"]', { opacity: 0, y: 20 }, { delay: 0.12, start: 'top 90%' });
      reveal('[data-anim="info-card"]', { opacity: 0, y: 28 }, { stagger: 0.09, duration: 0.65, start: 'top 90%' });
      reveal('[data-anim="faq-item"]', { opacity: 0, y: 22 }, { stagger: 0.07, duration: 0.6, start: 'top 91%' });

      // Recalculate trigger offsets for the newly rendered page.
      ScrollTrigger.refresh();
    });

    // Cleanups: only what this effect created (other components own their own ScrollTriggers).
    return () => {
      cleanups.splice(0).reverse().forEach((fn) => fn());
      ctx.revert();
    };
  }, [activePage]);

  return null;
}
