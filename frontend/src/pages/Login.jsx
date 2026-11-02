import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PhoneIncoming, CalendarCheck, Check, ShieldCheck, ArrowRight, AlertCircle, Building2, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ setActivePage, onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedInput = phone.trim();
    const cleanDigits = trimmedInput.replace(/[^0-9]/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length !== 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      setError(msg);
      toast.error(msg);
      return;
    }
    const submitPhone = cleanDigits;

    if (!password.trim()) {
      const msg = 'Please enter your password.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: submitPhone, password: password.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || 'Invalid mobile number or password.';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      // 1. Super Admin Login
      if (data.role === 'superadmin' || data.token) {
        localStorage.setItem('frontdesk_admin_key', data.token || password.trim());
        const welcomeMsg = 'Welcome Super Admin!';
        setSuccess(welcomeMsg);
        toast.success(welcomeMsg);
        setTimeout(() => {
          setActivePage('admin');
        }, 500);
        return;
      }

      // 2. Regular Clinic Login
      const welcomeMsg = `Welcome back, ${data.clinic.clinic_name}!`;
      setSuccess(welcomeMsg);
      toast.success(welcomeMsg);
      
      // Store authenticated clinic in localStorage
      localStorage.setItem('clinic_auth', JSON.stringify(data.clinic));
      if (onLoginSuccess) {
        onLoginSuccess(data.clinic);
      }

      setTimeout(() => {
        setActivePage('portal');
      }, 700);

    } catch (err) {
      console.error('Login error:', err);
      const networkError = 'Unable to connect to the server. Please try again.';
      setError(networkError);
      toast.error(networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-4.25rem)] min-h-[calc(100dvh-4.25rem)] max-h-[calc(100dvh-4.25rem)] overflow-hidden text-ink font-sans" data-motion-scope="clinic">
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(40rem_30rem_at_10%_10%,theme(colors.tint.cyan.6_/_0.4),transparent_60%),radial-gradient(45rem_35rem_at_90%_90%,theme(colors.blue.200_/_0.45),transparent_60%)]" aria-hidden="true" />

      <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center py-2 sm:py-3">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] rounded-3xl bg-white/85 backdrop-blur-xl border border-slate-900/[0.09] shadow-[0_1px_3px_theme(colors.ink.DEFAULT_/_0.04),0_24px_60px_-20px_theme(colors.blue.800_/_0.28)] overflow-hidden">

        {/* ─── Right (desktop) / first (mobile): the login form ─── */}
        <section className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 order-2 lg:order-2">
          <div className="w-full max-w-[26rem] mx-auto">
            <div className="mb-5 sm:mb-6 flex flex-col items-center text-center">
              <div className="grid place-items-center w-12 h-12 rounded-2xl text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_0_0_4px_theme(colors.blue.500_/_0.15),0_10px_22px_-10px_theme(colors.blue.600_/_0.8)] mb-3" aria-hidden="true">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-ink leading-tight">
                Admin Login
              </h1>
              <div
                className="mt-2 text-xs leading-relaxed text-slate-500 max-w-[21rem] mx-auto"
                style={{ fontFamily: 'var(--fd-font-sans)' }}
              >
                Sign in with your registered mobile number and password to<br className="hidden sm:inline" /> access your business's call logs &amp; billing.
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="clinic-mobile" className="block text-xs font-semibold text-ink mb-1.5">
                  Registered Mobile Number
                </label>

                <div className={`relative rounded-xl border transition-all ${error ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-300/80 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15'}`}>
                  <div className="absolute inset-y-1.5 left-0 flex items-center px-3.5 border-r border-slate-200 text-sm font-semibold text-slate-700 pointer-events-none">
                    +91
                  </div>

                  <input
                    id="clinic-mobile"
                    type="tel"
                    maxLength={14}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9\s-]/g, '');
                      setPhone(val);
                      if (error) setError('');
                    }}
                    placeholder="98765 43210"
                    className="w-full h-12 pl-16 pr-4 rounded-xl text-sm font-medium text-ink placeholder:text-slate-400 focus:outline-none bg-white"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby="clinic-mobile-hint"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="clinic-password" className="block text-xs font-semibold text-ink mb-1.5">
                  Password
                </label>

                <div className={`relative rounded-xl border transition-all ${error && !password.trim() ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-300/80 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15'}`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>

                  <input
                    id="clinic-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your portal password"
                    className="w-full h-12 pl-10 pr-11 rounded-xl text-sm font-medium text-ink placeholder:text-slate-400 focus:outline-none bg-white"
                    aria-invalid={error ? 'true' : undefined}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs font-medium leading-relaxed" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message Alert */}
              {success && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs font-medium leading-relaxed" role="status">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{success} Loading dashboard...</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:translate-y-px transition-all shadow-[inset_0_1px_0_theme(colors.white_/_0.2),0_6px_16px_-8px_theme(colors.blue.600_/_0.6)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying in Database...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Admin Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ─── Left (desktop): brand panel ─── */}
        <aside className="relative isolate flex flex-col items-center justify-center gap-4 md:gap-set-1 p-8 sm:px-6 sm:py-9 md:py-set-2 text-center bg-gradient-to-br from-tint-blue-3 via-tint-blue-13 to-tint-blue-19 border-t md:border-t-0 md:border-r border-slate-900/[0.07] order-1 lg:order-1 before:content-[''] before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(theme(colors.blue.800_/_0.09)_1px,transparent_1.2px)] before:bg-[size:22px_22px] before:[mask-image:radial-gradient(ellipse_75%_70%_at_50%_42%,#000_35%,transparent_100%)]">
          {/* Decorative scene: patient calls flow into the clinic's reception desk and are verified */}
          <div className="cx-scene cx-enter" style={{ '--i': 1 }} aria-hidden="true">
            <svg className="cx-scene-links" viewBox="0 0 400 320" fill="none">
              <defs>
                <radialGradient id="cxSceneHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--fd-brand-vivid)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--fd-brand-vivid)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="cxSceneLink" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--fd-brand-vivid)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--fd-brand)" stopOpacity="0.55" />
                </linearGradient>
              </defs>

              <circle cx="268" cy="160" r="150" fill="url(#cxSceneHalo)" />
              <g className="cx-scene-rings">
                <circle cx="268" cy="160" r="128" stroke="var(--fd-brand-deep)" strokeOpacity="0.07" />
                <circle cx="268" cy="160" r="98" stroke="var(--fd-brand)" strokeOpacity="0.12" strokeDasharray="2 6" strokeLinecap="round" />
              </g>

              {/* patient → reception */}
              <path className="cx-scene-link" pathLength="1" d="M146 86 C 168 86, 170 122, 192 122" stroke="url(#cxSceneLink)" strokeWidth="1.75" strokeLinecap="round" />
              <path className="cx-scene-link cx-scene-link--2" pathLength="1" d="M146 228 C 168 228, 170 196, 192 196" stroke="url(#cxSceneLink)" strokeWidth="1.75" strokeLinecap="round" />
              <circle cx="146" cy="86" r="2.5" fill="var(--fd-brand-vivid)" />
              <circle cx="146" cy="228" r="2.5" fill="var(--fd-brand-vivid)" />

              {/* signal pulses (hidden for reduced motion) */}
              <g className="cx-scene-signal" opacity="0">
                <circle r="7" fill="var(--fd-brand-vivid)" opacity="0.18" />
                <circle r="3" fill="var(--fd-brand-vivid)" />
                <animateMotion begin="1.4s" dur="3.6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.45;1" calcMode="linear" path="M146 86 C 168 86, 170 122, 192 122" />
                <animate attributeName="opacity" begin="1.4s" dur="3.6s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.06;0.4;0.46;1" />
              </g>
              <g className="cx-scene-signal" opacity="0">
                <circle r="7" fill="var(--fd-brand-vivid)" opacity="0.18" />
                <circle r="3" fill="var(--fd-brand-vivid)" />
                <animateMotion begin="3.2s" dur="3.6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.45;1" calcMode="linear" path="M146 228 C 168 228, 170 196, 192 196" />
                <animate attributeName="opacity" begin="3.2s" dur="3.6s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.06;0.4;0.46;1" />
              </g>
            </svg>

            {/* reception dashboard (focal card) */}
            <div className="cx-scene-pos cx-scene-pos--desk">
              <div className="cx-scene-card cx-scene-desk">
                <div className="cx-scene-desk-head">
                  <span className="cx-scene-mark"><Building2 /></span>
                  <span className="cx-scene-lines">
                    <i style={{ width: '62%' }} />
                    <i className="is-soft" style={{ width: '40%' }} />
                  </span>
                  <span className="cx-scene-live" />
                </div>
                <div className="cx-scene-row is-active">
                  <span className="cx-scene-dot cx-scene-dot--blue"><PhoneIncoming /></span>
                  <span className="cx-scene-lines">
                    <i style={{ width: '70%' }} />
                    <i className="is-soft" style={{ width: '46%' }} />
                  </span>
                  <span className="cx-scene-wave cx-scene-wave--sm"><i /><i /><i /><i /></span>
                </div>
                <div className="cx-scene-row">
                  <span className="cx-scene-dot cx-scene-dot--green"><Check /></span>
                  <span className="cx-scene-lines">
                    <i style={{ width: '58%' }} />
                    <i className="is-soft" style={{ width: '38%' }} />
                  </span>
                  <span className="cx-scene-tag" />
                </div>
                <div className="cx-scene-row">
                  <span className="cx-scene-dot cx-scene-dot--green"><Check /></span>
                  <span className="cx-scene-lines">
                    <i style={{ width: '64%' }} />
                    <i className="is-soft" style={{ width: '30%' }} />
                  </span>
                  <span className="cx-scene-tag" />
                </div>
                <div className="cx-scene-bars">
                  <i style={{ height: '45%' }} /><i style={{ height: '70%' }} /><i style={{ height: '55%' }} />
                  <i style={{ height: '85%' }} /><i style={{ height: '60%' }} /><i style={{ height: '95%' }} />
                  <i className="is-today" style={{ height: '75%' }} />
                </div>
              </div>
            </div>

            {/* incoming call */}
            <div className="cx-scene-pos cx-scene-pos--call">
              <div className="cx-scene-card cx-scene-float cx-scene-chip">
                <span className="cx-scene-avatar"><PhoneIncoming /></span>
                <span className="cx-scene-chip-body">
                  <i className="cx-scene-line" style={{ width: '70%' }} />
                  <span className="cx-scene-wave"><i /><i /><i /><i /><i /><i /><i /></span>
                </span>
              </div>
            </div>

            {/* appointment booked */}
            <div className="cx-scene-pos cx-scene-pos--booked">
              <div className="cx-scene-card cx-scene-float cx-scene-float--slow cx-scene-chip">
                <span className="cx-scene-avatar cx-scene-avatar--soft"><CalendarCheck /></span>
                <span className="cx-scene-chip-body">
                  <i className="cx-scene-line" style={{ width: '78%' }} />
                  <i className="cx-scene-line is-soft" style={{ width: '50%' }} />
                </span>
              </div>
            </div>

            {/* verified seal */}
            <div className="cx-scene-pos cx-scene-pos--seal">
              <span className="cx-scene-seal"><ShieldCheck /></span>
            </div>
          </div>

          <div className="max-w-[22rem] cx-enter" style={{ '--i': 2 }}>
            <span className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              Admin Portal
            </span>

            {/* Security & Multi-tenant note */}
            <div
              className="max-w-[20rem] mx-auto mt-1.5 text-xs leading-relaxed text-slate-500"
              style={{ fontFamily: 'var(--fd-font-sans)' }}
            >
              🔒 Multi-tenant isolation active: You will strictly only see call logs and billing for your verified business.
            </div>
          </div>
        </aside>

        </div>
      </div>
    </div>
  );
}
