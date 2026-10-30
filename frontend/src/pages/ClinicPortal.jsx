import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactCalendar from 'react-calendar';
import { 
  Building2, Phone, PhoneForwarded, Clock, CreditCard, 
  RefreshCw, LogOut, Calendar, CheckCircle2, AlertTriangle, 
  Download, ArrowUpRight, ShieldCheck, User, Stethoscope, Search, FileText,
  ChevronLeft, ChevronRight, Link2, KeyRound, Eye, EyeOff, ExternalLink,
  Copy, HelpCircle, Sparkles, Plus, X, Power, CalendarDays, Check
} from 'lucide-react';
import CallAudioPlayer from '../components/CallAudioPlayer';

export default function ClinicPortal({ setActivePage, clinicUser, onLogout }) {
  const [clinic, setClinic] = useState(clinicUser || null);
  const [billing, setBilling] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calls'); // 'calls' | 'appointments' | 'doctors' | 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [callsPage, setCallsPage] = useState(1);
  const [apptsPage, setApptsPage] = useState(1);
  const rowsPerPage = 10;

  // In-House Calendar State
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [calendarSlots, setCalendarSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
  const [schedulingEnabled, setSchedulingEnabled] = useState(clinicUser?.scheduling_enabled !== false);
  const [togglingScheduling, setTogglingScheduling] = useState(false);

  // Direct Manual Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [bookingPatientName, setBookingPatientName] = useState('');
  const [bookingPatientPhone, setBookingPatientPhone] = useState('');
  const [bookingService, setBookingService] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  // Calendly Integration State (Preserved)
  const [calendlyLink, setCalendlyLink] = useState(clinicUser?.calendly_link || '');
  const [calendlyApiKey, setCalendlyApiKey] = useState(clinicUser?.calendly_api_key_masked || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingCalendly, setSavingCalendly] = useState(false);
  const [testingCalendly, setTestingCalendly] = useState(false);
  const [calendlyTestResult, setCalendlyTestResult] = useState(null);

  // Load clinic from localStorage if not passed in props
  useEffect(() => {
    let activeClinic = clinicUser;
    if (!activeClinic) {
      const stored = localStorage.getItem('clinic_auth');
      if (stored) {
        try {
          activeClinic = JSON.parse(stored);
          if (activeClinic && activeClinic.virtual_phone_numbers) {
            activeClinic.virtual_phone_numbers = activeClinic.virtual_phone_numbers.filter(
              n => !['8065355910', '+917668433939', '7668433939', '+13312923658'].includes(n)
            );
          }
          setClinic(activeClinic);
          setCalendlyLink(activeClinic.calendly_link || '');
          setCalendlyApiKey(activeClinic.calendly_api_key_masked || '');
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      setCalendlyLink(activeClinic.calendly_link || '');
      setCalendlyApiKey(activeClinic.calendly_api_key_masked || '');
    }

    if (!activeClinic) {
      setActivePage('login');
      return;
    }

    fetchDashboardData(activeClinic.clinic_id);
  }, [clinicUser]);

  const fetchDashboardData = async (clinicId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clinics/${clinicId}/dashboard`);
      const data = await res.json();
      if (data.success) {
        const cleanedClinic = {
          ...data.clinic,
          virtual_phone_numbers: (data.clinic.virtual_phone_numbers || []).filter(
            n => !['8065355910', '+917668433939', '7668433939', '+13312923658'].includes(n)
          )
        };
        setClinic(cleanedClinic);
        localStorage.setItem('clinic_auth', JSON.stringify(cleanedClinic));
        if (typeof data.clinic?.scheduling_enabled === 'boolean') {
          setSchedulingEnabled(data.clinic.scheduling_enabled);
        }
        setCalendlyLink(cleanedClinic.calendly_link || '');
        setCalendlyApiKey(cleanedClinic.calendly_api_key_masked || '');
        setBilling(data.billing);
        setCallLogs(data.call_logs || []);
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load clinic dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatIsoDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchCalendarSlots = async (targetDate, doctor = '') => {
    if (!clinic?.clinic_id) return;
    setLoadingSlots(true);
    const dateStr = formatIsoDate(targetDate);
    try {
      const url = `/api/clinics/${clinic.clinic_id}/calendar/slots?date=${dateStr}${doctor ? `&doctor=${encodeURIComponent(doctor)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCalendarSlots(data.slots || []);
        if (typeof data.scheduling_enabled === 'boolean') {
          setSchedulingEnabled(data.scheduling_enabled);
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'calendar' || activeTab === 'calendly') && clinic?.clinic_id) {
      fetchCalendarSlots(calendarSelectedDate, selectedDoctorFilter);
    }
  }, [activeTab, calendarSelectedDate, selectedDoctorFilter, clinic?.clinic_id]);

  const handleToggleScheduling = async () => {
    if (!clinic?.clinic_id) return;
    setTogglingScheduling(true);
    const nextState = !schedulingEnabled;
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/calendar/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduling_enabled: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setSchedulingEnabled(nextState);
        setClinic((prev) => ({ ...prev, scheduling_enabled: nextState }));
        toast.success(
          nextState
            ? 'Online & AI Scheduling turned ON!'
            : 'Online & AI Scheduling turned OFF (Paused).'
        );
        fetchCalendarSlots(calendarSelectedDate, selectedDoctorFilter);
      } else {
        toast.error(data.message || 'Failed to toggle scheduling.');
      }
    } catch (err) {
      toast.error('Network error updating scheduling status.');
    } finally {
      setTogglingScheduling(false);
    }
  };

  const handleOpenBookingModal = (slot) => {
    setSelectedSlotForBooking(slot);
    setBookingDoctor(selectedDoctorFilter || clinic?.doctors?.[0]?.name || 'Clinic Doctor');
    setBookingService(clinic?.services?.[0] || 'General Consultation');
    setBookingPatientName('');
    setBookingPatientPhone('');
    setBookingModalOpen(true);
  };

  const handleDirectBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingPatientName.trim()) {
      toast.error('Please enter patient name.');
      return;
    }
    if (!selectedSlotForBooking) return;

    setSubmittingBooking(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/calendar/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: bookingPatientName.trim(),
          patient_phone: bookingPatientPhone.trim(),
          slot_iso_timestamp: selectedSlotForBooking.slot_iso,
          service_type: bookingService.trim() || 'General Consultation',
          doctor_name: bookingDoctor || selectedDoctorFilter || clinic?.doctors?.[0]?.name || 'Clinic Doctor'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Appointment confirmed & booked successfully!');
        setBookingModalOpen(false);
        setBookingPatientName('');
        setBookingPatientPhone('');
        fetchCalendarSlots(calendarSelectedDate, selectedDoctorFilter);
        fetchDashboardData(clinic.clinic_id);
      } else {
        toast.error(data.message || 'Slot already booked or unavailable.');
      }
    } catch (err) {
      toast.error('Network error booking appointment.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleCancelAppointment = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This slot will become free for other patients.')) {
      return;
    }
    setCancellingBookingId(bookingId);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/calendar/appointments/${bookingId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Appointment cancelled successfully.');
        fetchCalendarSlots(calendarSelectedDate, selectedDoctorFilter);
        fetchDashboardData(clinic.clinic_id);
      } else {
        toast.error(data.message || 'Failed to cancel appointment.');
      }
    } catch (err) {
      toast.error('Network error cancelling appointment.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const getSanitizedCalendlyUrl = (raw) => {
    if (!raw) return '';
    let trimmed = String(raw).trim();
    if (!trimmed) return '';
    // Strip accidental leading %20 if present
    trimmed = trimmed.replace(/^(%20|\s)+/i, '');
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleSaveCalendly = async (e) => {
    if (e) e.preventDefault();
    if (!clinic?.clinic_id) return;

    const sanitizedLink = getSanitizedCalendlyUrl(calendlyLink);
    setSavingCalendly(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/calendly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendly_link: sanitizedLink,
          calendly_api_key: calendlyApiKey.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Calendly configuration updated successfully!');
        setCalendlyLink(sanitizedLink);
        const updatedClinic = {
          ...clinic,
          calendly_link: data.calendly_link,
          has_calendly_api_key: data.has_calendly_api_key,
          calendly_api_key_masked: data.calendly_api_key_masked,
        };
        setClinic(updatedClinic);
        localStorage.setItem('clinic_auth', JSON.stringify(updatedClinic));
        if (data.calendly_api_key_masked) {
          setCalendlyApiKey(data.calendly_api_key_masked);
        }
      } else {
        toast.error(data.message || 'Failed to update Calendly configuration.');
      }
    } catch (err) {
      console.error('Error saving Calendly settings:', err);
      toast.error('Network error saving Calendly settings.');
    } finally {
      setSavingCalendly(false);
    }
  };

  const handleTestCalendly = async () => {
    if (!clinic?.clinic_id) return;
    setTestingCalendly(true);
    setCalendlyTestResult(null);

    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/calendly/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendly_api_key: calendlyApiKey.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCalendlyTestResult({
          success: true,
          message: data.message,
          user: data.user,
        });
        toast.success(`Connected as ${data.user?.name || 'Calendly User'}!`);
      } else {
        setCalendlyTestResult({
          success: false,
          message: data.message || 'Failed to connect with Calendly.',
        });
        toast.error(data.message || 'Calendly connection test failed.');
      }
    } catch (err) {
      setCalendlyTestResult({
        success: false,
        message: 'Network error connecting to Calendly API.',
      });
      toast.error('Network error testing Calendly connection.');
    } finally {
      setTestingCalendly(false);
    }
  };

  const handleCopyCalendlyLink = () => {
    const cleanUrl = getSanitizedCalendlyUrl(calendlyLink);
    if (!cleanUrl) return;
    navigator.clipboard.writeText(cleanUrl);
    toast.success('Calendly link copied to clipboard!');
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('clinic_auth');
    toast.success('Logged out successfully.');
    if (onLogout) onLogout();
    setActivePage('login');
  };

  const filteredLogs = callLogs.filter((log) => {
    const duration = Number(log.duration_seconds || 0);
    const status = String(log.call_status || '').toUpperCase();
    const isShortCall = duration <= 10 || status.includes('CANCEL');
    const dynamicTag = log.is_transferred
      ? 'Forwarded to Doctor Reception'
      : (status.includes('BUSY') ? 'Unanswered Busy' : (isShortCall ? 'Missed Short Call' : 'Patient Inquiry Handled by AI'));

    const matchesSearch = 
      (log.caller_phone || '').includes(searchQuery) ||
      (log.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      dynamicTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.transfer_reason || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter !== 'all') {
      const logDate = new Date(log.created_at);
      const logDateStr = logDate.toLocaleDateString('en-CA');
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');

      if (dateFilter === 'today') {
        if (logDateStr !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterdayStr = y.toLocaleDateString('en-CA');
        if (logDateStr !== yesterdayStr) return false;
      } else if (dateFilter === 'last7') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        if (logDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'last30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        if (logDate < thirtyDaysAgo) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (logDateStr !== customDate) return false;
      }
    }

    return true;
  });

  // Reset pagination on search or date filter change
  useEffect(() => {
    setCallsPage(1);
  }, [searchQuery, dateFilter, customDate]);

  // Pagination calculation for Call Logs (10 rows per page)
  const totalCallsPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;
  const currentCallsPage = Math.min(callsPage, totalCallsPages);
  const startCallsIdx = (currentCallsPage - 1) * rowsPerPage;
  const paginatedLogs = filteredLogs.slice(startCallsIdx, startCallsIdx + rowsPerPage);

  // Pagination calculation for Appointments (10 rows per page)
  const totalApptsPages = Math.ceil(appointments.length / rowsPerPage) || 1;
  const currentApptsPage = Math.min(apptsPage, totalApptsPages);
  const startApptsIdx = (currentApptsPage - 1) * rowsPerPage;
  const paginatedAppts = appointments.slice(startApptsIdx, startApptsIdx + rowsPerPage);

  const totalDurationSec = billing?.total_duration_seconds ?? callLogs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
  const totalMinutes = Math.round(totalDurationSec / 60);

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const exportCsv = () => {
    if (!callLogs.length) {
      toast.error('No call logs available to export.');
      return;
    }
    const headers = ['Call ID', 'Caller', 'Called Number', 'Duration (sec)', 'Billable Mins', 'Transferred', 'Transfer Reason', 'Transfer To', 'Cost (INR)', 'Date'];
    const rows = callLogs.map(l => [
      l.call_sid,
      l.caller_phone,
      l.called_number,
      l.duration_seconds,
      l.billable_minutes,
      l.is_transferred ? 'YES' : 'NO',
      `"${(l.transfer_reason || '').replace(/"/g, '""')}"`,
      l.transfer_destination || '',
      l.cost_inr,
      l.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${clinic?.clinic_id || 'clinic'}_vobiz_call_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Call logs CSV downloaded successfully!');
  };

  if (!clinic) {
    return (
      <div className="cx-page min-h-[60vh] flex items-center justify-center" data-motion-scope="clinic">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#D9EBFF] border-t-[#155BBA] animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  const tabs = [
    { id: 'calls', label: `Call Logs (${callLogs.length})` },
    { id: 'appointments', label: `Appointments (${appointments.length})` },
    { id: 'doctors', label: `Doctors & Services (${clinic.doctors?.length || 0})` },
    { 
      id: 'calendar', 
      label: '3. Calendar & Live Scheduling', 
      badge: schedulingEnabled ? 'Active' : 'Paused' 
    },
  ];

  return (
    // data-motion-scope opts this page out of the marketing site's magnetic/tilt button effects.
    <div className="cx-page min-h-[calc(100vh-4.25rem)] max-w-[80rem] mx-auto px-4 py-6 pb-12 sm:px-6 sm:py-8 sm:pb-16 lg:px-8 lg:py-9 lg:pb-16 space-y-6 text-[#0E1A2E] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]" data-motion-scope="clinic">

      {/* ─── Top Clinic Header Banner ──────────────────────────── */}
      <header
        className="cx-enter flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-5 sm:p-6 bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]"
        style={{ '--i': 0 }}
      >
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="grid place-items-center shrink-0 w-12 h-12 rounded-[12px] text-white bg-gradient-to-b from-[#2B8AF7] to-[#155BBA] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_18px_-10px_rgba(21,112,224,0.55)]"
            aria-hidden="true"
          >
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-[1.375rem] sm:text-[1.5rem] font-semibold leading-[1.25] tracking-[-0.02em] text-[#0E1A2E] [overflow-wrap:anywhere]">
                {clinic.clinic_name}
              </h1>
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#A7F3D0] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#047857] bg-[#ECFDF5]">
                <ShieldCheck className="w-3 h-3" />
                Verified Clinic Partner
              </span>
            </div>
            <p className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-[0.8125rem] leading-[1.5] text-[#3B4A63]">
              <span>📍 {clinic.address}</span>
              <span>📞 Registered: <strong className="font-semibold text-[#0E1A2E]">{clinic.contact_phone}</strong></span>
              {clinic.receptionist_name && (
                <span>🤖 AI Receptionist: <strong className="font-semibold text-[#0E1A2E]">{clinic.receptionist_name}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={async () => {
              await fetchDashboardData(clinic.clinic_id);
              toast.success('Clinic data refreshed successfully!');
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-9 px-3.5 border border-[rgba(15,23,42,0.16)] rounded-[10px] text-[0.8125rem] font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={handleLogoutClick}
            className="inline-flex items-center justify-center gap-2 h-9 px-3.5 border border-[#FECDD3] rounded-[10px] text-[0.8125rem] font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#BE123C] bg-white hover:bg-[#FFF1F2] hover:border-[#FDA4AF] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ─── Billing & Call Metrics KPI Cards ──────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Clinic metrics">

        {/* KPI 1: Total Calls */}
        <div
          className="cx-enter relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-[rgba(15,23,42,0.09)] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(15,23,42,0.16)] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-[2px] before:opacity-85 before:bg-[#155BBA]"
          style={{ '--i': 1 }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.04em] uppercase text-[#64748B]">Total Calls Received</span>
            <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#155BBA] bg-[#EEF6FF]">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[#0E1A2E]">
            {billing?.total_calls ?? callLogs.length}
          </div>
          <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-[#64748B]">
            <span>Duration: <strong className="font-semibold text-[#3B4A63]">{billing?.total_duration_formatted || '0m 0s'}</strong></span>
          </p>
        </div>

        {/* KPI 2: Total Minutes */}
        <div
          className="cx-enter relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-[rgba(15,23,42,0.09)] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(15,23,42,0.16)] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-[2px] before:opacity-85 before:bg-[#6366F1]"
          style={{ '--i': 2 }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.04em] uppercase text-[#64748B]">Total Minutes</span>
            <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#6366F1] bg-[#EEF2FF]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[#0E1A2E]">
            <span>{totalMinutes}</span>
            <span className="text-base font-semibold text-[#64748B]">mins</span>
          </div>
          <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-[#64748B]">
            Exact: {billing?.total_duration_formatted || `${Math.floor(totalDurationSec / 60)}m ${totalDurationSec % 60}s`} total call duration
          </p>
        </div>

        {/* KPI 3: Total Appointments Booked */}
        <div
          className="cx-enter relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-[rgba(15,23,42,0.09)] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(15,23,42,0.16)] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-[2px] before:opacity-85 before:bg-[#10B981]"
          style={{ '--i': 3 }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.04em] uppercase text-[#64748B]">Appointments Booked</span>
            <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#10B981] bg-[#ECFDF5]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[#0E1A2E]">
            {appointments.length}
          </div>
          <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-[#64748B]">
            100% scheduled via Voice AI
          </p>
        </div>

        {/* KPI 4: Total Telephony & AI Bill */}
        <div
          className="cx-enter relative p-[1.125rem_1.25rem_1.25rem] rounded-[14px] bg-white border border-[rgba(15,23,42,0.09)] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(15,23,42,0.16)] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-[2px] before:opacity-85 before:bg-[#0284C7]"
          style={{ '--i': 4 }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.04em] uppercase text-[#64748B]">Current Bill Amount</span>
            <div className="grid place-items-center shrink-0 w-8 h-8 rounded-[9px] text-[#0284C7] bg-[#F0F9FF]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3.5 text-[1.875rem] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[#0E1A2E]">
            ₹{billing?.total_bill_inr ? Number(billing.total_bill_inr).toFixed(2) : '0.00'}
          </div>
          <p className="mt-2.5 text-[0.8125rem] leading-[1.4] text-[#64748B]">
            Live Vobiz Carrier Telephony Actuals
          </p>
        </div>
      </section>

      {/* ─── Navigation Tabs ───────────────────────────────────── */}
      <div className="cx-enter flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" style={{ '--i': 5 }}>
        <div className="grid grid-cols-2 sm:flex sm:overflow-x-auto gap-1 max-w-full p-1 border border-[rgba(15,23,42,0.09)] rounded-[12px] bg-[#EEF2F7] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Clinic portal sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 min-h-[2.5rem] sm:min-h-0 sm:h-9 px-2.5 sm:px-3.5 py-2 sm:py-0 rounded-[9px] text-[0.8125rem] font-semibold whitespace-normal sm:whitespace-nowrap leading-[1.25] sm:leading-none cursor-pointer transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 ${
                activeTab === tab.id
                  ? 'text-[#155BBA] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.08),0_0_0_1px_rgba(15,23,42,0.05)]'
                  : 'text-[#3B4A63] hover:text-[#0E1A2E] hover:bg-white/55'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab-specific right actions */}
        {activeTab === 'calls' && (
          <button
            onClick={exportCsv}
            disabled={!callLogs.length}
            className="inline-flex items-center justify-center gap-2 h-9 px-3.5 border border-[rgba(15,23,42,0.16)] rounded-[10px] text-[0.8125rem] font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed self-start lg:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* ─── TAB 1: CALL LOGS VIEW ─────────────────────────────── */}
      {activeTab === 'calls' && (
        <section className="cx-panel-enter bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]" role="tabpanel">

          {/* Table Filters Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-6 sm:py-3.5 border-b border-[rgba(15,23,42,0.09)]">
            <div className="relative flex-1 max-w-[26rem] group">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none transition-colors duration-150 group-focus-within:text-[#155BBA]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by phone number"
                className="w-full h-9 pl-9 pr-3.5 border border-[rgba(15,23,42,0.16)] rounded-[10px] bg-white text-[0.8125rem] text-[#0E1A2E] placeholder-[#94A3B8] transition-[border-color,box-shadow,background-color] duration-150 hover:border-[rgba(15,23,42,0.26)] focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                aria-label="Search call logs"
              />
            </div>

            <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#64748B] flex-nowrap whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="shrink-0">Date & Day:</span>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== 'custom') setCustomDate('');
                }}
                className="appearance-none h-9 pl-3.5 pr-9 border border-[rgba(15,23,42,0.16)] rounded-[10px] bg-white text-[0.8125rem] text-[#0E1A2E] font-medium cursor-pointer shrink-0 transition-[border-color,box-shadow,background-color] duration-150 hover:border-[rgba(15,23,42,0.26)] focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%2364748B%27%20stroke-width=%272.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center]"
                aria-label="Filter call logs by date and day"
              >
                <option value="all">All Dates & Days</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="custom">Pick Specific Date...</option>
              </select>

              {dateFilter === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-9 px-3.5 border border-[rgba(15,23,42,0.16)] rounded-[10px] bg-white text-[0.8125rem] text-[#0E1A2E] shrink-0 transition-[border-color,box-shadow,background-color] duration-150 hover:border-[rgba(15,23,42,0.26)] focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                  style={{ width: 'auto', minWidth: '135px' }}
                  aria-label="Select custom date"
                />
              )}
            </div>
          </div>

          {/* Call Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="grid place-items-center w-12 h-12 mx-auto mb-3.5 rounded-xl text-slate-400 bg-[#EEF2F7]"><Phone className="w-5 h-5" /></div>
              <p className="text-[0.9375rem] font-semibold text-[#0E1A2E]">No call logs found.</p>
              <p className="max-w-[26rem] mx-auto mt-1.5 text-[0.8125rem] text-[#64748B]">
                Incoming calls received by your AI Receptionist will be automatically logged here in real time.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-[0.8125rem]">
                  <thead>
                    <tr>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Caller (Patient)</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Date & Time</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Duration</th>
                      {/* <th>Status / Flow</th> */}
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)] min-w-[17rem]">Summary & Details</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)] text-right whitespace-nowrap">Cost (INR)</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Recording</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => {
                      const isTrans = log.is_transferred;
                      const dateObj = new Date(log.created_at);
                      const formattedDate = dateObj.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                      return (
                        <tr key={log.id || log.call_sid} className="transition-colors duration-100 hover:bg-[#F7FAFF] last:[&>td]:border-b-0">

                          {/* Caller */}
                          <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)]">
                            <div className="font-semibold text-[#0E1A2E] tabular-nums">{log.caller_phone}</div>
                            <span className="mt-0.5 text-xs text-[#64748B] block tabular-nums">ID: {log.call_sid}</span>
                          </td>

                          {/* Date & Time */}
                          <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)] whitespace-nowrap">
                            <div className="tabular-nums">{formattedDate}</div>
                            <div className="mt-0.5 text-xs text-[#64748B] tabular-nums">{formattedTime}</div>
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)] whitespace-nowrap">
                            <span className="font-semibold text-[#0E1A2E] tabular-nums">
                              {Math.floor(log.duration_seconds / 60)}m {log.duration_seconds % 60}s
                            </span>
                            <span className="mt-0.5 text-xs text-[#64748B] block">({log.billable_minutes} min billable)</span>
                          </td>

                          {/* Status / Flow (Commented out per request)
                          <td className="whitespace-nowrap">
                            {isTrans ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <PhoneForwarded className="w-3 h-3" />
                                Transferred to Doctor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <CheckCircle2 className="w-3 h-3" />
                                AI Resolved
                              </span>
                            )}
                          </td>
                          */}

                          {/* Summary & Details (Option 2: Human-Readable Dynamic Status & Tags) */}
                          <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)] min-w-[17rem]">
                            {(() => {
                              const duration = Number(log.duration_seconds || 0);
                              const status = String(log.call_status || '').toUpperCase();
                              const isShortCall = duration <= 10 || status.includes('CANCEL');
                              const isBusy = status.includes('BUSY') || status.includes('NO_ANSWER');

                              if (isTrans) {
                                return (
                                  <div>
                                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#FDE68A] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#B45309] bg-[#FFFBEB]">
                                      <PhoneForwarded className="w-3 h-3" />
                                      Forwarded to Doctor / Reception
                                    </span>
                                  </div>
                                );
                              }

                              if (isBusy) {
                                return (
                                  <div>
                                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[rgba(15,23,42,0.16)] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#3B4A63] bg-[#F8FAFC]">
                                      <AlertTriangle className="w-3 h-3" />
                                      Unanswered / Line Busy
                                    </span>
                                  </div>
                                );
                              }

                              if (isShortCall) {
                                return (
                                  <div>
                                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#FDE68A] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#92400E] bg-[#FEF3C7]">
                                      <Clock className="w-3 h-3" />
                                      Missed / Short Call
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#BCDCFF] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#155BBA] bg-[#EEF6FF]">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Patient Inquiry Handled by AI
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Cost */}
                          <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)] whitespace-nowrap font-semibold tabular-nums text-right">
                            ₹{Number(log.cost_inr || 0).toFixed(2)}
                          </td>

                          {/* Dual-Side Call Recording Player (Moved to last column) */}
                          <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)] whitespace-nowrap">
                            <CallAudioPlayer log={log} clinicId={clinic?.clinic_id || clinicUser?.clinic_id} />
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls (10 rows per page) */}
              {filteredLogs.length > rowsPerPage && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-6 sm:py-3.5 border-t border-[rgba(15,23,42,0.09)] bg-[#F8FAFC] rounded-b-[14px]">
                  <div className="text-[0.8125rem] text-[#64748B]">
                    Showing <b className="font-semibold text-[#0E1A2E] tabular-nums">{startCallsIdx + 1}</b> to{' '}
                    <b className="font-semibold text-[#0E1A2E] tabular-nums">
                      {Math.min(startCallsIdx + rowsPerPage, filteredLogs.length)}
                    </b>{' '}
                    of <b className="font-semibold text-[#0E1A2E] tabular-nums">{filteredLogs.length}</b> calls
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCallsPage((p) => Math.max(1, p - 1))}
                      disabled={currentCallsPage === 1}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-[rgba(15,23,42,0.16)] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers(currentCallsPage, totalCallsPages).map((num, i) =>
                        num === '...' ? (
                          <span key={`dots-calls-${i}`} className="px-1 text-xs text-slate-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={num}
                            onClick={() => setCallsPage(num)}
                            aria-current={currentCallsPage === num ? 'page' : undefined}
                            className={`min-w-[2rem] h-8 px-2 border rounded-lg text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 ${
                              currentCallsPage === num
                                ? 'text-white bg-[#155BBA] border-[#155BBA]'
                                : 'text-[#3B4A63] bg-white border-[rgba(15,23,42,0.16)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] hover:text-[#0E1A2E]'
                            }`}
                          >
                            {num}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setCallsPage((p) => Math.min(totalCallsPages, p + 1))}
                      disabled={currentCallsPage === totalCallsPages}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-[rgba(15,23,42,0.16)] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}


      {/* ─── TAB 3: APPOINTMENTS BOOKED ────────────────────────── */}
      {activeTab === 'appointments' && (
        <section className="cx-panel-enter bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]" role="tabpanel">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[rgba(15,23,42,0.09)]">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[#0E1A2E]">Appointments Booked by Voice AI</h2>
              <p className="mt-0.5 text-[0.8125rem] text-[#64748B]">Directly synchronized into clinic database</p>
            </div>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#BCDCFF] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#155BBA] bg-[#EEF6FF]">
              {appointments.length} Total Booked
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="grid place-items-center w-12 h-12 mx-auto mb-3.5 rounded-xl text-slate-400 bg-[#EEF2F7]"><Calendar className="w-5 h-5" /></div>
              <p className="text-[0.9375rem] font-semibold text-[#0E1A2E]">No appointments booked yet.</p>
              <p className="max-w-[26rem] mx-auto mt-1.5 text-[0.8125rem] text-[#64748B]">
                Appointments scheduled by patients during AI calls will appear here immediately.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-[0.8125rem]">
                  <thead>
                    <tr>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Doctor & Service</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Patient Name</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Phone</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Booking ID</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)]">Slot Time</th>
                      <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-[#64748B] bg-[#F8FAFC] border-b border-[rgba(15,23,42,0.09)] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppts.map((apt) => (
                      <tr key={apt.booking_id} className="transition-colors duration-100 hover:bg-[#F7FAFF] last:[&>td]:border-b-0">
                        <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)]">
                          <div className="font-semibold text-[#0E1A2E]">{apt.doctor_name}</div>
                          <div className="mt-0.5 text-xs text-[#64748B]">{apt.service_type}</div>
                        </td>
                        <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-[#0E1A2E] border-b border-[rgba(15,23,42,0.06)] font-semibold">
                          {apt.patient_name}
                        </td>
                        <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-[rgba(15,23,42,0.06)] text-[#3B4A63] tabular-nums whitespace-nowrap">
                          {apt.patient_phone}
                        </td>
                        <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-[rgba(15,23,42,0.06)] font-semibold text-blue-700 tabular-nums whitespace-nowrap">
                          {apt.booking_id}
                        </td>
                        <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-[rgba(15,23,42,0.06)] whitespace-nowrap font-medium tabular-nums">
                          {apt.display_time}
                        </td>
                        <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-[rgba(15,23,42,0.06)] text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#A7F3D0] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#047857] bg-[#ECFDF5]">
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls for Appointments (10 rows per page) */}
              {appointments.length > rowsPerPage && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-6 sm:py-3.5 border-t border-[rgba(15,23,42,0.09)] bg-[#F8FAFC] rounded-b-[14px]">
                  <div className="text-[0.8125rem] text-[#64748B]">
                    Showing <b className="font-semibold text-[#0E1A2E] tabular-nums">{startApptsIdx + 1}</b> to{' '}
                    <b className="font-semibold text-[#0E1A2E] tabular-nums">
                      {Math.min(startApptsIdx + rowsPerPage, appointments.length)}
                    </b>{' '}
                    of <b className="font-semibold text-[#0E1A2E] tabular-nums">{appointments.length}</b> appointments
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setApptsPage((p) => Math.max(1, p - 1))}
                      disabled={currentApptsPage === 1}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-[rgba(15,23,42,0.16)] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers(currentApptsPage, totalApptsPages).map((num, i) =>
                        num === '...' ? (
                          <span key={`dots-appts-${i}`} className="px-1 text-xs text-slate-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={num}
                            onClick={() => setApptsPage(num)}
                            aria-current={currentApptsPage === num ? 'page' : undefined}
                            className={`min-w-[2rem] h-8 px-2 border rounded-lg text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 ${
                              currentApptsPage === num
                                ? 'text-white bg-[#155BBA] border-[#155BBA]'
                                : 'text-[#3B4A63] bg-white border-[rgba(15,23,42,0.16)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] hover:text-[#0E1A2E]'
                            }`}
                          >
                            {num}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setApptsPage((p) => Math.min(totalApptsPages, p + 1))}
                      disabled={currentApptsPage === totalApptsPages}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-[rgba(15,23,42,0.16)] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ─── TAB 4: DOCTORS & SERVICES (100% Dynamic from DB) ─── */}
      {activeTab === 'doctors' && (
        <section className="space-y-6 cx-panel-enter" role="tabpanel">
          {/* Doctors Section */}
          <div className="bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[rgba(15,23,42,0.09)]">
              <div>
                <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0E1A2E] flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Registered Clinic Doctors
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-[#64748B]">Dynamic doctor profiles loaded from database</p>
              </div>
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#BCDCFF] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#155BBA] bg-[#EEF6FF]">
                {clinic.doctors?.length || 0} Doctors On-Call
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6">
              {(clinic.doctors || []).map((doc, idx) => (
                <div key={idx} className="p-[1.125rem] rounded-xl border border-[rgba(15,23,42,0.09)] bg-[#F8FAFC] transition-[border-color,background-color,box-shadow] duration-200 hover:bg-white hover:border-[#BCDCFF] hover:shadow-[0_8px_20px_-16px_rgba(23,76,150,0.45)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[0.9375rem] font-semibold text-ink">{doc.name}</h3>
                      <p className="text-[0.8125rem] text-blue-700 font-medium mt-1">🕒 {doc.timings}</p>
                    </div>
                    <div className="grid place-items-center shrink-0 w-9 h-9 rounded-[10px] text-[#155BBA] bg-[#EEF6FF]">
                      <User className="w-4 h-4" />
                    </div>
                  </div>

                  {Array.isArray(doc.specialties) && doc.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3.5 border-t border-slate-200/70">
                      {doc.specialties.map((spec, sIdx) => (
                        <span key={sIdx} className="inline-flex items-center gap-2 min-h-[1.625rem] px-2.5 py-1 border border-[rgba(15,23,42,0.16)] rounded-lg text-xs font-medium text-[#3B4A63] bg-white">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[rgba(15,23,42,0.09)]">
              <div>
                <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0E1A2E] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Offered Clinical Services & Procedures
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-[#64748B]">Services recognized by AI receptionist for patient slot bookings</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-5 sm:p-6">
              {(clinic.services || []).map((srv, srvIdx) => (
                <span
                  key={srvIdx}
                  className="inline-flex items-center gap-2 min-h-[2.25rem] px-3.5 py-1.5 border border-[#BCDCFF] rounded-[10px] text-[0.8125rem] font-semibold text-[#174C96] bg-[#F4F9FF]"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {srv}
                </span>
              ))}
            </div>
          </div>

          {/* Clinic Hours & Telephony Config */}
          <div className="bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[rgba(15,23,42,0.09)]">
              <h3 className="text-base font-semibold tracking-[-0.01em] text-[#0E1A2E] flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Operating Hours & Phone Configuration
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 sm:p-6">
              <div className="p-3.5 sm:p-4 border border-[rgba(15,23,42,0.09)] rounded-xl bg-[#F8FAFC] text-[0.8125rem] leading-[1.5] text-[#3B4A63]">
                <span className="block mb-1 text-sm font-semibold text-[#0E1A2E]">Working Hours</span>
                <span>{clinic.working_hours}</span>
              </div>
              <div className="p-3.5 sm:p-4 border border-[rgba(15,23,42,0.09)] rounded-xl bg-[#F8FAFC] text-[0.8125rem] leading-[1.5] text-[#3B4A63]">
                <span className="block mb-1 text-sm font-semibold text-[#0E1A2E]">Assigned Virtual Numbers (DIDs)</span>
                <span className="tabular-nums">
                  {(clinic.virtual_phone_numbers || [])
                    .filter(n => !['8065355910', '+917668433939', '7668433939', '+13312923658'].includes(n))
                    .join(', ')}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB 4: IN-HOUSE CALENDAR & LIVE SCHEDULING ─────────────── */}
      {(activeTab === 'calendar' || activeTab === 'calendly') && (
        <section className="cx-panel-enter space-y-6" role="tabpanel">

          {/* 1. MASTER FEATURE TOGGLE: ON / OFF SCHEDULING */}
          <div className="bg-white border border-[rgba(15,23,42,0.09)] rounded-[14px] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[rgba(15,23,42,0.09)]">
              <div>
                <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0E1A2E] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  Clinic Calendar & Scheduling Control
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-[#64748B]">
                  Configure live time slots, monitor patient bookings, and enable/disable automated appointment scheduling.
                </p>
              </div>

              {/* Master ON / OFF Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  {schedulingEnabled ? 'Online & AI Scheduling: ON' : 'Online & AI Scheduling: OFF'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleScheduling}
                  disabled={togglingScheduling}
                  className="cx-toggle-switch"
                  data-state={schedulingEnabled ? 'on' : 'off'}
                  role="switch"
                  aria-checked={schedulingEnabled}
                  title={schedulingEnabled ? 'Click to Pause Scheduling' : 'Click to Enable Scheduling'}
                >
                  <span className="cx-toggle-thumb" />
                </button>
              </div>
            </div>

            {/* Status Information Banner */}
            <div className="p-5 sm:p-6 border-b border-slate-200/70">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  schedulingEnabled
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                {schedulingEnabled ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">
                    {schedulingEnabled
                      ? 'Automated Scheduling is ACTIVE'
                      : 'Automated Scheduling is PAUSED'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                    {schedulingEnabled
                      ? 'Patients calling your AI receptionist can inquire about slot availability and have their appointments confirmed directly into your clinic database in real time.'
                      : 'Online appointment bookings are currently turned OFF. When patients call, your AI receptionist will explain that online booking is paused, offer clinic walk-in info, or transfer their call to reception.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 h-6 px-2.5 border rounded-full text-xs font-semibold leading-none whitespace-nowrap ${
                      schedulingEnabled ? 'text-[#047857] bg-[#ECFDF5] border-[#A7F3D0]' : 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        schedulingEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {schedulingEnabled ? 'Active Mode' : 'Paused Mode'}
                  </span>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-[0.6875rem] uppercase font-bold text-slate-500">Selected Date</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {calendarSelectedDate.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-[0.6875rem] uppercase font-bold text-slate-500">Total Slots</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 tabular-nums">
                    {calendarSlots.length} Slots
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
                  <span className="text-[0.6875rem] uppercase font-bold text-emerald-700">Available</span>
                  <p className="text-sm font-semibold text-emerald-800 mt-0.5 tabular-nums">
                    {calendarSlots.filter((s) => s.available).length} Open
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/70">
                  <span className="text-[0.6875rem] uppercase font-bold text-blue-700">Booked</span>
                  <p className="text-sm font-semibold text-blue-800 mt-0.5 tabular-nums">
                    {calendarSlots.filter((s) => s.is_booked).length} Confirmed
                  </p>
                </div>
              </div>
            </div>

            {/* 2. INTERACTIVE CALENDAR & DYNAMIC SLOTS SECTION */}
            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: React Calendar Picker & Doctor Filter */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Select Consultation Date
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCalendarSelectedDate(new Date())}
                      className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tmr = new Date();
                        tmr.setDate(tmr.getDate() + 1);
                        setCalendarSelectedDate(tmr);
                      }}
                      className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                {/* React Calendar Component */}
                <div className="cx-cal-container overflow-hidden">
                  <ReactCalendar
                    value={calendarSelectedDate}
                    onChange={(d) => setCalendarSelectedDate(d)}
                    minDate={new Date()}
                    tileContent={({ date, view }) => {
                      if (view === 'month') {
                        const dateIso = formatIsoDate(date);
                        const hasBooking = appointments.some(
                          (a) => a.slot_iso_timestamp.startsWith(dateIso) && a.status !== 'cancelled'
                        );
                        if (hasBooking) {
                          return <span className="cx-cal-dot" title="Has Booked Appointments" />;
                        }
                      }
                      return null;
                    }}
                  />
                </div>

                {/* Doctor Selection Filter */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <label htmlFor="doc_filter" className="block text-xs font-semibold text-slate-700">
                    Filter by Attending Doctor:
                  </label>
                  <select
                    id="doc_filter"
                    value={selectedDoctorFilter}
                    onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                    className="w-full h-9 px-3.5 bg-white border border-[rgba(15,23,42,0.16)] rounded-[10px] text-xs text-[#0E1A2E] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                  >
                    <option value="">All Doctors (Default Schedule)</option>
                    {(clinic.doctors || []).map((doc, idx) => (
                      <option key={idx} value={doc.name}>
                        {doc.name} ({doc.timings || 'Regular Hours'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[0.6875rem] text-slate-500">
                    Clinic Hours: <strong>{clinic.working_hours}</strong> | Slot Duration: <strong>{clinic.slot_duration_minutes || 30} mins</strong>
                  </p>
                </div>
              </div>

              {/* Right Column: Time Slots Grid for Selected Date */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Time Slots for{' '}
                      <span className="text-blue-700">
                        {calendarSelectedDate.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedDoctorFilter || 'All Registered Doctors'}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-[#BCDCFF] rounded-full text-xs font-semibold leading-none whitespace-nowrap text-[#155BBA] bg-[#EEF6FF]">
                    {calendarSlots.filter((s) => s.available).length} Available / {calendarSlots.length} Total
                  </span>
                </div>

                {/* Slots Loading State */}
                {loadingSlots ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full border-[3px] border-[#D9EBFF] border-t-[#155BBA] animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Checking live slot availability...</span>
                  </div>
                ) : calendarSlots.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-[0.9375rem] font-semibold text-[#0E1A2E]">No time slots found for this date.</p>
                    <p className="max-w-[26rem] mx-auto mt-1.5 text-[0.8125rem] text-[#64748B]">Please pick another date from the calendar on the left.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 max-h-[520px] overflow-y-auto pr-1">
                    {calendarSlots.map((slot, idx) => {
                      const isPast = slot.is_past;
                      const isBooked = slot.is_booked;
                      const isAvailable = slot.available;

                      return (
                        <div
                          key={idx}
                          className={`rounded-[10px] p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between border ${
                            isBooked
                              ? 'bg-[#FDFEFE] border-[#E2E8F0]'
                              : isPast
                              ? 'bg-[#F8FAFC] opacity-70 border-[rgba(15,23,42,0.09)]'
                              : 'border-blue-200/80 bg-blue-50/20 hover:border-blue-300 hover:shadow-[0_4px_16px_-4px_rgba(37,99,235,0.12)]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-sm font-bold text-slate-900 tabular-nums">
                                {slot.display_time}
                              </span>

                              {isBooked ? (
                                <span className="inline-flex items-center gap-1 h-5 px-2 border border-[#FDE68A] rounded-full text-[0.6875rem] font-semibold leading-none whitespace-nowrap text-[#B45309] bg-[#FFFBEB]">
                                  Booked
                                </span>
                              ) : isPast ? (
                                <span className="inline-flex items-center gap-1 h-5 px-2 border border-[rgba(15,23,42,0.16)] rounded-full text-[0.6875rem] font-semibold leading-none whitespace-nowrap text-[#3B4A63] bg-[#F8FAFC]">
                                  Passed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 h-5 px-2 border border-[#A7F3D0] rounded-full text-[0.6875rem] font-semibold leading-none whitespace-nowrap text-[#047857] bg-[#ECFDF5]">
                                  Available
                                </span>
                              )}
                            </div>

                            {/* Booked Appointment Details */}
                            {isBooked && slot.appointment && (
                              <div className="py-1 px-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs mb-1.5 space-y-0.5">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="font-semibold text-slate-900 truncate text-xs">
                                    👤 {slot.appointment.patient_name}
                                  </p>
                                  <p className="text-slate-600 tabular-nums text-[0.6875rem] shrink-0">
                                    📞 {slot.appointment.patient_phone}
                                  </p>
                                </div>
                                <p className="text-slate-600 truncate text-[0.6875rem]">
                                  🩺 {slot.appointment.service_type || 'Consultation'}
                                </p>
                              </div>
                            )}

                            {!isBooked && (
                              <p className="text-xs text-slate-600 mb-1.5">
                                👨‍⚕️ {slot.doctor_name}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            {isBooked && slot.appointment ? (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(slot.appointment.booking_id)}
                                disabled={cancellingBookingId === slot.appointment.booking_id}
                                className="w-full text-xs font-semibold py-0.5 px-2.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                              >
                                {cancellingBookingId === slot.appointment.booking_id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Cancelling...</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" />
                                    <span>Cancel Booking</span>
                                  </>
                                )}
                              </button>
                            ) : isAvailable ? (
                              <button
                                type="button"
                                onClick={() => handleOpenBookingModal(slot)}
                                className="w-full text-xs font-semibold py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Book Patient</span>
                              </button>
                            ) : (
                              <span className="text-[0.6875rem] text-slate-400 italic">Slot Expired</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. DIRECT MANUAL BOOKING MODAL */}
          {bookingModalOpen && selectedSlotForBooking && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden cx-enter">
                <div className="p-4 sm:p-5 border-b border-slate-200/70 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-slate-900">
                      Book Patient Appointment
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Slot: <strong>{selectedSlotForBooking.display_time}</strong> on{' '}
                      <strong>
                        {calendarSelectedDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleDirectBookSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={bookingPatientName}
                      onChange={(e) => setBookingPatientName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[rgba(15,23,42,0.16)] rounded-[10px] text-sm text-[#0E1A2E] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Contact Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={bookingPatientPhone}
                      onChange={(e) => setBookingPatientPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[rgba(15,23,42,0.16)] rounded-[10px] text-sm text-[#0E1A2E] font-mono transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor
                    </label>
                    <select
                      value={bookingDoctor}
                      onChange={(e) => setBookingDoctor(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[rgba(15,23,42,0.16)] rounded-[10px] text-sm text-[#0E1A2E] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                    >
                      {(clinic.doctors || []).map((doc, idx) => (
                        <option key={idx} value={doc.name}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Visit / Procedure
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Routine Consultation, Teeth Cleaning"
                      value={bookingService}
                      onChange={(e) => setBookingService(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[rgba(15,23,42,0.16)] rounded-[10px] text-sm text-[#0E1A2E] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[#2B8AF7] focus:ring-2 focus:ring-[#2B8AF7]/20"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingModalOpen(false)}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-[rgba(15,23,42,0.16)] rounded-[8px] text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-[#0E1A2E] bg-white shadow-[0_1px_2px_rgba(14,26,46,0.04)] hover:bg-[#F8FAFC] hover:border-[rgba(15,23,42,0.26)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBooking}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-[rgba(21,91,186,0.6)] rounded-[8px] text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-white bg-gradient-to-b from-[#2B8AF7] to-[#155BBA] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(21,112,224,0.3)] hover:bg-gradient-to-b hover:from-[#155BBA] hover:to-[#155BBA] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_6px_16px_-8px_rgba(21,112,224,0.6)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8AF7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingBooking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Confirming Booking...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm & Book Slot</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             CALENDLY INTEGRATION (PRESERVED - COMMENTED OUT AS REQUESTED)
             ═══════════════════════════════════════════════════════════════════ */}
          {/*
          <div className="rounded-[14px] bg-white border border-[rgba(15,23,42,0.09)] shadow-[0_1px_2px_rgba(14,26,46,0.04),0_10px_28px_-18px_rgba(23,76,150,0.22)] opacity-50">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-[1.125rem_1.5rem] border-b border-[rgba(15,23,42,0.09)]">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[#0E1A2E] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Legacy Calendly Integration (Preserved)
              </h2>
            </div>
            <form onSubmit={handleSaveCalendly} className="p-5 sm:p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-800">Calendly Scheduling Link</label>
                <input
                  type="text"
                  value={calendlyLink}
                  onChange={(e) => setCalendlyLink(e.target.value)}
                  placeholder="https://calendly.com/dr-sharma-clinic/consultation"
                  className="w-full h-10 px-3 rounded-[10px] bg-white border border-[rgba(15,23,42,0.16)] text-sm text-[#0E1A2E] placeholder:text-[#64748B] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800">Calendly API Key</label>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={calendlyApiKey}
                  onChange={(e) => setCalendlyApiKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full h-10 px-3 rounded-[10px] bg-white border border-[rgba(15,23,42,0.16)] text-sm font-mono text-[#0E1A2E] placeholder:text-[#64748B] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-all"
                />
              </div>
              <button type="submit" disabled={savingCalendly} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium text-white bg-gradient-to-b from-[#2B8AF7] to-[#1570E0] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(21,112,224,0.3)] hover:brightness-105 active:scale-[0.98] transition-all">
                Save Calendly Settings
              </button>
            </form>
          </div>
          */}

        </section>
      )}

    </div>
  );
}
