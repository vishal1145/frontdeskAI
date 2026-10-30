// Shared motion primitives for the FrontDesk AI animation system.
// Every helper either runs inside a gsap.context (so it is reverted with its owner)
// or returns a cleanup function for listeners/inline styles GSAP does not track.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

// tl.enter(targets, { autoAlpha: 0, y: 20, ... }, position): like .from(), but always animates to
// explicit resting values instead of reading current computed styles. .from() can capture a value
// that is mid-CSS-transition (e.g. Tailwind `transition-all`) or mid-remount, and "rest" there hidden.
const RESTING = { autoAlpha: 1, opacity: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, scale: 1, scaleX: 1, scaleY: 1 };
if (!gsap.effects.enter) {
  gsap.registerEffect({
    name: 'enter',
    extendTimeline: true,
    defaults: { duration: 1, ease: 'expo.out' },
    effect: (targets, config) => {
      const from = {};
      const to = {};
      Object.entries(config).forEach(([key, value]) => {
        if (key in RESTING) {
          from[key] = value;
          to[key] = RESTING[key];
        } else {
          to[key] = value;
        }
      });
      return gsap.fromTo(targets, from, to);
    },
  });
}

// One easing vocabulary for the whole site (Prevvi uses cubic-bezier(.22,1,.36,1) ≈ expo.out).
export const EASE = {
  reveal: 'expo.out',
  soft: 'power3.out',
  hover: 'power3.out',
};

export const MEDIA = {
  isDesktop: '(min-width: 1024px)',
  isTablet: '(min-width: 768px) and (max-width: 1023px)',
  isMobile: '(max-width: 767px)',
  reduce: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
};

// Resolve when web fonts are ready (line splits depend on final metrics), capped so motion never waits long.
export function fontsReady(timeout = 900) {
  const ready = document.fonts?.ready ?? Promise.resolve();
  return Promise.race([ready, new Promise((r) => setTimeout(r, timeout))]);
}

// Masked line reveal. The element is hidden immediately; the split happens at play time so line
// breaks use final fonts and layout, and the split is reverted afterwards so text reflows normally.
export function addLineReveal(tl, ctx, el, position, { duration = 1.15, stagger = 0.1, distance = 115 } = {}) {
  if (!el) return;
  gsap.set(el, { autoAlpha: 0 });
  tl.call(() => {
    ctx.add(() => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(split.lines, { yPercent: distance }, {
        yPercent: 0,
        duration,
        stagger,
        ease: EASE.reveal,
        onComplete: () => split.revert(),
      });
    });
  }, null, position);
}

// Glass eyebrow pill: expands from its centre with a short rise.
export function addEyebrowReveal(tl, el, position, m = 1) {
  if (!el) return;
  tl.fromTo(
    el,
    { autoAlpha: 0, y: 14 * m, clipPath: 'inset(0% 50% 0% 50% round 999px)' },
    { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1, ease: EASE.reveal, clearProps: 'clipPath' },
    position
  );
}

// Count-up for real numeric values only. Restores the exact original string at the end and on revert.
export function countUp(el, cleanups, { duration = 1.6 } = {}) {
  const raw = el?.dataset.count;
  if (!el || raw === undefined) return null;
  const original = el.textContent;
  const target = parseFloat(raw);
  const decimals = (raw.split('.')[1] || '').length;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const obj = { v: 0 };
  el.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;
  cleanups.push(() => { el.textContent = original; });
  return gsap.to(obj, {
    v: target,
    duration,
    ease: 'power2.out',
    paused: true,
    onUpdate: () => { el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`; },
    onComplete: () => { el.textContent = original; },
  });
}

// Pointer-driven 3D tilt + lift. Uses rotationX/rotationY/z only, so it never fights the
// y/scale/opacity used by scroll reveals on the same element. Also feeds --mx/--my for spotlights.
export function attachTilt(el, { max = 6, lift = 18 } = {}) {
  gsap.set(el, { transformPerspective: 1000 });
  const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: EASE.hover });
  const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: EASE.hover });
  const tz = gsap.quickTo(el, 'z', { duration: 0.7, ease: EASE.hover });
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rx((0.5 - py) * max);
    ry((px - 0.5) * max * 1.2);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };
  const enter = () => tz(lift);
  const leave = () => { rx(0); ry(0); tz(0); };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerenter', enter);
    el.removeEventListener('pointerleave', leave);
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  };
}

// Restrained magnetic pull for primary pills (x/y only; entrances use yPercent).
export function attachMagnetic(el, { strength = 0.22 } = {}) {
  const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: EASE.hover });
  const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: EASE.hover });
  const move = (e) => {
    const r = el.getBoundingClientRect();
    qx((e.clientX - r.left - r.width / 2) * strength);
    qy((e.clientY - r.top - r.height / 2) * strength * 1.3);
  };
  const leave = () => { qx(0); qy(0); };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
  };
}

// GSAP-driven infinite strip that briefly speeds up with scroll velocity (Prevvi logo-strip feel).
// Takes over from the CSS keyframe animation, which stays as the no-JS fallback.
export function velocityMarquee(track, cleanups, { duration = 30, pauseOnHover = false } = {}) {
  if (!track) return null;
  const prevAnimation = track.style.getPropertyValue('animation');
  const prevPriority = track.style.getPropertyPriority('animation');
  track.style.setProperty('animation', 'none', 'important');
  const loop = gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration, ease: 'none', repeat: -1 });
  let hovered = false;
  const settle = () => gsap.to(loop, { timeScale: hovered ? 0 : 1, duration: 1.2, ease: 'power2.out', overwrite: true });

  const st = ScrollTrigger.create({
    trigger: track,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    onUpdate: (self) => {
      if (hovered) return;
      const boost = gsap.utils.clamp(1, 4, 1 + Math.abs(self.getVelocity()) / 700);
      gsap.to(loop, { timeScale: boost, duration: 0.25, overwrite: true, onComplete: settle });
    },
  });

  if (pauseOnHover) {
    const enter = () => { hovered = true; settle(); };
    const leave = () => { hovered = false; settle(); };
    track.addEventListener('pointerenter', enter);
    track.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      track.removeEventListener('pointerenter', enter);
      track.removeEventListener('pointerleave', leave);
    });
  }

  cleanups.push(() => {
    st.kill();
    track.style.removeProperty('animation');
    if (prevAnimation) track.style.setProperty('animation', prevAnimation, prevPriority);
  });
  return loop;
}
