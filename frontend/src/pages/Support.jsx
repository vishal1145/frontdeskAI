import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  PhoneForwarded,
  MessageSquare,
  Mail,
  PhoneCall,
  CheckCircle2,
  Send,
  Activity,
  Copy,
  ExternalLink,
  Clock,
  Check,
  AlertCircle,
  X,
  Radio,
  Zap,
  ArrowRight
} from 'lucide-react';
import { colors } from '../../design-tokens.js';

export default function Support({ setActivePage }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    clinicName: '',
    doctorName: '',
    phone: '',
    email: '',
    inquiryType: 'demo',
    message: ''
  });

  // Auto-dismiss top-right toaster after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleChange = (field, value) => {
    const finalValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clinicName.trim()) {
      newErrors.clinicName = 'Business / Company Name is required.';
    } else if (formData.clinicName.trim().length < 2) {
      newErrors.clinicName = 'Business name must be at least 2 characters.';
    }

    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Contact Person Name is required.';
    } else if (formData.doctorName.trim().length < 2) {
      newErrors.doctorName = 'Name must be at least 2 characters.';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'WhatsApp active phone number is required.';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    if (formData.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    const errorKeys = Object.keys(validationErrors);

    if (errorKeys.length > 0) {
      const firstError = validationErrors[errorKeys[0]];
      setToast({
        type: 'error',
        title: 'Please Check Form Details',
        message: firstError || 'Please fill in all required fields marked with *.'
      });
      return;
    }

    setFormSubmitted(true);
    setToast({
      type: 'success',
      title: 'Request Submitted Successfully!',
      message: `Thank you, ${formData.doctorName}. An onboarding specialist will call you at ${formData.phone} within 30 minutes.`
    });
  };

  const carrierGuides = [
    {
      carrier: 'Reliance Jio',
      busyCode: '*404*<VIRTUAL_NUMBER>#',
      noAnswerCode: '*403*<VIRTUAL_NUMBER>#',
      cancelCode: '*413#',
      instructions: 'Dial directly from business SIM or office phone. *404 forwards when busy, *403 forwards when unanswered.',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      carrier: 'Bharti Airtel',
      busyCode: '*67*<VIRTUAL_NUMBER>#',
      noAnswerCode: '*61*<VIRTUAL_NUMBER>#',
      cancelCode: '##002#',
      instructions: 'Standard GSM code. Forwards after 15 seconds if front desk does not pick up.',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200'
    },
    {
      carrier: 'Vodafone Idea (Vi)',
      busyCode: '*67*<VIRTUAL_NUMBER>#',
      noAnswerCode: '*61*<VIRTUAL_NUMBER>#',
      cancelCode: '##002#',
      instructions: 'Enable conditional forwarding so only unanswered calls route to AI.',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      carrier: 'Exotel / Tata Tele EPABX',
      busyCode: 'SIP Forward URI',
      noAnswerCode: 'Ring timeout: 15s',
      cancelCode: 'Admin Portal',
      instructions: 'In your Exotel Flow, add a Passthru or Call applet routing to FrontDesk AI SIP URI.',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    }
  ];

  return (
    <div className="support-page w-full pt-8 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 sm:space-y-24 relative">

      {/* Top-Right Toaster Notification */}
      {toast && (
        <div
          className="fixed top-4 inset-x-3 sm:inset-x-auto sm:top-6 sm:right-6 z-[99999] sm:max-w-sm w-auto sm:w-full animate-toast shadow-2xl rounded-2xl overflow-hidden border transition-all duration-300"
          style={{
            backgroundColor: toast.type === 'error' ? colors.tint.rose[2] : colors.tint.green[1],
            borderColor: toast.type === 'error' ? colors.tint.rose[3] : colors.tint.green[4]
          }}
        >
          <div className="p-4 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'error'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
              }`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 font-bold" />
              ) : (
                <CheckCircle2 className="w-4 h-4 font-bold" />
              )}
            </div>

            <div className="flex-1 pt-0.5">
              <h4 className={`text-xs font-bold ${toast.type === 'error' ? 'text-rose-900' : 'text-emerald-900'
                }`}>
                {toast.title}
              </h4>
              <p className={`text-11 mt-0.5 leading-relaxed ${toast.type === 'error' ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-left max-w-4xl space-y-4" data-fade>
        <div className="eyebrow">
          <span>— 24/7 Business Support &amp; Onboarding Desk —</span>
        </div>
        <div className="space-y-2">
          <h1 className="hero-title-clamp text-ink">
            How Can We Help Your Business Today?
          </h1>

          <p className="lead">
            From carrier call forwarding setup to custom team roster configuration, our voice telephony team is available 24/7.
          </p>
        </div>
      </div>

      {/* Grid: Contact Form & Telephony Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start" data-fade>

        {/* Contact / Demo Form */}
        <div className="lg:col-span-7 glass-solid !rounded-xl rounded-xl p-5 sm:p-8 md:p-10 space-y-7">
          <div>
            <h2 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight mb-2">
              Book a Demo or Request Setup
            </h2>
            <p className="text-sm text-ink-muted">
              Fill in your business details and an onboarding specialist will call you back within 30 minutes.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 sm:p-8 glass !rounded-xl rounded-xl text-center space-y-4 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="text-2xl font-medium tracking-tight text-ink">Inquiry Received Successfully!</h3>
              <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                Thank you, {formData.doctorName || formData.clinicName}. Our onboarding specialist will call you at <strong className="text-ink">{formData.phone || 'your phone number'}</strong> to setup your virtual forwarding test.
              </p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setFormData({
                    clinicName: '',
                    doctorName: '',
                    phone: '',
                    email: '',
                    inquiryType: 'demo',
                    message: ''
                  });
                  setErrors({});
                }}
                className="pill btn-brand mt-2 active:scale-[0.98]"
              >
                <span>Submit Another Request</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-13 font-medium text-ink mb-2">
                    Business / Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Solutions or Care Studio"
                    value={formData.clinicName}
                    onChange={(e) => handleChange('clinicName', e.target.value)}
                    className={`field ${errors.clinicName ? 'field-error' : ''}`}
                    aria-invalid={errors.clinicName ? 'true' : undefined}
                  />
                  {errors.clinicName && (
                    <span className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.clinicName}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-13 font-medium text-ink mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.doctorName}
                    onChange={(e) => handleChange('doctorName', e.target.value)}
                    className={`field ${errors.doctorName ? 'field-error' : ''}`}
                    aria-invalid={errors.doctorName ? 'true' : undefined}
                  />
                  {errors.doctorName && (
                    <span className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.doctorName}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-13 font-medium text-ink mb-2">
                    Phone Number (WhatsApp Active) *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`field ${errors.phone ? 'field-error' : ''}`}
                    aria-invalid={errors.phone ? 'true' : undefined}
                  />
                  {errors.phone && (
                    <span className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.phone}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-13 font-medium text-ink mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="hello@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`field ${errors.email ? 'field-error' : ''}`}
                    aria-invalid={errors.email ? 'true' : undefined}
                  />
                  {errors.email && (
                    <span className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-13 font-medium text-ink mb-2">
                  Reason for Inquiry
                </label>
                <select
                  value={formData.inquiryType}
                  onChange={(e) => handleChange('inquiryType', e.target.value)}
                  className="field"
                >
                  <option value="demo">Book a Live AI Call Demo</option>
                  <option value="forwarding">Need Help with Call Forwarding Setup</option>
                  <option value="custom">Multi-Department Team / Custom Staff Calendar</option>
                  <option value="billing">Pricing & Enterprise Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-13 font-medium text-ink mb-2">
                  Message / Business Requirements
                </label>
                <textarea
                  rows="3"
                  placeholder="Tell us about your business hours, daily call volume, or specific requirements..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="field resize-y"
                ></textarea>
              </div>

              <button
                type="submit"
                className="pill has-chip btn-brand w-full !min-h-[3.25rem] active:scale-[0.99]"
              >
                <span>Submit Request to Solutions Desk</span>
                <span className="btn-chip" aria-hidden="true"><Send /></span>
              </button>
            </form>
          )}

        </div>

        {/* Right Info & Live Systems Status */}
        <div className="lg:col-span-5 space-y-5">

          {/* Direct WhatsApp Callout */}
          <div className="glass glass-hover !rounded-xl rounded-xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-ink font-semibold text-base">
              <span className="w-9 h-9 icon-tile !rounded-xl !text-emerald-600"><MessageSquare className="w-4 h-4" /></span>
              <span>Instant WhatsApp Priority Support</span>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              Founders &amp; operations managers get dedicated WhatsApp helpline support with an average response time of under 4 minutes.
            </p>
            <a
              href="https://wa.me/919811111111?text=Hello%20FrontDesk%20AI%20Team%2C%20I%20want%20to%20test%20call%20forwarding%20for%20my%20business"
              target="_blank"
              rel="noreferrer"
              className="pill has-chip w-full sm:w-auto text-white bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[inset_0_1px_0_theme(colors.white_/_0.3),0_14px_30px_-12px_theme(colors.tint.green.8_/_0.55)] active:scale-[0.98]"
            >
              <span>Chat with Telephony Engineer</span>
              <span className="btn-chip bg-white/20 ring-1 ring-white/35" aria-hidden="true"><ExternalLink /></span>
            </a>
          </div>

          {/* Live Telephony Health Dashboard */}
          <div className="glass glass-hover !rounded-xl rounded-xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/10 pb-3 gap-2">
              <span className="text-sm font-semibold text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
                <span>Live System Status</span>
              </span>
              <span className="text-10 font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold shrink-0">
                100% OPERATIONAL
              </span>
            </div>

            <div className="space-y-3 text-13">
              <div className="flex justify-between items-center text-ink-soft gap-2">
                <span>LiveKit Voice Gateway:</span>
                <span className="text-blue-700 font-mono font-semibold shrink-0">99.98% Uptime</span>
              </div>
              <div className="flex justify-between items-center text-ink-soft gap-2">
                <span>Gemini 2.5 Reasoning API:</span>
                <span className="text-blue-700 font-mono font-semibold shrink-0">Operational (&lt;800ms)</span>
              </div>
              <div className="flex justify-between items-center text-ink-soft gap-2">
                <span>WhatsApp Cloud API:</span>
                <span className="text-blue-700 font-mono font-semibold shrink-0">Operational</span>
              </div>
              <div className="flex justify-between items-center text-ink-soft gap-2">
                <span>Concurrency Locks:</span>
                <span className="text-blue-700 font-mono font-semibold shrink-0">Active</span>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="glass !rounded-xl rounded-xl p-5 sm:p-7 text-13 text-ink-soft space-y-2">
            <div className="flex items-center gap-2 text-ink font-semibold text-base pb-1">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Support Desk Working Hours</span>
            </div>
            <p><strong>Technical Telephony Support:</strong> 24/7/365</p>
            <p><strong>Business Consultations:</strong> Mon – Sat (9:00 AM – 9:00 PM IST)</p>
            <p className="break-all"><strong>Email:</strong> support@frontdesk-ai.in</p>
          </div>

        </div>

      </div>

      {/* ================= CARRIER CALL FORWARDING REFERENCE ================= */}
      <div className="space-y-10 sm:space-y-12" data-fade>
        <div className="text-left max-w-4xl space-y-4">
          <div className="glass-pill inline-flex items-center gap-1.5 text-11 sm:text-xs text-blue-800 px-3.5 py-1.5 font-mono font-semibold uppercase tracking-wider">
            — <PhoneForwarded className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Business Telephony Quick Codes —</span>
          </div>
          <div className="space-y-2">
          <h2 className="section-title-clamp text-ink">
            Quick Carrier Forwarding Dial Codes
          </h2>
          <p className="lead">
            Dial these standard carrier USSD codes from your office phone to automatically forward busy or unanswered calls to FrontDesk AI.
          </p>
        </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {carrierGuides.map((guide, idx) => (
            <div key={idx} className="glass glass-hover card-hover-lift !rounded-xl rounded-xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-ink text-lg tracking-tight">{guide.carrier}</span>
                  <span className={`text-10 font-mono px-2 py-0.5 rounded border font-semibold ${guide.badgeColor}`}>
                    GSM
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-ink-muted text-11 font-medium">Forward When Busy:</div>
                  <div className="flex items-center justify-between glass-well !rounded-xl rounded-xl p-2.5 font-mono text-blue-700 text-11 gap-1">
                    <span className="break-all">{guide.busyCode}</span>
                    <button
                      onClick={() => handleCopy(guide.busyCode)}
                      className="text-ink-muted hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                      title="Copy code"
                      aria-label="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-ink-muted text-11 font-medium">Forward When Unanswered:</div>
                  <div className="flex items-center justify-between glass-well !rounded-xl rounded-xl p-2.5 font-mono text-sky-700 text-11 gap-1">
                    <span className="break-all">{guide.noAnswerCode}</span>
                    <button
                      onClick={() => handleCopy(guide.noAnswerCode)}
                      className="text-ink-muted hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                      title="Copy code"
                      aria-label="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-ink-muted text-11 font-medium">Cancel / Disable:</div>
                  <div className="glass-well !rounded-xl rounded-xl p-2.5 font-mono text-slate-500 text-11 break-all">
                    {guide.cancelCode}
                  </div>
                </div>
              </div>

              <p className="text-xs text-ink-muted leading-relaxed pt-3 border-t border-blue-900/10">
                {guide.instructions}
              </p>
            </div>
          ))}
        </div>

        {copiedCode && (
          <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 px-4 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-xl z-50 flex items-center justify-center gap-2 animate-slide-up max-w-fit mx-auto sm:mx-0">
            <Check className="w-4 h-4 shrink-0" />
            <span>Copied: {copiedCode}</span>
          </div>
        )}
      </div>

    </div>
  );
}
