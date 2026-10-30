import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  EyeOff, 
  Server, 
  FileText, 
  CheckCircle, 
  ArrowLeft,
  PhoneCall,
  Cpu,
  MessageSquare,
  Database,
  Mail,
  Shield,
  Clock
} from 'lucide-react';

export default function Privacy({ setActivePage }) {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth'
      });
    }
  };

  const sections = [
    { id: 'overview', title: '1. Overview & Data Confidentiality' },
    { id: 'collected-data', title: '2. Information Collected During Calls' },
    { id: 'dpdp-act', title: '3. Purpose Limitation & Zero Training' },
    { id: 'encryption', title: '4. Data Encryption & Security' },
    { id: 'processors', title: '5. Authorized Service Processors' },
    { id: 'rights', title: '6. Data Retention & Customer Rights' },
  ];

  return (
    <div className="w-full pt-10 sm:pt-16 lg:pt-20 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      
      {/* Top Header & Trust Status */}
      <div className="border-b border-blue-900/10 pb-8 sm:pb-12" data-fade>
        <div className="space-y-5 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Customer Data Protection &amp; Trust</span>
          </div>
          <h1 className="hero-title-clamp text-ink">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-[0.95rem] text-ink-muted leading-relaxed">
            Last Updated: October 2026 • Compliant with Indian Digital Personal Data Protection (DPDP) Act 2023 &amp; Data Security Guidelines
          </p>
        </div>
      </div>

      {/* Mobile Horizontal Quick Navigation Pills (Zero Screen Overlap) */}
      <div className="lg:hidden w-full space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted flex items-center gap-1.5 px-1">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Jump:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar select-none">
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'btn-brand shadow-sm scale-[1.02]'
                    : 'glass text-ink-soft hover:text-ink active:scale-[0.98]'
                }`}
              >
                {sec.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Sticky Table of Contents & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Left Sticky Table of Contents on Desktop */}
        <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
          <div className="glass p-4 space-y-2">
            <div className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Table of Contents</span>
            </div>
            <nav className="space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center justify-between ${
                    activeSection === sec.id
                      ? 'btn-brand'
                      : 'text-ink-soft hover:text-ink hover:bg-white/80'
                  }`}
                >
                  <span>{sec.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="glass p-5 text-[13px] text-ink-soft space-y-2">
            <div className="font-bold text-blue-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Data Protection Officer</span>
            </div>
            <p className="text-ink-soft leading-relaxed">
              Have questions regarding caller voice data or business retention logs? Reach our compliance desk:
            </p>
            <a 
              href="mailto:privacy@frontdesk-ai.in"
              className="inline-flex items-center gap-1.5 text-blue-700 font-semibold hover:underline pt-1 break-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>privacy@frontdesk-ai.in</span>
            </a>
          </div>
        </div>

        {/* Right Content Column */}
        <div className="lg:col-span-8 space-y-5 text-[0.95rem] sm:text-base text-ink-soft leading-relaxed font-normal prose-legal">
          
          {/* Section 1 */}
          <section id="overview" className="space-y-4 scroll-mt-28 glass-solid p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>1. Overview &amp; Data Confidentiality</span>
            </h2>
            <div className="space-y-3 text-ink-soft">
              <p>
                FrontDesk AI Technologies ("we", "our", or "FrontDesk AI") operates an artificial intelligence-driven inbound telephony and automated front desk receptionist platform for businesses, professional practices, and service enterprises ("Subscribers"). 
              </p>
              <p>
                We recognize the utmost sensitivity of customer communication and business interactions. This Privacy Policy details how voice audio, transcripts, caller telephone numbers, and booking details are collected, processed, encrypted, and retained.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="collected-data" className="space-y-4 scroll-mt-28 glass-solid p-6 sm:p-8 md:p-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0 font-bold text-xs">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink">
                2. Information Collected During Phone Calls
              </h2>
            </div>
            
            <p className="text-ink-soft">
              When a customer dials a registered business phone number or when a call is forwarded to FrontDesk AI, we collect only data strictly necessary to fulfill appointment scheduling and inquiry handling:
            </p>
            
            <div className="grid grid-cols-1 gap-3 pt-1">
              <div className="glass-well p-4 sm:p-5">
                <strong className="text-ink font-semibold block text-sm sm:text-[0.95rem] mb-1">
                  Caller Phone Number:
                </strong>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Captured via telephony Caller ID (CLI) and SIP headers to verify customer contact records and send WhatsApp booking confirmation slips.
                </p>
              </div>

              <div className="glass-well p-4 sm:p-5">
                <strong className="text-ink font-semibold block text-sm sm:text-[0.95rem] mb-1">
                  Audio Stream &amp; Live Voice:
                </strong>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Processed in real-time for speech-to-text conversion. Raw audio streams are not permanently stored unless specifically requested by the business for quality audit compliance.
                </p>
              </div>

              <div className="glass-well p-4 sm:p-5">
                <strong className="text-ink font-semibold block text-sm sm:text-[0.95rem] mb-1">
                  Call Transcripts:
                </strong>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Text logs generated to extract caller name, team member or service requested, appointment date, time, and inquiry type.
                </p>
              </div>

              <div className="glass-well p-4 sm:p-5">
                <strong className="text-ink font-semibold block text-sm sm:text-[0.95rem] mb-1">
                  Appointment Records:
                </strong>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Booking token ID, assigned representative, timestamp, and business location.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="dpdp-act" className="space-y-4 scroll-mt-28 glass-solid p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <span>3. Purpose Limitation &amp; Zero Training on Customer Data</span>
            </h2>
            
            <p>
              Under the provisions of the <strong className="text-ink font-semibold">Digital Personal Data Protection (DPDP) Act 2023</strong>:
            </p>
            
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 ring-1 ring-blue-200 space-y-2.5 text-sm sm:text-[0.95rem]">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero LLM Training Guarantee</span>
              </div>
              <p className="text-ink-soft leading-relaxed">
                Customer voice conversations, names, and business inquiries are <strong>NEVER used to train, retrain, or improve foundational public AI models</strong>. All inference is processed via zero-data-retention enterprise API endpoints.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="encryption" className="space-y-4 scroll-mt-28 glass-solid p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl !text-indigo-600 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <span>4. Data Encryption &amp; Storage Security</span>
            </h2>
            <p className="text-ink-soft leading-relaxed">
              All data in transit is encrypted using TLS 1.3 protocol. Appointment databases hosted on enterprise cloud infrastructure are encrypted at rest with AES-256 standard. Multi-tenant business data is strictly partitioned so Organization A cannot access records, customers, or logs of Organization B.
            </p>
          </section>

          {/* Section 5 */}
          <section id="processors" className="space-y-4 scroll-mt-28 glass-solid p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0 font-bold text-xs">
                5
              </div>
              <span>5. Authorized Service Processors</span>
            </h2>
            
            <p className="text-ink-soft">
              To deliver real-time voice receptionist services, we work with enterprise-grade infrastructure providers:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
              <div className="glass-well p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-[0.95rem]">
                  <PhoneCall className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Telephony Gateway</span>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Routes inbound telephony traffic, SIP diversion headers, and handles audio packets.
                </p>
              </div>

              <div className="glass-well p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-[0.95rem]">
                  <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Inference Engine</span>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Parses conversational intent, appointment dates, and function arguments under strict enterprise privacy agreements.
                </p>
              </div>

              <div className="glass-well p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-[0.95rem]">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Notification Gateway</span>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Transmits appointment slips, booking confirmation numbers, and location pins directly to caller WhatsApp.
                </p>
              </div>

              <div className="glass-well p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-[0.95rem]">
                  <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Database</span>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Stores business schedules, team working hours, and concurrency lock reservations in Indian/regional data centers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="rights" className="space-y-4 scroll-mt-28 glass-solid p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink flex items-center gap-3">
              <div className="w-10 h-10 icon-tile !rounded-xl shrink-0 font-bold text-xs">
                6
              </div>
              <span>6. Data Retention &amp; Customer Rights</span>
            </h2>
            <div className="space-y-3 text-ink-soft">
              <p>
                Customers and account administrators have the right to request access, correction, or deletion of their appointment data. Businesses can configure automated transcript purging (e.g., 30-day auto-expiry). 
              </p>
              <p>
                To exercise data rights or file a privacy inquiry, contact our Data Protection Officer at <a href="mailto:privacy@frontdesk-ai.in" className="text-blue-700 underline underline-offset-2 font-semibold hover:text-blue-800">privacy@frontdesk-ai.in</a>.
              </p>
            </div>
          </section>

          {/* Bottom Back Button */}
          <div className="pt-8 border-t border-blue-900/10 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
            <button
              onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="glass-pill inline-flex items-center justify-center gap-2 text-[13px] font-medium text-blue-700 hover:text-blue-800 px-4 py-2.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to FrontDesk AI Home</span>
            </button>
            <button
              onClick={() => { setActivePage('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="pill btn-brand !min-h-[2.75rem] !text-[13px] active:scale-[0.98]"
            >
              <span>View Terms of Service &rarr;</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
