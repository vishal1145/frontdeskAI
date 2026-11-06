import React, { useRef } from 'react';
import useFooterMotion from '../motion/useFooterMotion';
import BrandLogo from './BrandLogo';
import {
  PhoneCall,
  FileText,
  Lock,
  Mail,
  MapPin
} from 'lucide-react';

export default function Footer({ setActivePage }) {
  const footerRef = useRef(null);
  useFooterMotion(footerRef);

  const navigateTo = (pageId) => {
    setActivePage(pageId);
    window.scrollTo(0, 0);
  };

  const navigateToSection = (sectionId) => {
    setActivePage('home', sectionId);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer ref={footerRef} className="w-full max-w-7xl mx-auto relative text-ink-muted px-4 sm:px-6 lg:px-8 pb-16 pt-0">
      <div className="w-full glass-solid !rounded-xl rounded-xl px-5 sm:px-7 lg:px-8 pt-10 sm:pt-12 pb-8 sm:pb-10 relative overflow-hidden">
        {/* Soft cyan bloom in the card corner */}
        <div className="absolute -top-32 -right-24 w-96 h-72 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-9 sm:gap-10 lg:gap-12 relative">

          {/* Brand Info & Mission (Col 1-6) */}
          <div className="sm:col-span-2 lg:col-span-6 space-y-5">
            {/* Logo */}
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center cursor-pointer select-none inline-flex"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigateTo('home')}
              aria-label="FrontDesk AI Home"
            >
              <BrandLogo variant="footer" />
            </div>

            <p className="text-sm text-ink-soft max-w-sm sm:max-w-md leading-relaxed font-normal">
              The AI receptionist for modern businesses.
              <br className="hidden sm:inline" />
              Answers incoming calls naturally, manages schedules,
              <br className="hidden sm:inline" />
              and prevents missed customer bookings 24/7.
            </p>

            {/* Algofolks Company Contact Details */}
            {/* <div className="pt-1 space-y-2.5 text-sm text-ink-soft">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <a
                  href="mailto:hi@algofolks.com"
                  className="hover:text-blue-700 transition-colors text-ink-soft hover:underline"
                >
                  hi@algofolks.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <a
                  href="tel:+918860326476"
                  className="hover:text-blue-700 transition-colors text-ink-soft hover:underline"
                >
                  +91 8860326476
                </a>
              </div>
              <div className="flex items-start gap-2 pt-0.5 text-ink-muted">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-sm">
                  <strong className="text-ink font-semibold">Algofolks Private Limited,</strong><br />
                  A-406 T3, NX One Greater Noida
                </p>
              </div>
            </div> */}

            {/* Replaced Pills with Powered By text */}
            <p className="pt-2 text-xs text-ink-muted leading-relaxed">
              © 2026 Powered by Algofolks Private Limited. Noida, India.
            </p>
          </div>

          {/* Product & Flow Column (Col 7-9) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-wide-140 text-ink font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Product &amp; Flow
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => navigateToSection('simulator')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 text-left cursor-pointer"
                >
                  AI Voice Call Simulator
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToSection('features')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 text-left cursor-pointer"
                >
                  Slot Lock Concurrency
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToSection('telephony')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 text-left cursor-pointer"
                >
                  WhatsApp Notification Engine
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Column (Col 10-12) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-wide-140 text-ink font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Legal &amp; Privacy
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => navigateTo('privacy')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group text-left"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('terms')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1.5 group text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
                  <span>Terms &amp; Conditions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('terms')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 text-left text-ink-muted hover:text-amber-700"
                >
                  Urgent Requests Disclaimer
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('privacy')}
                  className="hover:text-blue-700 hover:translate-x-1 transition-all duration-200 text-left"
                >
                  Customer Data Privacy &amp; Redaction
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}
