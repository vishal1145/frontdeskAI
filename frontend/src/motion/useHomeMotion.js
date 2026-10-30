// Landing-page motion system. Owns every animation inside the Home root ([data-motion-scope="home"]).
// The global CustomCursorAndInteractions component skips this scope, so nothing is animated twice.
import { useLayoutEffect } from 'react';
import {
  gsap,
  ScrollTrigger,
  EASE,
  MEDIA,
  fontsReady,
  addLineReveal,
  addEyebrowReveal,
  countUp,
  attachTilt,
  attachMagnetic,
  velocityMarquee,
} from './core';
import { heroVoice } from './heroVoice';

// ─── Section intro: a paused timeline played once when its trigger enters (either direction) ─────
function sectionIntro(env, trigger, build, { start = 'top 80%' } = {}) {
  if (!trigger) return null;
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.reveal, duration: 1 } });
  build(tl);
  const st = ScrollTrigger.create({
    trigger,
    start,
    end: 'bottom top',
    onEnter: () => tl.play(),
    onEnterBack: () => tl.play(),
  });
  tl.eventCallback('onComplete', () => st.kill());
  env.intros.push({ tl, st });
  return tl;
}

// ─── 1. HERO ─────────────────────────────────────────────────────────────────────────────────────
// Editorial headline + AI voice ribbon. The ribbon is a canvas driven through `heroVoice`
// (reveal / amp / particles / settle / pointer); DOM layers own distinct transform properties per
// job (entrance / scroll / pointer) so no two animations fight.
const RIBBON_REST = { reveal: 1, amp: 1, particles: 1, settle: 0, pointerOn: 0, pointerX: 0.5, pointerY: 0 };

