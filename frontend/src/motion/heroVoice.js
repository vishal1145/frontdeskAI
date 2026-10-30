// Shared state + canvas loop for the hero voice ribbon.
// useHomeMotion drives the timeline values (reveal / amp / particles / settle / pointer);
// HeroRibbon reads them every frame.
import { useEffect } from 'react';
import { gsap } from './core';

export const heroVoice = {
  reveal: 1, // 0 → 1: ribbon draws in from the left (entrance)
  amp: 1, // 0 → 1: flat line → full voice amplitude (entrance)
  particles: 1, // 0 → 1: signal particles fade in
  settle: 0, // 0 → 1: the voice calms as the hero scrolls away
  pointerX: 0.5, // 0..1 across the ribbon
  pointerY: 0, // -1..1 relative to the ribbon centre
  pointerOn: 0, // 0 → 1 pointer influence (eased)
};

// Smooth, layered pseudo-noise in roughly [-1, 1].
export function voiceNoise(t, i, seed = 0) {
  return (
    Math.sin(t * 1.7 + i * 0.55 + seed) * 0.5 +
    Math.sin(t * 2.9 - i * 0.23 + seed * 1.9) * 0.3 +
    Math.sin(t * 0.8 + i * 1.31 + seed * 0.7) * 0.2
  );
}

// Runs `draw(ctx, width, height, timeSeconds)` on the GSAP ticker while the canvas is on screen and
// the tab is visible; renders one static frame for reduced motion. Handles DPR + resize + cleanup.
export function useCanvasLoop(canvasRef, draw) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let running = false;
    let visible = true;
    let lastT = 4;

    const frame = (t) => {
      lastT = t;
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, t);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || r.width;
      h = canvas.clientHeight || r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) frame(lastT);
    };
    const tick = (time) => frame(time);
    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      gsap.ticker.add(tick);
      running = true;
    };
    const stop = () => {
      if (!running) return;
      gsap.ticker.remove(tick);
      running = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [canvasRef, draw]);
}
