import React, { useState, useEffect } from 'react';
import {
  Phone, Clock, Calendar, CreditCard, Search,
  ArrowUpRight, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, Download, X, Copy, User, UserCheck,
  FileText, Volume2, PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinic } from '../../context/ClinicContext';
import CallAudioPlayer from '../../components/CallAudioPlayer';
import CustomSelect from '../../components/CustomSelect';

export default function DashboardPage() {
  const {
    clinic,
    billing,
    callLogs,
    appointments,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customDate,
    setCustomDate,
    isDateInFilter,
    cardTotalCalls,
    cardDurationFormatted,
    cardTotalMinutes,
    cardTotalAppointments,
    cardTotalBillInr,
    refreshData,
    loading,
    exportCsv,
  } = useClinic();

  const [callsPage, setCallsPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState(null);
  const rowsPerPage = 20;

  const isMedical = clinic?.business_type === 'medical_store' || /medical|pharmacy|chemist|medicos|dawa/i.test(clinic?.clinic_name || '');

  // Escape key listener & scroll lock for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedCall(null);
    };
    if (selectedCall) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedCall]);

  // Match caller phone with appointment or order if available
  const cleanPhone = (p) => (p || '').replace(/\D/g, '').slice(-10);
  const matchedAppointment = selectedCall
    ? (appointments || []).find((apt) => {
        const aptPhone = cleanPhone(apt.patient_phone || apt.customer_phone);
        const callerPhone = cleanPhone(selectedCall.caller_phone);
        return aptPhone && callerPhone && aptPhone === callerPhone;
      })
    : null;

  const selectedDuration = Number(selectedCall?.duration_seconds || 0);
  const selectedStatus = String(selectedCall?.call_status || '').toUpperCase();
  const selectedIsShortCall = selectedDuration <= 10 || selectedStatus.includes('CANCEL');

  // Filter call logs based on search query and date filter
  const filteredLogs = callLogs.filter((log) => {
    const duration = Number(log.duration_seconds || 0);
    const status = String(log.call_status || '').toUpperCase();
    const isShortCall = duration <= 10 || status.includes('CANCEL');
    const dynamicTag = log.is_transferred
      ? (isMedical ? 'Forwarded to Pharmacist' : 'Forwarded to Doctor Reception')
      : (status.includes('BUSY') ? 'Unanswered Busy' : (isShortCall ? 'Missed Short Call' : (isMedical ? 'Medicine Inquiry Handled by AI' : 'Patient Inquiry Handled by AI')));

    const matchesSearch =
      (log.caller_phone || '').includes(searchQuery) ||
      (log.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      dynamicTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.transfer_reason || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (!isDateInFilter(log.created_at)) return false;

    return true;
  });

  // Reset pagination on search or date filter change
  useEffect(() => {
    setCallsPage(1);
  }, [searchQuery, dateFilter, customDate]);

  // Pagination calculation
  const totalCallsPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;
  const currentCallsPage = Math.min(callsPage, totalCallsPages);
  const startCallsIdx = (currentCallsPage - 1) * rowsPerPage;
  const paginatedLogs = filteredLogs.slice(startCallsIdx, startCallsIdx + rowsPerPage);

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

  return (
    <div className="space-y-6">
      {/* ─── Top Header: Title & Date Filter ───────────────────────── */}
      <div className="cx-enter flex items-center justify-between gap-4" style={{ '--i': 1 }}>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
        <div className="flex items-center gap-2 text-13 font-medium text-ink-muted flex-nowrap whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="shrink-0">Date & Day:</span>
          <CustomSelect
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val);
              if (val !== 'custom') setCustomDate('');
            }}
            align="right"
            options={[
              { value: 'all', label: 'All Dates & Days' },
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'last7', label: 'Last 7 Days' },
              { value: 'last30', label: 'Last 30 Days' },
              { value: 'custom', label: 'Pick Specific Date...' },
            ]}
            className="h-9 px-3.5 border border-slate-900/[0.16] rounded-10 bg-white text-13 text-ink font-medium cursor-pointer shrink-0 transition-[border-color,box-shadow,background-color] duration-150 hover:border-slate-900/[0.26] focus:outline-none flex items-center justify-between gap-2.5"
            menuClassName="w-48"
            aria-label="Filter call logs by date and day"
          />

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-9 px-3 border border-slate-900/[0.16] rounded-10 bg-white text-13 text-ink font-medium transition-[border-color,box-shadow] duration-150 hover:border-slate-900/[0.26] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              aria-label="Specific custom date"
            />
          )}
        </div>
      </div>

      {/* ─── Billing & Call Metrics KPI Cards ──────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" aria-label="Clinic metrics">

        {/* KPI 1: Total Calls */}
        <div
          className="cx-enter relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-14 bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] transition-[border-color,box-shadow] duration-200 hover:border-slate-900/[0.16] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-2 before:opacity-85 before:bg-blue-700"
          style={{ '--i': 1 }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-11 font-semibold tracking-wide-40 uppercase text-ink-muted">Total Calls Received</span>
            <div className="grid place-items-center shrink-0 w-7 h-7 rounded-8 text-blue-700 bg-blue-50">
              <Phone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5 text-26 sm:text-28 font-semibold leading-none tracking-tight-25 tabular-nums text-ink">
            {cardTotalCalls}
          </div>
          <p className="mt-1 text-12 text-ink-muted truncate">
            <span>Duration: <strong className="font-semibold text-ink-soft">{cardDurationFormatted}</strong></span>
          </p>
        </div>

        {/* KPI 2: Total Minutes */}
        <div
          className="cx-enter relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-14 bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] transition-[border-color,box-shadow] duration-200 hover:border-slate-900/[0.16] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-2 before:opacity-85 before:bg-tint-blue-30"
          style={{ '--i': 2 }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-11 font-semibold tracking-wide-40 uppercase text-ink-muted">Total Minutes</span>
            <div className="grid place-items-center shrink-0 w-7 h-7 rounded-8 text-tint-blue-30 bg-tint-blue-9">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5 text-26 sm:text-28 font-semibold leading-none tracking-tight-25 tabular-nums text-ink">
            <span>{cardTotalMinutes}</span>
            <span className="text-sm font-semibold text-ink-muted">mins</span>
          </div>
          <p className="mt-1 text-12 text-ink-muted truncate">
            Exact: {cardDurationFormatted} total call duration
          </p>
        </div>

        {/* KPI 3: Total Appointments Booked */}
        <div
          className="cx-enter relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-14 bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] transition-[border-color,box-shadow] duration-200 hover:border-slate-900/[0.16] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-2 before:opacity-85 before:bg-tint-green-7"
          style={{ '--i': 3 }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-11 font-semibold tracking-wide-40 uppercase text-ink-muted">
              {isMedical ? 'Medicine Orders Booked' : 'Appointments Booked'}
            </span>
            <div className="grid place-items-center shrink-0 w-7 h-7 rounded-8 text-tint-green-7 bg-tint-green-2">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5 text-26 sm:text-28 font-semibold leading-none tracking-tight-25 tabular-nums text-ink">
            {cardTotalAppointments}
          </div>
          <p className="mt-1 text-12 text-ink-muted truncate">
            {isMedical ? 'Orders & pickup noted via Voice AI' : '100% scheduled via Voice AI'}
          </p>
        </div>

        {/* KPI 4: Total Telephony & AI Bill (Commented out) */}
        {/*
        <div
          className="cx-enter relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-14 bg-white border border-slate-900/[0.09] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] transition-[border-color,box-shadow] duration-200 hover:border-slate-900/[0.16] before:content-[''] before:absolute before:-top-px before:left-5 before:right-5 before:h-[2px] before:rounded-b-2 before:opacity-85 before:bg-accent-sapphire"
          style={{ '--i': 4 }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-11 font-semibold tracking-wide-40 uppercase text-ink-muted">Current Bill Amount</span>
            <div className="grid place-items-center shrink-0 w-7 h-7 rounded-8 text-accent-sapphire bg-accent-sapphire-light">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5 text-26 sm:text-28 font-semibold leading-none tracking-tight-25 tabular-nums text-ink">
            ₹{cardTotalBillInr}
          </div>
          <p className="mt-1 text-12 text-ink-muted truncate">
            Live Vobiz Carrier Telephony Actuals
          </p>
        </div>
        */}
      </section>

      {/* ─── Call Logs Main Table Panel ───────────────────────────── */}
      <section
        className="cx-panel-enter bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)]"
        role="region"
        aria-label="Call Logs"
      >
        {/* Table Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-6 sm:py-3.5 border-b border-slate-900/[0.09]">
          <div className="relative flex-1 max-w-[26rem] group">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors duration-150 group-focus-within:text-blue-700" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone number"
              className="w-full h-9 pl-9 pr-3.5 border border-slate-900/[0.16] rounded-10 bg-white text-13 text-ink placeholder-slate-400 transition-[border-color,box-shadow,background-color] duration-150 hover:border-slate-900/[0.26] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              aria-label="Search call logs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 border border-slate-900/[0.16] rounded-10 text-13 font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-ink bg-white shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:bg-slate-50 hover:border-slate-900/[0.26] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={exportCsv}
              disabled={!callLogs.length}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 border border-slate-900/[0.16] rounded-10 text-13 font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-ink bg-white shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:bg-slate-50 hover:border-slate-900/[0.26] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredLogs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="grid place-items-center w-12 h-12 mx-auto mb-3.5 rounded-xl text-slate-400 bg-tint-blue-15">
              <Phone className="w-5 h-5" />
            </div>
            <p className="text-15 font-semibold text-ink">No call records found.</p>
            <p className="max-w-[26rem] mx-auto mt-1.5 text-13 text-ink-muted">
              {searchQuery || dateFilter !== 'all'
                ? 'No calls match the current filters. Try resetting your search or date filter.'
                : 'Live calls received by your AI Receptionist on virtual lines will automatically log here in real time.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-left text-13">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Caller</th>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Call ID</th>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Duration</th>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Cost (INR)</th>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Date / Time</th>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Status &amp; Reason</th>
                    <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Recording</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => {
                    const duration = Number(log.duration_seconds || 0);
                    const status = String(log.call_status || '').toUpperCase();
                    const isShortCall = duration <= 10 || status.includes('CANCEL');

                    const dynamicTag = log.is_transferred
                      ? (isMedical ? 'Forwarded to Pharmacist' : 'Forwarded to Doctor Reception')
                      : (status.includes('BUSY') ? 'Unanswered Busy' : (isShortCall ? 'Missed Short Call' : (isMedical ? 'Medicine Inquiry Handled by AI' : 'Patient Inquiry Handled by AI')));

                    return (
                      <tr 
                        key={log.call_sid} 
                        onClick={() => setSelectedCall(log)}
                        className="transition-colors duration-150 hover:!bg-tint-blue-12/80 cursor-pointer last:[&>td]:border-b-0 group/tr"
                        title="Click to view full caller & call details"
                      >
                        {/* Caller */}
                        <td className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] text-ink font-medium whitespace-nowrap">
                          <div className="font-semibold flex items-center justify-between gap-1.5">
                            <span>{log.caller_phone || 'Anonymous'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/tr:text-blue-500 transition-colors shrink-0" />
                          </div>
                          <div className="text-11 text-slate-400 font-mono mt-0.5">To: {log.called_number}</div>
                        </td>

                        {/* Call ID */}
                        <td className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] font-mono text-xs text-ink-muted">
                          <span className="font-semibold text-blue-700">{log.call_sid.substring(0, 10)}...</span>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] text-ink-soft whitespace-nowrap tabular-nums">
                          <div>
                            <b>{Math.floor(duration / 60)}m {duration % 60}s</b>
                          </div>
                          <div className="text-11 text-ink-muted">
                            {log.billable_minutes || Math.ceil(duration / 60)} min billable
                          </div>
                        </td>

                        {/* Cost (INR) */}
                        <td className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] font-semibold text-ink tabular-nums whitespace-nowrap">
                          ₹{Number(log.cost_inr || 0).toFixed(2)}
                        </td>

                        {/* Date / Time */}
                        <td className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] text-ink-muted whitespace-nowrap text-xs">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Status & Reason */}
                        <td className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06]">
                          {log.is_transferred ? (
                            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-tint-amber-2 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-tint-amber-5 bg-tint-amber-1">
                              <ArrowUpRight className="w-3 h-3 text-tint-amber-4" />
                              Transfer to {log.transfer_destination || (isMedical ? 'Pharmacist Phone' : 'Doctor Phone')}
                            </span>
                          ) : isShortCall ? (
                            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-tint-rose-4 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-tint-rose-8 bg-tint-rose-1">
                              <AlertTriangle className="w-3 h-3 text-tint-rose-7" />
                              {dynamicTag}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-tint-green-5 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-tint-green-9 bg-tint-green-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-tint-green-7" />
                              {dynamicTag}
                            </span>
                          )}

                          {log.transfer_reason && (
                            <div className="text-11 text-amber-900 mt-1.5 font-medium bg-amber-50/80 p-1.5 px-2 rounded-lg border border-amber-200/60 max-w-xs leading-snug">
                              Reason: {log.transfer_reason}
                            </div>
                          )}
                        </td>

                        {/* Recording */}
                        <td 
                          className="px-4 py-3 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CallAudioPlayer log={log} clinicId={clinic?.clinic_id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredLogs.length > rowsPerPage && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-6 sm:py-3.5 border-t border-slate-900/[0.09] bg-slate-50 rounded-b-14">
                <div className="text-13 text-ink-muted">
                  Showing <b className="font-semibold text-ink tabular-nums">{startCallsIdx + 1}</b> to{' '}
                  <b className="font-semibold text-ink tabular-nums">
                    {Math.min(startCallsIdx + rowsPerPage, filteredLogs.length)}
                  </b>{' '}
                  of <b className="font-semibold text-ink tabular-nums">{filteredLogs.length}</b> records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCallsPage((p) => Math.max(1, p - 1))}
                    disabled={currentCallsPage === 1}
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-slate-900/[0.16] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-ink bg-white shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:bg-slate-50 hover:border-slate-900/[0.26] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers(currentCallsPage, totalCallsPages).map((num, i) =>
                      num === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={num}
                          onClick={() => setCallsPage(num)}
                          aria-current={currentCallsPage === num ? 'page' : undefined}
                          className={`min-w-[2rem] h-8 px-2 border rounded-lg text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${currentCallsPage === num
                            ? 'text-white bg-blue-700 border-blue-700'
                            : 'text-ink-soft bg-white border-slate-900/[0.16] hover:bg-slate-50 hover:border-slate-900/[0.26] hover:text-ink'
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
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-slate-900/[0.16] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-ink bg-white shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:bg-slate-50 hover:border-slate-900/[0.26] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Selected Call & Caller Details Modal (Super Admin Deep Dive Design) */}
      {selectedCall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedCall(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/30 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight truncate">
                      {matchedAppointment?.patient_name ? matchedAppointment.patient_name : (selectedCall.caller_phone || 'Inbound Caller')}
                    </h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedCall.is_transferred
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        : selectedIsShortCall
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedCall.is_transferred ? 'bg-amber-500' : selectedIsShortCall ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                      }`} />
                      {selectedCall.is_transferred
                        ? (isMedical ? 'Forwarded to Pharmacist' : 'Forwarded to Doctor Reception')
                        : selectedIsShortCall
                        ? 'Short / Missed Call'
                        : (isMedical ? 'Medicine Inquiry Handled' : 'Patient Inquiry Handled')}
                    </span>
                    {isMedical ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        💊 Pharmacy Caller
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        🏥 Clinic Patient
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono text-11 text-slate-400">
                      Call ID: {selectedCall.call_sid}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      AI Receptionist: {clinic?.receptionist_name || 'Riya'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0 cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Core Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Duration */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between">
                  <span className="text-10 font-bold text-blue-600 uppercase tracking-wider">Call Duration</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-blue-900 tabular-nums">
                      {Math.floor(selectedDuration / 60)}m {selectedDuration % 60}s
                    </span>
                    <span className="text-11 font-medium text-blue-500">total</span>
                  </div>
                </div>

                {/* Billable Minutes */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
                  <span className="text-10 font-bold text-emerald-600 uppercase tracking-wider">Billable Usage</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-emerald-900 tabular-nums">
                      {selectedCall.billable_minutes || Math.ceil(selectedDuration / 60)}
                    </span>
                    <span className="text-11 font-medium text-emerald-600">min</span>
                  </div>
                </div>

                {/* Telephony Cost */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col justify-between">
                  <span className="text-10 font-bold text-purple-600 uppercase tracking-wider">Telephony Cost</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-purple-900 tabular-nums">
                      ₹{Number(selectedCall.cost_inr || 0).toFixed(2)}
                    </span>
                    <span className="text-11 font-medium text-purple-500">INR</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
                  <span className="text-10 font-bold text-amber-700 uppercase tracking-wider">Call Timestamp</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-bold text-amber-900 truncate">
                      {new Date(selectedCall.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-10 font-medium text-amber-600 whitespace-nowrap">
                      {new Date(selectedCall.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Telephony Connection Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Telephony Connection Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Caller Phone */}
                  <div className="py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white">
                    <span className="text-xs text-slate-500 block">Caller Phone (Inbound)</span>
                    <span className="font-semibold text-slate-800 text-sm tracking-wide block truncate font-mono">
                      {selectedCall.caller_phone || 'Anonymous'}
                    </span>
                  </div>

                  {/* Virtual Dialed Line */}
                  <div className="py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white">
                    <span className="text-xs text-slate-500 block">Dialed Virtual AI Receptionist Line</span>
                    <span className="font-semibold text-blue-600 text-sm tracking-wide block truncate font-mono">
                      {selectedCall.called_number || ((Array.isArray(clinic?.virtual_phone_numbers) && clinic?.virtual_phone_numbers[0]) || '+91 8065355910')}
                    </span>
                  </div>

                  {/* Telephony Call SID with Copy */}
                  <div className="py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white sm:col-span-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs text-slate-500 block">Carrier Telephony Call SID</span>
                      <span className="font-mono text-xs text-slate-800 block truncate" title={selectedCall.call_sid}>
                        {selectedCall.call_sid}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedCall.call_sid);
                        toast.success('Call SID copied to clipboard');
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked Customer / Booking Record (if found) */}
              {matchedAppointment ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    {isMedical ? 'Linked Order & Customer Details' : 'Linked Patient & Appointment Record'}
                  </h3>
                  <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="py-2 px-3 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-11 text-emerald-700 font-semibold block uppercase">
                          {isMedical ? 'Customer Name' : 'Patient Name'}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {matchedAppointment.patient_name || 'Customer on Call'}
                        </span>
                      </div>
                      <div className="py-2 px-3 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-11 text-emerald-700 font-semibold block uppercase">
                          Contact Phone
                        </span>
                        <span className="text-sm font-mono font-semibold text-slate-900">
                          {matchedAppointment.patient_phone || selectedCall.caller_phone}
                        </span>
                      </div>
                      <div className="py-2 px-3 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-11 text-emerald-700 font-semibold block uppercase">
                          {isMedical ? 'Order Type / Schedule' : 'Booked Time Slot'}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {matchedAppointment.display_time || (matchedAppointment.slot_iso_timestamp ? new Date(matchedAppointment.slot_iso_timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Scheduled')}
                        </span>
                      </div>
                      <div className="py-2 px-3 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-11 text-emerald-700 font-semibold block uppercase">
                          {isMedical ? 'Delivery / Store' : 'Doctor / Specialist'}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {matchedAppointment.doctor_name || (isMedical ? 'Store Counter' : 'Consultant')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Caller Profile &amp; Receptionist Context
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <span className="text-xs text-slate-500 block">Caller Identity</span>
                      <span className="font-semibold text-slate-800 text-sm tracking-wide block truncate">
                        Direct Inbound Caller ({selectedCall.caller_phone || 'Unlisted'})
                      </span>
                    </div>
                    <div className="py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <span className="text-xs text-slate-500 block">Associated Business</span>
                      <span className="font-semibold text-slate-800 text-sm tracking-wide block truncate">
                        {clinic?.clinic_name || 'FrontDesk AI Portal'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Summary & AI Interaction */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Call Summary &amp; Conversation Details
                </h3>
                <div className="py-3 px-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                  {selectedCall.summary ? (
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      {selectedCall.summary}
                    </p>
                  ) : selectedCall.transfer_reason ? (
                    <div className="text-xs sm:text-sm text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80">
                      <strong className="block mb-0.5">Call Forwarding Note:</strong>
                      {selectedCall.transfer_reason}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Inbound phone conversation handled automatically by FrontDesk AI Receptionist ({clinic?.receptionist_name || 'Riya'}). Caller inquiry was addressed according to current business schedule and parameters.
                    </p>
                  )}
                </div>
              </div>

              {/* Call Recording Playback */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  Call Recording &amp; Voice Audio
                </h3>
                <div className="py-3 px-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
                  <CallAudioPlayer log={selectedCall} clinicId={clinic?.clinic_id} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 sm:px-8 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-mono">
                FrontDesk AI Telephony Record
              </span>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
