import React, { useState, useEffect } from 'react';
import { Calendar, Menu, X, ArrowRight, Building2, ShieldCheck, Settings, Users, LogOut, ChevronDown, LayoutDashboard, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from './BrandLogo';

export default function Navbar({ activePage, setActivePage, clinicUser, isSuperAdmin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Accessibility: close mobile menu on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { id: 'features', label: 'Features' },
    { id: 'telephony', label: 'Call Forwarding' },
    { id: 'roi', label: 'ROI Calculator' },
    { id: 'about', label: 'About Us' },
    { id: 'support', label: 'Support' },
  ];

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    if (['about', 'support', 'privacy', 'terms', 'login', 'portal', 'admin', 'admin-create'].includes(id)) {
      setActivePage(id);
    } else if (id === 'home') {
      setActivePage('home', null);
    } else {
      setActivePage('home', id);
    }
  };

  // Marketing links + demo CTA are hidden on the app pages (login, clinic portal, super admin console)
  const isPortalOrLogin = activePage === 'login' || activePage === 'portal' || activePage === 'admin' || activePage === 'admin-create';

  return (
    <header
      className={`sticky top-0 z-50 w-full nav-glass transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_1px_0_rgba(14,27,42,0.08),0_12px_30px_-18px_rgba(23,76,150,0.35)]' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.25rem] flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center cursor-pointer select-none shrink-0"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavClick('home')}
          aria-label="FrontDesk AI Home"
        >
          <BrandLogo variant="navbar" />
        </div>

        {/* Desktop Nav Items - Hidden on Login & Portal pages as marked */}
        {!isPortalOrLogin && (
          <nav
            className="hidden lg:flex items-center gap-0.5 p-1.5"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-2 rounded-full text-[0.92rem] font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'text-blue-800 glass-pill'
                      : 'text-ink/70 hover:text-ink hover:bg-white/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          {isSuperAdmin ? (
            <div className="relative">
              <button
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePage === 'admin' || activePage === 'admin-create' || adminDropdownOpen
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                aria-expanded={adminDropdownOpen}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${adminDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Super Admin Dropdown Menu */}
              {adminDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAdminDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setAdminDropdownOpen(false);
                        handleNavClick('admin');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer whitespace-nowrap"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdminDropdownOpen(false);
                        handleNavClick('admin-create');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 text-slate-500" />
                      <span>Create Business</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setAdminDropdownOpen(false);
                        localStorage.removeItem('frontdesk_admin_key');
                        toast.success('Logged out of Admin Console.');
                        handleNavClick('login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/60 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : clinicUser ? (
            <button
              onClick={() => handleNavClick('portal')}
              className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePage === 'portal'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{clinicUser.clinic_name.split(' ')[0]} Portal</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className={`px-4 py-2 rounded-full text-[0.88rem] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePage === 'login'
                  ? 'text-blue-700 bg-blue-50/90 border border-blue-200 shadow-xs'
                  : 'text-ink/75 hover:text-ink hover:bg-white/80 border border-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Admin Login</span>
            </button>
          )}

          {/* Primary CTA Button - Hidden on Login & Portal pages as marked */}
          {!isPortalOrLogin && (
            <button
              onClick={() => handleNavClick('support')}
              className="hidden lg:flex pill has-chip btn-brand !min-h-[2.75rem] !text-[0.9rem] active:scale-[0.98]"
            >
              <span>Book Live Demo</span>
              <span className="btn-chip !w-8 !h-8" aria-hidden="true">
                <Calendar />
              </span>
            </button>
          )}

          {/* Mobile Hamburger Button - Only shown when not on portal/login */}
          {!isPortalOrLogin && (
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-11 h-11 inline-flex items-center justify-center rounded-full glass-pill text-ink hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-blue-900/5 px-4 sm:px-6 pt-3 pb-6 space-y-3 shadow-[0_24px_40px_-24px_rgba(23,76,150,0.45)] animate-slide-up max-h-[calc(100vh-4.25rem)] overflow-y-auto"
          role="dialog"
          aria-label="Mobile Navigation"
        >
          {/* Gateway Status Badge in Mobile View */}
          {/* <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400">System Telephony:</span>
            <span className="flex items-center gap-2 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Gateway Active
            </span>
          </div> */}

          {/* Navigation Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl text-base font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? 'text-blue-800 glass-pill'
                      : 'text-ink/80 hover:text-ink hover:bg-blue-50/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {isActive && <ArrowRight className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Mobile Clinic Login / Portal Button */}
          <div className="pt-2">
            {isSuperAdmin ? (
              <button
                onClick={() => handleNavClick('admin')}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-between shadow-md shadow-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Super Admin</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : clinicUser ? (
              <button
                onClick={() => handleNavClick('portal')}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-between shadow-md shadow-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{clinicUser.clinic_name} Portal</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="w-full py-3 px-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Business Partner Login</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>
            )}
          </div>

          {/* Mobile CTA */}
          <div className="pt-2 border-t border-blue-900/10">
            <button
              onClick={() => handleNavClick('support')}
              className="pill has-chip btn-brand w-full active:scale-[0.98]"
            >
              <span>Book Live Demo</span>
              <span className="btn-chip" aria-hidden="true">
                <Calendar />
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