function hero(env, ctx) {
  const { root, m, isDesktop, isMobile, state } = env;
  const section = root.querySelector('#hero-section');
  if (!section) return;
  const q = (s) => section.querySelector(s);
  const qa = (s) => [...section.querySelectorAll(s)];

  const bg = q('.hr-bg');
  const lights = qa('.hr-light');
  const eyebrow = q('.hr-eyebrow');
  const title = q('.hr-title');
  const lines = qa('.hr-line-inner');
  const ribbon = q('.hr-ribbon-wrap');
  const rule = q('.hr-rule');
  const base = q('.hr-base');
  const sub = q('.hr-sub');
  const ctas = qa('.hr-actions > *');
  const chips = qa('.hr-actions .btn-chip');
  const strip = root.querySelector('[data-anim="marquee-ribbon"]');
  env.cleanups.push(() => { gsap.killTweensOf(heroVoice); Object.assign(heroVoice, RIBBON_REST); });

  // ── Tactile press feedback for [data-press] controls (mouse, touch, keyboard). `scale` only.
  const MIN_PRESS = 0.15;
  qa('[data-press]').forEach((el) => {
    const depth = parseFloat(el.dataset.press) || 0.96;
    let pressedAt = 0;
    const down = () => {
      pressedAt = performance.now();
      gsap.to(el, { scale: depth, duration: MIN_PRESS, ease: 'power2.out', overwrite: 'auto' });
    };
    const up = () => {
      const held = (performance.now() - pressedAt) / 1000;
      gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.55)', overwrite: 'auto', delay: Math.max(0, MIN_PRESS - held) });
    };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') (e.type === 'keydown' ? down : up)(); };
    const events = [['pointerdown', down], ['pointerup', up], ['pointercancel', up], ['pointerleave', up], ['keydown', key], ['keyup', key], ['blur', up]];
    events.forEach(([t, fn]) => el.addEventListener(t, fn));
    env.cleanups.push(() => events.forEach(([t, fn]) => el.removeEventListener(t, fn)));
  });

  // ── Pointer (desktop): the ribbon bends toward the cursor; light, headline and ribbon shift in
  // restrained layers (lights farthest, headline nearest).
  if (env.finePointer && !isMobile) {
    const px = gsap.quickTo(heroVoice, 'pointerX', { duration: 0.9, ease: 'power3' });
    const py = gsap.quickTo(heroVoice, 'pointerY', { duration: 0.9, ease: 'power3' });
    const layers = [
      ...lights.map((el) => [el, -26, -18, 'x', 'y']),
      [ribbon, -10, 0, 'x', 'x'],
      [title, 7, 1.2, 'x', 'yPercent'],
    ].filter(([el]) => el).map(([el, dx, dy, propX, propY]) => ({
      dx, dy, propY,
      x: gsap.quickTo(el, propX, { duration: 1.2, ease: 'power3' }),
      y: propY === propX ? null : gsap.quickTo(el, propY, { duration: 1.2, ease: 'power3' }),
    }));
    const move = (e) => {
      const r = section.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => { l.x(nx * 2 * l.dx); if (l.y) l.y(ny * 2 * l.dy); });
      if (ribbon) {
        const rb = ribbon.getBoundingClientRect();
        px((e.clientX - rb.left) / rb.width);
        py(gsap.utils.clamp(-1.4, 1.4, ((e.clientY - rb.top) / rb.height - 0.5) * 2));
      }
    };
    const enter = () => gsap.to(heroVoice, { pointerOn: 1, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
    const leave = () => {
      gsap.to(heroVoice, { pointerOn: 0, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
      layers.forEach((l) => { l.x(0); if (l.y) l.y(0); });
    };
    section.addEventListener('pointermove', move);
    section.addEventListener('pointerenter', enter);
    section.addEventListener('pointerleave', leave);
    env.cleanups.push(() => {
      section.removeEventListener('pointermove', move);
      section.removeEventListener('pointerenter', enter);
      section.removeEventListener('pointerleave', leave);
    });

    // CTA chips swell on hover / keyboard focus (the arrow's turn is existing CSS).
    ctas.forEach((btn) => {
      const chip = btn.querySelector('.btn-chip');
      if (!chip) return;
      const grow = () => gsap.to(chip, { scale: 1.1, duration: 0.45, ease: EASE.hover, overwrite: 'auto' });
      const rest = () => gsap.to(chip, { scale: 1, duration: 0.6, ease: EASE.hover, overwrite: 'auto' });
      const events = [['pointerenter', grow], ['pointerleave', rest], ['focus', grow], ['blur', rest]];
      events.forEach(([t, fn]) => btn.addEventListener(t, fn));
      env.cleanups.push(() => events.forEach(([t, fn]) => btn.removeEventListener(t, fn)));
    });
  }

  // ── Scroll: the headline lifts away first, the ribbon follows more slowly and its voice settles,
  // the light stays behind. CTAs never fade. Reverses cleanly when scrolling up.
  const buildScroll = () => {
    if (isMobile) return;
    const d = isDesktop ? 1 : 0.7;
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
    })
      .to(bg, { y: 120 * d, duration: 1 }, 0)
      .to(title, { y: -110 * d, duration: 1 }, 0)
      .to(title, { opacity: 0, duration: 0.3 }, 0.5)
      .to(ribbon, { y: -50 * d, duration: 1 }, 0)
      .to(heroVoice, { settle: 1, duration: 1 }, 0)
      .to(base, { y: -30 * d, duration: 1 }, 0);
    // No global refresh: a new trigger measures itself, and a refresh would cancel in-progress smooth scrolls.
    ScrollTrigger.sort();
  };

  if (state.heroPlayed) {
    buildScroll();
    return;
  }

  // ── Entrance: light blooms → headline rises → the voice draws itself across the page →
  //    its amplitude swells → copy, CTAs and the base rule settle in.
  Object.assign(heroVoice, { reveal: 0, amp: 0, particles: 0, settle: 0 });
  gsap.set([eyebrow, sub, ...ctas, strip, ...lights].filter(Boolean), { autoAlpha: 0 });
  gsap.set(lines, { yPercent: 115 });
  if (rule) gsap.set(rule, { scaleX: 0, transformOrigin: '0% 50%' });

  fontsReady().then(() => {
    if (state.disposed || !env.alive) return;
    ctx.add(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.reveal }, delay: 0.05 });
      tl.fromTo(lights, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 2.6, ease: EASE.soft, stagger: 0.25 }, 0);
      addEyebrowReveal(tl, eyebrow, 0.1, m);
      tl.fromTo(
        lines,
        { yPercent: 115, rotationX: isMobile ? 0 : -40, transformOrigin: '50% 100%' },
        { yPercent: 0, rotationX: 0, duration: 1.35, stagger: 0.13 },
        0.15
      );
      tl.to(heroVoice, { reveal: 1, duration: 2.3, ease: 'power2.inOut' }, 0.45)
        .to(heroVoice, { amp: 1, duration: 2.6, ease: 'power3.inOut' }, 0.7)
        .to(heroVoice, { particles: 1, duration: 1.4, ease: 'power1.out' }, 1.7);
      if (rule) tl.to(rule, { scaleX: 1, duration: 1.6, ease: 'power3.inOut' }, 0.9);
      tl.fromTo(sub, { autoAlpha: 0, y: 18 * m, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, clearProps: 'filter' }, 1.0)
        .fromTo(ctas, { autoAlpha: 0, yPercent: 60, scale: 0.94 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.05, stagger: 0.1 }, 1.1)
        .enter(chips, { scale: 0, rotation: -90, duration: 0.9, stagger: 0.1, ease: 'back.out(1.6)' }, 1.24);
      if (strip) tl.fromTo(strip, { autoAlpha: 0, y: 24 * m }, { autoAlpha: 1, y: 0, duration: 1.2 }, 1.6);
      tl.eventCallback('onComplete', () => {
        state.heroPlayed = true;
        ctx.add(buildScroll);
      });
    });
  });
}

