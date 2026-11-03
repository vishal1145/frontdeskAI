import React, { useEffect } from 'react';
import ReactCalendar from 'react-calendar';
import { 
  CalendarDays, Calendar, Clock, CheckCircle2, 
  Plus, X, RefreshCw 
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import CustomSelect from '../../components/CustomSelect';

export default function CalendarPage() {
  const {
    clinic,
    appointments,
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
  } = useClinic();

  const formatIsoDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (clinic?.clinic_id) {
      fetchCalendarSlots(calendarSelectedDate, selectedDoctorFilter);
    }
  }, [calendarSelectedDate, selectedDoctorFilter, clinic?.clinic_id]);

  if (!clinic) return null;

  const isMedical = clinic?.business_type === 'medical_store' || /medical|pharmacy|chemist|medicos|dawa/i.test(clinic?.clinic_name || '');

  return (
    <section className="cx-panel-enter space-y-6" role="region" aria-label={isMedical ? "Store Calendar & Timings" : "Clinic Calendar & Scheduling Control"}>
      {/* 1. MASTER FEATURE TOGGLE: ON / OFF SCHEDULING */}
      <div className="bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-900/[0.09]">
          <div>
            <h2 className="text-18 font-semibold tracking-tight-10 text-ink flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              {isMedical ? 'Store Calendar & Timings' : 'Clinic Calendar & Scheduling Control'}
            </h2>
            <p className="mt-0.5 text-13 text-ink-muted">
              {isMedical
                ? 'Configure store operating hours, monitor customer order pickups, and manage scheduling.'
                : 'Configure live time slots, monitor patient bookings, and enable/disable automated appointment scheduling.'}
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
              className="cx-toggle-switch cursor-pointer"
              data-state={schedulingEnabled ? 'on' : 'off'}
              role="switch"
              aria-checked={schedulingEnabled}
              title={schedulingEnabled ? 'Click to Pause Scheduling' : 'Click to Enable Scheduling'}
            >
              <span className="cx-toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 border-b border-slate-200/70">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-11 uppercase font-bold text-slate-500">Selected Date</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {calendarSelectedDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-11 uppercase font-bold text-slate-500">Total Slots</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 tabular-nums">
                {calendarSlots.length} Slots
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
              <span className="text-11 uppercase font-bold text-emerald-700">Available</span>
              <p className="text-sm font-semibold text-emerald-800 mt-0.5 tabular-nums">
                {calendarSlots.filter((s) => s.available).length} Open
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/70">
              <span className="text-11 uppercase font-bold text-blue-700">Booked</span>
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
                {isMedical ? 'Select Order / Pickup Date' : 'Select Consultation Date'}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarSelectedDate(new Date())}
                  className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
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
                  className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
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
                      (a) => a.slot_iso_timestamp?.startsWith(dateIso) && a.status !== 'cancelled'
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
                {isMedical ? 'Filter by Pharmacist / Staff:' : 'Filter by Attending Doctor:'}
              </label>
              <CustomSelect
                id="doc_filter"
                value={selectedDoctorFilter}
                onChange={setSelectedDoctorFilter}
                options={[
                  { value: '', label: isMedical ? 'All Pharmacists / Staff' : 'All Doctors' },
                  ...(clinic.doctors || []).map((doc) => ({
                    value: doc.name,
                    label: `${doc.name} (${doc.timings || 'Regular Hours'})`
                  }))
                ]}
                className="w-full h-9 px-3.5 bg-white border border-slate-900/[0.16] rounded-10 text-xs text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none hover:border-slate-400 cursor-pointer flex items-center justify-between gap-2"
                menuClassName="w-full"
              />
              <p className="text-11 text-slate-500">
                {isMedical ? 'Store Hours:' : 'Clinic Hours:'} <strong>{clinic.working_hours}</strong> | Slot Duration: <strong>{clinic.slot_duration_minutes || 30} mins</strong>
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
                  {selectedDoctorFilter || (isMedical ? 'All Registered Pharmacists & Staff' : 'All Registered Doctors')}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-blue-200 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-blue-700 bg-blue-50">
                {calendarSlots.filter((s) => s.available).length} Available / {calendarSlots.length} Total
              </span>
            </div>

            {/* Slots Loading State */}
            {loadingSlots ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-[3px] border-blue-100 border-t-blue-700 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Checking live slot availability...</span>
              </div>
            ) : calendarSlots.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-15 font-semibold text-ink">No time slots found for this date.</p>
                <p className="max-w-[26rem] mx-auto mt-1.5 text-13 text-ink-muted">Please pick another date from the calendar on the left.</p>
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
                      className={`rounded-10 p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between border ${
                        isBooked
                          ? 'bg-tint-cyan-1 border-slate-200'
                          : isPast
                            ? 'bg-slate-50 opacity-70 border-slate-900/[0.09]'
                            : 'border-blue-200/80 bg-blue-50/20 hover:border-blue-300 hover:shadow-[0_4px_16px_-4px_theme(colors.tint.blue.33_/_0.12)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm font-bold text-slate-900 tabular-nums">
                            {slot.display_time}
                          </span>

                          {isBooked ? (
                            <span className="inline-flex items-center gap-1 h-5 px-2 border border-tint-amber-3 rounded-full text-11 font-semibold leading-none whitespace-nowrap text-accent-amber-hover bg-accent-amber-light">
                              Booked
                            </span>
                          ) : isPast ? (
                            <span className="inline-flex items-center gap-1 h-5 px-2 border border-slate-900/[0.16] rounded-full text-11 font-semibold leading-none whitespace-nowrap text-ink-soft bg-slate-50">
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 h-5 px-2 border border-tint-green-5 rounded-full text-11 font-semibold leading-none whitespace-nowrap text-tint-green-9 bg-tint-green-2">
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
                              <p className="text-slate-600 tabular-nums text-11 shrink-0">
                                📞 {slot.appointment.patient_phone}
                              </p>
                            </div>
                            <p className="text-slate-600 truncate text-11">
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
                            className="w-full text-xs font-semibold py-0.5 px-2.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
                            className="w-full text-xs font-semibold py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isMedical ? 'Book Order / Slot' : 'Book Patient'}</span>
                          </button>
                        ) : (
                          <span className="text-11 text-slate-400 italic">Slot Expired</span>
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
                  {isMedical ? 'Create Customer Order / Booking' : 'Book Patient Appointment'}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectBookSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isMedical ? 'Customer Full Name *' : 'Patient Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isMedical ? "e.g. Ramesh Kumar" : "e.g. Ramesh Kumar"}
                  value={bookingPatientName}
                  onChange={(e) => setBookingPatientName(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-900/[0.16] rounded-10 text-sm text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isMedical ? 'Customer Contact Mobile *' : 'Patient Contact Mobile *'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={bookingPatientPhone}
                  onChange={(e) => setBookingPatientPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-900/[0.16] rounded-10 text-sm text-ink font-mono transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isMedical ? 'Pharmacist / Attending Staff' : 'Doctor'}
                </label>
                <CustomSelect
                  value={bookingDoctor}
                  onChange={(val) => {
                    setBookingDoctor(val);
                    setBookingService(getDoctorServices(val)[0] || (isMedical ? 'General Medicine' : 'General Consultation'));
                  }}
                  options={(clinic.doctors || []).map((doc) => ({
                    value: doc.name,
                    label: doc.name
                  }))}
                  className="w-full h-10 px-3 bg-white border border-slate-900/[0.16] rounded-10 text-sm text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none hover:border-slate-400 cursor-pointer flex items-center justify-between gap-2"
                  menuClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isMedical ? 'Requested Product / Service' : 'Reason for Visit / Procedure'}
                </label>
                {getDoctorServices(bookingDoctor).length > 0 ? (
                  <CustomSelect
                    value={bookingService}
                    onChange={setBookingService}
                    options={getDoctorServices(bookingDoctor).map((service) => ({
                      value: service,
                      label: service
                    }))}
                    className="w-full h-10 px-3 bg-white border border-slate-900/[0.16] rounded-10 text-sm text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none hover:border-slate-400 cursor-pointer flex items-center justify-between gap-2"
                    menuClassName="w-full"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={isMedical ? "e.g. Prescription medicines, First Aid items" : "e.g. Routine Consultation, Teeth Cleaning"}
                    value={bookingService}
                    onChange={(e) => setBookingService(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-900/[0.16] rounded-10 text-sm text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-slate-900/[0.16] rounded-8 text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-ink bg-white shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:bg-slate-50 hover:border-slate-900/[0.26] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-blue-700/[0.6] rounded-8 text-xs font-semibold leading-none whitespace-nowrap cursor-pointer select-none text-white bg-gradient-to-b from-blue-500 to-blue-700 shadow-[inset_0_1px_0_theme(colors.white_/_0.18),0_1px_2px_theme(colors.blue.600_/_0.3)] hover:bg-gradient-to-b hover:from-blue-700 hover:to-blue-700 hover:shadow-[inset_0_1px_0_theme(colors.white_/_0.14),0_6px_16px_-8px_theme(colors.blue.600_/_0.6)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingBooking ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Book Slot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
