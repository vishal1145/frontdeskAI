import { useEffect, useRef, useState } from 'react';
import { gsap } from '../motion/core';

// Renders `value` and rolls smoothly to each new value (e.g. ROI results while a slider moves).
// First render shows the exact value; reduced-motion users get instant updates.
export default function AnimatedNumber({ value, format = (n) => n, duration = 0.6 }) {
  const [display, setDisplay] = useState(value);
  const proxy = useRef({ v: value });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      proxy.current.v = value;
      setDisplay(value);
      return undefined;
    }
    const tween = gsap.to(proxy.current, {
      v: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => setDisplay(Math.round(proxy.current.v)),
      onComplete: () => setDisplay(value),
    });
    return () => tween.kill();
  }, [value, duration]);

  return format(display);
}