// Group elements that share a layout row/column (offsets ignore transforms, so this is stable).
function groupBy(els, key) {
  const groups = [];
  els.forEach((el) => {
    const k = Math.round(key(el));
    const g = groups.find((x) => Math.abs(x.k - k) < 6);
    if (g) g.items.push(el);
    else groups.push({ k, items: [el] });
  });
  return groups.sort((a, b) => a.k - b.k).map((g) => g.items);
}

// Shared header choreography: eyebrow pill → masked heading lines → supporting copy.
function addHeader(tl, ctx, head, m, { at = 0 } = {}) {
  if (!head) return;
  addEyebrowReveal(tl, head.querySelector('.eyebrow'), at, m);
  addLineReveal(tl, ctx, head.querySelector('h2'), at + 0.12);
  const copy = head.querySelectorAll(':scope > p, .lead');
  if (copy.length) {
    tl.fromTo(
      copy,
      { autoAlpha: 0, y: 18 * m, filter: 'blur(6px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.12, clearProps: 'filter' },
      at + 0.45
    );
  }
}

// ─── 6. FEATURES (Live Availability Search, Concurrency Slot Lock, Instant WhatsApp Slips, …) ───
function features(env, ctx) {
  const { root, m, isMobile } = env;
  const section = root.querySelector('#features');
  if (!section) return;
  const head = section.querySelector('[data-motion="feature-head"]');
  const cards = [...section.querySelectorAll('[data-motion="feature-card"]')];
  const parts = (card) => ({
    icon: card.querySelector('.icon-tile'),
    text: card.querySelectorAll('h3, p'),
    foot: card.lastElementChild,
    chip: card.lastElementChild?.lastElementChild,
  });

  sectionIntro(env, head, (tl) => addHeader(tl, ctx, head, m), { start: 'top 82%' });

  if (isMobile) {
    // One column: each card gets a short, self-contained reveal as it arrives. No scrub, no depth.
    cards.forEach((card) => {
      const p = parts(card);
      sectionIntro(env, card, (tl) => {
        tl.fromTo(card, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 1 })
          .enter(p.icon, { autoAlpha: 0, scale: 0.5, rotation: -20, duration: 0.9, ease: 'back.out(1.6)' }, 0.15)
          .enter(p.text, { autoAlpha: 0, y: 14, duration: 0.8, stagger: 0.07 }, 0.25)
          .enter(p.foot, { autoAlpha: 0, y: 10, duration: 0.7 }, 0.4);
      }, { start: 'top 90%' });
    });
    return;
  }

  // Desktop / tablet: each row is a scroll-scrubbed sequence. Cards rise from a slight scale with a
  // column stagger; inside each card the icon pops, then title/description, then the footer + arrow.
  groupBy(cards, (c) => c.offsetTop).forEach((row) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: row[0], start: 'top 96%', end: 'top 52%', scrub: 0.9, invalidateOnRefresh: true },
    });
    row.forEach((card, i) => {
      const p = parts(card);
      const at = i * 0.16;
      tl.fromTo(card, { autoAlpha: 0, y: 120 * m, scale: 0.9, transformOrigin: '50% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, at)
        .fromTo(p.icon, { autoAlpha: 0, scale: 0.45, rotation: -24 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.7)' }, at + 0.3)
        .fromTo(p.text, { autoAlpha: 0, y: 26 * m }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 }, at + 0.38)
        .fromTo(p.foot, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.55)
        .fromTo(p.chip, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, at + 0.62);
    });
  });

}

