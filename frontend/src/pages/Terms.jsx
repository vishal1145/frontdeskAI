import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  AlertTriangle,
  Scale,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
  PhoneCall,
  Clock,
  Landmark,
  Radio,
  Building
} from 'lucide-react';

const CLAUSES = [
  { id: 'disclaimer', title: 'Service & Urgent Request Disclaimer' },
  { id: 'clause-1', title: '1. Acceptance of Terms' },
  { id: 'clause-2', title: '2. Scope of Service' },
  { id: 'clause-3', title: '3. Client Responsibilities & Schedules' },
  { id: 'clause-4', title: '4. Telephony Carrier Compliance' },
  { id: 'clause-5', title: '5. Fair Usage & Prohibited Activities' },
  { id: 'clause-6', title: '6. Limitation of Liability' },
  { id: 'clause-7', title: '7. Governing Law & Jurisdiction' },
];

export default function Terms({ setActivePage }) {
  const [activeClause, setActiveClause] = useState('disclaimer');
  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // If near the bottom of page, highlight the last clause
          if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
            setActiveClause(CLAUSES[CLAUSES.length - 1].id);
            ticking = false;
            return;
          }

          // If at the very top of page
          if (window.scrollY < 80) {
            setActiveClause(CLAUSES[0].id);
            ticking = false;
            return;
          }

          let currentId = CLAUSES[0].id;
          for (const c of CLAUSES) {
            const el = document.getElementById(c.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 140) {
                currentId = c.id;
              }
            }
          }

          setActiveClause((prev) => (prev !== currentId ? currentId : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleUserInteraction = () => {
      if (isManualScrollingRef.current) {
        isManualScrollingRef.current = false;
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToClause = (id) => {
    setActiveClause(id);
    const element = document.getElementById(id);
    if (element) {
      isManualScrollingRef.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth'
      });

      scrollTimeoutRef.current = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 850);
    }
  };

  const clauses = CLAUSES;

  return (
    <div className="terms-page w-full pt-8 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-12">

      {/* Top Header */}
      <div className="border-b border-blue-900/10 pb-8 sm:pb-12" data-fade>
        <div className="space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide-140 text-blue-700">
            — <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Legal Agreement &amp; Service Terms —</span>
          </div>
          <div className="space-y-2">
            <h1 className="hero-title-clamp text-ink">
              Terms &amp; Conditions of Service
            </h1>
            <p className="text-sm sm:text-15-2 text-ink-muted leading-relaxed">
              Effective Date: October 2026 • Please read these terms carefully before deploying FrontDesk AI for your business
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Quick Clause Navigation Pills (Zero Screen Overlap) */}
      <div className="lg:hidden w-full space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide-120 text-ink-muted flex items-center gap-1.5 px-1">
          <Scale className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Jump:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar select-none">
          {clauses.map((c) => {
            const isActive = activeClause === c.id;
            return (
              <button
                key={c.id}
                onClick={() => scrollToClause(c.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                    ? 'btn-brand shadow-sm scale-[1.02]'
                    : 'glass text-ink-soft hover:text-ink active:scale-[0.98]'
                  }`}
              >
                {c.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Sticky Clause Nav & Clauses Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

        {/* Left Sticky Clause Navigator */}
        <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
          <div className="glass !rounded-xl rounded-xl p-4 space-y-2">
            <div className="px-2 pt-1 pb-2 text-11 font-semibold uppercase tracking-wide-140 text-ink-muted flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Clause Navigator</span>
            </div>
            <nav className="space-y-1">
              {clauses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => scrollToClause(c.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-13 font-medium transition-all flex items-center justify-between ${activeClause === c.id
                      ? 'btn-brand'
                      : 'text-ink-soft hover:text-ink hover:bg-white/80'
                    }`}
                >
                  <span>{c.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="!rounded-xl rounded-xl p-5 bg-amber-50/80 ring-1 ring-amber-200/80 text-13 text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Urgent Request Protocol</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-13">
              FrontDesk AI includes automated triage recognition to actively transfer high-priority or urgent callers to designated business personnel.
            </p>
          </div>
        </div>

        {/* Right Content Column */}
        <div className="lg:col-span-8 space-y-5 text-15-2 sm:text-base text-ink-soft leading-relaxed font-normal prose-legal">

          {/* EMERGENCY DISCLAIMER */}
          <div id="disclaimer" className="scroll-mt-28 p-6 sm:p-8 md:p-10 !rounded-xl rounded-xl bg-amber-50/90 ring-1 ring-amber-300/70 text-amber-950 space-y-4 shadow-[0_18px_38px_-22px_theme(colors.accent.amber.hover_/_0.35)] relative overflow-hidden">
            <div className="flex items-center gap-2.5 font-extrabold text-amber-950 text-sm sm:text-base md:text-lg">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span>IMPORTANT SERVICE &amp; URGENT REQUEST DISCLAIMER</span>
            </div>

            <p className="text-sm sm:text-15-2 leading-relaxed text-amber-900">
              FrontDesk AI is an <strong>administrative automated receptionist and appointment scheduling system</strong>. It is <strong>NOT an emergency response service or replacement for professional human judgment in critical life situations</strong>. FrontDesk AI does not provide emergency medical intervention or specialized statutory advisories over the telephone.
            </p>

            <div className="p-4 !rounded-xl rounded-xl bg-white/80 ring-1 ring-amber-200 text-sm leading-relaxed font-semibold text-amber-950 flex flex-col xs:flex-row items-start gap-2.5 sm:gap-3">
              <span className="px-2.5 py-1 rounded bg-amber-600 text-white font-mono font-bold text-10 shrink-0">
                DIAL 112
              </span>
              <p>
                If a caller is experiencing a life-threatening acute physical or medical emergency, they must immediately hang up and call 112 (National Emergency Helpline) or proceed to the nearest emergency healthcare center.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section id="clause-1" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span>1. Acceptance of Terms</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              By subscribing to, provisioning, or connecting your business telephone numbers to FrontDesk AI, you ("Subscriber" or "Client") agree to be legally bound by these Terms and Conditions. If you do not agree to these terms, you must immediately terminate call forwarding and cease using the service.
            </p>
          </section>

          {/* Section 2 */}
          <section id="clause-2" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0 font-bold text-xs">
                2
              </div>
              <span>2. Scope of Service</span>
            </h2>
            <p className="text-ink-soft">FrontDesk AI provides:</p>
            <div className="space-y-2.5 pt-1">
              <div className="glass-well !rounded-xl rounded-xl p-3.5 sm:p-4 text-sm text-ink-soft flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Inbound telephony reception for business numbers via SIP and GSM Call Forwarding.</span>
              </div>
              <div className="glass-well !rounded-xl rounded-xl p-3.5 sm:p-4 text-sm text-ink-soft flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Real-time speech-to-text, intent parsing, and natural vocal responses in English and regional languages.</span>
              </div>
              <div className="glass-well !rounded-xl rounded-xl p-3.5 sm:p-4 text-sm text-ink-soft flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Appointment slot availability queries, slot reservation locks, and booking confirmations.</span>
              </div>
              <div className="glass-well !rounded-xl rounded-xl p-3.5 sm:p-4 text-sm text-ink-soft flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Post-call notification dispatch via WhatsApp Cloud API and SMS.</span>
              </div>
              <div className="glass-well !rounded-xl rounded-xl p-3.5 sm:p-4 text-sm text-ink-soft flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Automated urgent request detection with human call bridging and transfer protocols.</span>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="clause-3" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0 font-bold text-xs">
                3
              </div>
              <span>3. Client Responsibilities &amp; Calendar Accuracy</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              The Client is solely responsible for maintaining accurate staff shift timings, team schedules, business addresses, and service charges in the FrontDesk AI management portal. FrontDesk AI is not liable for customer inconvenience resulting from outdated schedules configured by client personnel.
            </p>
          </section>

          {/* Section 4 */}
          <section id="clause-4" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <span>4. Telephony Carrier &amp; Forwarding Compliance</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Conditional Call Forwarding relies on underlying cellular telecommunications providers (such as Reliance Jio, Bharti Airtel, Vodafone Idea, or BSNL). While FrontDesk AI's cloud infrastructure maintains a 99.9% availability target, we are not responsible for telecom carrier cell tower outages, national network congestion, or cellular line drops caused by third-party telecom operators.
            </p>
          </section>

          {/* Section 5 */}
          <section id="clause-5" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0 font-bold text-xs">
                5
              </div>
              <span>5. Fair Usage &amp; Prohibited Activities</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              The service is provided strictly for legitimate customer appointment inquiries and business information. The Client shall not use the service for unsolicited telemarketing (cold calling), fraudulent activities, harassment, or transmission of malicious telecom traffic.
            </p>
          </section>

          {/* Section 6 */}
          <section id="clause-6" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl !text-rose-600 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span>6. Limitation of Liability</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              To the maximum extent permitted by applicable Indian law, FrontDesk AI Technologies Pvt. Ltd. shall not be liable for any indirect, punitive, or consequential damages resulting from missed appointments, telecom network drops, or miscommunication by callers. In all circumstances, total liability is limited to the subscription fees paid by the client in the preceding three (3) months.
            </p>
          </section>

          {/* Section 7 */}
          <section id="clause-7" className="space-y-4 scroll-mt-28 glass-solid !rounded-xl rounded-xl p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl !text-indigo-600 shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <span>7. Governing Law &amp; Dispute Resolution</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in New Delhi / Gurugram, India.
            </p>
          </section>

          {/* Bottom Back Button */}
          <div className="pt-8 border-t border-blue-900/10 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
            <button
              onClick={() => { setActivePage('home'); window.scrollTo(0, 0); }}
              className="glass-pill inline-flex items-center justify-center gap-2 text-13 font-medium text-blue-700 hover:text-blue-800 px-4 py-2.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to FrontDesk AI Home</span>
            </button>
            <button
              onClick={() => { setActivePage('privacy'); window.scrollTo(0, 0); }}
              className="pill btn-brand !min-h-[2.75rem] !text-13 active:scale-[0.98]"
            >
              <span>View Privacy Policy &rarr;</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
