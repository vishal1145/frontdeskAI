import React, { useState, useEffect, useRef } from 'react';
import ReactCalendar from 'react-calendar';
import {
  Building2,
  ShieldCheck,
  Pencil,
  Check,
  X,
  Loader2,
  Calendar,
  MapPin,
  Copy,
  Clock,
  Activity,
  User,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinic } from '../../context/ClinicContext';
import CustomSelect from '../../components/CustomSelect';
import { ProfileIcon } from '../../components/ProfileIcon';
import ProfileIconModal from '../../components/ProfileIconModal';

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
    slot_duration_minutes: 30,
    profile_icon: ''
  });

  // Icon Modal State
  const [showIconModal, setShowIconModal] = useState(false);

  // Calendar Schedule Modal State for Working Hours
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState('Monday to Saturday');
  const [selectedTiming, setSelectedTiming] = useState('10:00 AM - 08:00 PM');
  const modalScrollRef = useRef(null);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (!showCalendarModal && !showIconModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showCalendarModal, showIconModal]);

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
        slot_duration_minutes: Number(clinic.slot_duration_minutes) || 30,
        profile_icon: clinic.profile_icon || (isMedical ? 'pill:emerald' : 'building:blue')
      });
    }
  }, [clinic]);

  if (!clinic) return null;

  const isMedical = clinic?.business_type === 'medical_store' || /medical|pharmacy|chemist|medicos|dawa/i.test(clinic?.clinic_name || '');

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

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    const phoneToCopy = `+91 ${formData.contact_phone || clinic.contact_phone}`;
    navigator.clipboard.writeText(phoneToCopy);
    toast.success('Phone number copied to clipboard!');
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
        slot_duration_minutes: Number(clinic.slot_duration_minutes) || 30,
        profile_icon: clinic.profile_icon || (isMedical ? 'pill:emerald' : 'building:blue')
      });
    }
    setIsEditing(false);
    setShowCalendarModal(false);
    setShowIconModal(false);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // 1. Clinic Name Validation: No numbers, min 3, max 50
    const trimmedName = formData.clinic_name.trim();
    if (!trimmedName) {
      toast.error(isMedical ? 'Store / Pharmacy Name is required' : 'Clinic Name is required');
      return;
    }
    if (/[0-9]/.test(trimmedName)) {
      toast.error(isMedical ? 'Store / Pharmacy Name cannot contain numbers' : 'Clinic Name cannot contain numbers');
      return;
    }
    if (trimmedName.length < 3) {
      toast.error(isMedical ? 'Store / Pharmacy Name must be at least 3 characters' : 'Clinic Name must be at least 3 characters');
      return;
    }
    if (trimmedName.length > 50) {
      toast.error(isMedical ? 'Store / Pharmacy Name cannot exceed 50 characters' : 'Clinic Name cannot exceed 50 characters');
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
      toast.error(isMedical ? 'Store Address must be at least 3 characters' : 'Full Clinic Address must be at least 3 characters');
      return;
    }
    if (trimmedAddress.length > 200) {
      toast.error(isMedical ? 'Store Address cannot exceed 200 characters' : 'Full Clinic Address cannot exceed 200 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        clinic_name: trimmedName,
        contact_phone: `+91${phoneDigits}`,
        address: trimmedAddress,
        profile_icon: formData.profile_icon
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
        toast.success(data.message || (isMedical ? 'Pharmacy profile updated successfully!' : 'Clinic profile updated successfully!'));
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
        className="cx-panel-enter bg-white/95 backdrop-blur-xl border border-slate-900/[0.08] rounded-2xl sm:rounded-3xl shadow-[0_2px_8px_theme(colors.ink.DEFAULT_/_0.04),0_20px_45px_-20px_rgba(37,99,235,0.18)] overflow-hidden"
        role="region"
        aria-label={isMedical ? "Pharmacy Profile" : "Clinic Profile"}
      >
        {/* Header (Matching Image 2 with Glossy Brand Avatar, Title, Completeness Bar, and Badges) */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100/90 bg-gradient-to-r from-blue-50/50 via-slate-50/20 to-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3.5">
            {/* Glossy Brand Avatar Badge */}
            <button
              type="button"
              onClick={() => setShowIconModal(true)}
              className="relative group w-12 h-12 sm:w-13 sm:h-13 rounded-2xl shadow-md shadow-blue-600/20 bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700 text-white p-1.5 flex items-center justify-center text-center cursor-pointer hover:scale-102 transition-transform shrink-0"
              title="Click to update profile icon or logo"
              aria-label="Change profile icon"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <ProfileIcon
                  icon={isEditing ? formData.profile_icon : (clinic.profile_icon || (isMedical ? 'pill:emerald' : 'building:blue'))}
                  isMedical={isMedical}
                  containerClassName="w-full h-full rounded-xl bg-transparent"
                  iconClassName="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white"
                  alt={clinic.clinic_name}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white border border-slate-200 text-blue-600 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-2.5 h-2.5" />
              </span>
            </button>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isMedical ? 'Pharmacy / Store Profile' : 'Clinic Profile'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Business Identity &amp; AI receptionist settings</p>
            </div>
          </div>

          {/* Right: Verified Partner Glow Pill & Action Button */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 h-8 px-3.5 border border-emerald-200 rounded-full text-xs font-semibold leading-none whitespace-nowrap text-emerald-700 bg-emerald-50/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Partner
            </span>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
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
                  className="inline-flex items-center gap-1 h-8 px-3.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3">
          {/* Row 1 (3 Cards): Clinic Name, Registered Phone, AI Receptionist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Clinic Name */}
            <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[76px]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                  {isMedical ? 'Pharmacy Name' : 'Clinic Name'} {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing && (
                  <span className={`text-10 font-mono font-semibold ${formData.clinic_name.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.clinic_name.length}/50
                  </span>
                )}
              </div>

              {!isEditing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-slate-900 truncate">{clinic.clinic_name}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-10 font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Active
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                  maxLength={50}
                  minLength={3}
                  className="w-full mt-0.5 px-3 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                  placeholder={isMedical ? "Enter pharmacy name" : "Enter clinic name"}
                  required
                />
              )}
            </div>

            {/* Card 2: Registered Phone */}
            <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[76px]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                  Registered Phone {isEditing && <span className="text-red-500">*</span>}
                </span>
                {isEditing && (
                  <span className={`text-10 font-mono font-semibold ${formData.contact_phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.contact_phone.length}/10
                  </span>
                )}
              </div>

              {!isEditing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight tabular-nums">
                    {clinic.contact_phone || 'N/A'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    title="Copy Phone Number"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-10 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    Verified
                  </span>
                </div>
              ) : (
                <div className="relative flex items-center mt-0.5">
                  <span className="absolute left-3 text-xs font-semibold text-slate-400 select-none font-mono">
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
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                      const target = e.target;
                      const selLen = (target.selectionEnd || 0) - (target.selectionStart || 0);
                      if (formData.contact_phone.length >= 10 && selLen === 0) e.preventDefault();
                    }}
                    maxLength={10}
                    className="w-full pl-10 pr-3 py-1.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs tabular-nums font-mono"
                    placeholder="9876543210"
                    required
                  />
                </div>
              )}
            </div>

            {/* Card 3: AI Receptionist */}
            <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[76px]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                  AI Receptionist
                </span>
              </div>

              {!isEditing ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-amber-100 via-rose-100 to-indigo-100 border border-purple-200/80 shadow-2xs grid place-items-center text-xs shrink-0 select-none">
                      👩‍💼
                    </div>
                    <span className="text-sm sm:text-base font-bold text-slate-900">{clinic.receptionist_name || 'Riya'}</span>
                    <span className="text-cyan-600 font-mono font-bold text-xs tracking-tighter" title="AI Voice Active">
                      ∿∿
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 text-10 font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-10 font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      View Settings
                    </button>
                  </div>
                </div>
              ) : (
                <CustomSelect
                  value={formData.receptionist_name}
                  onChange={(val) => setFormData({ ...formData, receptionist_name: val })}
                  options={RECEPTIONIST_OPTIONS.map((name) => ({
                    value: name,
                    label: name === 'Neha' ? 'Neha (Recommended)' : name
                  }))}
                  className="w-full mt-0.5 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-white border border-slate-300 rounded-lg shadow-xs cursor-pointer flex items-center justify-between gap-2"
                  menuClassName="w-full"
                />
              )}
            </div>
          </div>

          {/* Row 2 (Full Width): Full Clinic Address */}
          <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all">
            {!isEditing ? (
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="min-w-0 pr-2">
                  <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    {isMedical ? 'Store Address' : 'Full Clinic Address'}
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed max-w-2xl">
                    {clinic.address || 'Address on file'}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/map flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50/90 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 shadow-2xs transition-all cursor-pointer shrink-0 ml-auto"
                  title="Open in Google Maps"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover/map:text-blue-600">
                    Open Map
                  </span>
                  <div className="relative w-13 h-8 rounded-lg overflow-hidden border border-slate-200/90 bg-emerald-50/50 shadow-2xs grid place-items-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:4px_4px] opacity-30" />
                    <div className="absolute w-8 h-0.5 bg-amber-300/80 rotate-45" />
                    <div className="absolute w-9 h-0.5 bg-blue-300/80 -rotate-12" />
                    <MapPin className="relative z-10 w-3.5 h-3.5 text-rose-500 drop-shadow-xs" />
                  </div>
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                    {isMedical ? 'Store Address' : 'Full Clinic Address'}
                  </span>
                  <span className={`text-10 font-mono font-semibold ${formData.address.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.address.length}/200 chars
                  </span>
                </div>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={200}
                  minLength={3}
                  className="w-full mt-0.5 px-3 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-xs"
                  placeholder={isMedical ? "Enter full store address" : "Enter full clinic address"}
                />
              </>
            )}
          </div>

          {/* Row 3 (2 Cards): Working Hours & Slot Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Card 4: Working Hours */}
            <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                  Working Hours
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {!isEditing ? (
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 block mb-1.5">
                    {clinic.working_hours || 'Monday to Saturday, 10:00 AM - 08:00 PM'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-10 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Open Now
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <CustomSelect
                    value={formData.working_hours}
                    onChange={(val) => setFormData({ ...formData, working_hours: val })}
                    options={WORKING_HOURS_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                    className="flex-1 min-w-0 px-3 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs cursor-pointer flex items-center justify-between gap-2"
                    menuClassName="w-full"
                  />
                  <button
                    type="button"
                    onClick={openCalendarModal}
                    title="Open Calendar Schedule Picker"
                    className="h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Calendar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card 5: Slot Duration */}
            <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                  {isMedical ? 'Order/Inquiry Slot Duration' : 'Slot Duration'}
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-1.5 rounded-xs bg-blue-600" />
                    <div className="w-3 h-1.5 rounded-xs bg-blue-500" />
                    <div className="w-3 h-1.5 rounded-xs bg-blue-400" />
                    <div className="w-2.5 h-1.5 rounded-xs bg-blue-200" />
                  </div>
                </div>
              </div>

              {!isEditing ? (
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-1">
                    {clinic.slot_duration_minutes || 30} mins {isMedical ? 'per order' : 'per patient'}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-4 h-2 rounded-xs bg-blue-600" />
                    <div className="w-4 h-2 rounded-xs bg-blue-500" />
                    <div className="w-4 h-2 rounded-xs bg-blue-400" />
                    <div className="w-4 h-2 rounded-xs bg-blue-300" />
                    <div className="w-4 h-2 rounded-xs bg-blue-200" />
                  </div>
                </div>
              ) : (
                <CustomSelect
                  value={formData.slot_duration_minutes}
                  onChange={(val) => setFormData({ ...formData, slot_duration_minutes: Number(val) })}
                  options={[
                    { value: 15, label: `15 mins ${isMedical ? 'per order' : 'per patient'}` },
                    { value: 20, label: `20 mins ${isMedical ? 'per order' : 'per patient'}` },
                    { value: 30, label: `30 mins ${isMedical ? 'per order' : 'per patient'}` },
                    { value: 45, label: `45 mins ${isMedical ? 'per order' : 'per patient'}` },
                    { value: 60, label: `60 mins ${isMedical ? 'per order' : 'per patient'}` },
                  ]}
                  className="w-full mt-0.5 px-3 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs cursor-pointer flex items-center justify-between gap-2"
                  menuClassName="w-full"
                />
              )}
            </div>
          </div>

          {/* Row 4: Registered Doctors / Staff */}
          {clinic.doctors && clinic.doctors.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-11 font-bold text-slate-500 uppercase tracking-wider block">
                    {isMedical ? 'Registered Pharmacist & Staff' : 'Registered Doctors'} ({clinic.doctors.length})
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-10 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Open Now
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {clinic.doctors.map((d, dIdx) => (
                  <div
                    key={dIdx}
                    className="bg-blue-50/40 hover:bg-blue-50/70 rounded-lg border border-blue-100/90 p-2.5 transition-colors flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center shrink-0 font-bold text-xs shadow-2xs">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{d.name}</h5>
                        <p className="text-10 sm:text-11 text-slate-500 truncate">
                          {d.specialization || d.specialties?.join(', ') || (isMedical ? 'Staff' : 'Specialist')}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-10 font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons at bottom when editing */}
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

            {/* Modal Body */}
            <div ref={modalScrollRef} className="p-5 overflow-y-auto space-y-4">
              {/* Calendar Widget */}
              <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                <ReactCalendar
                  value={calendarDate}
                  onChange={setCalendarDate}
                  className="w-full border-0 font-sans"
                />
              </div>

              {/* Common Days Preset Buttons */}
              <div>
                <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Select Days Preset:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_DAYS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedDays(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer truncate ${
                        selectedDays === preset
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Timings Dropdown */}
              <div>
                <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Daily Working Timings:
                </span>
                <CustomSelect
                  value={selectedTiming}
                  onChange={setSelectedTiming}
                  options={COMMON_TIMING_OPTIONS.map((timeOpt) => ({
                    value: timeOpt,
                    label: timeOpt
                  }))}
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer shadow-xs flex items-center justify-between gap-2"
                  menuClassName="w-full"
                />
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

      {/* Profile Icon Picker Modal */}
      <ProfileIconModal
        isOpen={showIconModal}
        onClose={() => setShowIconModal(false)}
        currentIcon={formData.profile_icon || clinic.profile_icon || (isMedical ? 'pill:emerald' : 'building:blue')}
        isMedical={isMedical}
        clinicName={formData.clinic_name || clinic.clinic_name}
        onApply={(newIcon) => {
          setFormData((prev) => ({ ...prev, profile_icon: newIcon }));
          if (!isEditing) setIsEditing(true);
        }}
      />
    </>
  );
}