// ─── 2. BENEFIT CHIP STRIP ───────────────────────────────────────────────────────────────────────
function benefitStrip(env) {
  const track = env.root.querySelector('[data-anim="marquee-ribbon"] .animate-marquee');
  velocityMarquee(track, env.cleanups, { duration: 48 });
}

// ─── 3. ABOUT ────────────────────────────────────────────────────────────────────────────────────
function about(env, ctx) {
  const { root, m, isDesktop } = env;
  const section = root.querySelector('#about');
  if (!section) return;
  const copy = section.querySelector('[data-motion="about-copy"]');
  const visual = section.querySelector('[data-anim="from-left"]');
  const arch = visual?.firstElementChild;
  const badge = visual?.querySelector('#circlePathBadge')?.closest('.absolute');

  // The arch card rises through a mask, its content settles, then the rotating seal spins into place.
  if (arch) {
    sectionIntro(env, visual, (tl) => {
      tl.fromTo(arch, { clipPath: 'inset(100% 0% 0% 0%)', y: 40 * m }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.4, clearProps: 'clipPath' }, 0)
        .enter([...arch.children], { autoAlpha: 0, y: 20 * m, duration: 0.9, stagger: 0.09 }, 0.35);
      if (badge) tl.enter(badge, { autoAlpha: 0, scale: 0.3, rotation: -140, duration: 1.3 }, 0.55);
    }, { start: 'top 78%' });
  }

  if (copy) {
    sectionIntro(env, copy, (tl) => {
      addHeader(tl, ctx, copy, m);
      tl.enter(copy.querySelectorAll('[data-anim="list-item"]'), { autoAlpha: 0, x: -24 * m, duration: 0.8, stagger: 0.1 }, 0.75)
        .enter(copy.querySelectorAll('[data-anim="stat-item"]'), { autoAlpha: 0, y: 26 * m, scale: 0.94, duration: 0.9, stagger: 0.1 }, 0.9)
        .fromTo(copy.querySelector('.pill'), { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 0.9 }, 1.15);
      copy.querySelectorAll('[data-count]').forEach((el, i) => {
        const counter = countUp(el, env.cleanups);
        if (counter) tl.add(() => counter.play(), 1.0 + i * 0.1);
      });
    }, { start: 'top 78%' });
  }

  // Desktop depth: visual column and seal drift at different rates.
  if (isDesktop && visual) {
    const scrub = { trigger: section, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true };
    gsap.fromTo(visual, { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { ...scrub, scrub: 1.2 } });
    if (badge) gsap.fromTo(badge, { y: 40 }, { y: -60, ease: 'none', scrollTrigger: { ...scrub, scrub: 0.9 } });
  }
}

