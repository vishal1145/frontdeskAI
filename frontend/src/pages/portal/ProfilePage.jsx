import React, { useState, useEffect, useRef } from 'react';
import ReactCalendar from 'react-calendar';
import { Building2, ShieldCheck, Pencil, Check, X, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinic } from '../../context/ClinicContext';

const RECEPTIONIST_OPTIONS = [
  'Neha',
  'Pooja',
  'Priya',
  'Shivani',
  'Riya',
  'Aditi'
];

const WORKING_HOURS_OPTIONS = [
  'Monday to Saturday, 10:00 AM - 08:00 PM',
  'Monday to Saturday, 09:00 AM - 08:00 PM',
  'Monday to Saturday, 09:00 AM - 07:00 PM',
  'Monday to Saturday, 10:00 AM - 07:00 PM',
  'Monday to Saturday, 11:00 AM - 08:00 PM',
  'Monday to Saturday, 10:00 AM - 02:00 PM & 04:30 PM - 08:00 PM',
  'Monday to Friday, 09:00 AM - 06:00 PM',
  'Monday to Friday, 10:00 AM - 07:00 PM',
  'Monday to Friday, 10:00 AM - 08:00 PM',
  'All Days (Mon - Sun), 09:00 AM - 08:00 PM',
  'All Days (Mon - Sun), 10:00 AM - 08:00 PM',
  'All Days (Mon - Sun), 10:00 AM - 09:00 PM'
];

const COMMON_DAYS_PRESETS = [
  'Monday to Saturday',
  'Monday to Friday',
  'All Days (Mon - Sun)',
  'Mon, Wed, Fri',
  'Tue, Thu, Sat',
  'Weekend (Sat - Sun)'
];

const COMMON_TIMING_OPTIONS = [
  '10:00 AM - 08:00 PM',
  '09:00 AM - 08:00 PM',
  '09:00 AM - 07:00 PM',
  '10:00 AM - 07:00 PM',
  '10:00 AM - 02:00 PM & 04:30 PM - 08:00 PM',
  '09:00 AM - 06:00 PM',
  '11:00 AM - 08:00 PM',
  '10:00 AM - 09:00 PM'
];

