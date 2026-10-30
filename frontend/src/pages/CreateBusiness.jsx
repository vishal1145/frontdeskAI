import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import ReactCalendar from 'react-calendar';

const SECTIONS = [
  { id: 'biz-details', label: 'Business & Account Details' },
  { id: 'biz-location', label: 'Location & AI Receptionist' },
  { id: 'biz-doctors', label: 'Doctors & Timings' },
  { id: 'biz-services', label: 'Services & Treatments' },
];

// Create New Business & AI Agent — its own page (/admin/create), opened from the Super Admin Console.
export default function CreateBusiness({ setActivePage }) {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('frontdesk_admin_key') || '');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
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

  // Calendar & Time Popovers State
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [timePickerStart, setTimePickerStart] = useState('09:00');
  const [timePickerEnd, setTimePickerEnd] = useState('20:00');

  // Doctor Timings Time Picker State
  const [activeDocTimePickerIndex, setActiveDocTimePickerIndex] = useState(null);
  const [docTimePickerStart, setDocTimePickerStart] = useState('10:00');
  const [docTimePickerEnd, setDocTimePickerEnd] = useState('19:00');

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

  const updateDoctorTime = (index, start24, end24) => {
    setDocTimePickerStart(start24);
    setDocTimePickerEnd(end24);
    const formatted = `${formatTime12h(start24)} - ${formatTime12h(end24)}`;
    updateDoctorRow(index, 'timings', formatted);
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
          timings: d.timings?.trim() || combinedWorkingHours
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
        services: cleanServices
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
    'biz-details': formData.clinic_name.trim().length >= 3 && formData.contact_phone.length === 10 && passwordStrength.score >= 2,
    'biz-location': formData.address.trim().length >= 3 && !!formData.working_days.trim() && !!formData.working_time.trim() && !!formData.receptionist_name,
    'biz-doctors': formData.doctors.some((d) => d.name.trim().length >= 3),
    'biz-services': formData.services.some((s) => s.name.trim().length >= 3),
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    // data-motion-scope opts this tool page out of the marketing site's magnetic/tilt effects.
    <div className="relative min-h-[calc(100vh-4.25rem)] pb-20 text-ink before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[32rem] before:z-0 before:bg-[radial-gradient(40rem_18rem_at_12%_0%,rgba(162,232,253,0.45),transparent_70%),radial-gradient(36rem_20rem_at_92%_8%,rgba(188,220,255,0.5),transparent_70%)] before:pointer-events-none" data-motion-scope="admin">
      <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">

        {/* Page header */}
        <header className="flex items-center gap-4 adm-rise" style={{ '--i': 1 }}>
          <button
            type="button"
            onClick={goToConsole}
            className="grid place-items-center flex-none w-14 h-14 rounded-[1.1rem] text-white bg-gradient-to-b from-[#2B8AF7] to-[#1570E0] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_0_4px_rgba(43,138,247,0.1),0_10px_22px_-10px_rgba(21,112,224,0.7)] hover:from-[#1570E0] hover:to-[#0D5BBF] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_0_4px_rgba(43,138,247,0.2),0_12px_24px_-8px_rgba(21,112,224,0.8)] active:scale-95 transition-all duration-200 cursor-pointer group"
            title="Back to Super Admin Console"
          >
            <ArrowLeft className="w-6 h-6 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[clamp(1.5rem,1.1rem+1.4vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink" style={{ fontSize: 'calc(clamp(1.5rem, 1.1rem + 1.4vw, 2.1rem) - 2px)' }}>Create New Business &amp; AI Agent</h1>
            <div className="text-[1.05rem] mt-[0.2rem] text-slate-500" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Deploy a dedicated voice receptionist instantly to PostgreSQL &amp; LiveKit</div>
          </div>
        </header>

        <form onSubmit={handleCreateClinic} className="grid grid-cols-1 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-0 gap-5 mt-8">
          {/* Section index & sidebar actions */}
          <aside className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-[calc(4.25rem+1.5rem)] adm-rise" style={{ '--i': 2 }} aria-label="Form sections">
            <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:p-[0.6rem] lg:overflow-visible lg:rounded-[1.25rem] lg:bg-white/70 lg:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9),0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(14,26,46,0.04),0_18px_40px_-26px_rgba(23,76,150,0.35)]">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={`flex items-center gap-[0.65rem] w-full py-[0.55rem] pr-[0.75rem] pl-[0.55rem] rounded-[0.875rem] text-[0.8125rem] font-medium text-left whitespace-nowrap lg:whitespace-normal transition-[background-color,color,box-shadow] duration-200 cursor-pointer ${
                      sectionDone[s.id]
                        ? 'text-ink bg-[#EEF5FF] shadow-none'
                        : 'text-[#3B4A63] bg-white/80 lg:bg-transparent shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] lg:shadow-none hover:text-ink hover:bg-[#EEF5FF]'
                    }`}
                  >
                    <span className={`grid place-items-center flex-none w-[1.6rem] h-[1.6rem] rounded-full text-[0.75rem] font-semibold transition-[background-color,color,transform] duration-300 ${
                      sectionDone[s.id]
                        ? '!text-white !bg-[#10B981] !shadow-[0_0_0_3px_rgba(16,185,129,0.15)] scale-[1.04]'
                        : 'text-[#1570E0] bg-[#EAF3FF] shadow-[inset_0_0_0_1px_rgba(21,112,224,0.2)]'
                    }`}>
                      {sectionDone[s.id] ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-3 p-3.5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-[0_4px_16px_-4px_rgba(23,76,150,0.1)]">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 w-full justify-center text-xs py-2.5 px-3 rounded-full font-semibold cursor-pointer text-white bg-gradient-to-b from-[#2B8AF7] to-[#1570E0] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_26px_-12px_rgba(21,112,224,0.75)] hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_16px_30px_-12px_rgba(21,112,224,0.85)] active:not(:disabled):translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
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
                className="inline-flex items-center gap-2 w-full justify-center text-xs py-2 px-3 rounded-full font-semibold cursor-pointer text-slate-500 bg-white/[0.85] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.14),0_1px_2px_rgba(14,26,46,0.04)] hover:not(:disabled):text-slate-800 hover:not(:disabled):bg-white hover:not(:disabled):shadow-[inset_0_0_0_1px_rgba(21,112,224,0.3),0_6px_16px_-10px_rgba(23,76,150,0.4)] disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </aside>

          {/* Form sections */}
          <div className="grid gap-5 min-w-0 lg:col-start-2">
          {/* Section 1: Basic Clinic Info */}
          <div className="relative p-6 sm:px-8 sm:py-7 rounded-[1.5rem] bg-white/[0.86] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.95),0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(14,26,46,0.04),0_18px_40px_-26px_rgba(23,76,150,0.35)] scroll-mt-24 space-y-4" id="biz-details">
            <h4 className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase text-[#1570E0] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-gradient-to-b before:from-[#60A5FA] before:to-[#1570E0] before:shadow-[0_0_0_3px_rgba(43,138,247,0.12)]">
              <span>1. Business &amp; Account Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono font-semibold ${formData.clinic_name.length > 45 ? 'text-amber-600' : 'text-slate-400'}`}>
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
                  placeholder="e.g. Apex Dental & Orthodontics"
                  className="w-full h-[2.875rem] px-[0.95rem] rounded-[0.875rem] text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                    Primary Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono font-semibold ${formData.contact_phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
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
                    className="w-full h-[2.875rem] pl-11 pr-[0.95rem] rounded-[0.875rem] text-sm font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                    Portal Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
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
                    className="w-full h-[2.875rem] pl-[0.95rem] pr-10 rounded-[0.875rem] text-sm font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
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
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                    <span className="text-slate-400">
                      Min 8 chars, mix of A-Z, 0-9 &amp; symbol
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location & AI Receptionist */}
          <div
            className="relative p-6 sm:px-8 sm:py-7 rounded-[1.5rem] bg-white/[0.86] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.95),0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(14,26,46,0.04),0_18px_40px_-26px_rgba(23,76,150,0.35)] scroll-mt-24 space-y-4"
            id="biz-location"
            style={{ zIndex: (showDateCalendar || showTimePicker) ? 35 : 2 }}
          >
            <h4 className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase text-[#1570E0] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-gradient-to-b before:from-[#60A5FA] before:to-[#1570E0] before:shadow-[0_0_0_3px_rgba(43,138,247,0.12)]">
              <span>2. Location &amp; AI Receptionist Personality</span>
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                  Full Business Address <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-mono font-semibold ${formData.address.length > 180 ? 'text-amber-600' : 'text-slate-400'}`}>
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
                className="w-full h-[2.875rem] px-[0.95rem] rounded-[0.875rem] text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
              />
              <span className="block mt-1 text-[0.6875rem] text-slate-500">AI Receptionist quotes this when callers ask for directions or location</span>
            </div>

            {/* Working Hours divided into 2 fields: Date & Day, and Time (both with Calendar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: Date & Day with Calendar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                    Working Days &amp; Dates <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
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
                    className="w-full h-[2.875rem] pl-[0.95rem] pr-10 rounded-[0.875rem] text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowDateCalendar(!showDateCalendar);
                      setShowTimePicker(false);
                      setActiveDocTimePickerIndex(null);
                    }}
                    title="Open Calendar Schedule Picker"
                    className="absolute right-2 p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <span className="block mt-1 text-[0.6875rem] text-slate-500">Days / dates when business is open</span>

                {/* Date Calendar Popover */}
                {showDateCalendar && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowDateCalendar(false)}
                    />
                    <div className="absolute top-full mt-1.5 bg-white border border-slate-900/[0.12] rounded-2xl shadow-[0_14px_35px_-5px_rgba(15,23,42,0.18),0_8px_12px_-6px_rgba(15,23,42,0.08)] p-[0.9rem] z-40 left-0 right-0 sm:right-auto sm:w-80 adm-calendar-widget">
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
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                              className={`text-left px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
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
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
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
                        <span className="text-[11px] text-slate-500 truncate max-w-[170px]" title={formData.working_days}>
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
                  <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                    Working Hours (Time) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
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
                    className="w-full h-[2.875rem] pl-[0.95rem] pr-10 rounded-[0.875rem] text-sm font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimePicker(!showTimePicker);
                      setShowDateCalendar(false);
                      setActiveDocTimePickerIndex(null);
                    }}
                    title="Open Time Calendar Picker"
                    className="absolute right-2 p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <span className="block mt-1 text-[0.6875rem] text-slate-500">Opening &amp; closing timings quoted by AI</span>

                {/* Time Calendar Popover */}
                {showTimePicker && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowTimePicker(false)}
                    />
                    <div className="absolute top-full mt-1.5 bg-white border border-slate-900/[0.12] rounded-2xl shadow-[0_14px_35px_-5px_rgba(15,23,42,0.18),0_8px_12px_-6px_rgba(15,23,42,0.08)] p-[0.9rem] z-40 right-0 left-0 sm:left-auto sm:w-80">
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
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                              className={`text-left px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-colors ${
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
                        <span className="text-[11px] font-mono text-slate-500 truncate">
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

            {/* AI Receptionist Name: Dropdown with 6 names */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block mb-1 text-[0.8125rem] font-medium text-[#3B4A63]">
                  AI Receptionist Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  6 Names Available
                </span>
              </div>
              <select
                value={formData.receptionist_name}
                onChange={(e) => setFormData({ ...formData, receptionist_name: e.target.value })}
                className="w-full h-[2.875rem] px-[0.95rem] rounded-[0.875rem] text-sm text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200 cursor-pointer"
              >
                <option value="Neha">Neha (Recommended)</option>
                <option value="Pooja">Pooja</option>
                <option value="Priya">Priya</option>
                <option value="Shivani">Shivani</option>
                <option value="Riya">Riya</option>
                <option value="Aditi">Aditi</option>
              </select>
              <span className="block mt-1 text-[0.6875rem] text-slate-500">Choose which AI voice receptionist greets callers on live phone calls</span>
            </div>
          </div>

          {/* Section 3: Doctors */}
          <div
            className="relative p-6 sm:px-8 sm:py-7 rounded-[1.5rem] bg-white/[0.86] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.95),0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(14,26,46,0.04),0_18px_40px_-26px_rgba(23,76,150,0.35)] scroll-mt-24 space-y-4"
            id="biz-doctors"
            style={{ zIndex: activeDocTimePickerIndex !== null ? 35 : 1 }}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase text-[#1570E0] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-gradient-to-b before:from-[#60A5FA] before:to-[#1570E0] before:shadow-[0_0_0_3px_rgba(43,138,247,0.12)]">
                <span>3. Doctors &amp; Timings</span>
              </h4>
              <button
                type="button"
                onClick={addDoctorRow}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold text-[#1570E0] bg-[#EEF5FF] shadow-[inset_0_0_0_1px_rgba(21,112,224,0.18)] hover:text-white hover:bg-[#1570E0] transition-colors duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Doctor</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.doctors.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-gradient-to-b from-[#F6FAFF] to-[#EFF5FD] shadow-[inset_0_0_0_1px_rgba(23,76,150,0.08)]"
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
                      className="w-full h-[2.4rem] px-[0.95rem] rounded-[0.7rem] text-[0.8125rem] text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                    />
                    <input
                      type="text"
                      minLength={3}
                      maxLength={50}
                      value={doc.specialization}
                      onChange={(e) => updateDoctorRow(idx, 'specialization', e.target.value.replace(/[0-9]/g, '').slice(0, 50))}
                      placeholder="Specialty (e.g. Dentist)"
                      className="w-full h-[2.4rem] px-[0.95rem] rounded-[0.7rem] text-[0.8125rem] text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                    />
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={doc.timings}
                        onChange={(e) => updateDoctorRow(idx, 'timings', e.target.value)}
                        placeholder="e.g. 10:00 AM - 07:00 PM"
                        className="w-full h-[2.4rem] pl-[0.95rem] pr-8 rounded-[0.7rem] text-xs font-mono text-ink bg-white border border-slate-900/[0.14] shadow-[0_1px_2px_rgba(14,26,46,0.04)] placeholder:text-slate-400 hover:border-slate-900/[0.24] focus:outline-none focus:border-[#2B8AF7] focus:ring-4 focus:ring-blue-500/15 transition-[border-color,box-shadow] duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (activeDocTimePickerIndex === idx) {
                            setActiveDocTimePickerIndex(null);
                          } else {
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
                          <div className="absolute top-full mt-1.5 bg-white border border-slate-900/[0.12] rounded-2xl shadow-[0_14px_35px_-5px_rgba(15,23,42,0.18),0_8px_12px_-6px_rgba(15,23,42,0.08)] p-[0.9rem] z-40 right-0 left-0 sm:left-auto sm:w-80">
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

                            {/* Time Inputs */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={docTimePickerStart}
                                  onChange={(e) => updateDoctorTime(idx, e.target.value, docTimePickerEnd)}
                                  className="w-full text-xs font-mono font-medium p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={docTimePickerEnd}
                                  onChange={(e) => updateDoctorTime(idx, docTimePickerStart, e.target.value)}
                                  className="w-full text-xs font-mono font-medium p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Quick Time Presets */}
                            <div className="space-y-1.5 mb-2.5">
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Common Doctor Timings:
                              </span>
                              <div className="grid grid-cols-1 gap-1.5">
                                {[
                                  { label: '10:00 AM - 07:00 PM (Standard)', start: '10:00', end: '19:00', text: '10:00 AM - 07:00 PM' },
                                  { label: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM (Split Shift)', text: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM' },
                                  { label: '09:00 AM - 01:00 PM (Morning OPD)', start: '09:00', end: '13:00', text: '09:00 AM - 01:00 PM' },
                                  { label: '05:00 PM - 09:00 PM (Evening OPD)', start: '17:00', end: '21:00', text: '05:00 PM - 09:00 PM' },
                                  { label: '09:00 AM - 08:00 PM (Full Day)', start: '09:00', end: '20:00', text: '09:00 AM - 08:00 PM' },
                                  { label: '11:00 AM - 04:00 PM (Day Shift)', start: '11:00', end: '16:00', text: '11:00 AM - 04:00 PM' },
                                  { label: 'On Call / By Appointment', text: 'On Call / By Appointment' }
                                ].map((t) => (
                                  <button
                                    key={t.label}
                                    type="button"
                                    onClick={() => {
                                      if (t.start && t.end) {
                                        setDocTimePickerStart(t.start);
                                        setDocTimePickerEnd(t.end);
                                      }
                                      updateDoctorRow(idx, 'timings', t.text);
                                      setActiveDocTimePickerIndex(null);
                                    }}
                                    className={`text-left px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-colors ${
                                      doc.timings === t.text
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
                              <span className="text-[11px] font-mono text-slate-500 truncate max-w-[190px]" title={doc.timings}>
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
          </div>

          {/* Section 4: Services */}
          <div className="relative p-6 sm:px-8 sm:py-7 rounded-[1.5rem] bg-white/[0.86] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.95),0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(14,26,46,0.04),0_18px_40px_-26px_rgba(23,76,150,0.35)] scroll-mt-24 space-y-4" id="biz-services">
            <div className="flex items-center justify-between gap-3">
              <h4 className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase text-[#1570E0] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-gradient-to-b before:from-[#60A5FA] before:to-[#1570E0] before:shadow-[0_0_0_3px_rgba(43,138,247,0.12)]">
                <span>4. Services &amp; Treatments</span>
              </h4>
              <button
                type="button"
                onClick={addServiceRow}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold text-[#1570E0] bg-[#EEF5FF] shadow-[inset_0_0_0_1px_rgba(21,112,224,0.18)] hover:text-white hover:bg-[#1570E0] transition-colors duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formData.services.map((srv, idx) => (
                <div key={idx} className="flex items-center gap-2 h-[2.6rem] pl-[0.9rem] pr-2 rounded-[0.875rem] bg-white border border-slate-900/[0.14] focus-within:border-[#2B8AF7] focus-within:ring-4 focus-within:ring-blue-500/15 transition-[border-color,box-shadow] duration-200">
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