// ─── 4. CALL SIMULATOR ───────────────────────────────────────────────────────────────────────────
function simulator(env, ctx) {
  const { root, m } = env;
  const section = root.querySelector('#simulator');
  if (!section) return;
  const copy = section.querySelector('[data-motion="sim-copy"]');
  const win = section.querySelector('[data-motion="sim-window"]');

  if (copy) {
    const selector = copy.querySelector('.glass');
    sectionIntro(env, copy, (tl) => {
      addHeader(tl, ctx, copy, m);
      if (selector) {
        tl.enter(selector, { autoAlpha: 0, y: 24 * m, duration: 0.9 }, 0.7)
          .enter(selector.querySelectorAll('button'), { autoAlpha: 0, y: 12, duration: 0.7, stagger: 0.08 }, 0.85);
      }
      tl.enter(copy.querySelectorAll('[data-motion="sim-benefits"] > div'), { autoAlpha: 0, x: -20 * m, duration: 0.8, stagger: 0.1 }, 0.95)
        .fromTo(copy.querySelector('.pill'), { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, duration: 0.8 }, 1.2);
    });
  }

  // The simulator window "opens": a top-down mask with a slight lift, then chrome → waveform → stream.
  if (win) {
    sectionIntro(env, win, (tl) => {
      tl.fromTo(
        win,
        { autoAlpha: 0, y: 60 * m, scale: 0.96, clipPath: 'inset(0% 0% 100% 0% round 28px)' },
        { autoAlpha: 1, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, clearProps: 'clipPath' },
        0.15
      ).enter([...win.children], { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.12 }, 0.6);
    }, { start: 'top 82%' });
  }
}

// ─── 5. WORK PROCESS (existing pinned story, now scoped) ────────────────────────────────────────
function story(env, ctx) {
  const { root, m, isDesktop, isMobile, cleanups } = env;
  const section = root.querySelector('#telephony');
  if (!section) return;
  const head = section.querySelector('[data-motion="story-head"]');
  const steps = [...section.querySelectorAll('.story-step')];
  const bar = section.querySelector('.story-progress-bar');
  const track = bar?.parentElement;

  sectionIntro(env, head, (tl) => addHeader(tl, ctx, head, m));

  // Step contents assemble: number badge pops, then title, copy and code tag.
  const addContents = (tl, step, at) => {
    const [num, ...rest] = step.children;
    tl.enter(num, { autoAlpha: 0, scale: 0.4, duration: 0.9, ease: 'back.out(1.7)' }, at)
      .enter(rest, { autoAlpha: 0, y: 18 * m, duration: 0.8, stagger: 0.08 }, at + 0.12);
  };

  if (isMobile) {
    steps.forEach((step) => {
      sectionIntro(env, step, (tl) => {
        tl.fromTo(step, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1 }, 0);
        addContents(tl, step, 0.15);
      }, { start: 'top 90%' });
    });
  } else if (steps.length) {
    sectionIntro(env, steps[0].parentElement, (tl) => {
      // On desktop the cards' own transform/opacity belong to the pinned step states (CSS), so only
      // their contents animate; on tablet the cards rise too.
      if (!isDesktop) tl.fromTo(steps, { autoAlpha: 0, y: 50 * m }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.14 }, 0);
      steps.forEach((step, i) => addContents(tl, step, 0.1 + i * 0.14));
      if (track) tl.enter(track, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.4, ease: EASE.soft }, 0);
    }, { start: 'top 85%' });
  }

  // Desktop: the existing pinned storytelling sequence (steps highlight as you scroll through).
  if (isDesktop && steps.length === 4) {
    const setActive = (active) => steps.forEach((s, idx) => {
      s.classList.remove('step-active', 'step-completed', 'step-inactive');
      s.classList.add(idx === active ? 'step-active' : idx < active ? 'step-completed' : 'step-inactive');
    });
    setActive(0);
    cleanups.push(() => {
      steps.forEach((s) => s.classList.remove('step-active', 'step-completed', 'step-inactive'));
      if (bar) bar.style.width = '0%';
    });
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=1400',
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
        setActive(p < 0.28 ? 0 : p < 0.55 ? 1 : p < 0.82 ? 2 : 3);
      },
      onLeave: () => { setActive(3); if (bar) bar.style.width = '100%'; },
      onLeaveBack: () => { setActive(0); if (bar) bar.style.width = '0%'; },
    });

    const stepProgresses = [0.1, 0.4, 0.68, 0.95];
    steps.forEach((step, idx) => {
      const onClick = () => {
        if (!st) return;
        const targetScroll = st.start + (stepProgresses[idx] * (st.end - st.start));
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      };
      step.addEventListener('click', onClick);
      cleanups.push(() => step.removeEventListener('click', onClick));
    });
  }
}

