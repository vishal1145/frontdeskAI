import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Stethoscope,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Loader2,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinic } from '../../context/ClinicContext';
import { DoctorDaysField, DoctorTimingsField, formatWorkingDays, parseTimingShifts, parseWorkingDays, splitTimings } from '../../components/DoctorSchedulePicker';

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
  'All Days (Mon - Sun), 10:00 AM - 09:00 PM',
  '10:00 AM - 02:00 PM & 04:30 PM - 08:00 PM',
  '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM'
];

export default function DoctorsServicesPage() {
  const { clinic, setClinic, appointments } = useClinic();

  // Doctors State
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctorIndex, setEditingDoctorIndex] = useState(null); // null when adding
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    timings: 'Monday to Saturday, 10:00 AM - 08:00 PM'
  });
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null); // { index, name }
  const [deletingDoctor, setDeletingDoctor] = useState(false);

  // Calendar Schedule Modal State for Doctor Working Timings
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState('Monday to Saturday');
  const [selectedTiming, setSelectedTiming] = useState('10:00 AM - 08:00 PM');
  const [selectedServices, setSelectedServices] = useState([]); // empty = doctor handles every service
  const modalScrollRef = useRef(null);

  // Prevent background scroll while doctor modal is open
  useEffect(() => {
    if (!doctorModalOpen) return;

    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalOverflow;
    };
  }, [doctorModalOpen]);

  // Services State
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [editingServiceName, setEditingServiceName] = useState('');
  const [savingService, setSavingService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null); // { index, name }
  const [deletingService, setDeletingService] = useState(false);

  if (!clinic) return null;

  const doctorUpcomingCount = doctorToDelete
    ? (appointments || []).filter((appt) => (
        appt.doctor_name === doctorToDelete.name
        && appt.status !== 'cancelled'
        && new Date(appt.slot_iso_timestamp).getTime() > Date.now()
      )).length
    : 0;

  // Helper to keep localStorage.clinic_auth updated
  const syncClinicAuth = (updatedFields) => {
    try {
      const stored = localStorage.getItem('clinic_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('clinic_auth', JSON.stringify({ ...parsed, ...updatedFields }));
      }
    } catch (e) {
      console.error('Error syncing clinic_auth in localStorage:', e);
    }
  };

  // ─── DOCTORS HANDLERS ────────────────────────────────────────────────────────
  const handleOpenAddDoctor = () => {
    setEditingDoctorIndex(null);
    const { days: defaultDays, timing: defaultTiming } = splitTimings(clinic.working_hours);
    setSelectedDays(defaultDays);
    setSelectedTiming(defaultTiming);
    setSelectedServices([]);
    setDoctorForm({
      name: '',
      specialization: '',
      timings: `${defaultDays}, ${defaultTiming}`
    });
    setDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc, index) => {
    setEditingDoctorIndex(index);
    const rawTimings = doc.timings || clinic.working_hours || 'Monday to Saturday, 10:00 AM - 08:00 PM';
    const { days: docDays, timing: docTiming } = splitTimings(rawTimings);
    setSelectedDays(doc.working_days?.length > 0 ? formatWorkingDays(doc.working_days) : docDays);
    setSelectedTiming(docTiming);
    setSelectedServices(Array.isArray(doc.services) ? doc.services : []);
    setDoctorForm({
      name: doc.name || '',
      specialization: doc.specialization || (Array.isArray(doc.specialties) ? doc.specialties.join(', ') : ''),
      timings: rawTimings
    });
    setDoctorModalOpen(true);
  };

  const timingShifts = parseTimingShifts(selectedTiming);

  const handleSaveDoctor = async (e) => {
    if (e) e.preventDefault();
    const cleanName = doctorForm.name.replace(/[0-9]/g, '').trim();
    if (!cleanName || cleanName.length < 3) {
      toast.error('Doctor Name must be at least 3 characters and cannot contain numbers.');
      return;
    }
    const cleanSpec = doctorForm.specialization.replace(/[0-9]/g, '').trim() || 'Specialist';
    if (cleanSpec.length < 3) {
      toast.error('Specialization must be at least 3 characters.');
      return;
    }
    if (timingShifts.some((shift, i) => shift.start >= shift.end || (i > 0 && shift.start < timingShifts[i - 1].end))) {
      toast.error('Each shift must end after it starts, and shifts cannot overlap.');
      return;
    }
    const combinedTimings = selectedDays ? `${selectedDays}, ${selectedTiming}` : selectedTiming;
    const cleanTimings = combinedTimings || doctorForm.timings || 'Monday to Saturday, 10:00 AM - 08:00 PM';
    const specList = cleanSpec.split(',').map((s) => s.trim()).filter(Boolean);

    const doctorObj = {
      name: cleanName,
      specialization: cleanSpec,
      specialties: specList.length > 0 ? specList : [cleanSpec],
      timings: cleanTimings,
      services: selectedServices,
      working_days: parseWorkingDays(selectedDays)
    };

    const currentDoctors = [...(clinic.doctors || [])];
    const previousName = editingDoctorIndex !== null ? currentDoctors[editingDoctorIndex]?.name : null;
    if (editingDoctorIndex !== null) {
      currentDoctors[editingDoctorIndex] = doctorObj;
    } else {
      currentDoctors.push(doctorObj);
    }

    setSavingDoctor(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctors: currentDoctors,
          doctor_renames: previousName && previousName !== cleanName ? [{ from: previousName, to: cleanName }] : []
        })
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic((prev) => ({
          ...prev,
          doctors: data.clinic.doctors || currentDoctors
        }));
        syncClinicAuth({ doctors: data.clinic.doctors || currentDoctors });
        toast.success(editingDoctorIndex !== null ? 'Doctor updated successfully!' : 'Doctor added successfully!');
        setDoctorModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to save doctor.');
      }
    } catch (err) {
      toast.error('Network error saving doctor.');
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    const { index, name } = doctorToDelete;
    const currentDoctors = (clinic.doctors || []).filter((_, i) => i !== index);

    setDeletingDoctor(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctors: currentDoctors })
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic((prev) => ({
          ...prev,
          doctors: data.clinic.doctors || currentDoctors
        }));
        syncClinicAuth({ doctors: data.clinic.doctors || currentDoctors });
        toast.success(`Dr. ${name} deleted successfully!`);
        setDoctorToDelete(null);
      } else {
        toast.error(data.message || 'Failed to delete doctor.');
      }
    } catch (err) {
      toast.error('Network error deleting doctor.');
    } finally {
      setDeletingDoctor(false);
    }
  };

  // ─── SERVICES HANDLERS ───────────────────────────────────────────────────────
  const handleAddService = async () => {
    const clean = newServiceName.replace(/[0-9]/g, '').trim();
    if (!clean || clean.length < 3) {
      toast.error('Service name must be at least 3 characters and cannot contain numbers.');
      return;
    }
    if ((clinic.services || []).some((s) => s.toLowerCase() === clean.toLowerCase())) {
      toast.error('This service already exists in your offerings.');
      return;
    }

    const currentServices = [...(clinic.services || []), clean];
    setSavingService(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: currentServices })
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic((prev) => ({
          ...prev,
          services: data.clinic.services || currentServices
        }));
        syncClinicAuth({ services: data.clinic.services || currentServices });
        toast.success(`Service "${clean}" added successfully!`);
        setNewServiceName('');
        setIsAddingService(false);
      } else {
        toast.error(data.message || 'Failed to add service.');
      }
    } catch (err) {
      toast.error('Network error adding service.');
    } finally {
      setSavingService(false);
    }
  };

  const handleSaveEditService = async (index) => {
    const clean = editingServiceName.replace(/[0-9]/g, '').trim();
    if (!clean || clean.length < 3) {
      toast.error('Service name must be at least 3 characters and cannot contain numbers.');
      return;
    }

    const currentServices = [...(clinic.services || [])];
    const previousService = currentServices[index];
    currentServices[index] = clean;
    const currentDoctors = (clinic.doctors || []).map((doc) => ({
      ...doc,
      services: (doc.services || []).map((name) => (name === previousService ? clean : name))
    }));

    setSavingService(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: currentServices, doctors: currentDoctors })
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic((prev) => ({
          ...prev,
          services: data.clinic.services || currentServices,
          doctors: data.clinic.doctors || currentDoctors
        }));
        syncClinicAuth({ services: data.clinic.services || currentServices, doctors: data.clinic.doctors || currentDoctors });
        toast.success('Service updated successfully!');
        setEditingServiceIndex(null);
      } else {
        toast.error(data.message || 'Failed to update service.');
      }
    } catch (err) {
      toast.error('Network error updating service.');
    } finally {
      setSavingService(false);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    const { index, name } = serviceToDelete;
    const currentServices = (clinic.services || []).filter((_, i) => i !== index);

    setDeletingService(true);
    try {
      const res = await fetch(`/api/clinics/${clinic.clinic_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: currentServices })
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic((prev) => ({
          ...prev,
          services: data.clinic.services || currentServices,
          doctors: data.clinic.doctors || prev.doctors
        }));
        syncClinicAuth({ services: data.clinic.services || currentServices, doctors: data.clinic.doctors || clinic.doctors });
        toast.success(`Service "${name}" removed successfully!`);
        setServiceToDelete(null);
      } else {
        toast.error(data.message || 'Failed to remove service.');
      }
    } catch (err) {
      toast.error('Network error removing service.');
    } finally {
      setDeletingService(false);
    }
  };

  return (
    <>
      <section className="space-y-6 cx-panel-enter" role="region" aria-label="Doctors and Services">
      {/* ─── Doctors Section ───────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-900/[0.09] bg-gradient-to-r from-blue-50/40 to-white">
          <div>
            <h2 className="text-18 font-semibold tracking-tight-10 text-ink flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Registered Clinic Doctors
            </h2>
            <p className="mt-0.5 text-13 text-ink-muted">Dynamic doctor profiles loaded from database</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAddDoctor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Doctor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6">
          {(clinic.doctors || []).map((doc, idx) => (
            <div
              key={idx}
              className="p-s-18 rounded-xl border border-slate-900/[0.09] bg-slate-50 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-white hover:border-blue-200 hover:shadow-[0_8px_20px_-16px_theme(colors.blue.800_/_0.45)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-15 font-semibold text-ink truncate">{doc.name}</h3>
                  <p className="text-13 text-blue-700 font-medium mt-1">🕒 {doc.timings}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditDoctor(doc, idx)}
                    title="Edit Doctor Details"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoctorToDelete({ index: idx, name: doc.name })}
                    title="Delete Doctor"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid place-items-center w-8 h-8 rounded-lg text-blue-700 bg-blue-50 ml-1">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3.5 border-t border-slate-200/70">
                {[
                  ...(Array.isArray(doc.specialties) ? doc.specialties : []),
                  ...(doc.services?.length > 0 ? doc.services : ['All services'])
                ].map((chip, chipIdx) => (
                  <span
                    key={chipIdx}
                    className="inline-flex items-center gap-2 min-h-[1.625rem] px-2.5 py-1 border border-slate-900/[0.16] rounded-lg text-xs font-medium text-ink-soft bg-white shadow-2xs"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {(!clinic.doctors || clinic.doctors.length === 0) && (
            <div className="col-span-full p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No doctors registered yet.</p>
              <button
                type="button"
                onClick={handleOpenAddDoctor}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Doctor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Services Section ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-900/[0.09] bg-gradient-to-r from-blue-50/40 to-white">
          <div>
            <h2 className="text-18 font-semibold tracking-tight-10 text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Offered Clinical Services &amp; Procedures
            </h2>
            <p className="mt-0.5 text-13 text-ink-muted">Services recognized by AI receptionist for patient slot bookings</p>
          </div>
          <div className="flex items-center gap-2">
            {!isAddingService ? (
              <button
                type="button"
                onClick={() => setIsAddingService(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value.replace(/[0-9]/g, '').slice(0, 50))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddService();
                    if (e.key === 'Escape') {
                      setIsAddingService(false);
                      setNewServiceName('');
                    }
                    if (/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                  maxLength={50}
                  autoFocus
                  placeholder="Service name (min 3 chars)"
                  className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56 shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  disabled={savingService}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                >
                  {savingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingService(false);
                    setNewServiceName('');
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 p-5 sm:p-6">
          {(clinic.services || []).map((srv, srvIdx) => (
            editingServiceIndex === srvIdx ? (
              <div
                key={srvIdx}
                className="inline-flex items-center gap-1.5 min-h-[2.25rem] px-2 py-1 border border-blue-400 rounded-10 bg-white shadow-xs"
              >
                <input
                  type="text"
                  value={editingServiceName}
                  onChange={(e) => setEditingServiceName(e.target.value.replace(/[0-9]/g, '').slice(0, 50))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEditService(srvIdx);
                    if (e.key === 'Escape') setEditingServiceIndex(null);
                    if (/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                  maxLength={50}
                  autoFocus
                  className="px-2 py-1 text-xs font-semibold text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                  placeholder="Service name (min 3 chars)"
                />
                <button
                  type="button"
                  onClick={() => handleSaveEditService(srvIdx)}
                  disabled={savingService}
                  className="p-1 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
                  title="Save Service"
                >
                  {savingService ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingServiceIndex(null)}
                  disabled={savingService}
                  className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span
                key={srvIdx}
                className="inline-flex items-center gap-2 min-h-[2.25rem] pl-3.5 pr-2 py-1.5 border border-blue-200 hover:border-blue-400 rounded-10 text-13 font-semibold text-blue-800 bg-tint-blue-4 transition-all shadow-2xs group"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{srv}</span>
                <span className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-blue-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingServiceIndex(srvIdx);
                      setEditingServiceName(srv);
                    }}
                    title="Edit Service"
                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100/70 rounded transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceToDelete({ index: srvIdx, name: srv })}
                    title="Delete Service"
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              </span>
            )
          ))}
          {(!clinic.services || clinic.services.length === 0) && (
            <div className="w-full p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-600">No clinical services configured yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Clinic Hours & Telephony Config ───────────────────────────────── */}
      <div className="bg-white border border-slate-900/[0.09] rounded-14 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04),0_10px_28px_-18px_theme(colors.blue.800_/_0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-900/[0.09]">
          <h3 className="text-base font-semibold tracking-tight-10 text-ink flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Operating Hours &amp; Phone Configuration
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 sm:p-6">
          <div className="p-3.5 sm:p-4 border border-slate-900/[0.09] rounded-xl bg-slate-50 text-13 leading-ratio-150 text-ink-soft">
            <span className="block mb-1 text-sm font-semibold text-ink">Working Hours</span>
            <span>{clinic.working_hours}</span>
          </div>
          <div className="p-3.5 sm:p-4 border border-slate-900/[0.09] rounded-xl bg-slate-50 text-13 leading-ratio-150 text-ink-soft">
            <span className="block mb-1 text-sm font-semibold text-ink">Assigned Virtual Numbers (DIDs)</span>
            <span className="tabular-nums">
              {(clinic.virtual_phone_numbers || [])
                .filter((n) => !['8065355910', '+917668433939', '7668433939', '+13312923658'].includes(n))
                .join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Doctor Add / Edit Modal ───────────────────────────────────────── */}
      {doctorModalOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingDoctor) setDoctorModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-full min-h-0 adm-calendar-widget"
            role="dialog"
            aria-modal="true"
            aria-label={editingDoctorIndex !== null ? 'Edit Doctor Profile' : 'Add New Doctor'}
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
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingDoctorIndex !== null ? 'Edit Doctor Profile' : 'Add New Doctor'}
                  </h3>
                  <span className="block text-11 text-slate-500">Update doctor details &amp; on-call schedule</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoctorModalOpen(false)}
                disabled={savingDoctor}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDoctor} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div
                ref={modalScrollRef}
                className="p-5 overflow-y-auto flex-1 min-h-0"
                style={{ WebkitOverflowScrolling: 'touch' }}
                data-lenis-prevent="true"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Doctor Info & Timings */}
                  <div className="md:col-span-5 space-y-3.5">
                    {/* Doctor Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-11 font-semibold text-slate-400 uppercase tracking-wider block">
                          Doctor Name <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-10 font-mono font-semibold ${doctorForm.name.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {doctorForm.name.length}/50 chars (no numbers)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={doctorForm.name}
                        onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value.replace(/[0-9]/g, '').slice(0, 50) })}
                        onKeyDown={(e) => {
                          if (/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        maxLength={50}
                        minLength={3}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full px-3 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                        required
                      />
                    </div>

                    {/* Specialization / Specialties */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-11 font-semibold text-slate-400 uppercase tracking-wider block">
                          Specialization / Specialties <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-10 font-mono font-semibold ${doctorForm.specialization.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {doctorForm.specialization.length}/50 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={doctorForm.specialization}
                        onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value.replace(/[0-9]/g, '').slice(0, 50) })}
                        onKeyDown={(e) => {
                          if (/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        maxLength={50}
                        minLength={3}
                        placeholder="e.g. Dentist, Implantologist"
                        className="w-full px-3 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                        required
                      />
                      <span className="text-10 text-slate-400 mt-0.5 block">Separate multiple specialties with comma</span>
                    </div>

                    {/* Daily Timings Picker */}
                    <DoctorTimingsField timing={selectedTiming} onChange={setSelectedTiming} />

                    {/* Services handled by this doctor */}
                    {(clinic.services || []).length > 0 && (
                      <div>
                        <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Services Offered:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {clinic.services.map((service) => {
                            const isSelected = selectedServices.includes(service);
                            return (
                              <button
                                key={service}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedServices((prev) => (
                                  isSelected ? prev.filter((name) => name !== service) : [...prev, service]
                                ))}
                                className={`px-2 py-1 rounded-lg text-11 font-medium border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold shadow-xs'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {service}
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-10 text-slate-400 mt-0.5 block">
                          {selectedServices.length === 0 ? 'None selected: this doctor handles all services' : `${selectedServices.length} selected`}
                        </span>
                      </div>
                    )}

                    {/* Schedule Preview */}
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                      <span className="text-10 font-semibold text-blue-600 uppercase tracking-wider block mb-0.5">
                        Selected Schedule:
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-blue-900 block break-words">
                        {selectedDays ? `${selectedDays}, ${selectedTiming}` : selectedTiming}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Days & Calendar */}
                  <div className="md:col-span-7 space-y-3">
                    <DoctorDaysField days={selectedDays} onChange={setSelectedDays} />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDoctorModalOpen(false)}
                  disabled={savingDoctor}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingDoctor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingDoctorIndex !== null ? 'Save Changes' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Delete Doctor Confirmation Modal ──────────────────────────────── */}
      {doctorToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingDoctor) setDoctorToDelete(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-red-100 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Doctor</h3>
                <p className="text-xs text-slate-500">Remove from clinic registry</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{doctorToDelete.name}</strong>? This doctor will no longer be available for appointment bookings.
            </p>
            {doctorUpcomingCount > 0 && (
              <p className="text-xs font-medium text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                This doctor has {doctorUpcomingCount} upcoming appointment{doctorUpcomingCount > 1 ? 's' : ''}. They will stay booked under this name, so please reschedule or cancel them.
              </p>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                disabled={deletingDoctor}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoctor}
                disabled={deletingDoctor}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingDoctor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Service Confirmation Modal ─────────────────────────────── */}
      {serviceToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingService) setServiceToDelete(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-red-100 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Service</h3>
                <p className="text-xs text-slate-500">Remove from offerings</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">"{serviceToDelete.name}"</strong>? AI receptionist will no longer suggest this service.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                disabled={deletingService}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteService}
                disabled={deletingService}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </>
  );
}
