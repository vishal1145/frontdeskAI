import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CalendarCheck,
  Clock,
  MessageSquare,
  PhoneForwarded,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Users,
  ArrowRight,
  Calculator,
  Sliders,
  Building2,
  Briefcase,
  ChevronDown,
  Play,
  Zap,
  PhoneIncoming,
  Check,
  Shield,
  Activity,
  Radio,
  SendHorizontal,
  Star,
  Layers
} from 'lucide-react';
import useHomeMotion from '../motion/useHomeMotion';
import AnimatedNumber from '../components/AnimatedNumber';
import HeroRibbon from '../components/HeroRibbon';

export default function Home({ setActivePage }) {
  // Landing-page motion system (scoped to this root; see src/motion/useHomeMotion.js)
  const motionRootRef = useRef(null);
  useHomeMotion(motionRootRef);

  // Call Simulator State & Auto-play Ref
  const simulatorRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [isSimulatorInView, setIsSimulatorInView] = useState(false);
  const [activeScenario, setActiveScenario] = useState('booking'); // 'booking' | 'emergency'
  const [simulatorStep, setSimulatorStep] = useState(0);
  const [callDuration, setCallDuration] = useState(14);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showWhatsAppToast, setShowWhatsAppToast] = useState(false);

  // Auto-scroll chat stream to bottom when step advances or thinking starts
  useEffect(() => {
    if (simulatorStep === 0) {
      chatContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [simulatorStep, isAiThinking]);

  // ROI Calculator State
  const [dailyCalls, setDailyCalls] = useState(60);
  const [missedPercent, setMissedPercent] = useState(35);
  const [consultFee, setConsultFee] = useState(600);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Call timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => (prev > 58 ? 14 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show WhatsApp notification on booking confirmation step
  useEffect(() => {
    if (activeScenario === 'booking' && simulatorStep >= 5) {
      setShowWhatsAppToast(true);
      const toastTimer = setTimeout(() => setShowWhatsAppToast(false), 5000);
      return () => clearTimeout(toastTimer);
    } else {
      setShowWhatsAppToast(false);
    }
  }, [simulatorStep, activeScenario]);

  // ROI Calculations
  const monthlyMissedCalls = Math.round(dailyCalls * (missedPercent / 100) * 26);
  const recoveredCustomers = Math.round(monthlyMissedCalls * 0.70); // 70% conversion
  const recoveredRevenue = recoveredCustomers * consultFee;

  // Simulator Dialogues
  const scenarios = {
    booking: [
      {
        speaker: 'AI Voice',
        tag: 'Receptionist',
        role: 'ai',
        text: 'Hello and welcome to Apex Solutions! I am your FrontDesk AI Receptionist. How may I assist you with scheduling an appointment today?',
        tool: null,
      },
      {
        speaker: 'Customer',
        tag: 'Caller',
        role: 'user',
        text: 'Hello, I would like to schedule a consultation with your team tomorrow evening. Is there an available slot around 6:00 PM?',
        tool: null,
      },
      {
        speaker: 'Voice Telephony Engine',
        tag: 'check_availability',
        role: 'tool',
        text: 'Live Query: date="tomorrow", time_range="evening". Result: 6:00 PM appointment slot is available.',
        tool: 'check_availability',
        status: 'Slot Found: 6:00 PM (Tomorrow)',
      },
      {
        speaker: 'AI Voice',
        tag: 'Receptionist',
        role: 'ai',
        text: 'Yes! We have an available slot tomorrow at 6:00 PM. Could you please confirm your full name and phone number to finalize the booking?',
        tool: null,
      },
      {
        speaker: 'Customer',
        tag: 'Caller',
        role: 'user',
        text: 'My name is Rahul Sharma, and my contact number is 9876543210.',
        tool: null,
      },
      {
        speaker: 'Voice Telephony Engine',
        tag: 'book_appointment',
        role: 'tool',
        text: 'Concurrency Lock Acquired. Booking ID: BK-8419 generated. Triggering Meta WhatsApp Cloud notification.',
        tool: 'book_appointment',
        status: 'Confirmed • BK-8419',
      },
      {
        speaker: 'AI Voice',
        tag: 'Receptionist',
        role: 'ai',
        text: 'Your appointment is confirmed for tomorrow at 6:00 PM under Booking ID BK-8419. A confirmation receipt with location and meeting details has been sent to your WhatsApp. Thank you!',
        tool: null,
      }
    ],
    emergency: [
      {
        speaker: 'AI Voice',
        tag: 'Receptionist',
        role: 'ai',
        text: 'Hello, Apex Solutions. How may I assist you today?',
        tool: null,
      },
      {
        speaker: 'Customer',
        tag: 'Caller',
        role: 'user',
        text: 'Hello, I have an urgent account escalation and need to speak with a senior supervisor immediately!',
        tool: null,
      },
      {
        speaker: 'Priority Triage Guardrail',
        tag: 'transfer_call',
        role: 'tool',
        text: 'Urgent priority flagged: Enterprise account escalation. Initiating live staff telephone bridging.',
        tool: 'transfer_call',
        status: 'Priority Transfer → Lead Supervisor',
      },
      {
        speaker: 'AI Voice',
        tag: 'Receptionist',
        role: 'ai',
        text: 'Understood, this has been marked as high priority. I am immediately transferring your call to our on-call supervisor. Please stay on the line!',
        tool: null,
      }
    ]
  };

  const currentDialogue = scenarios[activeScenario];

  // IntersectionObserver to auto-start when user reaches section and auto-reset when user scrolls away
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsSimulatorInView(true);
        } else {
          setIsSimulatorInView(false);
          setSimulatorStep(0);
          setShowWhatsAppToast(false);
          setIsAiThinking(false);
        }
      },
      { threshold: 0.2 }
    );

    if (simulatorRef.current) {
      observer.observe(simulatorRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Automated dialogue progression while in view
  useEffect(() => {
    if (!isSimulatorInView) return;

    const isLastStep = simulatorStep >= currentDialogue.length - 1;
    const stepDuration = isLastStep ? 3500 : 1500;

    let aiTimer;
    const nextTimer = setTimeout(() => {
      if (isLastStep) {
        setSimulatorStep(0);
      } else {
        setIsAiThinking(true);
        aiTimer = setTimeout(() => {
          setIsAiThinking(false);
          setSimulatorStep((prev) => prev + 1);
        }, 250);
      }
    }, stepDuration);

    return () => {
      clearTimeout(nextTimer);
      if (aiTimer) clearTimeout(aiTimer);
    };
  }, [isSimulatorInView, simulatorStep, currentDialogue.length]);

  const handleResetScenario = (type) => {
    setActiveScenario(type);
    setSimulatorStep(0);
    setShowWhatsAppToast(false);
    chatContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs = [
    {
      q: "Do we need to purchase a new phone number or dedicated SIM card?",
      a: "No. FrontDesk AI connects to your existing phone number via standard call forwarding. When your line is busy or unanswered, calls route automatically to the AI."
    },
    {
      q: "Does the AI accurately understand regional accents and natural phrasing?",
      a: "Yes. Our speech engine understands natural accents, bilingual phrasing, and conversational nuances with sub-second voice latency."
    },
    {
      q: "Can double-bookings occur if multiple customers call at the exact same second?",
      a: "Never. Our Concurrency Slot Lock reserves chosen times instantly in milliseconds, preventing overlapping or duplicate bookings."
    },
    {
      q: "How does the AI handle urgent requests or priority escalations?",
      a: "If a caller reports an urgent issue or requests escalation, the AI immediately transfers the live call to your designated on-call staff line."
    },
    {
      q: "How do customers receive their appointment confirmation details?",
      a: "The caller receives an instant confirmation via Meta WhatsApp Cloud API with booking time, reference ID, and location details."
    }
  ];

  return (
    <div ref={motionRootRef} data-motion-scope="home" className="w-full relative selection:bg-blue-600 selection:text-white">
      {/* ================= 1. HERO: EDITORIAL HEADLINE + AI VOICE RIBBON ================= */}
      <section id="hero-section" className="hr relative overflow-hidden">
        {/* Atmosphere: two soft light fields and a fine grain */}
        <div className="hr-bg" aria-hidden="true">
          <div className="hr-light hr-light-a"></div>
          <div className="hr-light hr-light-b"></div>
          <div className="hr-grain"></div>
        </div>

        <div className="hr-inner relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hr-eyebrow">
            <span>— AI Voice Receptionist —</span>
          </div>

          <h1 className="hr-title">
            <span className="hr-line"><span className="hr-line-inner">Never miss</span></span>
            <span className="hr-line hr-line-indent">
              <span className="hr-line-inner">another <span className="text-brand-gradient">call.</span></span>
            </span>
          </h1>

          {/* The voice ribbon flows full-bleed through this band */}
          <div className="hr-band">
            <div className="hr-ribbon-wrap">
              <HeroRibbon className="hr-ribbon" />
            </div>
          </div>

          <div className="hr-rule" aria-hidden="true"></div>
          <div className="hr-base">
            <p className="hr-sub lead">
              FrontDesk AI answers calls naturally, books appointments, and confirms them on WhatsApp — 24/7 using your existing number.            </p>

            <div className="hr-actions">
              <button
                onClick={() => setActivePage('support')}
                data-press="0.965"
                className="pill has-chip btn-brand magnetic hr-cta"
              >
                <span>Book Live Demo</span>
                <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
              </button>
              <a
                href="#simulator"
                data-press="0.965"
                className="pill has-chip btn-glass magnetic hr-cta"
              >
                <span>View Live Simulator</span>
                <span className="btn-chip" aria-hidden="true"><Play className="!rotate-0" /></span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. BENEFIT CHIP STRIP (PREVVI LOGO-CHIP MARQUEE PATTERN) ================= */}
      <div className="w-full overflow-hidden mask-fade-x" data-anim="marquee-ribbon" data-marquee-viewport>
        <div className="flex w-max items-center animate-marquee py-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 pr-3 select-none" aria-hidden={idx > 0 ? 'true' : undefined}>
              {[
                '24/7 Zero Missed Calls',
                'Instant WhatsApp Slips',
                'Natural Voice Intelligence',
                'Emergency Call Transfer',
                '99.98% Telephony Uptime',
                'Concurrency Slot Lock',
                'Keep Existing Phone Line',
              ].map((label) => (
                <span key={label} className="marquee-chip glass-pill">
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ================= 3. ABOUT US SECTION (MATCHING PINTEREST ARCHED CARD & ROTATING BADGE) ================= */}
      <section id="about" className="section-y !pt-24 sm:!pt-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Column: Arched Image Card Collage & Rotating Badge */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-start" data-anim="from-left">

              {/* Engine Card */}
              <div className="eng-card relative w-full max-w-[calc(100vw-2.5rem)] sm:max-w-md lg:max-w-none !rounded-xl rounded-xl p-5 sm:p-6 pt-5 sm:pt-6 overflow-hidden panel-ink">

                {/* Voice core: globe with orbiting signals and live sound waves */}
                <div className="eng-core" aria-hidden="true">
                  <span className="eng-wave eng-wave--left">
                    {[0.35, 0.6, 0.45, 0.8, 0.55, 1, 0.7, 0.9, 0.5, 0.75, 0.4, 0.6].map((h, i) => (
                      <i key={i} style={{ '--h': h, '--d': `${-i * 0.13}s` }} />
                    ))}
                  </span>
                  <span className="eng-wave eng-wave--right">
                    {[0.35, 0.6, 0.45, 0.8, 0.55, 1, 0.7, 0.9, 0.5, 0.75, 0.4, 0.6].map((h, i) => (
                      <i key={i} style={{ '--h': h, '--d': `${-i * 0.11 - 0.4}s` }} />
                    ))}
                  </span>

                  <svg className="eng-orbits" viewBox="0 0 200 140" fill="none">
                    <ellipse cx="100" cy="70" rx="92" ry="20" transform="rotate(-14 100 70)" stroke="var(--fd-rim)" strokeOpacity="0.55" />
                    <ellipse cx="100" cy="70" rx="86" ry="16" transform="rotate(12 100 70)" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.45" />
                    <ellipse cx="100" cy="70" rx="70" ry="28" stroke="var(--fd-brand-vivid)" strokeOpacity="0.35" />
                    <g className="eng-sparks" fill="var(--fd-color-tint-cyan-3)">
                      <circle cx="22" cy="86" r="1.4" /><circle cx="176" cy="48" r="1.6" /><circle cx="44" cy="44" r="1" />
                      <circle cx="160" cy="98" r="1.2" /><circle cx="128" cy="24" r="1" /><circle cx="70" cy="116" r="1.1" />
                    </g>
                    <circle className="eng-orbit-dot" r="2.6" fill="var(--fd-color-tint-cyan-4)">
                      <animateMotion dur="6s" repeatCount="indefinite" rotate="auto"
                        path="M8 70 a92 20 0 1 0 184 0 a92 20 0 1 0 -184 0" />
                    </circle>
                    <circle className="eng-orbit-dot" r="2.2" fill="var(--fd-color-tint-blue-28)">
                      <animateMotion dur="8s" begin="-3s" repeatCount="indefinite"
                        path="M186 70 a86 16 0 1 1 -172 0 a86 16 0 1 1 172 0" />
                    </circle>
                  </svg>

                  <span className="eng-globe">
                    <svg viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="46" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.7" />
                      <path d="M4 50 H96 M10 30 H90 M10 70 H90 M22 14 H78 M22 86 H78" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.28" />
                      <ellipse cx="50" cy="50" rx="46" ry="16" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.3" />
                      <ellipse cx="50" cy="50" rx="16" ry="46" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.3" />
                      <ellipse className="eng-meridian" cx="50" cy="50" rx="34" ry="46" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.32" />
                      <ellipse className="eng-meridian eng-meridian--2" cx="50" cy="50" rx="34" ry="46" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.32" />
                      <ellipse className="eng-meridian eng-meridian--3" cx="50" cy="50" rx="34" ry="46" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.32" />
                    </svg>
                    <span className="eng-globe-icon">
                      <PhoneForwarded className="w-6 h-6 sm:w-7 sm:h-7" />
                    </span>
                  </span>
                </div>

                {/* Card Title & Content */}
                <div className="text-center space-y-2 mb-6">
                  <span className="eng-label text-11 font-mono uppercase font-semibold tracking-wider text-cyan-300">
                    AI Telephony Intelligence
                  </span>
                  <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                    FrontDesk AI Engine
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Built for high-volume practices, modern offices, and service businesses.
                  </p>
                </div>

                {/* Floating Telephony Notification Cards */}
                <div className="space-y-2.5">
                  <div className="eng-row eng-row--green py-2.5 px-4 rounded-full flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="eng-live" aria-hidden="true"></span>
                      <span className="text-slate-200 font-medium whitespace-nowrap">SIP Call Handover</span>
                    </div>
                    <span className="eng-mini-wave" aria-hidden="true">
                      {[0.3, 0.55, 0.4, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.7, 0.4, 0.3].map((h, i) => <i key={i} style={{ '--h': h, '--d': `${-i * 0.17}s` }} />)}
                    </span>
                    <span className="eng-tag text-emerald-300 font-mono font-bold">15ms</span>
                  </div>

                  <div className="eng-row eng-row--blue py-2.5 px-4 rounded-full flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="text-slate-200 font-medium whitespace-nowrap">Appointment Booking</span>
                    </div>
                    <span className="eng-mini-wave" aria-hidden="true">
                      {[0.35, 0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.5, 0.75, 0.4, 0.55, 0.3].map((h, i) => <i key={i} style={{ '--h': h, '--d': `${-i * 0.19 - 0.3}s` }} />)}
                    </span>
                    <span className="shrink-0 text-cyan-300 font-mono font-bold">Automatic</span>
                  </div>
                </div>

                {/* Subtle Business Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-11 text-slate-400">
                  <span>Zero Hardware Needed</span>
                  <span className="text-cyan-300 font-bold">100% Cloud</span>
                </div>
              </div>

              {/* Rotating Circular Badge */}
              <div className="eng-badge absolute -top-6 right-0 sm:-top-9 sm:-right-4 lg:-right-10 w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 flex items-center justify-center rounded-full p-1">
                <svg className="w-full h-full animate-spin-slow" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="74" fill="none" stroke="var(--fd-color-tint-cyan-8)" strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="1 5" />
                  <circle cx="80" cy="80" r="40" fill="none" stroke="var(--fd-rim)" strokeOpacity="0.45" />
                  <path
                    id="circlePathBadge"
                    d="M 80, 80 m -56, 0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"
                    fill="none"
                  />
                  <text className="text-9-5 uppercase font-extrabold tracking-wide-240 fill-white">
                    <textPath href="#circlePathBadge" startOffset="0%">
                      ✦ 24/7 BUSINESS TELEPHONY ✦ ENTERPRISE VOICE AI ✦
                    </textPath>
                  </text>
                </svg>
                <div className="eng-badge-core absolute inset-0 m-auto w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center">
                  <PhoneIncoming className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

            </div>

            {/* Right Column: About Details (Preserving 100% Copy) */}
            <div className="lg:col-span-7 space-y-6" data-motion="about-copy">

              <div className="eyebrow" data-anim="eyebrow">
                <span>— About FrontDesk AI —</span>
              </div>

              <h2 className="section-title-clamp text-ink" data-anim="heading">
                Dedicated Telephony Intelligence
              </h2>

              <p className="lead" data-anim="para">
                Growing businesses miss 45% of calls during peak hours. FrontDesk AI answers 24/7, manages calendars, and transfers urgent calls—without changing your number.</p>

              {/* Feature Points with Stars */}
              <div className="space-y-3 pt-2" data-anim="stagger-list">
                <div className="flex items-start gap-3" data-anim="list-item">
                  <div className="w-5 h-5 rounded-full bg-white ring-1 ring-blue-200 text-blue-600 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 font-bold" />
                  </div>
                  <span className="text-sm sm:text-15-2 font-medium text-ink">
                    Smart call divert on busy or after-hours (zero hardware needed)
                  </span>
                </div>

                <div className="flex items-start gap-3" data-anim="list-item">
                  <div className="w-5 h-5 rounded-full bg-white ring-1 ring-blue-200 text-blue-600 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 font-bold" />
                  </div>
                  <span className="text-sm sm:text-15-2 font-medium text-ink">
                    Instant appointment booking with WhatsApp confirmation slip
                  </span>
                </div>

                <div className="flex items-start gap-3" data-anim="list-item">
                  <div className="w-5 h-5 rounded-full bg-white ring-1 ring-blue-200 text-blue-600 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 font-bold" />
                  </div>
                  <span className="text-sm sm:text-15-2 font-medium text-ink">
                    Live priority call transfer for urgent customer escalations
                  </span>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 sm:p-2 glass !rounded-xl rounded-xl">
                <div className="glass-well !rounded-xl rounded-xl p-3 sm:p-4 space-y-1 tilt-card" data-anim="stat-item">
                  <div className="font-display text-2xl sm:text-4xl font-medium tracking-tight text-ink" data-count="99.8" data-suffix="%">
                    99.8%
                  </div>
                  <div className="text-11 sm:text-xs text-ink-muted font-medium">
                    Telephony Uptime
                  </div>
                </div>

                <div className="glass-well !rounded-xl rounded-xl p-3 sm:p-4 space-y-1 tilt-card" data-anim="stat-item">
                  <div className="font-display text-2xl sm:text-4xl font-medium tracking-tight text-blue-600" data-count="45" data-suffix="%">
                    45%
                  </div>
                  <div className="text-11 sm:text-xs text-ink-muted font-medium">
                    Recovered Calls
                  </div>
                </div>

                <div className="glass-well !rounded-xl rounded-xl p-3 sm:p-4 space-y-1 tilt-card" data-anim="stat-item">
                  <div className="font-display text-2xl sm:text-4xl font-medium tracking-tight text-ink" data-count="15" data-suffix="s">
                    15s
                  </div>
                  <div className="text-11 sm:text-xs text-ink-muted font-medium">
                    Quick SIP Pickup
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={() => setActivePage('about')}
                  className="pill has-chip btn-brand magnetic active:scale-[0.98]"
                >
                  <span>Learn About Our Mission</span>
                  <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================= 4. INTERACTIVE CALL SIMULATOR WIDGET (ASYMMETRIC TWO-COLUMN) ================= */}
      <section id="simulator" ref={simulatorRef} className="section-y bloom relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">

            {/* Left Column: Heading, Context, Benefits & Interactive Scenario Selector (~42%) */}
            {/*<div className="lg:col-span-5 space-y-6 text-left" data-motion="sim-copy">
              <div className="eyebrow">
                <span>Live Call Simulator</span>
              </div>

              <h2 className="section-title-clamp text-ink">
                Experience How FrontDesk AI Answers Business Calls
              </h2>

              <p className="lead">
                Experience how FrontDesk AI converses naturally, checks live team calendars, and routes urgent calls in real time.
              </p>

             
              <div className="p-3 sm:p-4 glass space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-11 font-semibold uppercase tracking-wider text-ink-muted font-mono">
                    Select Simulation:
                  </span>
                  <span className="text-10 text-blue-700 font-semibold bg-white/80 ring-1 ring-blue-200 px-2 py-0.5 rounded-full">
                    Auto-plays in real time
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleResetScenario('booking')}
                    className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between ${activeScenario === 'booking'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'bg-white/70 text-ink-soft hover:bg-white ring-1 ring-blue-900/10'
                      }`}
                  >
                    <span>1. Appointment Booking</span>
                    {activeScenario === 'booking' && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                  </button>
                  <button
                    onClick={() => handleResetScenario('emergency')}
                    className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between ${activeScenario === 'emergency'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                        : 'bg-white/70 text-ink-soft hover:bg-white ring-1 ring-blue-900/10'
                      }`}
                  >
                    <span>2. Urgent Call Transfer</span>
                    {activeScenario === 'emergency' && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                  </button>
                </div>
              </div>

              
              <div className="space-y-3.5 pt-1" data-motion="sim-benefits">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 icon-tile !rounded-xl shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">&lt; 800ms Voice Latency</h4>
                    <p className="text-13 text-ink-muted leading-snug mt-0.5">Natural conversational flow with zero awkward pauses.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 icon-tile !rounded-xl !text-emerald-600 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Atomic Concurrency Lock</h4>
                    <p className="text-13 text-ink-muted leading-snug mt-0.5">Prevents duplicate bookings across concurrent caller lines.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 icon-tile !rounded-xl shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Instant WhatsApp Confirmation</h4>
                    <p className="text-13 text-ink-muted leading-snug mt-0.5">Booking slip and location details sent immediately to the caller.</p>
                  </div>
                </div>
              </div>

              
              <div className="pt-2">
                <button
                  onClick={() => setActivePage('support')}
                  className="pill has-chip btn-brand magnetic active:scale-[0.98]"
                >
                  <span className="bf">
                    <span className="l1">Book Live Walkthrough</span>
                  </span>
                  <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
                </button>
              </div>

            </div> */}

            {/* Right Column: Live Telephony Simulator Interface (~58%) */}
            <div className="lg:col-span-12 relative">
              {showWhatsAppToast && (
                <div className="absolute -top-14 inset-x-2 sm:inset-x-auto sm:right-4 z-30 animate-slide-up bg-white rounded-xl shadow-elevated border border-emerald-300 p-3 sm:p-3.5 flex items-center gap-3 sm:max-w-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <span className="text-emerald-600 font-semibold">WhatsApp Cloud</span>
                      <span className="text-10 text-slate-400 font-normal">Just now</span>
                    </div>
                    <p className="text-11 text-slate-600 leading-tight">
                      Booking Confirmed! Reference #BK-8419 for Tomorrow 6:00 PM with Apex Solutions.
                    </p>
                  </div>
                </div>
              )}

              <div className="glass-solid !rounded-xl rounded-xl overflow-hidden card-stagger tilt-card view-hover" data-motion="sim-window">

                {/* Window Header */}
                <div className="bg-white/60 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* Pulsing acoustic rings around avatar */}
                      <span className="absolute -inset-1.5 rounded-2xl bg-blue-500/20 animate-pulse-ring"></span>
                      <div className="relative w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                        <PhoneIncoming className="w-5 h-5 text-blue-600 animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-15-2 text-ink">Live Inbound Telephony Simulator</h3>
                        <span className="text-10 font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          CALL ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Apex Solutions • Virtual Inbound Call • Duration: 00:{callDuration}
                      </p>
                    </div>
                  </div>

                  {/* Scenario Toggle */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-ice-deep/70 p-1 rounded-2xl sm:rounded-full ring-1 ring-blue-900/10 w-full sm:w-auto gap-1">
                    <button
                      onClick={() => handleResetScenario('booking')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl sm:rounded-full text-11 sm:text-xs font-semibold transition-all text-center whitespace-nowrap ${activeScenario === 'booking'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      1. Appointment Booking
                    </button>
                    <button
                      onClick={() => handleResetScenario('emergency')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl sm:rounded-full text-11 sm:text-xs font-semibold transition-all text-center whitespace-nowrap ${activeScenario === 'emergency'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      2. Urgent Call Transfer
                    </button>
                  </div>

                </div>

                {/* Dynamic Sound Wave & Voice Status Bar */}
                <div className="panel-ink !shadow-none px-4 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      Live Speech Waveform:
                    </span>

                    {/* Dynamic oscillating soundwave frequency bars */}
                    <div className="flex items-center gap-1 h-6">
                      <span className="w-1 bg-blue-500 rounded-full wave-1"></span>
                      <span className="w-1 bg-blue-400 rounded-full wave-2"></span>
                      <span className="w-1 bg-sky-400 rounded-full wave-3"></span>
                      <span className="w-1 bg-sky-300 rounded-full wave-4"></span>
                      <span className="w-1 bg-blue-500 rounded-full wave-2"></span>
                      <span className="w-1 bg-blue-400 rounded-full wave-1"></span>
                      <span className="w-1 bg-sky-400 rounded-full wave-3"></span>
                      <span className="w-1 bg-emerald-400 rounded-full wave-4"></span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
                    <span>Step: <strong className="text-blue-400 font-bold">{simulatorStep + 1}</strong> / {currentDialogue.length}</span>
                  </div>
                </div>

                {/* Conversation Stream Container with Smooth Slide-in Animation */}
                <div
                  ref={chatContainerRef}
                  className="p-4 sm:p-6 md:p-8 space-y-3.5 sm:space-y-4 bg-ice/50 h-[400px] sm:h-[460px] md:h-[480px] overflow-y-auto scroll-smooth"
                >
                  {currentDialogue.slice(0, simulatorStep + 1).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`animate-slide-up transition-all ${msg.role === 'tool'
                        ? 'p-3 sm:p-3.5 rounded-xl panel-ink text-blue-300 font-mono text-xs'
                        : msg.role === 'ai'
                          ? 'p-3.5 sm:p-4 rounded-2xl rounded-tl-md bg-white ring-1 ring-blue-200 shadow-[0_10px_24px_-16px_theme(colors.blue.800_/_0.45)] max-w-full sm:max-w-[88%]'
                          : 'p-3.5 sm:p-4 rounded-2xl rounded-tr-md bg-blue-50/90 ring-1 ring-blue-900/10 max-w-full sm:max-w-[88%] ml-auto'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${msg.role === 'ai' ? 'text-blue-600' : msg.role === 'tool' ? 'text-blue-300' : 'text-ink'
                            }`}>
                            {msg.speaker}
                          </span>
                          <span className="text-10 text-slate-400 font-medium">({msg.tag})</span>
                        </div>

                        {msg.status && (
                          <span className="text-10 uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                            {msg.status}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed ${msg.role === 'tool' ? 'font-mono text-slate-200' : 'text-ink-soft'
                        }`}>
                        {msg.text}
                      </p>
                    </div>
                  ))}

                  {/* AI Thinking Animation */}
                  {isAiThinking && (
                    <div className="p-3 bg-white rounded-xl ring-1 ring-blue-200 inline-flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                      <span className="font-medium">AI generating natural response...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= 5. OUR PROVEN WORK PROCESS (MATCHING PINTEREST CONNECTED STEPPER) ================= */}
      <section id="telephony" className="section-y relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

          {/* Section Header */}
          <div className="max-w-3xl space-y-3 sm:space-y-4 mb-8 sm:mb-12 text-left" data-motion="story-head">
            <div className="eyebrow" data-anim="eyebrow">
              <span>— Our Work Process —</span>
            </div>
            <div className='space-y-2'>
              <h2 className="section-title-clamp text-ink" data-anim="heading">
                How Call Forwarding (SIP Diversion) Works
              </h2>
              <p className="lead">
                No new SIM or number needed. Works via standard Conditional Call Forwarding on all telecom networks.
              </p>
            </div>
          </div>

          {/* Connected Horizontal Stepper */}
          <div className="relative">
            {/* Visual Connecting Laser Progress Bar for Pinned Sequence (visible on desktop) */}
            <div className="hidden lg:block absolute top-[28px] left-[6%] right-[6%] h-[3px] bg-blue-900/10 z-0 rounded-full overflow-hidden pointer-events-none">
              <div className="h-full bg-gradient-to-r from-cyan-300 via-blue-500 to-blue-700 rounded-full story-progress-bar transition-all" style={{ width: '0%' }}></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">

              {/* Step 01 */}
              <div className="card-stagger tilt-card view-hover glass glass-hover !rounded-xl rounded-xl p-6 relative space-y-4 group story-step story-step-1 cursor-pointer" data-step="1">
                <div className="w-14 h-14 rounded-full icon-tile !rounded-full !text-ink flex items-center justify-center font-semibold font-mono text-base group-hover:scale-110 transition-transform duration-500 story-badge">
                  01
                </div>
                <h3 className="text-lg font-medium text-ink tracking-tight leading-snug">Customer Calls Main Business Number</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Callers dial your existing business number as listed on Google Maps, website, or ads.
                </p>
                <div className="glass-well !rounded-xl rounded-xl px-3 py-2.5 text-11 font-mono text-ink-soft">
                  Incoming: Main Office Line / SIM
                </div>
              </div>

              {/* Step 02 */}
              <div className="card-stagger tilt-card view-hover glass glass-hover !rounded-xl rounded-xl p-6 relative space-y-4 group story-step story-step-2 cursor-pointer" data-step="2">
                <div className="w-14 h-14 rounded-full icon-tile !rounded-full !text-ink flex items-center justify-center font-semibold font-mono text-base group-hover:scale-110 transition-transform duration-500 story-badge">
                  02
                </div>
                <h3 className="text-lg font-medium text-ink tracking-tight leading-snug">Phone Busy / Missed After 15s</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  If line is busy or unanswered for 15 seconds, your telecom carrier auto-forwards the call.
                </p>
                <div className="glass-well !rounded-xl rounded-xl px-3 py-2.5 text-11 font-mono text-ink-soft">
                  Trigger: GSM Conditional Forward
                </div>
              </div>

              {/* Step 03 */}
              <div className="card-stagger tilt-card view-hover glass glass-hover !rounded-xl rounded-xl p-6 relative space-y-4 group story-step story-step-3 cursor-pointer" data-step="3">
                <div className="w-14 h-14 rounded-full icon-tile !rounded-full !text-ink flex items-center justify-center font-semibold font-mono text-base group-hover:scale-110 transition-transform duration-500 story-badge">
                  03
                </div>
                <h3 className="text-lg font-medium text-ink tracking-tight leading-snug">AI Answers with Custom Business Knowledge</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Voice AI answers with your custom company greeting and checks team availability live.
                </p>
                <div className="glass-well !rounded-xl rounded-xl px-3 py-2.5 text-11 font-mono text-ink-soft">
                  SIP Diversion &rarr; Team Roster Loaded
                </div>
              </div>

              {/* Step 04 */}
              <div className="card-stagger tilt-card view-hover glass glass-hover !rounded-xl rounded-xl p-6 relative space-y-4 group story-step story-step-4 cursor-pointer" data-step="4">
                <div className="w-14 h-14 rounded-full icon-tile !rounded-full !text-ink flex items-center justify-center font-semibold font-mono text-base group-hover:scale-110 transition-transform duration-500 story-badge">
                  04
                </div>
                <h3 className="text-lg font-medium text-ink tracking-tight leading-snug">Instant WhatsApp Confirmation Slip</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Appointment is confirmed and caller receives instant WhatsApp details with location link.
                </p>
                <div className="glass-well !rounded-xl rounded-xl px-3 py-2.5 text-11 font-mono text-ink-soft">
                  Realtime: WhatsApp Cloud API
                </div>
              </div>

            </div>
          </div>

          {/* Compatible Carriers Strip */}
          {/* <div className="mt-14 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h4 className="font-bold text-sm text-white">Works With All Major Indian Telecom Providers:</h4>
              <p className="text-xs text-slate-400">Supports standard GSM call divert dial codes (*67*, *61*, *62*).</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {['Jio 5G / 4G', 'Airtel Enterprise', 'Vodafone Idea', 'Tata Tele Cloud', 'Exotel Telephony', 'Twilio Voice'].map((c, i) => (
                <span key={i} className="px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200 hover:border-blue-500 hover:text-blue-400 transition-colors">
                  {c}
                </span>
              ))}
            </div>
          </div> */}

        </div>
      </section>

      {/* ================= 6. SERVICES WE PROVIDE (MATCHING PINTEREST SQUIRCLE ICON CARDS) ================= */}
      {/* ================= 6. SERVICES / FEATURES SECTION ================= */}
      <section id="features" className="section-y max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="max-w-4xl space-y-4 mb-12 sm:mb-16 text-left" data-motion="feature-head">
          <div className="eyebrow" data-anim="eyebrow">
            <span>— Services We Provide —</span>
          </div>
          <div className='space-y-2'>
            <h2 className="section-title-clamp text-ink" data-anim="heading">
              Engineered for Demanding Business Operations
            </h2>
            <p className="lead">
              Enterprise voice telephony engineered around live calendars, team availability, and priority escalations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" data-motion="feature-grid">

          {/* Service 1 */}
          <div
            className="tilt-card view-hover glass glass-hover !rounded-xl rounded-xl spotlight p-6 sm:p-7 group flex flex-col justify-between cursor-pointer"
            data-motion="feature-card"
            onClick={() => setActivePage('feature', 'live-availability-search')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePage('feature', 'live-availability-search'); } }}
          >
            <div>
              <div className="icon-tile w-14 h-14 mb-5">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight mb-2.5">Live Availability Search</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Converts spoken time requests into live calendar queries and offers open slots in real time.
              </p>
            </div>
            <div aria-label="Learn more about Live Availability Search" className="w-full mt-6 pt-4 border-t border-blue-900/10 flex items-center justify-between text-sm font-medium text-blue-700 text-left">
              <span>Learn more</span>
              <span className="w-8 h-8 rounded-full bg-white/80 ring-1 ring-blue-900/10 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600"><ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45" /></span>
            </div>
          </div>

          {/* Service 2 */}
          <div
            className="tilt-card view-hover glass glass-hover !rounded-xl rounded-xl spotlight p-6 sm:p-7 group flex flex-col justify-between cursor-pointer"
            data-motion="feature-card"
            onClick={() => setActivePage('feature', 'concurrency-slot-lock')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePage('feature', 'concurrency-slot-lock'); } }}
          >
            <div>
              <div className="icon-tile w-14 h-14 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight mb-2.5">Concurrency Slot Lock</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                High-speed in-memory locking prevents double-booking across simultaneous callers.
              </p>
            </div>
            <div aria-label="Learn more about Concurrency Slot Lock" className="w-full mt-6 pt-4 border-t border-blue-900/10 flex items-center justify-between text-sm font-medium text-blue-700 text-left">
              <span>Learn more</span>
              <span className="w-8 h-8 rounded-full bg-white/80 ring-1 ring-blue-900/10 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600"><ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45" /></span>
            </div>
          </div>

          {/* Service 3 */}
          <div
            className="tilt-card view-hover glass glass-hover !rounded-xl rounded-xl spotlight p-6 sm:p-7 group flex flex-col justify-between cursor-pointer"
            data-motion="feature-card"
            onClick={() => setActivePage('feature', 'instant-whatsapp-slips')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePage('feature', 'instant-whatsapp-slips'); } }}
          >
            <div>
              <div className="icon-tile w-14 h-14 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight mb-2.5">Instant WhatsApp Slips</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Sends instant WhatsApp confirmations with booking ID, staff name, and location directions.
              </p>
            </div>
            <div aria-label="Learn more about Instant WhatsApp Slips" className="w-full mt-6 pt-4 border-t border-blue-900/10 flex items-center justify-between text-sm font-medium text-blue-700 text-left">
              <span>Learn more</span>
              <span className="w-8 h-8 rounded-full bg-white/80 ring-1 ring-blue-900/10 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600"><ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45" /></span>
            </div>
          </div>

          {/* Service 4 */}
          <div
            className="tilt-card view-hover glass glass-hover !rounded-xl rounded-xl spotlight p-6 sm:p-7 group flex flex-col justify-between cursor-pointer"
            data-motion="feature-card"
            onClick={() => setActivePage('feature', 'urgent-call-escalation')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePage('feature', 'urgent-call-escalation'); } }}
          >
            <div>
              <div className="icon-tile w-14 h-14 mb-5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight mb-2.5">Urgent Call Escalation</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Bridges callers directly to on-call staff whenever high-priority emergencies are detected.
              </p>
            </div>
            <div aria-label="Learn more about Urgent Call Escalation" className="w-full mt-6 pt-4 border-t border-blue-900/10 flex items-center justify-between text-sm font-medium text-blue-700 text-left">
              <span>Learn more</span>
              <span className="w-8 h-8 rounded-full bg-white/80 ring-1 ring-blue-900/10 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600"><ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45" /></span>
            </div>
          </div>

          {/* Service 5 */}
          <div
            className="tilt-card view-hover glass glass-hover !rounded-xl rounded-xl spotlight p-6 sm:p-7 group flex flex-col justify-between cursor-pointer"
            data-motion="feature-card"
            onClick={() => setActivePage('feature', 'multi-department-staff-calendars')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePage('feature', 'multi-department-staff-calendars'); } }}
          >
            <div>
              <div className="icon-tile w-14 h-14 mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight mb-2.5">Multi-Department Calendars</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Manages multi-staff schedules and rotating shifts, booking appointments on live availability.
              </p>
            </div>
            <div aria-label="Learn more about Multi-Department Calendars" className="w-full mt-6 pt-4 border-t border-blue-900/10 flex items-center justify-between text-sm font-medium text-blue-700 text-left">
              <span>Learn more</span>
              <span className="w-8 h-8 rounded-full bg-white/80 ring-1 ring-blue-900/10 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600"><ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45" /></span>
            </div>
          </div>

          {/* Service 6 */}
          <div
            className="tilt-card view-hover glass glass-hover !rounded-xl rounded-xl spotlight p-6 sm:p-7 group flex flex-col justify-between cursor-pointer"
            data-motion="feature-card"
            onClick={() => setActivePage('feature', 'natural-voice-intelligence')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePage('feature', 'natural-voice-intelligence'); } }}
          >
            <div>
              <div className="icon-tile w-14 h-14 mb-5">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-ink tracking-tight mb-2.5">Natural Voice Intelligence</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Responds with natural human warmth and sub-second voice latency.
              </p>
            </div>
            <div aria-label="Learn more about Natural Voice Intelligence" className="w-full mt-6 pt-4 border-t border-blue-900/10 flex items-center justify-between text-sm font-medium text-blue-700 text-left">
              <span>Learn more</span>
              <span className="w-8 h-8 rounded-full bg-white/80 ring-1 ring-blue-900/10 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600"><ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45" /></span>
            </div>
          </div>

        </div>

      </section>

      {/* ================= 7. INTERACTIVE MISSED-CALL ROI CALCULATOR ================= */}
      <section id="roi" className="section-y bloom relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full space-y-8">

            {/* Header: Above the calculator card */}
            <div className="max-w-4xl space-y-4 text-left" data-motion="roi-copy">
              <div className="eyebrow" data-anim="eyebrow">
                <span>— Business Growth & ROI —</span>
              </div>
              <div className='space-y-2'>
                <h2 className="section-title-clamp text-ink" data-anim="heading">
                  Calculate Your Lost Revenue from Missed Calls
                </h2>

                <p className="lead" data-anim="para">
                  Businesses miss up to 45% of peak-hour calls. See how much monthly revenue your business can recapture.
                </p>
              </div>
            </div>

            {/* Interactive Sliders & Live Results Dashboard (Side-by-Side) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch" data-anim="widget">

              {/* Left Column: Sliders Card (White Clean Card) */}
              <div
                className="bg-white/95 border border-slate-200/90 shadow-sm !rounded-xl rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 sm:space-y-7"
                data-motion="roi-sliders"
              >
                {/* Slider 1: Daily Calls */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-sm sm:text-15 font-medium text-ink">Average Inbound Calls / Day</label>
                    <span className="text-sm font-bold text-blue-600 font-mono bg-blue-50/90 px-3 py-1 rounded-lg border border-blue-200/80 shadow-xs">
                      {dailyCalls} calls
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={dailyCalls}
                    onChange={(e) => setDailyCalls(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 rounded-lg cursor-pointer appearance-none"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((dailyCalls - 20) / (200 - 20)) * 100}%, #e2e8f0 ${((dailyCalls - 20) / (200 - 20)) * 100}%, #e2e8f0 100%)`
                    }}
                  />
                  <div className="flex justify-between text-11 text-slate-400 mt-1.5 font-mono">
                    <span>20 calls</span>
                    <span>200 calls</span>
                  </div>
                </div>

                {/* Slider 2: Missed Call Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-sm sm:text-15 font-medium text-ink">Estimated Missed / Busy Rate (%)</label>
                    <span className="text-sm font-bold text-blue-600 font-mono bg-blue-50/90 px-3 py-1 rounded-lg border border-blue-200/80 shadow-xs">
                      {missedPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={missedPercent}
                    onChange={(e) => setMissedPercent(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 rounded-lg cursor-pointer appearance-none"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((missedPercent - 15) / (60 - 15)) * 100}%, #e2e8f0 ${((missedPercent - 15) / (60 - 15)) * 100}%, #e2e8f0 100%)`
                    }}
                  />
                  <div className="flex justify-between text-11 text-slate-400 mt-1.5 font-mono">
                    <span>15% (Standard Flow)</span>
                    <span>60% (Peak Call Rush)</span>
                  </div>
                </div>

                {/* Slider 3: Consultation Fee */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-sm sm:text-15 font-medium text-ink">Average Service Value / Booking Value (₹)</label>
                    <span className="text-sm font-bold text-slate-900 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                      ₹{consultFee}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="2000"
                    step="50"
                    value={consultFee}
                    onChange={(e) => setConsultFee(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 rounded-lg cursor-pointer appearance-none"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((consultFee - 300) / (2000 - 300)) * 100}%, #e2e8f0 ${((consultFee - 300) / (2000 - 300)) * 100}%, #e2e8f0 100%)`
                    }}
                  />
                  <div className="flex justify-between text-11 text-slate-400 mt-1.5 font-mono">
                    <span>₹ 300</span>
                    <span>₹ 2,000</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dark Luxury Results Card */}
              <div
                className="panel-ink !rounded-xl rounded-xl p-6 sm:p-7 text-white relative overflow-hidden flex flex-col justify-between space-y-5"
                data-motion="roi-result"
              >
                {/* Header: Centered uppercase label */}
                <div className="text-center">
                  <span className="text-11 sm:text-xs uppercase font-semibold tracking-wider text-slate-400 block font-mono">
                    Estimated Monthly Recovered Revenue
                  </span>
                </div>

                {/* Hero Revenue Display */}
                <div className="flex flex-col items-center justify-center my-1 sm:my-2">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                    {/* Glowing Rising Bar Chart Icon */}
                    <div className="flex items-center text-cyan-400/80 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] shrink-0">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 36 36" fill="none">
                        <rect x="4" y="20" width="5" height="12" rx="1.5" fill="currentColor" opacity="0.45" />
                        <rect x="13" y="14" width="5" height="18" rx="1.5" fill="currentColor" opacity="0.65" />
                        <rect x="22" y="8" width="5" height="24" rx="1.5" fill="currentColor" opacity="0.85" />
                        <path d="M4 17L14 9L21 14L31 4M31 4H23M31 4V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Main Amount */}
                    <div className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white tracking-tight leading-none drop-shadow-[0_0_24px_rgba(56,189,248,0.35)] flex items-center">
                      <span className="text-cyan-400 mr-2 font-display">₹</span>
                      <AnimatedNumber value={recoveredRevenue} format={(n) => n.toLocaleString('en-IN')} />
                    </div>

                    {/* Slash + Audio Waveform */}
                    <div className="flex items-center gap-2 sm:gap-2.5 text-cyan-400/80 shrink-0">
                      <span className="text-xl sm:text-2xl text-slate-500 font-light select-none">/</span>
                      <div className="flex items-center gap-[3px] h-7 px-0.5">
                        {[4, 8, 14, 22, 16, 26, 18, 12, 6].map((h, i) => (
                          <span
                            key={i}
                            className="w-[2.5px] rounded-full bg-cyan-400/80 shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-normal text-slate-400 block mt-2 text-center">
                    per month recovered
                  </span>
                </div>

                {/* Middle Breakdown: 2 Cards Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Monthly Missed Calls */}
                  <div className="p-3.5 rounded-xl panel-ink-well flex items-center gap-3 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-blue-950/70 border border-blue-700/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400 block text-11 leading-tight">Monthly Missed Calls:</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <strong className="text-white font-mono text-sm sm:text-base font-bold">
                          <AnimatedNumber value={monthlyMissedCalls} /> calls
                        </strong>
                        <span className="text-emerald-400 font-mono text-11 font-medium">
                          (↗ {missedPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Customers Converted via AI */}
                  <div className="p-3.5 rounded-xl panel-ink-well flex flex-col justify-center border border-white/5">
                    <span className="text-slate-400 block text-11 leading-tight">Customers Converted via AI</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <strong className="text-white font-mono text-sm sm:text-base font-bold">
                        <AnimatedNumber value={recoveredCustomers} /> customers
                      </strong>
                      <span className="text-emerald-400 text-11 font-medium flex items-center gap-0.5">
                        (✓ verified)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Breakdown: Projected Annual Revenue with Flowing Wave Chart */}
                <div className="rounded-xl panel-ink-well p-3.5 sm:p-4 flex items-center justify-between relative overflow-hidden border border-white/5">
                  <div className="min-w-0 z-10">
                    <span className="text-slate-400 block text-11 leading-tight">Projected Annual Revenue:</span>
                    <strong className="text-white font-mono text-lg sm:text-xl font-bold block mt-0.5">
                      ₹<AnimatedNumber value={recoveredRevenue * 12} format={(n) => n.toLocaleString('en-IN')} />
                    </strong>
                  </div>

                  {/* Flowing Wave Chart with Sparkle */}
                  <div className="relative w-36 sm:w-48 h-12 flex items-center justify-end z-10">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 180 48" fill="none">
                      <defs>
                        <linearGradient id="roiAnnualWaveGrad" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 36 Q30 42 60 30 T120 14 T160 26 T180 10 L180 48 L0 48 Z"
                        fill="url(#roiAnnualWaveGrad)"
                      />
                      <path
                        d="M0 36 Q30 42 60 30 T120 14 T160 26 T180 10"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line x1="120" y1="14" x2="120" y2="48" stroke="#38bdf8" strokeOpacity="0.3" strokeDasharray="2 2" />
                      <circle cx="120" cy="14" r="3.5" fill="#38bdf8" className="drop-shadow-[0_0_6px_#38bdf8]" />
                      <circle cx="120" cy="14" r="7" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1" />
                    </svg>
                    <div className="absolute right-0 bottom-0 text-cyan-300/40 pointer-events-none">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" opacity="0.35" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================= 8. CLIENT & BUSINESS TESTIMONIALS ================= */}
      <section className="section-y overflow-hidden" data-motion="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl space-y-4 mb-10 sm:mb-14 text-left" data-motion="testimonials-head">
            <div className="eyebrow" data-anim="eyebrow">
              <span>— Client & Business Feedback —</span>
            </div>
            <div className='space-y-2'>
              <h2 className="section-title-clamp text-ink" data-anim="heading">
                Trusted by Business Leaders Across India
              </h2>
              <p className="lead">
                Trusted by founders, practice directors, and operations leaders across India.
              </p>
            </div>
          </div>

          {/* Infinite Continuous Left-to-Right Sliding Testimonials Carousel */}
          <div className="w-full overflow-hidden py-6 select-none mask-fade-x" data-marquee-viewport>
            <div className="flex gap-6 w-max animate-marquee-left-to-right">
              {[
                {
                  initials: 'AS',
                  name: 'Ananya Sharma',
                  company: 'Care & Wellness Studio, Gurugram',
                  text: '"Since deploying FrontDesk AI, we haven\'t missed a single customer call even during our busiest walk-in hours."'
                },
                {
                  initials: 'RS',
                  name: 'Rajesh Sharma',
                  company: 'Sharma & Associates, New Delhi',
                  text: '"Callers feel they are speaking with our front office team. Instant WhatsApp confirmations arrive within seconds."'
                },
                {
                  initials: 'SK',
                  name: 'Sameer Kapoor',
                  company: 'Apex Advisory Group, Greater Noida',
                  text: '"Urgent caller requests transfer straight to my line with zero delay. Truly reliable and enterprise grade."'
                },
                {
                  initials: 'PM',
                  name: 'Priya Mehta',
                  company: 'Mehta Learning & Consultancy, Noida',
                  text: '"Handles high-volume seasonal appointment inquiries seamlessly with zero scheduling conflicts."'
                },
                {
                  initials: 'VR',
                  name: 'Vikramaditya Rao',
                  company: 'Rao Logistics & Commercial Hub, Bengaluru',
                  text: '"We recovered over 40% of missed after-hours inquiries in our first month with automated WhatsApp follow-ups."'
                },
                {
                  initials: 'AS',
                  name: 'Ananya Sharma',
                  company: 'Care & Wellness Studio, Gurugram',
                  text: '"Since deploying FrontDesk AI, we haven\'t missed a single customer call even during our busiest walk-in hours."'
                },
                {
                  initials: 'RS',
                  name: 'Rajesh Sharma',
                  company: 'Sharma & Associates, New Delhi',
                  text: '"Callers feel they are speaking with our front office team. Instant WhatsApp confirmations arrive within seconds."'
                },
                {
                  initials: 'SK',
                  name: 'Sameer Kapoor',
                  company: 'Apex Advisory Group, Greater Noida',
                  text: '"Urgent caller requests transfer straight to my line with zero delay. Truly reliable and enterprise grade."'
                },
                {
                  initials: 'PM',
                  name: 'Priya Mehta',
                  company: 'Mehta Learning & Consultancy, Noida',
                  text: '"Handles high-volume seasonal appointment inquiries seamlessly with zero scheduling conflicts."'
                },
                {
                  initials: 'VR',
                  name: 'Vikramaditya Rao',
                  company: 'Rao Logistics & Commercial Hub, Bengaluru',
                  text: '"We recovered over 40% of missed after-hours inquiries in our first month with automated WhatsApp follow-ups."'
                }
              ].map((t, idx) => (
                <div
                  key={idx}
                  className="w-[280px] xs:w-[320px] sm:w-[400px] shrink-0 tilt-card view-hover glass glass-hover !rounded-xl rounded-xl p-6 sm:p-8 flex flex-col gap-5"
                >
                  <div className="flex items-center gap-1 text-amber-500 text-sm" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} aria-hidden="true">★</span>
                    ))}
                  </div>
                  <p className="font-display text-15-68 sm:text-lg text-ink leading-snug tracking-tight">
                    {t.text}
                  </p>
                  <div className="mt-auto pt-5 border-t border-blue-900/10 flex items-center gap-3">
                    <div className="w-11 h-11 icon-tile !rounded-full text-sm font-semibold">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink">{t.name}</h4>
                      <p className="text-xs text-ink-muted">{t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 9. FAQ ACCORDION ================= */}
      <section className="section-y bloom" data-motion="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full space-y-8 text-left">

            {/* Left-aligned Header & Accordion List */}
            <div className="space-y-4" data-motion="faq-head">
              <div className="eyebrow" data-anim="eyebrow">
                <span>— Common Questions —</span>
              </div>
              <div className='space-y-2'>
                <h2 className="section-title-clamp text-ink" data-anim="heading">
                  Frequently Asked Questions
                </h2>
                <p className="lead max-w-2xl">
                  Quick answers about setup, call forwarding, and WhatsApp integration.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  data-anim="faq-item"
                  className="glass glass-hover !rounded-xl rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full text-left px-4 sm:px-4 py-3 flex items-center justify-between font-display text-15-68 sm:text-lg font-medium tracking-tight text-ink hover:text-blue-700 transition-colors gap-4"
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${openFaq === idx ? 'btn-brand' : 'bg-white/80 ring-1 ring-blue-900/10 text-ink-muted'}`}><ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} /></span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 sm:px-6 pb-6 text-sm sm:text-15-2 text-ink-soft leading-relaxed border-t border-blue-900/10 pt-4 animate-slide-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ================= 11. FINAL CTA BAND (GLASS BAND + LIVE STATUS CONSOLE) ================= */}
      <section data-motion="cta" className="section-y max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-motion="cta-band"
          className="glass !rounded-xl rounded-xl p-5 sm:p-7 lg:p-8 relative overflow-hidden"
        >
          {/* Subtle Background Glows */}
          <div className="absolute -top-32 -right-24 w-96 h-96 bg-cyan-200/50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Left Column: Heading, Subtitle & Actions (~60%) */}
            <div className="lg:col-span-7 space-y-6 text-left" data-motion="cta-copy">
              <div className="eyebrow" data-anim="eyebrow">
                <span>— Get Started in 15 Minutes —</span>
              </div>
              <h2 className="section-title-clamp text-ink" data-anim="cta-heading">
                Ready to automate your front desk in 15 minutes?
              </h2>
              <p className="lead max-w-xl" data-anim="para">
                Test call forwarding with your existing business number today. Zero hardware or SIM cards required.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-13 text-ink-soft pt-1" data-anim="badge-group">
                <div className="flex items-center gap-1.5 glass-pill px-3 py-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                  <span>Zero Hardware Needed</span>
                </div>
                <div className="flex items-center gap-1.5 glass-pill px-3 py-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                  <span>Works with Existing Number</span>
                </div>
                <div className="flex items-center gap-1.5 glass-pill px-3 py-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                  <span>Meta WhatsApp Cloud Integration</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" data-anim="cta-actions">
                <button
                  onClick={() => setActivePage('support')}
                  className="pill has-chip btn-brand magnetic active:scale-[0.98]"
                >
                  <span className="bf">
                    <span className="l1">Start Free Business Trial</span>
                  </span>
                  <span className="btn-chip" aria-hidden="true"><ArrowRight /></span>
                </button>
                <button
                  onClick={() => setActivePage('about')}
                  className="pill btn-glass magnetic active:scale-[0.98]"
                >
                  <span className="bf">
                    <span className="l1">Learn About Our Mission</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Readiness Visual Console (~40%) */}
            <div className="lg:col-span-5">
              <div className="tsx-console p-5 sm:p-6 !rounded-xl rounded-xl panel-ink space-y-4 text-left" data-anim="cta-console">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 pb-3">
                  <span className="tsx-title text-white uppercase">Telephony Status</span>
                  <span className="tsx-ready">
                    Live System Ready
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="tsx-row">
                    <span className="text-slate-300 min-w-0">GSM Divert Handshake:</span>
                    <span className="tsx-sine" aria-hidden="true"><svg viewBox="0 0 120 16" preserveAspectRatio="none"><path d="M0 8 Q7.5 1 15 8 T30 8 T45 8 T60 8 T75 8 T90 8 T105 8 T120 8" /></svg></span>
                    <strong className="text-emerald-400 font-mono shrink-0">Active &lt; 15ms</strong>
                    <span className="tsx-dot" aria-hidden="true"></span>
                  </div>
                  <div className="tsx-row">
                    <span className="text-slate-300 min-w-0">Team Calendar Sync:</span>
                    <span className="tsx-sine tsx-sine--blue" aria-hidden="true"><svg viewBox="0 0 120 16" preserveAspectRatio="none"><path d="M0 8 Q7.5 1 15 8 T30 8 T45 8 T60 8 T75 8 T90 8 T105 8 T120 8" /></svg></span>
                    <strong className="text-sky-400 font-mono shrink-0">Atomic Locked</strong>
                    <span className="tsx-spin" aria-hidden="true"></span>
                  </div>
                  <div className="tsx-row">
                    <span className="text-slate-300 min-w-0">Meta WhatsApp API:</span>
                    <span className="tsx-bars" aria-hidden="true">
                      {[0.3, 0.6, 0.4, 0.9, 0.5, 1, 0.45, 0.75, 0.35, 0.6, 0.3].map((h, i) => <i key={i} style={{ '--h': h, '--d': `${-i * 0.13}s` }} />)}
                    </span>
                    <strong className="text-emerald-400 font-mono shrink-0">Dispatched</strong>
                  </div>
                  <div className="tsx-row">
                    <span className="text-slate-300 min-w-0">Average Setup Time:</span>
                    <span className="flex-1" aria-hidden="true"></span>
                    <strong className="text-white font-mono shrink-0">15 Minutes</strong>
                  </div>
                </div>

                <div className="tsx-voice" aria-hidden="true">
                  <span className="tsx-eq" />
                  <span className="tsx-voice-bars">
                    {[0.15, 0.2, 0.3, 0.25, 0.4, 0.35, 0.55, 0.45, 0.7, 0.6, 0.85, 0.7, 1, 0.8, 0.95, 0.75, 1, 0.8, 0.9, 0.65, 0.75, 0.55, 0.6, 0.4, 0.45, 0.3, 0.35, 0.22, 0.25, 0.15].map((h, i) => (
                      <i key={i} style={{ '--h': h, '--d': `${-((i * 0.137) % 1.4)}s` }} />
                    ))}
                  </span>
                  <span className="tsx-eq" />
                </div>

                <div className="text-center">
                  <span className="text-11 text-slate-300">
                    Ready to route calls for your business today
                  </span>
                </div>
                <span className="tsx-spark" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
