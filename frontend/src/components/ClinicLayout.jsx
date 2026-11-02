import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export default function ClinicLayout({ activePage, setActivePage, extraActions, children }) {
  const { clinic, callLogs, appointments, loading, refreshData, schedulingEnabled, exportCsv } = useClinic();

  if (!clinic) {
    return (
      <div className="cx-page min-h-[60vh] flex items-center justify-center" data-motion-scope="clinic">
        <div className="w-8 h-8 rounded-full border-[3px] border-blue-100 border-t-blue-700 animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  const normalizedPage = activePage === 'doctors-services' || activePage === 'doctors'
    ? 'doctors'
    : (activePage === 'portal' || activePage === 'calls' ? 'dashboard' : activePage);

  return (
    <div
      className="cx-page min-h-[calc(100vh-4.25rem)] max-w-[80rem] mx-auto px-4 py-6 pb-12 sm:px-6 sm:py-8 sm:pb-16 lg:px-8 lg:py-9 lg:pb-16 space-y-6 text-ink font-sans"
      data-motion-scope="clinic"
    >
      {/* ─── Top Actions: Extra Actions if any ─────────────────────────── */}
      {extraActions && (
        <div className="cx-enter flex items-center justify-end gap-2" style={{ '--i': 1 }}>
          {extraActions}
        </div>
      )}

      {/* ─── Page Dynamic Content ──────────────────────────────────── */}
      {children}
    </div>
  );
}