// ─── 7. ROI CALCULATOR ───────────────────────────────────────────────────────────────────────────
function roi(env, ctx) {
  const { root, m } = env;
  const section = root.querySelector('#roi');
  if (!section) return;
  const copy = section.querySelector('[data-motion="roi-copy"]');
  const widget = section.querySelector('[data-anim="widget"]');
  const sliders = [...(section.querySelector('[data-motion="roi-sliders"]')?.children ?? [])];
  const result = section.querySelector('[data-motion="roi-result"]');

  if (copy) {
    sectionIntro(env, copy, (tl) => {
      addHeader(tl, ctx, copy, m);
      const cards = copy.querySelectorAll('[data-anim="info-card"]');
      if (cards.length) tl.enter(cards, { autoAlpha: 0, x: -30 * m, duration: 0.9, stagger: 0.12 }, 0.75);
      const pill = copy.querySelector('.pill');
      if (pill) tl.fromTo(pill, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, duration: 0.8 }, 1.05);
    });
  }

  // The calculator assembles like an instrument: panel → control rows → slider tracks → readout.
  if (widget) {
    sectionIntro(env, widget, (tl) => {
      tl.fromTo(widget, { autoAlpha: 0, y: 70 * m, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.3 }, 0)
        .enter(sliders, { autoAlpha: 0, y: 18 * m, duration: 0.8, stagger: 0.1 }, 0.3)
        .enter(sliders.map((r) => r.querySelector('input')).filter(Boolean), { scaleX: 0, transformOrigin: '0% 50%', duration: 1, stagger: 0.1, ease: EASE.soft }, 0.4);
      if (result) {
        tl.fromTo(result, { clipPath: 'inset(0% 0% 100% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.2, clearProps: 'clipPath' }, 0.6)
          .enter([...result.children], { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.1 }, 0.85);
      }
    }, { start: 'top 80%' });
  }
}

// ─── 8. TESTIMONIALS ─────────────────────────────────────────────────────────────────────────────
function testimonials(env, ctx) {
  const { root, m } = env;
  const section = root.querySelector('[data-motion="testimonials"]');
  if (!section) return;
  const head = section.querySelector('[data-motion="testimonials-head"]');
  const viewport = section.querySelector('[data-marquee-viewport]');

  sectionIntro(env, head, (tl) => addHeader(tl, ctx, head, m));
  if (viewport) {
    sectionIntro(env, viewport, (tl) => {
      tl.fromTo(viewport, { autoAlpha: 0, x: 120 * m }, { autoAlpha: 1, x: 0, duration: 1.6 }, 0.1);
    }, { start: 'top 88%' });
  }
  velocityMarquee(section.querySelector('.animate-marquee-left-to-right'), env.cleanups, { duration: 38, pauseOnHover: true });
}

// ─── 9. FAQ ──────────────────────────────────────────────────────────────────────────────────────
function faq(env, ctx) {
  const { root, m } = env;
  const section = root.querySelector('[data-motion="faq"]');
  if (!section) return;
  const head = section.querySelector('[data-motion="faq-head"]');
  const items = [...section.querySelectorAll('[data-anim="faq-item"]')];
  const side = section.querySelector('[data-anim="sidebar-card"]');
  const panel = side?.firstElementChild;

  sectionIntro(env, head, (tl) => addHeader(tl, ctx, head, m));
  if (items.length) {
    sectionIntro(env, items[0].parentElement, (tl) => {
      tl.enter(items, { autoAlpha: 0, y: 26 * m, duration: 0.9, stagger: 0.09 }, 0);
    }, { start: 'top 85%' });
  }
  if (panel) {
    sectionIntro(env, side, (tl) => {
      tl.fromTo(panel, { autoAlpha: 0, y: 50 * m, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.3 }, 0)
        .enter(panel.querySelector('[data-motion="faq-orb"]'), { autoAlpha: 0, scale: 0.7, duration: 1.2 }, 0.35)
        .enter(panel.querySelectorAll(':scope > .space-y-3 > div, :scope > .mt-6'), { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.1 }, 0.55);
    }, { start: 'top 82%' });
  }
}

// ─── 11. FINAL CTA ───────────────────────────────────────────────────────────────────────────────
function cta(env, ctx) {
  const { root, m, isMobile } = env;
  const band = root.querySelector('[data-motion="cta-band"]');
  if (!band) return;
  const copy = band.querySelector('[data-motion="cta-copy"]');
  const consoleEl = band.querySelector('[data-anim="cta-console"]');

  // The band grows into place with scroll, so the page visibly "lands" on the closing CTA.
  if (!isMobile) {
    gsap.fromTo(band, { scale: 0.92, y: 60 * m, transformOrigin: '50% 100%' }, {
      scale: 1,
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 55%', scrub: 0.8, invalidateOnRefresh: true },
    });
  }

  sectionIntro(env, band, (tl) => {
    if (isMobile) tl.fromTo(band, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1 }, 0);
    addHeader(tl, ctx, copy, m, { at: isMobile ? 0.15 : 0 });
    tl.enter(copy.querySelectorAll('[data-anim="badge-group"] > div'), { autoAlpha: 0, y: 14, scale: 0.94, duration: 0.7, stagger: 0.08 }, 0.7)
      .fromTo(copy.querySelectorAll('[data-anim="cta-actions"] > *'), { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 0.9, stagger: 0.1 }, 0.85);
    if (consoleEl) {
      tl.fromTo(consoleEl, { autoAlpha: 0, x: 40 * m }, { autoAlpha: 1, x: 0, duration: 1.2 }, 0.5)
        .enter(consoleEl.querySelectorAll('.space-y-2 > div'), { autoAlpha: 0, x: 16, duration: 0.7, stagger: 0.08 }, 0.8);
    }
  }, { start: 'top 75%' });
}