export default function ProfilePage() {
  const { clinic, setClinic } = useClinic();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clinic_name: '',
    contact_phone: '',
    receptionist_name: '',
    address: '',
    working_hours: '',
    slot_duration_minutes: 30
  });

  // Calendar Schedule Modal State for Working Hours
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState('Monday to Saturday');
  const [selectedTiming, setSelectedTiming] = useState('10:00 AM - 08:00 PM');
  const modalScrollRef = useRef(null);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (!showCalendarModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showCalendarModal]);

  const parsePhoneTo10 = (phoneStr) => {
    let raw = (phoneStr || '').replace(/[^0-9]/g, '');
    if (raw.startsWith('91') && raw.length > 10) {
      raw = raw.slice(2);
    }
    return raw.slice(0, 10);
  };

  useEffect(() => {
    if (clinic) {
      setFormData({
        clinic_name: (clinic.clinic_name || '').replace(/[0-9]/g, '').slice(0, 50),
        contact_phone: parsePhoneTo10(clinic.contact_phone),
        receptionist_name: clinic.receptionist_name || 'Neha',
        address: (clinic.address || '').slice(0, 200),
        working_hours: clinic.working_hours || 'Monday to Saturday, 10:00 AM - 08:00 PM',
        slot_duration_minutes: Number(clinic.slot_duration_minutes) || 30
      });
    }
  }, [clinic]);

  if (!clinic) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clinic_name') {
      // Disallow any digits (0-9) and enforce max 50 characters
      const noNumbers = value.replace(/[0-9]/g, '').slice(0, 50);
      setFormData((prev) => ({ ...prev, clinic_name: noNumbers }));
      return;
    }
    if (name === 'contact_phone') {
      // Max 10 digits, only numbers allowed
      let digits = value.replace(/[^0-9]/g, '');
      if (digits.startsWith('91') && digits.length > 10) {
        digits = digits.slice(2);
      }
      digits = digits.slice(0, 10);
      setFormData((prev) => ({ ...prev, contact_phone: digits }));
      return;
    }
    if (name === 'address') {
      // Max 200 characters
      setFormData((prev) => ({ ...prev, address: value.slice(0, 200) }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'slot_duration_minutes' ? Number(value) : value
    }));
  };

  const openCalendarModal = () => {
    if (formData.working_hours) {
      const parts = formData.working_hours.split(',');
      if (parts.length >= 2) {
        setSelectedDays(parts[0].trim());
        setSelectedTiming(parts.slice(1).join(',').trim());
      } else {
        setSelectedDays(formData.working_hours);
      }
    }
    setShowCalendarModal(true);
  };

  const handleApplyCalendarSchedule = () => {
    const combined = `${selectedDays}, ${selectedTiming}`;
    setFormData((prev) => ({
      ...prev,
      working_hours: combined
    }));
    setShowCalendarModal(false);
  };

  const handleCancel = () => {
    if (clinic) {
      setFormData({
        clinic_name: (clinic.clinic_name || '').replace(/[0-9]/g, '').slice(0, 50),
        contact_phone: parsePhoneTo10(clinic.contact_phone),
        receptionist_name: clinic.receptionist_name || 'Neha',
        address: (clinic.address || '').slice(0, 200),
        working_hours: clinic.working_hours || 'Monday to Saturday, 10:00 AM - 08:00 PM',
        slot_duration_minutes: Number(clinic.slot_duration_minutes) || 30
      });
    }
    setIsEditing(false);
    setShowCalendarModal(false);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // 1. Clinic Name Validation: No numbers, min 3, max 50
    const trimmedName = formData.clinic_name.trim();
    if (!trimmedName) {
      toast.error('Clinic Name is required');
      return;
    }
    if (/[0-9]/.test(trimmedName)) {
      toast.error('Clinic Name cannot contain numbers');
      return;
    }
    if (trimmedName.length < 3) {
      toast.error('Clinic Name must be at least 3 characters');
      return;
    }
    if (trimmedName.length > 50) {
      toast.error('Clinic Name cannot exceed 50 characters');
      return;
    }

    // 2. Registered Phone Validation: Only digits, exactly 10 digits
    const phoneDigits = formData.contact_phone.replace(/[^0-9]/g, '');
    if (!phoneDigits) {
      toast.error('Registered Phone is required');
      return;
    }
    if (phoneDigits.length !== 10) {
      toast.error('Registered Phone must be exactly 10 digits');
      return;
    }

    // 3. Full Clinic Address Validation: min 3 (if provided), max 200
    const trimmedAddress = formData.address.trim();
    if (trimmedAddress && trimmedAddress.length < 3) {
      toast.error('Full Clinic Address must be at least 3 characters');
      return;
    }
    if (trimmedAddress.length > 200) {
      toast.error('Full Clinic Address cannot exceed 200 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        clinic_name: trimmedName,
        contact_phone: `+91${phoneDigits}`,
        address: trimmedAddress
      };
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic((prev) => ({
          ...prev,
          ...data.clinic
        }));
        try {
          const stored = localStorage.getItem('clinic_auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('clinic_auth', JSON.stringify({ ...parsed, ...data.clinic }));
          }
        } catch (storageErr) {
          console.error(storageErr);
        }
        toast.success(data.message || 'Clinic profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section
        className="cx-panel-enter bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] overflow-hidden"
      role="region"
      aria-label="Clinic Profile"
    >
      {/* Header */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-blue-50/40 to-white">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Clinic Profile</h2>
            <p className="text-xs text-slate-500">Business identity &amp; AI receptionist settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 border border-tint-green-5 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-tint-green-9 bg-tint-green-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Partner
          </span>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
        {/* Clinic Name */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block">
              Clinic Name {isEditing && <span className="text-red-500">*</span>}
            </span>
            {isEditing && (
              <span className={`text-10 font-mono font-semibold ${formData.clinic_name.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formData.clinic_name.length}/50 (min 3 chars, no numbers)
              </span>
            )}
          </div>
          {!isEditing ? (
            <span className="text-base font-bold text-slate-900">{clinic.clinic_name}</span>
          ) : (
            <input
              type="text"
              name="clinic_name"
              value={formData.clinic_name}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              maxLength={50}
              minLength={3}
              className="w-full mt-1 px-3.5 py-2 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              placeholder="Enter clinic name (letters only, min 3 - max 50 chars)"
              required
            />
          )}
        </div>

        {/* Registered Phone & AI Receptionist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block">
                Registered Phone {isEditing && <span className="text-red-500">*</span>}
              </span>
              {isEditing && (
                <span className={`text-10 font-mono font-semibold ${formData.contact_phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formData.contact_phone.length}/10 digits
                </span>
              )}
            </div>
            {!isEditing ? (
              <span className="text-sm font-semibold text-slate-800 tabular-nums">{clinic.contact_phone || 'N/A'}</span>
            ) : (
              <div className="relative flex items-center mt-1">
                <span className="absolute left-3.5 text-xs font-semibold text-slate-400 select-none font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                    if (e.ctrlKey || e.metaKey) return;
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                      return;
                    }
                    const target = e.target;
                    const selectionLength = (target.selectionEnd || 0) - (target.selectionStart || 0);
                    if (formData.contact_phone.length >= 10 && selectionLength === 0) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={10}
                  className="w-full pl-11 pr-3.5 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs tabular-nums font-mono"
                  placeholder="9876543210"
                  required
                />
              </div>
            )}
          </div>

          {/* AI Receptionist - Dropdown Only (No Manual Typing) */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              AI Receptionist
            </span>
            {!isEditing ? (
              <span className="text-sm font-semibold text-blue-700">{clinic.receptionist_name || 'Neha'}</span>
            ) : (
              <select
                name="receptionist_name"
                value={formData.receptionist_name}
                onChange={handleChange}
                className="w-full mt-1 px-3.5 py-2 text-sm font-semibold text-blue-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs cursor-pointer"
              >
                {formData.receptionist_name && !RECEPTIONIST_OPTIONS.includes(formData.receptionist_name) && (
                  <option value={formData.receptionist_name}>{formData.receptionist_name}</option>
                )}
                {RECEPTIONIST_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name === 'Neha' ? 'Neha (Recommended)' : name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Full Clinic Address */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block">
              Full Clinic Address
            </span>
            {isEditing && (
              <span className={`text-10 font-mono font-semibold ${formData.address.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formData.address.length}/200 chars (min 3)
              </span>
            )}
          </div>
          {!isEditing ? (
            <span className="text-sm text-slate-700 leading-relaxed">{clinic.address || 'Address on file'}</span>
          ) : (
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              maxLength={200}
              minLength={3}
              className="w-full mt-1 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-xs"
              placeholder="Enter full clinic address (min 3, max 200 characters)"
            />
          )}
        </div>

        {/* Working Hours & Slot Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Working Hours - Dropdown + Calendar Picker (No Manual Typing) */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Working Hours
            </span>
            {!isEditing ? (
              <span className="text-sm text-slate-700">{clinic.working_hours || 'Mon-Sat: 09:00 AM - 08:00 PM'}</span>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <select
                  name="working_hours"
                  value={formData.working_hours}
                  onChange={handleChange}
                  className="flex-1 min-w-0 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs cursor-pointer truncate"
                >
                  {formData.working_hours && !WORKING_HOURS_OPTIONS.includes(formData.working_hours) && (
                    <option value={formData.working_hours}>{formData.working_hours}</option>
                  )}
                  {WORKING_HOURS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openCalendarModal}
                  title="Open Calendar Schedule Picker"
                  className="h-[38px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Calendar</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Slot Duration
            </span>
            {!isEditing ? (
              <span className="text-sm text-slate-700 font-semibold">{clinic.slot_duration_minutes || 30} mins per patient</span>
            ) : (
              <select
                name="slot_duration_minutes"
                value={formData.slot_duration_minutes}
                onChange={handleChange}
                className="w-full mt-1 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              >
                <option value={15}>15 mins per patient</option>
                <option value={20}>20 mins per patient</option>
                <option value={30}>30 mins per patient</option>
                <option value={45}>45 mins per patient</option>
                <option value={60}>60 mins per patient</option>
              </select>
            )}
          </div>
        </div>

        {/* Registered Doctors */}
        {clinic.doctors && clinic.doctors.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-11 font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Registered Doctors ({clinic.doctors.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {clinic.doctors.map((d, dIdx) => (
                <div key={dIdx} className="flex items-center justify-between text-xs text-slate-700 bg-white p-2.5 px-3 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-900">{d.name}</span>
                  <span className="text-slate-500">{d.specialization || d.specialties?.join(', ') || 'Specialist'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons at bottom when editing (below Registered Doctors) */}
        {isEditing && (
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </form>

      </section>

      {/* Calendar Schedule Modal for Working Hours */}
      {showCalendarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCalendarModal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] min-h-0 adm-calendar-widget"
            role="dialog"
            aria-modal="true"
            aria-label="Working Hours Calendar Schedule Picker"
            data-lenis-prevent="true"
            onWheel={(e) => {
              if (modalScrollRef.current && e.target !== modalScrollRef.current && !modalScrollRef.current.contains(e.target)) {
                modalScrollRef.current.scrollTop += e.deltaY;
              }
            }}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="grid place-items-center w-7 h-7 rounded-lg bg-blue-100 text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Working Hours Calendar</h3>
                  <p className="text-11 text-slate-500">Select days &amp; timings schedule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={modalScrollRef}
              className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0"
              style={{ WebkitOverflowScrolling: 'touch' }}
              data-lenis-prevent="true"
            >
              {/* Quick Days Schedule Selection */}
              <div>
                <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Common Days Schedules:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_DAYS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedDays(preset)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        selectedDays === preset
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Day Picker */}
              <div>
                <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Or Pick Starting Day from Calendar:
                </span>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/50 flex justify-center">
                  <ReactCalendar
                    value={calendarDate}
                    onChange={(d) => {
                      setCalendarDate(d);
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                      setSelectedDays(`${dayName} to Saturday`);
                    }}
                  />
                </div>
              </div>

              {/* Daily Timings Dropdown */}
              <div>
                <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Daily Working Timings:
                </span>
                <select
                  value={selectedTiming}
                  onChange={(e) => setSelectedTiming(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs"
                >
                  {COMMON_TIMING_OPTIONS.map((timeOpt) => (
                    <option key={timeOpt} value={timeOpt}>
                      {timeOpt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Preview */}
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                <span className="text-11 font-semibold text-blue-600 uppercase tracking-wider block mb-0.5">
                  Selected Schedule:
                </span>
                <span className="text-sm font-bold text-blue-900">
                  {selectedDays}, {selectedTiming}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCalendarSchedule}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


