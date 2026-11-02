import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ClinicContext = createContext(null);

export function ClinicProvider({ clinicUser, onLogout, setActivePage, children }) {
  const [clinic, setClinic] = useState(clinicUser || null);
  const [billing, setBilling] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'custom'
  const [customDate, setCustomDate] = useState('');

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
        } catch (e) {
          console.error('Error parsing stored clinic auth:', e);
        }
      }
    }

    if (!activeClinic) {
      if (setActivePage) setActivePage('login');
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

  const refreshData = async () => {
    if (!clinic?.clinic_id) return;
    await fetchDashboardData(clinic.clinic_id);
    if (calendarSelectedDate) {
      await fetchCalendarSlots(calendarSelectedDate, selectedDoctorFilter);
    }
    toast.success('Clinic data refreshed successfully!');
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

  // A doctor with no assigned services handles everything the clinic offers
  const getDoctorServices = (doctorName) => {
    const assigned = clinic?.doctors?.find((doc) => doc.name === doctorName)?.services;
    return assigned?.length > 0 ? assigned : (clinic?.services || []);
  };

  const handleOpenBookingModal = (slot) => {
    setSelectedSlotForBooking(slot);
    const doctorName = slot.doctor_name || selectedDoctorFilter || clinic?.doctors?.[0]?.name || 'Clinic Doctor';
    setBookingDoctor(doctorName);
    setBookingService(getDoctorServices(doctorName)[0] || 'General Consultation');
    setBookingPatientName('');
    setBookingPatientPhone('');
    setBookingModalOpen(true);
  };

  const handleDirectBookSubmit = async (e) => {
    if (e) e.preventDefault();
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

  const isDateInFilter = (dateInput) => {
    if (!dateInput) return false;
    if (dateFilter === 'all') return true;

    const targetDate = new Date(dateInput);
    if (isNaN(targetDate.getTime())) return false;
    const targetDateStr = targetDate.toLocaleDateString('en-CA');
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');

    if (dateFilter === 'today') {
      return targetDateStr === todayStr;
    } else if (dateFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterdayStr = y.toLocaleDateString('en-CA');
      return targetDateStr === yesterdayStr;
    } else if (dateFilter === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return targetDate >= sevenDaysAgo;
    } else if (dateFilter === 'last30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return targetDate >= thirtyDaysAgo;
    } else if (dateFilter === 'custom' && customDate) {
      return targetDateStr === customDate;
    }
    return true;
  };

  // Date-filtered datasets
  const dateFilteredCalls = dateFilter === 'all'
    ? callLogs
    : callLogs.filter(log => isDateInFilter(log.created_at));

  const dateFilteredAppointments = dateFilter === 'all'
    ? appointments
    : appointments.filter(apt => isDateInFilter(apt.slot_iso_timestamp) || isDateInFilter(apt.created_at));

  // ─── Reactive KPI Cards Calculations Based on Date Filter ───
  const cardTotalCalls = dateFilter === 'all'
    ? (billing?.total_calls ?? callLogs.length)
    : dateFilteredCalls.length;

  const cardDurationSec = dateFilter === 'all' && billing?.total_duration_seconds != null
    ? Number(billing.total_duration_seconds)
    : dateFilteredCalls.reduce((acc, l) => acc + (Number(l.duration_seconds) || 0), 0);

  const cardDurationFormatted = dateFilter === 'all' && billing?.total_duration_formatted
    ? billing.total_duration_formatted
    : `${Math.floor(cardDurationSec / 60)}m ${cardDurationSec % 60}s`;

  const cardTotalMinutes = Math.round(cardDurationSec / 60);
  const cardTotalAppointments = dateFilteredAppointments.length;
  const cardTotalBillInr = dateFilter === 'all' && billing?.total_bill_inr != null
    ? Number(billing.total_bill_inr).toFixed(2)
    : dateFilteredCalls.reduce((acc, l) => acc + (Number(l.cost_inr) || 0), 0).toFixed(2);

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

  const value = {
    exportCsv,
    clinic,
    setClinic,
    billing,
    callLogs,
    appointments,
    loading,
    refreshData,
    fetchDashboardData,

    // Filters & Search
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customDate,
    setCustomDate,
    isDateInFilter,
    dateFilteredCalls,
    dateFilteredAppointments,

    // Reactive KPI Metrics
    cardTotalCalls,
    cardDurationFormatted,
    cardTotalMinutes,
    cardTotalAppointments,
    cardTotalBillInr,

    // Calendar & Scheduling
    calendarSelectedDate,
    setCalendarSelectedDate,
    calendarSlots,
    loadingSlots,
    fetchCalendarSlots,
    selectedDoctorFilter,
    setSelectedDoctorFilter,
    schedulingEnabled,
    togglingScheduling,
    handleToggleScheduling,

    // Manual Booking & Cancellation
    bookingModalOpen,
    setBookingModalOpen,
    selectedSlotForBooking,
    bookingPatientName,
    setBookingPatientName,
    bookingPatientPhone,
    setBookingPatientPhone,
    bookingService,
    setBookingService,
    bookingDoctor,
    setBookingDoctor,
    submittingBooking,
    getDoctorServices,
    handleOpenBookingModal,
    handleDirectBookSubmit,
    cancellingBookingId,
    handleCancelAppointment,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