// ─── Interaction layer: tilt + magnetic (desktop pointers only) ───────────────────────────────
function interactions(env) {
  const { root, cleanups } = env;
  root.querySelectorAll('.tilt-card:not(.story-step)').forEach((el) => cleanups.push(attachTilt(el, { max: 5, lift: 14 })));
  root.querySelectorAll('.magnetic').forEach((el) => cleanups.push(attachMagnetic(el)));
}

// Built in DOM order so ScrollTrigger offsets (including the pinned story section) resolve correctly.
const SECTIONS = [
  ['hero', hero],
  ['benefit-strip', benefitStrip],
  ['about', about],
  ['simulator', simulator],
  ['story', story],
  ['features', features],
  ['roi', roi],
  ['testimonials', testimonials],
  ['faq', faq],
  ['cta', cta],
];

export default function useHomeMotion(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const state = { heroPlayed: false, disposed: false };
    const mm = gsap.matchMedia();

    mm.add(MEDIA, (self) => {
      const { isDesktop, isTablet, isMobile, reduce, finePointer } = self.conditions;
      if (reduce) return undefined; // Static, fully visible content (see CSS reduced-motion rules).

      const env = {
        root, state, isDesktop, isTablet, isMobile, finePointer,
        m: isDesktop ? 1 : isTablet ? 0.8 : 0.6,
        cleanups: [],
        intros: [],
        alive: true,
      };
      const contexts = [];

      // Each section runs in its own context: if one throws, only its own hidden states are reverted.
      SECTIONS.forEach(([name, build]) => {
        const ctx = gsap.context(() => {}, root);
        contexts.push(ctx);
        try {
          ctx.add(() => build(env, ctx));
        } catch (err) {
          ctx.revert();
          console.warn(`[motion] "${name}" skipped:`, err);
        }
      });

      if (finePointer) interactions(env);

      // Sections already scrolled past (deep links, reloads) render their final state instead of waiting.
      ScrollTrigger.refresh();
      env.intros.forEach(({ tl, st }) => {
        const y = st.scroll();
        if (y >= st.end) tl.progress(1);
        else if (y >= st.start) tl.play();
      });
      fontsReady().then(() => { if (!state.disposed && env.alive) ScrollTrigger.refresh(); });

      return () => {
        env.alive = false;
        env.cleanups.splice(0).reverse().forEach((fn) => fn());
        contexts.forEach((ctx) => ctx.revert());
      };
    });

    return () => {
      state.disposed = true;
      mm.revert();
    };
  }, [rootRef]);
}
