import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export default function AppointmentsPage() {
  const { appointments, dateFilteredAppointments } = useClinic();
  const [apptsPage, setApptsPage] = useState(1);
  const rowsPerPage = 10;

  // Pagination calculation for Appointments (10 rows per page)
  const totalApptsPages = Math.ceil(dateFilteredAppointments.length / rowsPerPage) || 1;
  const currentApptsPage = Math.min(apptsPage, totalApptsPages);
  const startApptsIdx = (currentApptsPage - 1) * rowsPerPage;
  const paginatedAppts = dateFilteredAppointments.slice(startApptsIdx, startApptsIdx + rowsPerPage);

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
    <section
      className="cx-panel-enter bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)]"
      role="region"
      aria-label="Appointments"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-900/[0.09]">
        <div>
          <h2 className="text-base font-semibold tracking-tight-10 text-ink">Appointments Booked by Voice AI</h2>
          <p className="mt-0.5 text-13 text-ink-muted">Directly synchronized into clinic database</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-blue-200 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-blue-700 bg-blue-50">
            {appointments.length} Total Booked
          </span>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="grid place-items-center w-12 h-12 mx-auto mb-3.5 rounded-xl text-slate-400 bg-tint-blue-15">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-15 font-semibold text-ink">No appointments booked yet.</p>
          <p className="max-w-[26rem] mx-auto mt-1.5 text-13 text-ink-muted">
            Appointments scheduled by patients during AI calls will appear here immediately.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-13">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Doctor &amp; Service</th>
                  <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Patient Name</th>
                  <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Phone</th>
                  <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Booking ID</th>
                  <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09]">Slot Time</th>
                  <th className="px-4 py-2.5 sm:first:pl-6 sm:last:pr-6 text-11 font-semibold tracking-wide-60 uppercase whitespace-nowrap text-ink-muted bg-slate-50 border-b border-slate-900/[0.09] text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppts.map((apt) => (
                  <tr key={apt.booking_id} className="transition-colors duration-100 hover:bg-tint-blue-2 last:[&>td]:border-b-0">
                    <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-ink border-b border-slate-900/[0.06]">
                      <div className="font-semibold text-ink">{apt.doctor_name}</div>
                      <div className="mt-0.5 text-xs text-ink-muted">{apt.service_type}</div>
                    </td>
                    <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top text-ink border-b border-slate-900/[0.06] font-semibold">
                      {apt.patient_name}
                    </td>
                    <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] text-ink-soft tabular-nums whitespace-nowrap">
                      {apt.patient_phone}
                    </td>
                    <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] font-semibold text-blue-700 tabular-nums whitespace-nowrap">
                      {apt.booking_id}
                    </td>
                    <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] whitespace-nowrap font-medium tabular-nums">
                      {apt.display_time}
                    </td>
                    <td className="px-4 py-3.5 sm:first:pl-6 sm:last:pr-6 align-top border-b border-slate-900/[0.06] text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-tint-green-5 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-tint-green-9 bg-tint-green-2">
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
          {dateFilteredAppointments.length > rowsPerPage && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:px-6 sm:py-3.5 border-t border-slate-900/[0.09] bg-slate-50 rounded-b-14">
              <div className="text-13 text-ink-muted">
                Showing <b className="font-semibold text-ink tabular-nums">{startApptsIdx + 1}</b> to{' '}
                <b className="font-semibold text-ink tabular-nums">
                  {Math.min(startApptsIdx + rowsPerPage, dateFilteredAppointments.length)}
                </b>{' '}
                of <b className="font-semibold text-ink tabular-nums">{dateFilteredAppointments.length}</b> appointments
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setApptsPage((p) => Math.max(1, p - 1))}
                  disabled={currentApptsPage === 1}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 border border-slate-900/[0.16] rounded-lg text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-ink bg-white shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:bg-slate-50 hover:border-slate-900/[0.26] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`min-w-[2rem] h-8 px-2 border rounded-lg text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${currentApptsPage === num
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
                  onClick={() => setApptsPage((p) => Math.min(totalApptsPages, p + 1))}
                  disabled={currentApptsPage === totalApptsPages}
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
  );
}
