import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Building2,
  Phone,
  Clock,
  MapPin,
  UserCheck,
  Stethoscope,
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ChevronRight,
  AlertCircle,
  Activity,
  CalendarCheck,
  PhoneCall,
  Calendar,
  CalendarDays,
  X,
  Layers,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function AdminPanel({ setActivePage, onLoginAsClinic }) {
  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem('frontdesk_admin_key') || '';
  });

  // Clinics List State
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Selected Clinic for View Details Modal
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Close modal on Escape key and lock background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedClinic(null);
      }
    };
    if (selectedClinic) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedClinic]);

  // Verify stored key on mount or redirect to /login
  useEffect(() => {
    const key = localStorage.getItem('frontdesk_admin_key');
    if (!key) {
      toast.error('Please login from the login page.');
      setActivePage('login');
      return;
    }
    setAdminKey(key);
    loadClinics(key);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('frontdesk_admin_key');
    setAdminKey('');
    toast.success('Logged out of Admin Console.');
    setActivePage('login');
  };

  const loadClinics = async (key = adminKey) => {
    setLoadingClinics(true);
    try {
      const res = await fetch('/api/admin/clinics', {
        headers: { 'x-admin-key': key }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClinics(data.clinics || []);
      } else {
        toast.error(data.message || 'Failed to fetch clinics');
      }
    } catch (err) {
      toast.error('Network error while loading clinics');
    } finally {
      setLoadingClinics(false);
    }
  };

  // Toggle enable/disable status for a business
  const handleToggleClinicStatus = async (clinic) => {
    const currentStatus = clinic.is_active !== false;
    const nextStatus = !currentStatus;

    // Optimistically update the UI
    setClinics((prev) =>
      prev.map((item) =>
        item.clinic_id === clinic.clinic_id ? { ...item, is_active: nextStatus } : item
      )
    );

    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey || localStorage.getItem('frontdesk_admin_key') || ''
        },
        body: JSON.stringify({
          is_active: nextStatus
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`"${clinic.clinic_name}" has been ${nextStatus ? 'enabled' : 'disabled'} successfully.`);
      } else {
        // Revert on error
        setClinics((prev) =>
          prev.map((item) =>
            item.clinic_id === clinic.clinic_id ? { ...item, is_active: currentStatus } : item
          )
        );
        toast.error(data.message || 'Failed to update business status. Please try again.');
      }
    } catch (err) {
      // Revert on network error
      setClinics((prev) =>
        prev.map((item) =>
          item.clinic_id === clinic.clinic_id ? { ...item, is_active: currentStatus } : item
        )
      );
      toast.error('Network error updating business status. Please check your connection.');
    }
  };

  // Copy credentials helper
  const copyCredentials = (c) => {
    const text = `FrontDesk AI Clinic Portal Access:\nClinic: ${c.clinic_name}\nMobile: ${c.contact_phone}\nPassword: ${c.password || '123456'}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedId(c.clinic_id);
    toast.success('Login credentials copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter clinics
  const filteredClinics = clinics.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.clinic_name?.toLowerCase().includes(q) ||
      c.clinic_id?.toLowerCase().includes(q) ||
      c.contact_phone?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalCalls = clinics.reduce((acc, c) => acc + (Number(c.call_count) || 0), 0);
  const totalAppointments = clinics.reduce((acc, c) => acc + (Number(c.appointment_count) || 0), 0);

  return (
    // data-motion-scope opts this tool page out of the marketing site's magnetic/tilt effects.
    <div className="relative min-h-[calc(100vh-4.25rem)] pb-20 text-ink before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[32rem] before:z-0 before:bg-[radial-gradient(40rem_18rem_at_12%_0%,rgba(162,232,253,0.45),transparent_70%),radial-gradient(36rem_20rem_at_92%_8%,rgba(188,220,255,0.5),transparent_70%)] before:pointer-events-none" data-motion-scope="admin">

      {/* Main Content Area */}
      <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-8">
        {/* KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Admin metrics">
          {/* Card 1: Registered Businesses */}
          <div className="relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] hover:border-slate-900/[0.16] transition-[border-color,box-shadow] duration-200 before:content-[''] before:absolute before:-top-px before:inset-x-5 before:h-0.5 before:rounded-b-[2px] before:bg-[#1570E0] before:opacity-85 cx-enter" style={{ '--i': 1 }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-[0.04em] uppercase text-slate-500">Registered Businesses</span>
              <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#1570E0] bg-[#EEF6FF]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-ink">
              {clinics.length}
            </div>
            <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-slate-500">
              <span><strong className="font-semibold text-[#3B4A63]">100% Dynamic</strong> &middot; Stored in Supabase</span>
            </p>
          </div>

          {/* Card 2: Total Calls Logged */}
          <div className="relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] hover:border-slate-900/[0.16] transition-[border-color,box-shadow] duration-200 before:content-[''] before:absolute before:-top-px before:inset-x-5 before:h-0.5 before:rounded-b-[2px] before:bg-[#6366F1] before:opacity-85 cx-enter" style={{ '--i': 2 }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-[0.04em] uppercase text-slate-500">Total Calls Logged</span>
              <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#6366F1] bg-[#EEF2FF]">
                <Phone className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-ink">
              {totalCalls}
            </div>
            <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-slate-500">
              <span>AI Handled &amp; Vobiz CDRs</span>
            </p>
          </div>

          {/* Card 3: Appointments Booked */}
          <div className="relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] hover:border-slate-900/[0.16] transition-[border-color,box-shadow] duration-200 before:content-[''] before:absolute before:-top-px before:inset-x-5 before:h-0.5 before:rounded-b-[2px] before:bg-[#10B981] before:opacity-85 cx-enter" style={{ '--i': 3 }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-[0.04em] uppercase text-slate-500">Appointments Booked</span>
              <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#10B981] bg-[#ECFDF5]">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-ink">
              {totalAppointments}
            </div>
            <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-slate-500">
              <span><strong className="font-semibold text-[#3B4A63]">Atomic DB Locked</strong> Slots</span>
            </p>
          </div>

          {/* Card 4: Voice AI Engine */}
          <div className="relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] hover:border-slate-900/[0.16] transition-[border-color,box-shadow] duration-200 before:content-[''] before:absolute before:-top-px before:inset-x-5 before:h-0.5 before:rounded-b-[2px] before:bg-[#0284C7] before:opacity-85 cx-enter" style={{ '--i': 4 }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-[0.04em] uppercase text-slate-500">Voice AI Engine</span>
              <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#0284C7] bg-[#F0F9FF]">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.35rem] leading-snug font-semibold tracking-[-0.025em] text-ink">
              Gemini 2.5 + LiveKit
            </div>
            <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-slate-500">
              <span><strong className="font-semibold text-[#3B4A63]">Active &amp; Ready</strong> for incoming SIP calls</span>
            </p>
          </div>
        </section>

        {/* Clinics Search and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, or address..."
              className="w-full h-[2.875rem] pl-[2.6rem] pr-[0.95rem] rounded-full text-sm text-ink bg-white/85 border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActivePage('admin-create')}
              className="inline-flex items-center gap-2 pl-[0.45rem] pr-[1.1rem] h-10 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer text-white bg-gradient-to-b from-[#2B8AF7] to-[#1570E0] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_26px_-12px_rgba(21,112,224,0.75)] hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_16px_30px_-12px_rgba(21,112,224,0.85)] active:not(:disabled):translate-y-0 transition-all duration-200 group"
            >
              <span className="grid place-items-center w-[1.9rem] h-[1.9rem] rounded-full bg-white/[0.18] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] transition-transform duration-350 ease-out group-hover:rotate-90" aria-hidden="true"><Plus className="w-4 h-4" /></span>
              <span>Create New Business</span>
            </button>
          </div>
        </div>

        {/* Clinics Table */}
        {loadingClinics ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading businesses from PostgreSQL database...</p>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="grid place-items-center flex-none w-14 h-14 rounded-2xl text-white bg-gradient-to-b from-[#2B8AF7] to-[#1570E0] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_0_4px_rgba(43,138,247,0.1),0_10px_22px_-10px_rgba(21,112,224,0.7)] mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">No businesses found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No businesses match your search query.' : 'Click "Create New Business" above to register your first business!'}
              </p>
            </div>
            <button
              onClick={() => setActivePage('admin-create')}
              className="inline-flex items-center gap-2 pl-[0.45rem] pr-[1.1rem] h-10 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer text-white bg-gradient-to-b from-[#2B8AF7] to-[#1570E0] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_26px_-12px_rgba(21,112,224,0.75)] hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_16px_30px_-12px_rgba(21,112,224,0.85)] active:not(:disabled):translate-y-0 transition-all duration-200 group mx-auto"
            >
              <span className="grid place-items-center w-[1.9rem] h-[1.9rem] rounded-full bg-white/[0.18] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] transition-transform duration-350 ease-out group-hover:rotate-90" aria-hidden="true"><Plus className="w-4 h-4" /></span>
              <span>Create First Business</span>
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] bg-white/[0.72] backdrop-blur-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9),0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(14,26,46,0.04),0_18px_40px_-26px_rgba(23,76,150,0.35)] adm-rise" style={{ '--i': 4 }}>
            <div className="overflow-x-auto [overscroll-behavior-x:contain]">
              <table className="w-full min-w-[60rem] border-separate border-spacing-0 text-[0.8125rem]">
                <thead>
                  <tr>
                    <th scope="col" className="sticky top-0 left-0 z-20 pl-5 pr-[0.85rem] py-[0.8rem] text-left text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Business</th>
                    <th scope="col" className="sticky top-0 z-10 px-[0.85rem] py-[0.8rem] text-left text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Location</th>
                    <th scope="col" className="sticky top-0 z-10 px-[0.85rem] py-[0.8rem] text-left text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Hours</th>
                    <th scope="col" className="sticky top-0 z-10 px-[0.85rem] py-[0.8rem] text-left text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Doctors</th>
                    <th scope="col" className="sticky top-0 z-10 px-[0.85rem] py-[0.8rem] text-left text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Services</th>
                    <th scope="col" className="sticky top-0 z-10 px-[0.85rem] py-[0.8rem] text-left text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Activity</th>
                    <th scope="col" className="sticky top-0 z-10 pl-[0.85rem] pr-5 py-[0.8rem] text-center text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap text-slate-500 bg-gradient-to-b from-[#F6FAFF] to-[#EEF5FD] border-b border-slate-900/[0.08]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClinics.map((c, rowIndex) => {
                    const doctorsList = Array.isArray(c.doctors) ? c.doctors : [];
                    const servicesList = Array.isArray(c.services) ? c.services : [];
                    const servicesText = servicesList.length > 0 ? servicesList.join(', ') : 'General Healthcare';

                    return (
                      <tr
                        key={c.clinic_id}
                        onClick={() => setSelectedClinic(c)}
                        className="group/tr adm-tr cursor-pointer hover:!bg-[#EAF3FF]/80 transition-colors duration-150"
                        style={{ '--i': Math.min(rowIndex, 8) }}
                        title="Click on row to view full business details"
                      >
                        {/* Clinic */}
                        <td className="sticky left-0 z-10 pl-5 pr-[0.85rem] py-4 align-top border-b border-slate-900/[0.06] bg-white/[0.96] shadow-[1px_0_0_rgba(15,23,42,0.06)] group-hover/tr:!bg-[#F3F8FF] transition-colors duration-200">
                          <div className="space-y-1.5 min-w-[11rem] max-w-[14rem]">
                            <div className="font-semibold text-ink leading-snug flex items-center justify-between gap-1.5">
                              <span>{c.clinic_name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/tr:text-blue-500 transition-colors shrink-0" />
                            </div>
                            <span className="inline-flex items-center gap-1.5 flex-none py-[0.3rem] px-[0.7rem] rounded-full text-[0.6875rem] font-semibold text-[#1570E0] bg-gradient-to-b from-[#F2F8FF] to-[#E6F1FF] shadow-[inset_0_0_0_1px_rgba(21,112,224,0.18)]">
                              <UserCheck className="w-3 h-3" />
                              AI: {c.receptionist_name || 'Neha'}
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-[0.85rem] py-4 align-top border-b border-slate-900/[0.06] group-hover/tr:bg-[#EAF3FF]/[0.55] transition-colors duration-200">
                          <div className="text-xs min-w-[9rem] max-w-[12rem]">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="text-slate-600 leading-relaxed line-clamp-2" title={c.address}>
                                {c.address}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Hours */}
                        <td className="px-[0.85rem] py-4 align-top border-b border-slate-900/[0.06] group-hover/tr:bg-[#EAF3FF]/[0.55] transition-colors duration-200">
                          <div className="text-xs min-w-[9rem] max-w-[12rem]">
                            <div className="flex items-start gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-slate-500 leading-relaxed font-medium" title={c.working_hours}>
                                {c.working_hours}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Doctors */}
                        <td className="px-[0.85rem] py-4 align-top border-b border-slate-900/[0.06] group-hover/tr:bg-[#EAF3FF]/[0.55] transition-colors duration-200">
                          <div className="space-y-1.5 text-xs min-w-[8rem] max-w-[11rem]">
                            <div className="flex flex-wrap gap-1">
                              {doctorsList.slice(0, 3).map((d, i) => (
                                <span key={i} className="py-[0.15rem] px-[0.55rem] rounded-full text-[0.6875rem] font-medium text-[#3B4A63] bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.14)]">
                                  {d.name}
                                </span>
                              ))}
                              {doctorsList.length > 3 && (
                                <span className="text-[11px] text-slate-500 self-center">+{doctorsList.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Services */}
                        <td className="px-[0.85rem] py-4 align-top border-b border-slate-900/[0.06] group-hover/tr:bg-[#EAF3FF]/[0.55] transition-colors duration-200">
                          <div className="space-y-1.5 text-xs min-w-[9rem] max-w-[12rem]">
                            <div className="text-slate-600 leading-relaxed line-clamp-2" title={servicesText} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                              {servicesText}
                            </div>
                          </div>
                        </td>

                        {/* Activity */}
                        <td className="px-[0.85rem] py-4 align-top border-b border-slate-900/[0.06] group-hover/tr:bg-[#EAF3FF]/[0.55] transition-colors duration-200">
                          <div className="space-y-1 text-xs text-slate-500 whitespace-nowrap">
                            <div><b className="font-semibold text-ink tabular-nums">{c.appointment_count || 0}</b> appts</div>
                            <div><b className="font-semibold text-ink tabular-nums">{c.call_count || 0}</b> calls</div>
                          </div>
                        </td>

                        {/* Status Toggle (Enable / Disable) */}
                        <td
                          onClick={(e) => e.stopPropagation()}
                          className="pl-[0.85rem] pr-5 py-4 align-middle text-center border-b border-slate-900/[0.06] group-hover/tr:bg-[#EAF3FF]/[0.55] transition-colors duration-200"
                        >
                          <div className="inline-flex flex-col items-center gap-1">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={c.is_active !== false}
                              onClick={() => handleToggleClinicStatus(c)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                c.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={c.is_active !== false ? 'Click to Disable' : 'Click to Enable'}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  c.is_active !== false ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-[11px] leading-none ${
                                c.is_active !== false ? 'text-emerald-600 font-semibold' : 'text-slate-400 font-medium'
                              }`}
                            >
                              {c.is_active !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View All Business Data Modal */}
      {selectedClinic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedClinic(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/30 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2B8AF7] to-[#1570E0] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                      {selectedClinic.clinic_name}
                    </h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedClinic.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedClinic.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {selectedClinic.is_active !== false ? 'Active & Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      ID: {selectedClinic.clinic_id}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      AI Receptionist: {selectedClinic.receptionist_name || 'Neha'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedClinic(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

              {/* Core Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Calls */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Calls</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-blue-900 tabular-nums">{selectedClinic.call_count || 0}</span>
                    <span className="text-[11px] font-medium text-blue-500">logged</span>
                  </div>
                </div>

                {/* Appointments */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Appointments</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-emerald-900 tabular-nums">{selectedClinic.appointment_count || 0}</span>
                    <span className="text-[11px] font-medium text-emerald-600">booked</span>
                  </div>
                </div>

                {/* Slot Duration */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Slot Duration</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-purple-900 tabular-nums">{selectedClinic.slot_duration_minutes || 30}</span>
                    <span className="text-[11px] font-medium text-purple-500">mins</span>
                  </div>
                </div>

                {/* Specialists */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Specialists</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-amber-900 tabular-nums">
                      {Array.isArray(selectedClinic.doctors) ? selectedClinic.doctors.length : 0}
                    </span>
                    <span className="text-[11px] font-medium text-amber-600">doctors</span>
                  </div>
                </div>
              </div>

              {/* Contact & Telephony Configurations */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Contact &amp; Telephony Configurations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Registered Phone */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <span className="text-xs text-slate-500 block">Registered Mobile / Contact</span>
                    <span className="font-semibold text-slate-800 text-sm tracking-wide block truncate">
                      {selectedClinic.contact_phone}
                    </span>
                  </div>

                  {/* Virtual Inbound Number */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <span className="text-xs text-slate-500 block">Virtual AI SIP Inbound Number</span>
                    <span className="font-semibold text-blue-600 text-sm tracking-wide block truncate font-mono">
                      {(Array.isArray(selectedClinic.virtual_phone_numbers) && selectedClinic.virtual_phone_numbers[0]) || '+91 8065355910'}
                    </span>
                  </div>

                  {/* Working Hours */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white sm:col-span-2">
                    <span className="text-xs text-slate-500 block">Working Hours</span>
                    <span className="font-medium text-slate-800 text-sm block truncate" title={selectedClinic.working_hours}>
                      {selectedClinic.working_hours || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location / Address */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Physical Address &amp; Location
                </h3>
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    {selectedClinic.address || 'Address on file'}
                  </div>
                </div>
              </div>

              {/* Doctors & Specialists */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    Doctors &amp; Duty Specialists ({Array.isArray(selectedClinic.doctors) ? selectedClinic.doctors.length : 0})
                  </h3>
                </div>
                {Array.isArray(selectedClinic.doctors) && selectedClinic.doctors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedClinic.doctors.map((doc, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 flex flex-col justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {doc.name ? doc.name.replace(/^(Dr\.\s*|Dr\s*)/i, '').charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm">{doc.name}</div>
                            <div className="text-xs text-blue-600 font-medium">{doc.specialization || 'Consultant Specialist'}</div>
                          </div>
                        </div>
                        {doc.timings && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.timings}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No specific doctors listed (General duty schedule applies).
                  </div>
                )}
              </div>

              {/* Services & Treatments */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Services &amp; Clinical Treatments ({Array.isArray(selectedClinic.services) ? selectedClinic.services.length : 0})
                </h3>
                {Array.isArray(selectedClinic.services) && selectedClinic.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedClinic.services.map((srv, idx) => {
                      const srvName = typeof srv === 'string' ? srv : srv?.name || 'Service';
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {srvName}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    General Healthcare Consultation
                  </div>
                )}
              </div>

            </div>


          </div>
        </div>
      )}
    </div>
  );
}
