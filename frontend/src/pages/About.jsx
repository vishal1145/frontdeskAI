import React from 'react';
import { 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  Users, 
  Award, 
  Heart, 
  Cpu, 
  PhoneCall, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';

export default function About({ setActivePage }) {
  return (
    <div className="w-full pt-14 sm:pt-20 lg:pt-24 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20 sm:space-y-28">
      
      {/* Hero Header with Apex-Inspired Hierarchy */}
      <div className="text-left max-w-4xl space-y-5" data-fade>
        <div className="eyebrow">
          <span>Our Mission for Modern Businesses</span>
        </div>
        
        <h1 className="hero-title-clamp text-ink">
          Reinventing Front Desks with Voice Intelligence
        </h1>
        
        <p className="lead">
          Built by systems engineers and voice AI researchers to ensure that no customer is met with a busy dial tone when they reach out to your business.
        </p>

        {/* Subtle Decorative Metric Pills */}
        <div className="pt-2 flex flex-wrap items-center justify-start gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-medium text-ink-soft">
          <span className="glass-pill px-3.5 py-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>24/7 Zero Call Drops</span>
          </span>
          <span className="glass-pill px-3.5 py-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>DPDP & Enterprise Compliant</span>
          </span>
          <span className="glass-pill px-3.5 py-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>&lt;800ms Voice Latency</span>
          </span>
        </div>
      </div>

      {/* The Core Problem & Our Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center" data-fade>
        
        {/* Left Column: Story & Problem Analysis */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-7">
          <div className="inline-flex px-3.5 py-1.5 rounded-full bg-rose-50/80 text-rose-700 text-[11px] font-mono font-semibold ring-1 ring-rose-200 uppercase tracking-wider">
            THE UNSEEN RECEPTION CRISIS
          </div>
          
          <h2 className="section-title-clamp text-ink">
            Why Front Desks and Reception Lines Are Overwhelmed
          </h2>
          
          <div className="space-y-4 text-[0.95rem] sm:text-base text-ink-soft leading-relaxed">
            <p>
              During peak operational hours, businesses across India face overwhelming call volumes. A single receptionist or front desk executive has to juggle physical walk-in visitors, counter service, admin duties, and simultaneously answer dozens of ringing phone calls.
            </p>
            <p>
              The result? More than <strong className="text-slate-900 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-rose-900">35% of inbound customer calls go unanswered</strong>. Frustrated customers move on to a competitor, and businesses lose valuable revenue and customer trust.
            </p>
          </div>

          {/* Elevated Callout Card */}
          <div className="p-4 sm:p-6 glass text-ink flex items-start gap-3 sm:gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl btn-brand flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
              <strong className="block text-ink font-semibold text-base">
                FrontDesk AI was born to solve this:
              </strong>
              <p className="text-ink-soft">
                An intelligent, voice-first copilot that takes over when your staff is busy, ensuring 100% call coverage with authentic warmth and operational accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Core Architecture Card */}
        <div className="lg:col-span-5 panel-ink rounded-[1.75rem] p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              Core Technology Architecture
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 font-bold">
              STACK
            </span>
          </div>

          <ul className="space-y-5 text-xs text-slate-300">
            <li className="flex items-start gap-3.5 group">
              <span className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                1
              </span>
              <div className="space-y-1">
                <strong className="text-white block text-sm font-semibold tracking-tight">
                  Google Gemini 2.5 Flash
                </strong>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ultra-low latency reasoning tailored for natural conversational dialogue, regional nuance, and rapid function execution.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3.5 group">
              <span className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                2
              </span>
              <div className="space-y-1">
                <strong className="text-white block text-sm font-semibold tracking-tight">
                  Vapi Telephony & Cartesia Voice
                </strong>
                <p className="text-slate-400 text-xs leading-relaxed">
                  High-fidelity natural human Indian vocal synthesis with background noise reduction, sub-800ms latency, and full SIP telephony protocol support.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3.5 group">
              <span className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                3
              </span>
              <div className="space-y-1">
                <strong className="text-white block text-sm font-semibold tracking-tight">
                  Meta WhatsApp Cloud Dispatch
                </strong>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Official WhatsApp Business integration for instant appointment confirmations, Google Maps directions, and cancellation tokens.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3.5 group">
              <span className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                4
              </span>
              <div className="space-y-1">
                <strong className="text-white block text-sm font-semibold tracking-tight">
                  Supabase / PostgreSQL Concurrency Engine
                </strong>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Robust slot reservation locks preventing double bookings even when multiple customers call at the exact same millisecond.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Operational Guardrails / Safety Principles */}
      <div className="space-y-10 sm:space-y-12" data-fade>
        <div className="text-left max-w-4xl space-y-5">
          <div className="eyebrow">
            <span>Operational Guardrails</span>
          </div>
          <h2 className="section-title-clamp text-ink">
            How We Guarantee Reliability and Customer Trust
          </h2>
          <p className="lead">
            Every layer of our telephony stack is architected around strict privacy, reliable escalation, and data security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="glass glass-hover card-hover-lift p-6 sm:p-8 space-y-6 relative flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 icon-tile">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight">
                Zero Unverified Answers
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Our AI never invents facts or makes unauthorized promises. It is strictly trained on your business knowledge base as an empathetic front desk receptionist and coordinator.
              </p>
            </div>
            <div className="pt-4 border-t border-blue-900/10 flex items-center gap-1.5 text-xs font-medium text-blue-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Grounded Business Knowledge Only</span>
            </div>
          </div>

          <div className="glass glass-hover card-hover-lift p-6 sm:p-8 space-y-6 relative flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 icon-tile">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight">
                Human Fallback by Design
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                If a caller exhibits acute distress or asks for a live representative, the AI immediately initiates an active call transfer protocol to your team helpline.
              </p>
            </div>
            <div className="pt-4 border-t border-blue-900/10 flex items-center gap-1.5 text-xs font-medium text-blue-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Active Call Transfer Protocol</span>
            </div>
          </div>

          <div className="glass glass-hover card-hover-lift p-6 sm:p-8 space-y-6 relative flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 icon-tile">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight">
                Privacy & DPDP Compliance
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Customer and caller information is protected under Indian Digital Personal Data Protection standards with end-to-end encryption and automated PII scrubbing.
              </p>
            </div>
            <div className="pt-4 border-t border-blue-900/10 flex items-center gap-1.5 text-xs font-medium text-blue-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Zero AI Training on Voice Audio</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box - Matching Dark Luxury CTA */}
      <div 
        className="glass !rounded-[2.25rem] p-6 sm:p-12 lg:p-16 text-left max-w-7xl mx-auto space-y-6 relative overflow-hidden"
        data-fade
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] max-w-full h-72 bg-cyan-200/50 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div className="relative space-y-5 max-w-2xl text-left">
          <div className="eyebrow">
            <span>Partner With FrontDesk AI</span>
          </div>
          
          <h3 className="section-title-clamp text-ink">
            Want to partner with FrontDesk AI?
          </h3>
          
          <p className="lead">
            We onboard modern businesses, professional practices, and service teams in under 15 minutes.
          </p>
          
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4 w-full sm:w-auto">
            <button
              onClick={() => setActivePage('support')}
              className="pill has-chip btn-brand magnetic active:scale-[0.98]"
            >
              <span>Speak with our Solutions Team</span>
              <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
