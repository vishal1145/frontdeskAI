import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  Eye,
  EyeOff,
  Pill,
  Plus,
  RefreshCw,
  Stethoscope,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import ReactCalendar from 'react-calendar';
import { fontSize } from '../../design-tokens.js';
import { DoctorDaysField, DoctorTimingsField, parseTimingShifts, parseWorkingDays, splitTimings } from '../components/DoctorSchedulePicker';
import CustomSelect from '../components/CustomSelect';

const SECTIONS = [
  { id: 'biz-details', label: 'Business Details' },
  { id: 'biz-location', label: 'Working Hours' },
  { id: 'biz-doctors', label: 'Doctors & Services' },
];

// Create New Business & AI Agent — its own page (/admin/create), opened from the Super Admin Console.
export default function CreateBusiness({ setActivePage }) {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('frontdesk_admin_key') || '');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    business_type: 'clinic',
    delivery_available: true,
    min_delivery_order: '₹200',
    clinic_name: '',
    contact_phone: '',
    password: '',
    address: '',
    working_days: 'Monday to Saturday',
    working_time: '09:00 AM - 08:00 PM',
    working_hours: 'Monday to Saturday, 09:00 AM - 08:00 PM',
    receptionist_name: 'Neha',
    slot_duration_minutes: 30,
    scheduling_enabled: true,
    doctors: [
      { name: 'Dr. Sharma', specialization: 'Consultant Specialist', timings: '10:00 AM - 2:00 PM & 5:00 PM - 8:00 PM' }
    ],
    services: [
      { name: 'General Consultation' },
      { name: 'Follow-up Checkup' }
    ]
  });

  const handleBusinessTypeChange = (type) => {
    if (type === 'medical_store') {
      setFormData(prev => ({
        ...prev,
        business_type: 'medical_store',
        clinic_name: prev.clinic_name && prev.clinic_name !== 'Apex Dental & Orthodontics' ? prev.clinic_name : 'Sanjivani Medicos & Pharmacy',
        doctors: prev.doctors.length > 0 && prev.doctors[0].name !== 'Dr. Sharma' ? prev.doctors : [
          { name: 'Pharmacist Rahul', specialization: 'Chief Pharmacist', timings: '09:00 AM - 10:00 PM' }
        ],
        services: prev.services.length > 0 && prev.services[0].name !== 'General Consultation' ? prev.services : [
          { name: 'Prescription Medicines' },
          { name: 'OTC & First Aid' },
          { name: 'Home Delivery' },
          { name: 'Health Supplements & Baby Care' }
        ]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        business_type: 'clinic',
        clinic_name: prev.clinic_name === 'Sanjivani Medicos & Pharmacy' ? '' : prev.clinic_name,
        doctors: prev.doctors.length > 0 && prev.doctors[0].name !== 'Pharmacist Rahul' ? prev.doctors : [
          { name: 'Dr. Sharma', specialization: 'Consultant Specialist', timings: '10:00 AM - 2:00 PM & 5:00 PM - 8:00 PM' }
        ],
        services: prev.services.length > 0 && prev.services[0].name !== 'Prescription Medicines' ? prev.services : [
          { name: 'General Consultation' },
          { name: 'Follow-up Checkup' }
        ]
      }));
    }
  };

  // Calendar & Time Popovers State
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [timePickerStart, setTimePickerStart] = useState('09:00');
  const [timePickerEnd, setTimePickerEnd] = useState('20:00');

  // Doctor Timings Time Picker State
  const [activeDocTimePickerIndex, setActiveDocTimePickerIndex] = useState(null);

  // Popover Placement & Max Height (auto-flip to top when insufficient space below)
  const [docTimePickerPlacement, setDocTimePickerPlacement] = useState({ placement: 'bottom', maxHeight: undefined });
  const [dateCalendarPlacement, setDateCalendarPlacement] = useState({ placement: 'bottom', maxHeight: undefined });
  const [timePickerPlacement, setTimePickerPlacement] = useState({ placement: 'bottom', maxHeight: undefined });

  const docTimePickerPopoverRef = useRef(null);
  const dateCalendarPopoverRef = useRef(null);
  const timePickerPopoverRef = useRef(null);

  const updatePopoverPosition = (anchorEl, setPlacement, preferredHeight = 440) => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const navbarBottom = document.querySelector('header')?.getBoundingClientRect().bottom || 0;
    const spaceAbove = rect.top - navbarBottom - 16;

    if (spaceBelow < preferredHeight && spaceAbove > spaceBelow) {
      setPlacement({
        placement: 'top',
        maxHeight: Math.max(220, Math.min(preferredHeight, spaceAbove))
      });
    } else {
      setPlacement({
        placement: 'bottom',
        maxHeight: Math.max(220, Math.min(preferredHeight, spaceBelow))
      });
    }
  };

  useLayoutEffect(() => {
    if (activeDocTimePickerIndex === null) return;
    const update = () => {
      const parent = docTimePickerPopoverRef.current?.parentElement;
      if (parent) {
        const height = docTimePickerPopoverRef.current?.offsetHeight || 560;
        updatePopoverPosition(parent, setDocTimePickerPlacement, height);
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [activeDocTimePickerIndex]);

  useLayoutEffect(() => {
    if (!showDateCalendar) return;
    const update = () => {
      const parent = dateCalendarPopoverRef.current?.parentElement;
      if (parent) {
        const height = dateCalendarPopoverRef.current?.offsetHeight || 480;
        updatePopoverPosition(parent, setDateCalendarPlacement, height);
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showDateCalendar]);

  useLayoutEffect(() => {
    if (!showTimePicker) return;
    const update = () => {
      const parent = timePickerPopoverRef.current?.parentElement;
      if (parent) {
        const height = timePickerPopoverRef.current?.offsetHeight || 440;
        updatePopoverPosition(parent, setTimePickerPlacement, height);
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showTimePicker]);

  // Same guard as the console: only a signed-in super admin can open this page
  useEffect(() => {
    const key = localStorage.getItem('frontdesk_admin_key');
    if (!key) {
      toast.error('Please login from the login page.');
      setActivePage('login');
      return;
    }
    setAdminKey(key);
  }, []);

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const period = h >= 12 ? 'PM' : 'AM';
    const hours12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hours12).padStart(2, '0')}:${m} ${period}`;
  };

  const updateWorkingTime = (start24, end24) => {
    setTimePickerStart(start24);
    setTimePickerEnd(end24);
    const formatted = `${formatTime12h(start24)} - ${formatTime12h(end24)}`;
    setFormData((prev) => ({
      ...prev,
      working_time: formatted,
      working_hours: `${prev.working_days || 'Monday to Saturday'}, ${formatted}`
    }));
  };

  const updateWorkingDays = (daysStr) => {
    setFormData((prev) => ({
      ...prev,
      working_days: daysStr,
      working_hours: `${daysStr}, ${prev.working_time || '09:00 AM - 08:00 PM'}`
    }));
  };

  // Add/remove doctor rows
  const addDoctorRow = () => {
    setFormData(prev => ({
      ...prev,
      doctors: [...prev.doctors, { name: '', specialization: 'Specialist', timings: '10:00 AM - 2:00 PM & 5:00 PM - 8:00 PM' }]
    }));
  };

  const updateDoctorRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.doctors];
      if (field === 'name' || field === 'specialization') {
        updated[index][field] = value.replace(/[0-9]/g, '').slice(0, 50);
      } else {
        updated[index][field] = value;
      }
      return { ...prev, doctors: updated };
    });
  };

  const getDoctorSchedule = (doc) => splitTimings(doc.timings, formData.working_days);

  const updateDoctorSchedule = (index, days, timing) => {
    updateDoctorRow(index, 'timings', `${days}, ${timing}`);
  };

  const removeDoctorRow = (index) => {
    setActiveDocTimePickerIndex(null);
    setFormData(prev => ({
      ...prev,
      doctors: prev.doctors.filter((_, i) => i !== index)
    }));
  };

  // Add/remove service rows
  const addServiceRow = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '' }]
    }));
  };

  const updateServiceRow = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.services];
      updated[index].name = value.replace(/[0-9]/g, '').slice(0, 50);
      return { ...prev, services: updated };
    });
  };

  const removeServiceRow = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  // Password Strength Evaluator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Password required', color: 'bg-slate-200', text: 'text-slate-400', width: '0%', isStrong: false };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    else if (/[a-zA-Z]/.test(pass)) score += 0.5;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (pass.length < 8 || score < 2.5) {
      return { score: 1, label: 'Weak (min 8 chars needed)', color: 'bg-rose-500', text: 'text-rose-500', width: '25%', isStrong: false };
    }
    if (score < 4) {
      return { score: 2, label: 'Medium (add symbols/numbers)', color: 'bg-amber-500', text: 'text-amber-500', width: '60%', isStrong: false };
    }
    return { score: 3, label: 'Strong password', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%', isStrong: true };
  };

  // Helper to auto-generate a strong compliant password
  const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '@#$%&*!';

    let pass = '';
    pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));

    setFormData(prev => ({ ...prev, password: pass }));
    toast.success('Generated strong password!');
  };

  // Handle Create Clinic Submission
  const handleCreateClinic = async (e) => {
    e.preventDefault();
    const cleanClinicName = formData.clinic_name.replace(/[0-9]/g, '').trim();
    if (!cleanClinicName) {
      toast.error('Please enter a valid Business Name (numbers are not allowed).');
      return;
    }
    if (cleanClinicName.length < 3) {
      toast.error('Business Name must be at least 3 characters.');
      return;
    }
    if (formData.clinic_name.length > 50) {
      toast.error('Business Name cannot exceed 50 characters.');
      return;
    }
    if (/[0-9]/.test(formData.clinic_name)) {
      toast.error('Business Name cannot contain numbers.');
      return;
    }

    if (!formData.address || !formData.address.trim()) {
      toast.error('Please enter the Full Business Address.');
      return;
    }
    if (formData.address.trim().length < 3) {
      toast.error('Full Business Address must be at least 3 characters.');
      return;
    }
    if (formData.address.length > 200) {
      toast.error('Address cannot exceed 200 characters.');
      return;
    }

    if (!formData.working_days || !formData.working_days.trim()) {
      toast.error('Please specify working days / schedule.');
      return;
    }

    if (!formData.working_time || !formData.working_time.trim()) {
      toast.error('Please specify working hours / timings.');
      return;
    }

    if (formData.receptionist_name && /[0-9]/.test(formData.receptionist_name)) {
      toast.error('AI Receptionist Name cannot contain numbers.');
      return;
    }
    if (formData.receptionist_name && formData.receptionist_name.length > 50) {
      toast.error('AI Receptionist Name cannot exceed 50 characters.');
      return;
    }

    for (let i = 0; i < formData.doctors.length; i++) {
      const d = formData.doctors[i];
      if (d.name && d.name.trim().length < 3) {
        toast.error(`Doctor name "${d.name.trim()}" must be at least 3 characters.`);
        return;
      }
      if (d.name && /[0-9]/.test(d.name)) {
        toast.error(`Doctor name "${d.name}" cannot contain numbers.`);
        return;
      }
      if (d.name && d.name.length > 50) {
        toast.error('Doctor name cannot exceed 50 characters.');
        return;
      }
      if (d.specialization && d.specialization.trim().length < 3) {
        toast.error(`Doctor specialty "${d.specialization.trim()}" must be at least 3 characters.`);
        return;
      }
      if (d.specialization && /[0-9]/.test(d.specialization)) {
        toast.error(`Doctor specialty "${d.specialization}" cannot contain numbers.`);
        return;
      }
      if (d.specialization && d.specialization.length > 50) {
        toast.error('Doctor specialty cannot exceed 50 characters.');
        return;
      }
      const doctorShifts = parseTimingShifts(d.timings);
      if (doctorShifts.some((shift, shiftIdx) => shift.start >= shift.end || (shiftIdx > 0 && shift.start < doctorShifts[shiftIdx - 1].end))) {
        toast.error('Each doctor shift must end after it starts, and shifts cannot overlap.');
        return;
      }
    }

    for (let i = 0; i < formData.services.length; i++) {
      const s = formData.services[i];
      if (s.name && s.name.trim().length < 3) {
        toast.error(`Service "${s.name.trim()}" must be at least 3 characters.`);
        return;
      }
      if (s.name && /[0-9]/.test(s.name)) {
        toast.error(`Service "${s.name}" cannot contain numbers.`);
        return;
      }
      if (s.name && s.name.length > 50) {
        toast.error('Service name cannot exceed 50 characters.');
        return;
      }
    }

    const cleanPhone = formData.contact_phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Primary Mobile Number must be exactly 10 digits.');
      return;
    }

    const pwd = formData.password.trim();
    if (!pwd) {
      toast.error('Please enter a strong Portal Password.');
      return;
    }
    if (pwd.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      toast.error('Password must contain letters, numbers, and at least one special character (e.g. Strong@2025).');
      return;
    }

    setSubmitting(true);
    try {
      const combinedWorkingHours = `${formData.working_days.trim()}, ${formData.working_time.trim()}`;

      const cleanDoctors = formData.doctors
        .filter(d => d.name.trim().length >= 3)
        .map(d => ({
          name: d.name.trim(),
          specialization: d.specialization?.trim() || 'Consultant',
          timings: d.timings?.trim() || combinedWorkingHours,
          working_days: parseWorkingDays(getDoctorSchedule(d).days)
        }));

      const cleanServices = formData.services
        .filter(s => s.name.trim().length >= 3)
        .map(s => s.name.trim());

      const payload = {
        clinic_name: formData.clinic_name.trim(),
        contact_phone: `+91${cleanPhone}`,
        virtual_phone_numbers: ['+918065355910'],
        password: pwd,
        address: formData.address.trim(),
        working_hours: combinedWorkingHours,
        receptionist_name: formData.receptionist_name.trim() || 'Neha',
        slot_duration_minutes: Number(formData.slot_duration_minutes) || 30,
        scheduling_enabled: formData.scheduling_enabled,
        doctors: cleanDoctors,
        services: cleanServices,
        business_type: formData.business_type || 'clinic',
        delivery_available: formData.delivery_available !== false,
        min_delivery_order: formData.min_delivery_order || 'None'
      };

      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`🎉 ${data.message}`);
        // Back to the console, which reloads the business list on mount
        setActivePage('admin');
      } else {
        toast.error(data.message || 'Failed to create business.');
      }
    } catch (err) {
      toast.error('Network error during business creation.');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const goToConsole = () => setActivePage('admin');

  // Section completion drives the sidebar ticks
  const sectionDone = {
    'biz-details': formData.clinic_name.trim().length >= 3 && formData.contact_phone.length === 10 && passwordStrength.score >= 2 && formData.address.trim().length >= 3 && !!formData.receptionist_name,
    'biz-location': !!formData.working_days.trim() && !!formData.working_time.trim(),
    'biz-doctors': formData.doctors.some((d) => d.name.trim().length >= 3) && formData.services.some((s) => s.name.trim().length >= 3),
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    // data-motion-scope opts this tool page out of the marketing site's magnetic/tilt effects.
    <div className="relative min-h-[calc(100vh-4.25rem)] pb-20 text-ink before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[32rem] before:z-0 before:bg-[radial-gradient(40rem_18rem_at_12%_0%,theme(colors.tint.cyan.6_/_0.45),transparent_70%),radial-gradient(36rem_20rem_at_92%_8%,theme(colors.blue.200_/_0.5),transparent_70%)] before:pointer-events-none" data-motion-scope="admin">
      <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">

        {/* Page header */}
        <header className="flex items-center gap-3 sm:gap-3.5 adm-rise" style={{ '--i': 1 }}>
          <button
            type="button"
            onClick={goToConsole}
            className="grid place-items-center flex-none w-10 h-10 rounded-12 text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[inset_0_1px_0_theme(colors.white_/_0.25),0_0_0_3px_theme(colors.blue.500_/_0.1),0_8px_16px_-6px_theme(colors.blue.600_/_0.7)] hover:from-blue-600 hover:to-tint-blue-34 hover:shadow-[inset_0_1px_0_theme(colors.white_/_0.25),0_0_0_3px_theme(colors.blue.500_/_0.2),0_10px_20px_-6px_theme(colors.blue.600_/_0.8)] active:scale-95 transition-all duration-200 cursor-pointer group"
            title="Back to Super Admin Console"
          >
            <ArrowLeft className="w-4.5 h-4.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink leading-tight">Create New Business &amp; AI Agent</h1>
            <div className="text-xs sm:text-13 mt-0.5 text-slate-500" style={{ fontFamily: 'var(--fd-font-sans)' }}>Deploy a dedicated voice receptionist instantly to PostgreSQL &amp; LiveKit</div>
          </div>
        </header>

        <form onSubmit={handleCreateClinic} className="grid grid-cols-1 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-0 gap-5 mt-5 sm:mt-6">
          {/* Section index & sidebar actions */}
          <aside className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-[calc(4.25rem+1.5rem)] adm-rise" style={{ '--i': 2 }} aria-label="Form sections">
            <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:p-s-9-6 lg:overflow-visible lg:rounded-20 lg:bg-white/70 lg:shadow-[inset_0_0_0_1px_theme(colors.white_/_0.9),0_0_0_1px_theme(colors.slate.900_/_0.08),0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_18px_40px_-26px_theme(colors.blue.800_/_0.35)]">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={`flex items-center gap-s-10-4 w-full py-s-8-8 pr-s-12 pl-s-8-8 rounded-14 text-13 font-medium text-left whitespace-nowrap lg:whitespace-normal transition-[background-color,color,box-shadow] duration-200 cursor-pointer ${
                      sectionDone[s.id]
                        ? 'text-ink bg-tint-blue-10 shadow-none'
                        : 'text-ink-soft bg-white/80 lg:bg-transparent shadow-[inset_0_0_0_1px_theme(colors.slate.900_/_0.08)] lg:shadow-none hover:text-ink hover:bg-tint-blue-10'
                    }`}
                  >
                    <span className={`grid place-items-center flex-none w-[1.6rem] h-[1.6rem] rounded-full text-12 font-semibold transition-[background-color,color,transform] duration-300 ${
                      sectionDone[s.id]
                        ? '!text-white !bg-tint-green-7 !shadow-[0_0_0_3px_theme(colors.tint.green.7_/_0.15)] scale-[1.04]'
                        : 'text-blue-600 bg-tint-blue-12 shadow-[inset_0_0_0_1px_theme(colors.blue.600_/_0.2)]'
                    }`}>
                      {sectionDone[s.id] ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-3 p-3.5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-[0_4px_16px_-4px_theme(colors.blue.800_/_0.1)]">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 w-full justify-center text-xs py-2.5 px-3 rounded-full font-semibold cursor-pointer text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[inset_0_1px_0_theme(colors.white_/_0.22),0_12px_26px_-12px_theme(colors.blue.600_/_0.75)] hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[inset_0_1px_0_theme(colors.white_/_0.22),0_16px_30px_-12px_theme(colors.blue.600_/_0.85)] active:not(:disabled):translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Business...</span>
                  </>
                ) : (
                  <>
                    <span>Save Business &amp; Activate AI</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={goToConsole}
                className="inline-flex items-center gap-2 w-full justify-center text-xs py-2 px-3 rounded-full font-semibold cursor-pointer text-slate-500 bg-white/[0.85] shadow-[inset_0_0_0_1px_theme(colors.slate.900_/_0.14),0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:not(:disabled):text-slate-800 hover:not(:disabled):bg-white hover:not(:disabled):shadow-[inset_0_0_0_1px_theme(colors.blue.600_/_0.3),0_6px_16px_-10px_theme(colors.blue.800_/_0.4)] disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </aside>

          {/* Form sections */}
          <div className="grid gap-5 min-w-0 lg:col-start-2">
          {/* Section 1: Basic Clinic Info */}
          <div className="relative p-6 sm:px-8 sm:py-7 rounded-24 bg-white/[0.86] shadow-[inset_0_0_0_1px_theme(colors.white_/_0.95),0_0_0_1px_theme(colors.slate.900_/_0.08),0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_18px_40px_-26px_theme(colors.blue.800_/_0.35)] scroll-mt-24 space-y-4" id="biz-details">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-15 font-semibold text-slate-800 tracking-tight">
                Business Details
              </h3>
              <div className="flex items-center gap-2">
                <label htmlFor="business-category-select" className="text-xs font-medium text-slate-500 hidden sm:inline">
                 Business Category:
                </label>
                <CustomSelect
                  id="business-category-select"
                  value={formData.business_type === 'medical_store' ? 'medical_store' : 'clinic'}
                  onChange={handleBusinessTypeChange}
                  align="right"
                  options={[
                    { value: 'clinic', label: 'Clinic' },
                    { value: 'medical_store', label: 'Pharmacy' },
                  ]}
                  className="h-9 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:border-blue-400 cursor-pointer transition-all duration-200 flex items-center justify-between gap-2.5"
                  menuClassName="w-36"
                />
              </div>
            </div>

            {/* Medical Store Delivery Options */}
            {formData.business_type === 'medical_store' && (
              <div className="p-3.5 rounded-16 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border border-indigo-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="grid place-items-center w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Home Delivery Service</div>
                    <div className="text-11 text-slate-500">AI receptionist offers local delivery &amp; notes customer address</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.delivery_available}
                      onChange={(e) => setFormData({ ...formData, delivery_available: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-slate-700">Available</span>
                  </label>
                  {formData.delivery_available && (
                    <input
                      type="text"
                      value={formData.min_delivery_order}
                      onChange={(e) => setFormData({ ...formData, min_delivery_order: e.target.value })}
                      placeholder="Min order e.g. ₹200"
                      className="w-28 h-7 px-2 rounded-lg text-xs font-mono bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-indigo-500"
                      title="Minimum order value for free or local home delivery"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-13 font-medium text-ink-soft">
                    {formData.business_type === 'medical_store' ? 'Medical Store Name' : 'Business Name'} <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-11 font-mono font-semibold ${formData.clinic_name.length > 45 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {formData.clinic_name.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={formData.clinic_name}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[0-9]/g, '').slice(0, 50);
                    setFormData({ ...formData, clinic_name: clean });
                  }}
                  placeholder={formData.business_type === 'medical_store' ? 'e.g. Sanjivani Medicos & Pharmacy' : 'e.g. Apex Dental & Orthodontics'}
                  className="w-full h-[2.4rem] px-3.5 rounded-12 text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-13 font-medium text-ink-soft">
                    Primary Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-11 font-mono font-semibold ${formData.contact_phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.contact_phone.length}/10 digits
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-slate-400 select-none font-mono tracking-wider">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.contact_phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setFormData({ ...formData, contact_phone: digitsOnly });
                    }}
                    placeholder="9876543210"
                    className="w-full h-[2.4rem] pl-10 pr-3.5 rounded-12 text-sm font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-13 font-medium text-ink-soft">
                    Portal Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-11 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    Auto-Generate
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. Strong@2025"
                    className="w-full h-[2.4rem] pl-3.5 pr-10 rounded-12 text-sm font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                <div className="mt-1.5 space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-11">
                    <span className={`font-semibold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                    <span className="text-slate-400">
                      Min 8 chars, mix of A-Z, 0-9 &amp; symbol
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Receptionist Name: Dropdown with 6 names */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-13 font-medium text-ink-soft">
                    AI Receptionist Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-11 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    6 Names Available
                  </span>
                </div>
                <CustomSelect
                  value={formData.receptionist_name}
                  onChange={(val) => setFormData({ ...formData, receptionist_name: val })}
                  options={[
                    { value: 'Neha', label: 'Neha (Recommended)' },
                    { value: 'Pooja', label: 'Pooja' },
                    { value: 'Priya', label: 'Priya' },
                    { value: 'Shivani', label: 'Shivani' },
                    { value: 'Riya', label: 'Riya' },
                    { value: 'Aditi', label: 'Aditi' },
                  ]}
                  className="w-full h-[2.4rem] px-3.5 rounded-12 text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:border-slate-900/[0.24] flex items-center justify-between gap-2 transition-[border-color,box-shadow] duration-200 cursor-pointer"
                  menuClassName="w-full"
                />
                <span className="block mt-1 text-11 text-slate-500">Choose which AI voice receptionist greets callers on live phone calls</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block mb-1 text-13 font-medium text-ink-soft">
                  Full Business Address <span className="text-rose-500">*</span>
                </label>
                <span className={`text-11 font-mono font-semibold ${formData.address.length > 180 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {formData.address.length}/200
                </span>
              </div>
              <input
                type="text"
                required
                minLength={3}
                maxLength={200}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 200) })}
                placeholder="e.g. Suite 204, Metro Plaza, Sector 18, Noida 201301"
                className="w-full h-[2.4rem] px-3.5 rounded-12 text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
              />
              <span className="block mt-1 text-11 text-slate-500">AI Receptionist quotes this when callers ask for directions or location</span>
            </div>
          </div>

          {/* Section 2: Working Hours */}
          <div
            className="relative p-6 sm:px-8 sm:py-7 rounded-24 bg-white/[0.86] shadow-[inset_0_0_0_1px_theme(colors.white_/_0.95),0_0_0_1px_theme(colors.slate.900_/_0.08),0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_18px_40px_-26px_theme(colors.blue.800_/_0.35)] scroll-mt-24 space-y-4"
            id="biz-location"
            style={{ zIndex: (showDateCalendar || showTimePicker) ? 35 : 2 }}
          >
            <h3 className="text-15 font-semibold text-slate-800 tracking-tight">
              Working Hours
            </h3>

            {/* Working Hours divided into 2 fields: Date & Day, and Time (both with Calendar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: Date & Day with Calendar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-13 font-medium text-ink-soft">
                    Working Days &amp; Dates <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-11 font-medium text-slate-400">
                    Date &amp; Day
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={formData.working_days}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        working_days: val,
                        working_hours: `${val}, ${prev.working_time || '09:00 AM - 08:00 PM'}`
                      }));
                    }}
                    placeholder="e.g. Monday to Saturday"
                    className="w-full h-[2.4rem] pl-3.5 pr-10 rounded-12 text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const next = !showDateCalendar;
                      if (next) {
                        updatePopoverPosition(e.currentTarget.closest('.relative') || e.currentTarget.parentElement, setDateCalendarPlacement, 480);
                      }
                      setShowDateCalendar(next);
                      setShowTimePicker(false);
                      setActiveDocTimePickerIndex(null);
                    }}
                    title="Open Calendar Schedule Picker"
                    className="absolute right-2 p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <span className="block mt-1 text-11 text-slate-500">Days / dates when business is open</span>

                {/* Date Calendar Popover */}
                {showDateCalendar && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowDateCalendar(false)}
                    />
                    <div
                      ref={dateCalendarPopoverRef}
                      style={{ maxHeight: dateCalendarPlacement.maxHeight ? `${dateCalendarPlacement.maxHeight}px` : undefined }}
                      className={`absolute ${
                        dateCalendarPlacement.placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                      } bg-white border border-slate-900/[0.12] rounded-2xl shadow-[0_14px_35px_-5px_theme(colors.slate.900_/_0.18),0_8px_12px_-6px_theme(colors.slate.900_/_0.08)] p-s-14-4 z-40 left-0 right-0 sm:right-auto sm:w-80 adm-calendar-widget overflow-y-auto`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Select Working Days / Date</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDateCalendar(false)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Day Presets */}
                      <div className="space-y-1.5 mb-2.5">
                        <span className="block text-10 font-semibold uppercase tracking-wider text-slate-400">
                          Common Working Schedules:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            'Monday to Saturday',
                            'Monday to Friday',
                            'All Days (Mon - Sun)',
                            'Mon, Wed, Fri',
                            'Tue, Thu, Sat',
                            'Weekend (Sat - Sun)'
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                updateWorkingDays(preset);
                                setShowDateCalendar(false);
                              }}
                              className={`text-left px-2 py-1.5 rounded-md text-11 font-medium border transition-colors ${
                                formData.working_days === preset
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Calendar */}
                      <div>
                        <span className="block text-10 font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Pick Specific Date / Day from Calendar:
                        </span>
                        <ReactCalendar
                          value={calendarSelectedDate}
                          onChange={(d) => {
                            setCalendarSelectedDate(d);
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                            const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            updateWorkingDays(`${dayName} to Saturday (${dateStr})`);
                          }}
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-11 text-slate-500 truncate max-w-[170px]" title={formData.working_days}>
                          {formData.working_days}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowDateCalendar(false)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Field 2: Time with Calendar / Time Picker */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-13 font-medium text-ink-soft">
                    Working Hours (Time) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-11 font-medium text-slate-400">
                    Daily Timings
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={formData.working_time}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        working_time: val,
                        working_hours: `${prev.working_days || 'Monday to Saturday'}, ${val}`
                      }));
                    }}
                    placeholder="e.g. 09:00 AM - 08:00 PM"
                    className="w-full h-[2.4rem] pl-3.5 pr-10 rounded-12 text-sm font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const next = !showTimePicker;
                      if (next) {
                        updatePopoverPosition(e.currentTarget.closest('.relative') || e.currentTarget.parentElement, setTimePickerPlacement, 440);
                      }
                      setShowTimePicker(next);
                      setShowDateCalendar(false);
                      setActiveDocTimePickerIndex(null);
                    }}
                    title="Open Time Calendar Picker"
                    className="absolute right-2 p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <span className="block mt-1 text-11 text-slate-500">Opening &amp; closing timings quoted by AI</span>

                {/* Time Calendar Popover */}
                {showTimePicker && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowTimePicker(false)}
                    />
                    <div
                      ref={timePickerPopoverRef}
                      style={{ maxHeight: timePickerPlacement.maxHeight ? `${timePickerPlacement.maxHeight}px` : undefined }}
                      className={`absolute ${
                        timePickerPlacement.placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                      } bg-white border border-slate-900/[0.12] rounded-2xl shadow-[0_14px_35px_-5px_theme(colors.slate.900_/_0.18),0_8px_12px_-6px_theme(colors.slate.900_/_0.08)] p-s-14-4 z-40 right-0 left-0 sm:left-auto sm:w-80 overflow-y-auto`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Set Daily Hours (Time Picker)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTimePicker(false)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Time Inputs */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="block text-11 font-semibold text-slate-600 mb-1">
                            Opening Time
                          </label>
                          <input
                            type="time"
                            value={timePickerStart}
                            onChange={(e) => updateWorkingTime(e.target.value, timePickerEnd)}
                            className="w-full text-xs font-mono font-medium p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-11 font-semibold text-slate-600 mb-1">
                            Closing Time
                          </label>
                          <input
                            type="time"
                            value={timePickerEnd}
                            onChange={(e) => updateWorkingTime(timePickerStart, e.target.value)}
                            className="w-full text-xs font-mono font-medium p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Quick Time Presets */}
                      <div className="space-y-1.5 mb-2.5">
                        <span className="block text-10 font-semibold uppercase tracking-wider text-slate-400">
                          Common Daily Timings:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { label: '09:00 AM - 08:00 PM (Full Day)', start: '09:00', end: '20:00' },
                            { label: '10:00 AM - 07:00 PM (Standard)', start: '10:00', end: '19:00' },
                            { label: '08:00 AM - 02:00 PM (Morning)', start: '08:00', end: '14:00' },
                            { label: '05:00 PM - 09:00 PM (Evening)', start: '17:00', end: '21:00' },
                            { label: '12:00 AM - 11:59 PM (24 Hours Open)', start: '00:00', end: '23:59' }
                          ].map((t) => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => {
                                updateWorkingTime(t.start, t.end);
                                setShowTimePicker(false);
                              }}
                              className={`text-left px-2.5 py-1.5 rounded-md text-11 font-mono border transition-colors ${
                                timePickerStart === t.start && timePickerEnd === t.end
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-11 font-mono text-slate-500 truncate">
                          {formData.working_time}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTimePicker(false)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Doctors & Services */}
          <div
            className="relative p-6 sm:px-8 sm:py-7 rounded-24 bg-white/[0.86] shadow-[inset_0_0_0_1px_theme(colors.white_/_0.95),0_0_0_1px_theme(colors.slate.900_/_0.08),0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_18px_40px_-26px_theme(colors.blue.800_/_0.35)] scroll-mt-24 space-y-4"
            id="biz-doctors"
            style={{ zIndex: activeDocTimePickerIndex !== null ? 35 : 1 }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-15 font-semibold text-slate-800 tracking-tight">
                {formData.business_type === 'medical_store' ? 'Pharmacist Staff & Offerings' : 'Doctors & Services'}
              </h3>
              <button
                type="button"
                onClick={addDoctorRow}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold text-blue-600 bg-tint-blue-10 shadow-[inset_0_0_0_1px_theme(colors.blue.600_/_0.18)] hover:text-white hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{formData.business_type === 'medical_store' ? 'Add Staff / Pharmacist' : 'Add Doctor'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.doctors.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-gradient-to-b from-tint-blue-3 to-ice-base shadow-[inset_0_0_0_1px_theme(colors.blue.800_/_0.08)]"
                  style={{
                    position: 'relative',
                    zIndex: activeDocTimePickerIndex === idx ? 40 : 'auto'
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                    <input
                      type="text"
                      minLength={3}
                      maxLength={50}
                      value={doc.name}
                      onChange={(e) => updateDoctorRow(idx, 'name', e.target.value.replace(/[0-9]/g, '').slice(0, 50))}
                      placeholder="Doctor Name (e.g. Dr. Rajesh)"
                      className="w-full h-[2.4rem] px-3.5 rounded-11-2 text-13 text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                    />
                    <input
                      type="text"
                      minLength={3}
                      maxLength={50}
                      value={doc.specialization}
                      onChange={(e) => updateDoctorRow(idx, 'specialization', e.target.value.replace(/[0-9]/g, '').slice(0, 50))}
                      placeholder="Specialty (e.g. Dentist)"
                      className="w-full h-[2.4rem] px-3.5 rounded-11-2 text-13 text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                    />
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={doc.timings}
                        onChange={(e) => updateDoctorRow(idx, 'timings', e.target.value)}
                        placeholder="e.g. 10:00 AM - 07:00 PM"
                        className="w-full h-[2.4rem] pl-3.5 pr-8 rounded-11-2 text-xs font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          if (activeDocTimePickerIndex === idx) {
                            setActiveDocTimePickerIndex(null);
                          } else {
                            updatePopoverPosition(e.currentTarget.parentElement, setDocTimePickerPlacement, 560);
                            setActiveDocTimePickerIndex(idx);
                            setShowTimePicker(false);
                            setShowDateCalendar(false);
                          }
                        }}
                        title="Open Time Calendar Picker"
                        className="absolute right-1.5 p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      {/* Doctor Time Calendar / Picker Popover */}
                      {activeDocTimePickerIndex === idx && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveDocTimePickerIndex(null)}
                          />
                          <div
                            ref={docTimePickerPopoverRef}
                            style={{ maxHeight: docTimePickerPlacement.maxHeight ? `${docTimePickerPlacement.maxHeight}px` : undefined }}
                            className={`absolute ${
                              docTimePickerPlacement.placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                            } bg-white border border-slate-900/[0.12] rounded-2xl shadow-[0_14px_35px_-5px_theme(colors.slate.900_/_0.18),0_8px_12px_-6px_theme(colors.slate.900_/_0.08)] p-s-14-4 z-40 right-0 left-0 sm:left-auto sm:w-80 md:w-doctor-popover overflow-y-auto adm-calendar-widget`}
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Set Doctor Timings (Time Picker)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveDocTimePickerIndex(null)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Same timing and day controls as the portal's doctor modal */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-2.5 items-start">
                              <div className="md:col-span-5">
                                <DoctorTimingsField
                                  timing={getDoctorSchedule(doc).timing}
                                  onChange={(timing) => updateDoctorSchedule(idx, getDoctorSchedule(doc).days, timing)}
                                />
                              </div>
                              <div className="md:col-span-7 space-y-3">
                                <DoctorDaysField
                                  days={getDoctorSchedule(doc).days}
                                  onChange={(days) => updateDoctorSchedule(idx, days, getDoctorSchedule(doc).timing)}
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                              <span className="text-11 font-mono text-slate-500 truncate min-w-0" title={doc.timings}>
                                {doc.timings || 'Select or enter timings'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveDocTimePickerIndex(null)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {formData.doctors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDoctorRow(idx)}
                      className="inline-grid place-items-center w-7 h-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <h4 className="text-13 font-semibold text-slate-700">
                {formData.business_type === 'medical_store' ? 'Medicine Categories & Offerings' : 'Services & Treatments'}
              </h4>
              <button
                type="button"
                onClick={addServiceRow}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold text-blue-600 bg-tint-blue-10 shadow-[inset_0_0_0_1px_theme(colors.blue.600_/_0.18)] hover:text-white hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{formData.business_type === 'medical_store' ? 'Add Category' : 'Add Service'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formData.services.map((srv, idx) => (
                <div key={idx} className="flex items-center gap-2 h-[2.6rem] pl-s-14-4 pr-2 rounded-14 bg-white border border-slate-900/[0.14] focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-[border-color,box-shadow] duration-200">
                  <input
                    type="text"
                    minLength={3}
                    maxLength={50}
                    value={srv.name}
                    onChange={(e) => updateServiceRow(idx, e.target.value.replace(/[0-9]/g, '').slice(0, 50))}
                    placeholder="e.g. Root Canal Treatment"
                    className="bg-transparent border-none text-sm text-ink flex-1 min-w-0 focus:outline-none placeholder:text-slate-400"
                  />
                  {formData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeServiceRow(idx)}
                      className="inline-grid place-items-center w-6 h-6 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
