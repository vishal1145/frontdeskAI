import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, User, Zap, CheckCircle2 } from 'lucide-react';
import { FEATURES } from './featureContent';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal [data-reveal] elements once as they scroll into view (re-runs per feature via the page key).
function useReveal(rootRef) {
  useEffect(() => {
    const els = [...rootRef.current.querySelectorAll('[data-reveal]')];
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

// Plays the example call one line at a time, holds on the result, then loops.
function useCallScript(length) {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? length + 1 : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => setStep((s) => (s >= length + 3 ? 0 : s + 1)), 1500);
    return () => clearInterval(id);
  }, [length]);
  return step;
}

const WHO = {
  caller: { label: 'Caller', icon: User },
  ai: { label: 'FrontDesk AI', icon: Bot },
  system: { label: 'System', icon: Zap },
};

function CallConsole({ feature }) {
  const step = useCallScript(feature.script.length);
  const Icon = feature.icon;
  const done = step > feature.script.length;

  return (
    <div className="rounded-3xl p-5 sm:p-6 min-h-[27rem] flex flex-col bg-tint-blue-38 border border-white/10 shadow-2xl relative overflow-hidden" aria-label={`Example call: ${feature.title}`}>
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
        <span className="grid place-items-center w-10 h-10 flex-none rounded-xl text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_0_0_4px_theme(colors.blue.500_/_0.15),0_8px_18px_-8px_theme(colors.blue.500_/_0.8)] [&>svg]:w-[1.15rem] [&>svg]:h-[1.15rem]"><Icon /></span>
        <span className="flex flex-col min-w-0 leading-tight">
          <strong className="text-sm font-semibold text-white">Example call</strong>
          <span className="text-xs text-tint-blue-29 truncate">{feature.title}</span>
        </span>
        <span className={`ml-auto inline-flex items-center gap-1.5 flex-none px-2.5 py-1 rounded-full text-11 font-semibold tracking-wider uppercase ${done ? 'text-blue-300 bg-blue-500/10 shadow-[inset_0_0_0_1px_theme(colors.tint.blue.28_/_0.3)]' : 'text-emerald-300 bg-emerald-500/10 shadow-[inset_0_0_0_1px_theme(colors.tint.green.6_/_0.3)] before:content-[\'\'] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:animate-pulse'}`}>{done ? 'Completed' : 'Live'}</span>
      </div>

      <ol className="flex flex-col gap-3 py-5 flex-1 list-none">
        {feature.script.map((line, i) => {
          const who = WHO[line.who];
          const WhoIcon = who.icon;
          const isOn = step > i;
          const isAi = line.who === 'ai';
          const isSys = line.who === 'system';

          return (
            <li
              key={i}
              className={`flex items-end gap-2 max-w-[88%] transition-all duration-500 ${isAi ? 'self-end flex-row-reverse' : isSys ? 'self-center max-w-full' : 'self-start'} ${isOn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2.5 scale-[0.98]'}`}
            >
              {!isSys && (
                <span className={`grid place-items-center w-7 h-7 flex-none rounded-full [&>svg]:w-3.5 [&>svg]:h-3.5 ${isAi ? 'text-white bg-blue-600 shadow-[0_0_12px_-2px_theme(colors.blue.500_/_0.8)]' : 'text-tint-blue-23 bg-white/[0.08] shadow-[inset_0_0_0_1px_theme(colors.white_/_0.1)]'}`}>
                  <WhoIcon />
                </span>
              )}
              <span className={`text-13 leading-relaxed ${isAi ? 'p-2.5 sm:px-3.5 sm:py-2.5 rounded-set-1 bg-gradient-to-b from-blue-500/40 to-blue-600/30 text-tint-blue-16 shadow-[inset_0_0_0_1px_theme(colors.tint.blue.28_/_0.35)]' : isSys ? 'rounded-full px-3.5 py-1.5 font-mono text-11 text-cyan-300 bg-cyan-400/[0.08] shadow-[inset_0_0_0_1px_theme(colors.rim_/_0.25)]' : 'p-2.5 sm:px-3.5 sm:py-2.5 rounded-set-2 bg-white/[0.07] text-tint-blue-16 shadow-[inset_0_0_0_1px_theme(colors.white_/_0.08)]'}`}>
                {!isSys && <small className={`block text-10 font-semibold tracking-wider uppercase mb-0.5 ${isAi ? 'text-blue-200' : 'text-tint-blue-31'}`}>{who.label}</small>}
                {line.text}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={`rounded-2xl p-3.5 sm:p-4 bg-white/[0.05] transition-all duration-500 ${done ? 'opacity-100 translate-y-0 shadow-[inset_0_0_0_1px_theme(colors.tint.blue.28_/_0.5),0_0_26px_-10px_theme(colors.blue.500_/_0.9)]' : 'opacity-35 translate-y-1.5 shadow-[inset_0_0_0_1px_theme(colors.white_/_0.1)]'}`}>
        <div className="flex items-center gap-2 mb-2.5 text-13 font-semibold text-white [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-blue-400">
          <CheckCircle2 />
          {feature.result.title}
        </div>
        <dl className="grid gap-1.5">
          {feature.result.rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-xs">
              <dt className="text-tint-blue-31">{k}</dt>
              <dd className="text-tint-blue-16 font-medium text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function FeatureDetail({ slug, setActivePage }) {
  const rootRef = useRef(null);
  useReveal(rootRef);

  const index = Math.max(0, FEATURES.findIndex((f) => f.slug === slug));
  const feature = FEATURES[index];
  const others = FEATURES.filter((f) => f.slug !== feature.slug);

  return (
    <div ref={rootRef} className="fdx w-full pt-10 sm:pt-14 lg:pt-16 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 items-center mt-8 lg:mt-10">
        <div className="[container-type:inline-size] space-y-5">
          <div className="eyebrow" data-reveal>
            <span>Feature {String(index + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}</span>
          </div>
          <div data-reveal style={{ '--d': '80ms' }}>
            <h1 className="hero-title-clamp text-ink whitespace-nowrap [font-size:min(clamp(1.75rem,1.1rem+1.8vw,2.65rem),calc(100cqi/(var(--len)*0.52)))]" style={{ '--len': feature.title.length }}>{feature.title}</h1>
          </div>
          <p className="lead" data-reveal style={{ '--d': '160ms' }}>{feature.lead}</p>

          <ul className="flex flex-wrap gap-2 pt-1" data-reveal style={{ '--d': '240ms' }}>
            {feature.facts.map((f) => (
              <li key={f} className="glass-pill inline-flex items-center gap-1.5 px-3.5 py-s-7-2 text-13 font-medium text-slate-700 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:text-blue-600 [&>svg]:flex-none"><CheckCircle2 />{f}</li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 pt-2" data-reveal style={{ '--d': '320ms' }}>
            <button type="button" onClick={() => setActivePage('support')} className="pill has-chip btn-brand">
              <span>Book Live Demo</span>
              <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
            </button>
            <button type="button" onClick={() => setActivePage('home', 'features')} className="pill has-chip btn-glass">
              <span>Explore all features</span>
              <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
            </button>
          </div>
        </div>

        <div className="relative before:content-[''] before:absolute before:inset-[8%_6%_-6%] before:-z-10 before:rounded-full before:bg-[radial-gradient(closest-side,theme(colors.rim_/_0.35),theme(colors.blue.500_/_0.16)_60%,transparent)] before:blur-[30px]" data-reveal style={{ '--d': '200ms' }}>
          <CallConsole feature={feature} key={feature.slug} />
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20 sm:mt-28">
        <div className="max-w-[40rem] mb-9 space-y-4">
          <div className="eyebrow" data-reveal><span>How it works</span></div>
          <h2 className="section-title-clamp text-ink" data-reveal style={{ '--d': '80ms' }}>Three steps, handled on every call</h2>
        </div>
        <ol className="relative grid gap-4 md:grid-cols-3 md:gap-5 md:before:content-[''] md:before:absolute md:before:top-[2.85rem] md:before:left-10 md:before:right-10 md:before:h-[1px] md:before:bg-gradient-to-r md:before:from-blue-600/35 md:before:via-rim/50 md:before:to-blue-600/35 md:before:-z-10">
          {feature.steps.map((s, i) => (
            <li key={s.title} className="p-7 glass rounded-2xl" data-reveal style={{ '--d': `${i * 120}ms` }}>
              <span className="grid place-items-center w-9 h-9 rounded-full text-13 font-semibold text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_0_0_5px_theme(colors.blue.500_/_0.12),0_8px_18px_-8px_theme(colors.blue.600_/_0.8)]">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight-15 text-ink">{s.title}</h3>
              <p className="mt-2 text-14-5 leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Capabilities */}
      <section className="mt-20 sm:mt-28">
        <div className="max-w-[40rem] mb-9 space-y-4">
          <div className="eyebrow" data-reveal><span>What’s included</span></div>
          <h2 className="section-title-clamp text-ink" data-reveal style={{ '--d': '80ms' }}>Built into every conversation</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {feature.capabilities.map((c, i) => {
            const CapIcon = c.icon;
            return (
              <div key={c.title} className="p-6 glass glass-hover rounded-2xl transition-all duration-350 hover:-translate-y-1" data-reveal style={{ '--d': `${i * 90}ms` }}>
                <span className="icon-tile w-12 h-12"><CapIcon className="w-5 h-5" /></span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight-15 text-ink">{c.title}</h3>
                <p className="mt-2 text-14-5 leading-relaxed text-slate-600">{c.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why it matters */}
      <section className="relative overflow-hidden mt-20 sm:mt-28 p-6 sm:p-8 md:p-10 rounded-28 panel-ink after:content-[''] after:absolute after:-top-[40%] after:-right-[10%] after:w-[28rem] after:h-[28rem] after:rounded-full after:bg-[radial-gradient(closest-side,theme(colors.rim_/_0.18),transparent)] after:pointer-events-none" data-reveal>
        <div>
          <span className="text-11 font-semibold tracking-wide-120 uppercase text-tint-cyan-9">Why it matters</span>
          <h2 className="mt-3 max-w-[34rem] text-fluid-1 font-medium leading-tight tracking-tight-25 text-white">What {feature.title} changes for your front desk</h2>
        </div>
        <div className="relative z-[1] grid gap-6 md:grid-cols-3 md:gap-8 mt-9">
          {feature.outcomes.map((o, i) => (
            <div key={o.title} className="flex gap-3.5 pt-5 border-t border-white/10 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:flex-none [&>svg]:mt-0.5 [&>svg]:text-tint-cyan-9" data-reveal style={{ '--d': `${120 + i * 110}ms` }}>
              <CheckCircle2 />
              <div>
                <h3 className="text-base font-semibold text-white">{o.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-tint-blue-27">{o.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other features */}
      <section className="mt-20 sm:mt-28">
        <div className="max-w-[40rem] mb-9 space-y-4">
          <div>
            <div className="eyebrow" data-reveal><span>Keep exploring</span></div>
            <h2 className="section-title-clamp text-ink" data-reveal style={{ '--d': '80ms' }}>More ways FrontDesk AI helps</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {others.map((f, i) => {
            const OtherIcon = f.icon;
            return (
              <button
                key={f.slug}
                type="button"
                onClick={() => setActivePage('feature', f.slug)}
                className="flex items-start gap-4 p-5 text-left rounded-2xl glass glass-hover group transition-all duration-350 hover:-translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[3px]"
                data-reveal
                style={{ '--d': `${i * 70}ms` }}
              >
                <span className="icon-tile w-11 h-11"><OtherIcon className="w-5 h-5" /></span>
                <span className="flex flex-col gap-1 min-w-0 flex-1">
                  <strong className="text-15-5 font-semibold text-ink">{f.title}</strong>
                  <span className="text-13 leading-relaxed text-slate-500">{f.summary}</span>
                </span>
                <span className="grid place-items-center w-8 h-8 flex-none rounded-full text-blue-600 bg-white/85 shadow-[inset_0_0_0_1px_theme(colors.blue.800_/_0.1)] transition-all duration-300 group-hover:text-white group-hover:bg-blue-600 group-hover:-rotate-45 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden="true"><ArrowRight /></span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="flex flex-col gap-6 mt-20 sm:mt-28 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between rounded-28! glass" data-reveal>
        <div className="space-y-3">
          <h2 className="section-title-clamp text-ink">See {feature.title} on your own number</h2>
          <p className="lead">Test call forwarding with your existing business number. Zero hardware or SIM cards required.</p>
        </div>
        <button type="button" onClick={() => setActivePage('support')} className="pill has-chip btn-brand shrink-0">
          <span>Book Live Demo</span>
          <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
        </button>
      </section>
    </div>
  );
}
