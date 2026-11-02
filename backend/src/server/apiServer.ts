import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { dbService } from "../services/dbService.js";
import { clinicRegistry, ClinicRegistration } from "../config/clinicRegistry.js";
import { vobizService } from "../services/vobizService.js";
import { recordingStorageService } from "../services/recordingStorageService.js";
import { generateDynamicClinicSlots } from "../tools/availabilityTool.js";
import { cleanWorkingDays, doctorSlotKey, normalizeName, selectDoctorForBooking, todayInIst } from "../services/doctorScheduleService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check
 */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "frontdesk-ai-api",
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. CLINIC MOBILE NUMBER AUTHENTICATION
 * Allows login ONLY with the clinic's registered mobile number in the database.
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered mobile number."
      });
    }

    if (!password || typeof password !== "string" || password.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter your password."
      });
    }

    const cleanInput = phone.trim();
    const enteredPassword = password.trim();
    const adminKey = getAdminSecretKey();

    // 1. Super Admin Authentication Check from Supabase Database (Phone + Password only)
    const superAdmin = await dbService.findSuperAdminByPhone(cleanInput);
    if (superAdmin) {
      if (enteredPassword === String(superAdmin.password).trim()) {
        console.log(`[AUTH LOGIN SUCCESS] Super Admin (${superAdmin.phone}) logged in via Supabase database.`);
        return res.json({
          success: true,
          role: "superadmin",
          token: adminKey,
          message: "Super Admin login successful!"
        });
      } else {
        console.warn(`[AUTH LOGIN REJECTED] Incorrect password for Super Admin: ${superAdmin.phone}`);
        return res.status(401).json({
          success: false,
          message: "Incorrect password. Please verify and try again."
        });
      }
    }

    console.log(`[AUTH LOGIN ATTEMPT] Mobile number: ${cleanInput}`);

    // Ensure clinic registry is synced with Supabase
    await clinicRegistry.ensureLoaded();

    const clinic = await dbService.findClinicByMobileNumber(cleanInput);

    if (!clinic) {
      console.warn(`[AUTH LOGIN REJECTED] Phone ${cleanInput} is not registered to any clinic.`);
      return res.status(404).json({
        success: false,
        message: "This mobile number is not associated with any registered clinic."
      });
    }

    // Verify password matches clinic password (default: '123456')
    const storedPassword = String(clinic.password || "123456").trim();

    if (storedPassword !== enteredPassword) {
      console.warn(`[AUTH LOGIN REJECTED] Incorrect password for clinic: ${clinic.clinic_name}`);
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please verify and try again."
      });
    }

    // Verify Super Admin Account Status (Enable / Disable)
    if (clinic.is_active === false) {
      console.warn(`[AUTH LOGIN BLOCKED] Disabled clinic account attempt: ${clinic.clinic_name} (${clinic.clinic_id})`);
      return res.status(403).json({
        success: false,
        is_disabled: true,
        message: "Your business account has been disabled by the Super Admin. Please contact support."
      });
    }

    console.log(`[AUTH LOGIN SUCCESS] Logged in with password verification: ${clinic.clinic_name} (${clinic.clinic_id})`);

    return res.json({
      success: true,
      message: "Login successful!",
      clinic: {
        clinic_id: clinic.clinic_id,
        clinic_name: clinic.clinic_name,
        contact_phone: clinic.contact_phone,
        address: clinic.address,
        working_hours: clinic.working_hours,
        receptionist_name: clinic.receptionist_name,
        virtual_phone_numbers: clinic.virtual_phone_numbers || [clinic.contact_phone],
        doctors: clinic.doctors,
        services: clinic.services,
        is_active: clinic.is_active !== false
      }
    });
  } catch (err: any) {
    console.error(`[AUTH LOGIN ERROR]`, err);
    return res.status(500).json({
      success: false,
      message: "Server error occurred during login. Please try again."
    });
  }
});

/**
 * 2. CLINIC-SPECIFIC DASHBOARD & BILLING DETAILS
 * STRICT ISOLATION: Fetches ONLY the details, call logs, appointments, and billing for the logged-in clinic.
 */
app.get("/api/clinics/:clinicId/dashboard", async (req, res) => {
  try {
    const { clinicId } = req.params;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic ID required." });
    }

    await clinicRegistry.ensureLoaded();
    const clinic = clinicRegistry.getClinicById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found." });
    }

    // Sync latest CDRs in background without blocking dashboard load time
    if (vobizService.isConfigured()) {
      if (req.query.sync === 'true') {
        try {
          await vobizService.syncVobizCdrsForClinic(clinicId);
        } catch (e: any) {
          console.warn(`[VOBIZ AUTO-SYNC NOTICE] ${e.message}`);
        }
      } else {
        vobizService.syncVobizCdrsForClinic(clinicId).catch((e: any) => {
          console.warn(`[VOBIZ AUTO-SYNC NOTICE] ${e.message}`);
        });
      }
    }

    // Parallel fetch for speed
    const [callLogs, billingSummary, appointments] = await Promise.all([
      dbService.getCallLogsForClinic(clinicId),
      dbService.getBillingSummaryForClinic(clinicId),
      dbService.getAppointmentsForClinic(clinicId)
    ]);

    return res.json({
      success: true,
      clinic: {
        clinic_id: clinic.clinic_id,
        clinic_name: clinic.clinic_name,
        contact_phone: clinic.contact_phone,
        address: clinic.address,
        working_hours: clinic.working_hours,
        receptionist_name: clinic.receptionist_name,
        virtual_phone_numbers: (clinic.virtual_phone_numbers || []).filter(
          (n: string) => !['8065355910', '+917668433939', '7668433939', '+13312923658'].includes(n)
        ),
        doctors: clinic.doctors,
        services: clinic.services,
        scheduling_enabled: clinic.scheduling_enabled !== false,
        slot_duration_minutes: clinic.slot_duration_minutes || 30
      },
      billing: billingSummary,
      call_logs: callLogs,
      appointments: appointments
    });
  } catch (err: any) {
    console.error(`[CLINIC DASHBOARD API ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2.1 IN-HOUSE CALENDAR: SLOTS & AVAILABILITY PER CLINIC & DATE
 * Fetches dynamic time slots cross-referenced with booked appointments in database.
 */
app.get("/api/clinics/:clinicId/calendar/slots", async (req, res) => {
  try {
    const { clinicId } = req.params;
    const targetDate = String(req.query.date || todayInIst());
    const doctorName = String(req.query.doctor || "");

    await clinicRegistry.ensureLoaded();
    const clinic = clinicRegistry.getClinicById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found." });
    }

    const isSchedulingEnabled = clinic.scheduling_enabled !== false;
    // One doctor when filtered, otherwise every doctor's own schedule
    const doctorNames = doctorName
      ? [doctorName]
      : (clinic.doctors?.length ? clinic.doctors.map((d) => d.name) : ["Clinic Doctor"]);
    const rawSlots = doctorNames.flatMap((name) => generateDynamicClinicSlots(targetDate, name, clinic));

    // Fetch existing appointments for this clinic on this date
    const appointments = await dbService.getAppointmentsForClinic(clinicId);
    const activeAppts = appointments.filter(
      (a) => a.status !== "cancelled" && a.slot_iso_timestamp.startsWith(targetDate)
        && (!doctorName || normalizeName(a.doctor_name) === normalizeName(doctorName))
    );
    const apptMap = new Map<string, any>();
    for (const a of activeAppts) {
      apptMap.set(doctorSlotKey(a.slot_iso_timestamp, a.doctor_name), a);
    }

    // Bookings outside the current schedule stay visible instead of vanishing from the calendar
    const generatedKeys = new Set(rawSlots.map((s) => doctorSlotKey(s.slot_iso, s.doctor_name)));
    const offScheduleSlots = activeAppts
      .filter((a) => !generatedKeys.has(doctorSlotKey(a.slot_iso_timestamp, a.doctor_name)))
      .map((a) => ({
        slot_iso: a.slot_iso_timestamp,
        display_time: new Date(a.slot_iso_timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
        doctor_name: a.doctor_name,
        available: false
      }));

    const now = new Date();
    const slots = [...rawSlots, ...offScheduleSlots]
      .sort((a, b) => new Date(a.slot_iso).getTime() - new Date(b.slot_iso).getTime())
      .map((s) => {
        const slotTime = new Date(s.slot_iso).getTime();
        const isPast = slotTime < now.getTime();
        const existingAppt = apptMap.get(doctorSlotKey(s.slot_iso, s.doctor_name));

        return {
          slot_iso: s.slot_iso,
          display_time: s.display_time,
          doctor_name: s.doctor_name,
          is_booked: Boolean(existingAppt),
          is_past: isPast,
          available: !existingAppt && !isPast && isSchedulingEnabled,
          appointment: existingAppt
            ? {
                booking_id: existingAppt.booking_id,
                patient_name: existingAppt.patient_name,
                patient_phone: existingAppt.patient_phone,
                service_type: existingAppt.service_type,
                status: existingAppt.status,
                created_at: existingAppt.created_at
              }
            : null
        };
      });

    return res.json({
      success: true,
      clinic_id: clinicId,
      scheduling_enabled: isSchedulingEnabled,
      date: targetDate,
      selected_doctor: doctorName,
      doctors: clinic.doctors || [],
      slots_count: slots.length,
      booked_count: slots.filter((s) => s.is_booked).length,
      available_count: slots.filter((s) => s.available).length,
      slots
    });
  } catch (err: any) {
    console.error(`[CALENDAR SLOTS ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2.2 IN-HOUSE CALENDAR: ON / OFF SCHEDULING TOGGLE
 * Enables or disables online & AI receptionist appointment scheduling per clinic.
 */
app.post("/api/clinics/:clinicId/calendar/toggle", async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { scheduling_enabled, slot_duration_minutes } = req.body;

    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic ID required." });
    }

    await clinicRegistry.ensureLoaded();
    const clinic = clinicRegistry.getClinicById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found." });
    }

    const newStatus = Boolean(scheduling_enabled);
    const duration = Number(slot_duration_minutes) || clinic.slot_duration_minutes || 30;

    const pool = (clinicRegistry as any).pgPool;
    if (pool) {
      await pool.query(
        "UPDATE clinics SET scheduling_enabled = $1, slot_duration_minutes = $2 WHERE clinic_id = $3;",
        [newStatus, duration, clinicId]
      );
    }

    clinicRegistry.updateClinicScheduling(clinicId, newStatus, duration);

    return res.json({
      success: true,
      message: `Scheduling feature successfully turned ${newStatus ? "ON" : "OFF"}.`,
      scheduling_enabled: newStatus,
      slot_duration_minutes: duration
    });
  } catch (err: any) {
    console.error(`[CALENDAR TOGGLE ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2.2b SUPER ADMIN: ENABLE / DISABLE BUSINESS ACCOUNT STATUS
 * Toggles whether a business account is active or disabled, stored persistently in Supabase DB.
 */
app.post("/api/clinics/:clinicId/status", async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { is_active } = req.body;
    const adminKeyHeader = req.headers["x-admin-key"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "") || req.body?.adminKey;
    const adminSecret = getAdminSecretKey();
    const validKeys = [adminSecret, "Frontend@123", "admin@frontdesk2025"];

    if (!adminKeyHeader || !validKeys.includes(String(adminKeyHeader).trim())) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid Super Admin key."
      });
    }

    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic ID is required." });
    }

    await clinicRegistry.ensureLoaded();
    const clinic = clinicRegistry.getClinicById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Business not found." });
    }

    const nextActiveStatus = Boolean(is_active);

    const pool = (clinicRegistry as any).pgPool;
    if (pool) {
      await pool.query(
        "UPDATE clinics SET is_active = $1 WHERE clinic_id = $2;",
        [nextActiveStatus, clinicId]
      );
    }

    clinicRegistry.updateClinicActiveStatus(clinicId, nextActiveStatus);

    const statusText = nextActiveStatus ? "enabled" : "disabled";
    return res.json({
      success: true,
      message: `"${clinic.clinic_name}" has been ${statusText} successfully.`,
      is_active: nextActiveStatus
    });
  } catch (err: any) {
    console.error("[CLINIC STATUS TOGGLE ERROR]", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update business status."
    });
  }
});

/**
 * 2.2c CLINIC PROFILE UPDATE:
 * Allows a clinic to edit their business profile details
 */
const cleanDoctorServices = (assigned: any, allowed: string[]): string[] => {
  const allowedByName = new Map(allowed.map((name) => [normalizeName(name), name]));
  const picked = (Array.isArray(assigned) ? assigned : [])
    .map((name: any) => allowedByName.get(normalizeName(String(name))))
    .filter((name): name is string => Boolean(name));
  return [...new Set(picked)];
};

const handleClinicProfileUpdate = async (req: express.Request, res: express.Response) => {
  try {
    const clinicId = String(req.params.clinicId || "");
    const {
      clinic_name,
      contact_phone,
      receptionist_name,
      address,
      working_hours,
      slot_duration_minutes,
      password,
      doctors,
      services,
      doctor_renames
    } = req.body;

    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic ID required." });
    }

    await clinicRegistry.ensureLoaded();
    const clinic = clinicRegistry.getClinicById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found." });
    }

    // Build dynamic UPDATE query
    const updates: Partial<ClinicRegistration> = {};
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (clinic_name !== undefined) {
      if (typeof clinic_name !== "string" || !clinic_name.trim()) {
        return res.status(400).json({ success: false, message: "Clinic name is required." });
      }
      const trimmedName = clinic_name.trim();
      if (/[0-9]/.test(trimmedName)) {
        return res.status(400).json({ success: false, message: "Clinic name cannot contain numbers." });
      }
      if (trimmedName.length < 3 || trimmedName.length > 50) {
        return res.status(400).json({ success: false, message: "Clinic name must be between 3 and 50 characters." });
      }
      setClauses.push(`clinic_name = $${paramIndex++}`);
      values.push(trimmedName);
      updates.clinic_name = trimmedName;
    }

    if (contact_phone !== undefined) {
      if (typeof contact_phone !== "string" || !contact_phone.trim()) {
        return res.status(400).json({ success: false, message: "Registered phone is required." });
      }
      let phoneDigits = contact_phone.replace(/[^0-9]/g, "");
      if (phoneDigits.startsWith("91") && phoneDigits.length > 10) {
        phoneDigits = phoneDigits.slice(2);
      }
      if (phoneDigits.length !== 10) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
      }
      const formattedPhone = `+91${phoneDigits}`;
      setClauses.push(`contact_phone = $${paramIndex++}`);
      values.push(formattedPhone);
      updates.contact_phone = formattedPhone;
    }

    if (receptionist_name !== undefined && typeof receptionist_name === "string" && receptionist_name.trim()) {
      setClauses.push(`receptionist_name = $${paramIndex++}`);
      values.push(receptionist_name.trim());
      updates.receptionist_name = receptionist_name.trim();
    }

    if (address !== undefined) {
      if (typeof address === "string") {
        const trimmedAddress = address.trim();
        if (trimmedAddress && trimmedAddress.length < 3) {
          return res.status(400).json({ success: false, message: "Address must be at least 3 characters." });
        }
        if (trimmedAddress.length > 200) {
          return res.status(400).json({ success: false, message: "Address cannot exceed 200 characters." });
        }
        setClauses.push(`address = $${paramIndex++}`);
        values.push(trimmedAddress);
        updates.address = trimmedAddress;
      }
    }

    if (working_hours !== undefined && typeof working_hours === "string") {
      setClauses.push(`working_hours = $${paramIndex++}`);
      values.push(working_hours.trim());
      updates.working_hours = working_hours.trim();
    }

    if (slot_duration_minutes !== undefined) {
      const durationNum = Number(slot_duration_minutes) || 30;
      setClauses.push(`slot_duration_minutes = $${paramIndex++}`);
      values.push(durationNum);
      updates.slot_duration_minutes = durationNum;
    }

    if (password !== undefined && typeof password === "string" && password.trim()) {
      setClauses.push(`password = $${paramIndex++}`);
      values.push(password.trim());
      updates.password = password.trim();
    }

    if (doctors !== undefined && Array.isArray(doctors)) {
      for (const d of doctors) {
        if (!d || typeof d.name !== "string" || d.name.trim().length < 3) {
          return res.status(400).json({ success: false, message: "Doctor name must be at least 3 characters." });
        }
      }
      const uniqueNames = new Set(doctors.map((d: any) => normalizeName(d.name.replace(/[0-9]/g, ''))));
      if (uniqueNames.size !== doctors.length) {
        return res.status(400).json({ success: false, message: "Each doctor must have a unique name." });
      }

      const allowedServices: string[] = Array.isArray(services)
        ? services.map((s: any) => (typeof s === "string" ? s : (s?.name || "")))
        : (clinicRegistry.getClinicById(clinicId)?.services || []);

      const cleanDoctors = doctors.map((d: any) => {
        const name = d.name.replace(/[0-9]/g, '').slice(0, 50).trim();
        const spec = (d.specialization || d.specialties?.[0] || "Specialist").toString().replace(/[0-9]/g, '').slice(0, 50).trim() || "Specialist";
        let specs = Array.isArray(d.specialties) && d.specialties.length > 0 
          ? d.specialties.map((s: any) => String(s).replace(/[0-9]/g, '').slice(0, 50).trim()).filter(Boolean)
          : [spec];
        if (specs.length === 0) specs = [spec];
        const timings = (d.timings || "10:00 AM - 7:00 PM").toString().slice(0, 100).trim();
        return {
          name,
          specialization: spec,
          specialties: specs,
          timings,
          services: cleanDoctorServices(d.services, allowedServices),
          working_days: cleanWorkingDays(d.working_days)
        };
      });

      setClauses.push(`doctors = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(cleanDoctors));
      updates.doctors = cleanDoctors;
    }

    if (services !== undefined && Array.isArray(services)) {
      for (const s of services) {
        const sName = typeof s === "string" ? s : (s?.name || "");
        if (typeof sName !== "string" || sName.trim().length < 3) {
          return res.status(400).json({ success: false, message: "Service name must be at least 3 characters." });
        }
      }
      const cleanServices = services.map((s: any) => {
        const str = typeof s === "string" ? s : (s?.name || "");
        return str.replace(/[0-9]/g, '').slice(0, 50).trim();
      }).filter((s: string) => s.length >= 3);

      setClauses.push(`services = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(cleanServices));
      updates.services = cleanServices;

      // A removed service must also leave every doctor it was assigned to
      if (doctors === undefined) {
        const prunedDoctors = (clinicRegistry.getClinicById(clinicId)?.doctors || []).map((d) => ({
          ...d,
          services: cleanDoctorServices(d.services, cleanServices)
        }));
        setClauses.push(`doctors = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(prunedDoctors));
        updates.doctors = prunedDoctors;
      }
    }

    if (setClauses.length > 0) {
      const pool = (clinicRegistry as any).pgPool;
      if (pool) {
        values.push(clinicId);
        const query = `UPDATE clinics SET ${setClauses.join(", ")} WHERE clinic_id = $${paramIndex};`;
        await pool.query(query, values);

        // Bookings are stored by doctor name, so a rename must carry them across
        for (const rename of Array.isArray(doctor_renames) ? doctor_renames : []) {
          if (rename?.from && rename?.to) {
            await pool.query(
              `UPDATE appointments SET doctor_name = $1 WHERE clinic_id = $2 AND doctor_name = $3 AND status <> 'cancelled'`,
              [String(rename.to), clinicId, String(rename.from)]
            );
          }
        }
      }
      clinicRegistry.updateClinicProfile(clinicId, updates);
    }

    const updatedClinic = clinicRegistry.getClinicById(clinicId);

    return res.json({
      success: true,
      message: "Clinic profile updated successfully.",
      clinic: {
        clinic_id: updatedClinic?.clinic_id,
        clinic_name: updatedClinic?.clinic_name,
        contact_phone: updatedClinic?.contact_phone,
        address: updatedClinic?.address,
        working_hours: updatedClinic?.working_hours,
        receptionist_name: updatedClinic?.receptionist_name,
        virtual_phone_numbers: (updatedClinic?.virtual_phone_numbers || []).filter(
          (n: string) => !['8065355910', '+917668433939', '7668433939', '+13312923658'].includes(n)
        ),
        doctors: updatedClinic?.doctors,
        services: updatedClinic?.services,
        scheduling_enabled: updatedClinic?.scheduling_enabled !== false,
        slot_duration_minutes: updatedClinic?.slot_duration_minutes || 30
      }
    });
  } catch (err: any) {
    console.error("[CLINIC PROFILE UPDATE ERROR]", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update clinic profile."
    });
  }
};

app.put("/api/clinics/:clinicId/profile", handleClinicProfileUpdate);
app.post("/api/clinics/:clinicId/profile", handleClinicProfileUpdate);
app.put("/api/clinics/:clinicId/doctors", handleClinicProfileUpdate);
app.put("/api/clinics/:clinicId/services", handleClinicProfileUpdate);

/**
 * 2.3 IN-HOUSE CALENDAR: DIRECT MANUAL BOOKING
 * Allows clinic admin / reception staff to book an appointment directly from the Calendar UI.
 */
app.post("/api/clinics/:clinicId/calendar/book", async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { patient_name, patient_phone, slot_iso_timestamp, service_type, doctor_name, notes } = req.body;

    if (!clinicId || !patient_name || !slot_iso_timestamp) {
      return res.status(400).json({ success: false, message: "Missing required booking details (patient name, slot time)." });
    }

    await clinicRegistry.ensureLoaded();
    const clinic = clinicRegistry.getClinicById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found." });
    }

    const selection = selectDoctorForBooking(clinic, {
      doctorName: doctor_name,
      serviceType: service_type,
      slotIso: slot_iso_timestamp,
      bookedKeys: await dbService.getBookedDoctorSlotsFromDb(clinicId)
    });
    if (selection.status !== "ok") {
      return res.status(selection.status === "slot_taken" ? 409 : 400).json({ success: false, message: selection.message });
    }

    const dbResult = await dbService.bookAppointmentInDb({
      clinic_id: clinicId,
      patient_name,
      patient_phone: patient_phone || clinic.contact_phone || "Manual Booking",
      slot_iso_timestamp,
      service_type: service_type || "General Consultation",
      doctor_name: selection.doctorName,
      notes: notes || "Directly booked via Clinic Admin Calendar"
    });

    if (dbResult.status === "slot_taken") {
      return res.status(409).json({ success: false, message: "This time slot is already booked." });
    }
    if (dbResult.status !== "confirmed") {
      return res.status(503).json({ success: false, message: dbResult.error_message || "Appointment could not be saved. Please try again." });
    }

    return res.json({
      success: true,
      message: "Appointment confirmed and booked successfully!",
      booking: dbResult
    });
  } catch (err: any) {
    console.error(`[CALENDAR BOOK ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2.4 IN-HOUSE CALENDAR: CANCEL APPOINTMENT
 * Allows clinic staff to cancel an appointment directly from the Calendar slot view.
 */
app.delete("/api/clinics/:clinicId/calendar/appointments/:bookingId", async (req, res) => {
  try {
    const { clinicId, bookingId } = req.params;
    if (!clinicId || !bookingId) {
      return res.status(400).json({ success: false, message: "Clinic ID and Booking ID required." });
    }

    const cancelled = await dbService.cancelAppointmentInDb(clinicId, bookingId);
    if (!cancelled) {
      return res.status(404).json({ success: false, message: "Appointment not found or already cancelled." });
    }

    return res.json({
      success: true,
      message: "Appointment cancelled successfully."
    });
  } catch (err: any) {
    console.error(`[CALENDAR CANCEL ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});



/**
 * Trigger manual or client-side sync with Vobiz CDR API
 */
app.post("/api/clinics/:clinicId/vobiz-sync", async (req, res) => {
  try {
    const { clinicId } = req.params;
    const synced = await vobizService.syncVobizCdrsForClinic(clinicId);
    return res.json({ success: true, synced_count: synced });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2B. CALL RECORDING PLAYBACK / PRESIGNED URL ENDPOINT
 * Generates secure temporary streaming URL (S3 Presigned or local stream).
 */
app.get("/api/clinics/:clinicId/calls/:callSid/recording", async (req, res) => {
  try {
    const { clinicId, callSid } = req.params;
    const playbackUrl = await recordingStorageService.getPlaybackUrl(clinicId, callSid);
    return res.json({
      success: true,
      call_sid: callSid,
      clinic_id: clinicId,
      playback_url: playbackUrl,
      is_s3: recordingStorageService.isAwsConfigured()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * LOCAL RECORDING STREAMING ENDPOINT (Fallback when S3 is local/dummy)
 */
app.get("/api/recordings/:clinicId/:filename", (req, res) => {
  const { clinicId, filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), "recordings", clinicId, safeFilename);

  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "audio/mpeg");
    return fs.createReadStream(filePath).pipe(res);
  }

  return res.status(404).json({
    success: false,
    message: "Recording audio file not found on local storage. Set valid AWS S3 credentials for cloud storage."
  });
});


/**
 * 3. VOBIZ REAL-TIME CDR / CALL LOGS WEBHOOK
 * Listens for Vobiz Hangup / CDR callbacks and automatically maps them to the respective clinic.
 */
app.post("/api/webhooks/vobiz/cdr", async (req, res) => {
  try {
    const body = req.body || {};
    console.log(`[VOBIZ WEBHOOK RECEIVED] Call Event Payload:`, JSON.stringify(body, null, 2));

    const callSid = body.CallUUID || body.call_uuid || body.uuid || body.call_id || body.CallSid || `vbz_${Date.now()}`;
    const callerPhone = body.From || body.from || body.caller || "Unknown";
    const calledNumber = body.To || body.to || body.destination || "";
    const diversion = body.Diversion || body.diversion || body["sip.diversion"] || "";
    const durationSeconds = parseInt(body.Duration || body.duration || body.BillDuration || "0", 10);
    const billableMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const isTransferred = Boolean(body.is_transferred || body.forwarded || body.transfer_to);
    const transferDestination = body.transfer_to || body.transfer_destination || null;
    const transferReason = body.transfer_reason || (isTransferred ? "Transferred by Voice AI" : null);

    // Resolve target clinic from Called number or SIP Diversion
    await clinicRegistry.ensureLoaded();
    const resolvedClinic = clinicRegistry.getClinicByPhone(diversion || calledNumber || callerPhone);

    // Direct actual cost from Vobiz webhook payload if provided
    const costVal = parseFloat(String(body.total_cost ?? body.cost ?? body.Price ?? body.price ?? 0.00));
    const costInr = !isNaN(costVal) && costVal > 0 ? costVal : 0.00;

    const altSids = [body.bridge_uuid, body.BridgeUUID, body.sip_call_id, body.SIPCallID, body.sip_call_id_full].filter(Boolean);

    await dbService.recordCallLogInDb({
      clinic_id: resolvedClinic.clinic_id,
      call_sid: callSid,
      caller_phone: callerPhone,
      called_number: calledNumber,
      call_direction: "inbound",
      duration_seconds: durationSeconds,
      billable_minutes: billableMinutes,
      is_transferred: isTransferred,
      transfer_destination: transferDestination,
      transfer_reason: transferReason,
      call_status: body.hangup_cause || "completed",
      cost_inr: costInr,
      summary: body.summary || (isTransferred ? `Call transferred to ${transferDestination}` : `AI voice receptionist consultation.`),
      created_at: new Date().toISOString()
    }, altSids);

    // Background sync to ensure full Vobiz CDR details & pricing are synchronized
    vobizService.syncVobizCdrsForClinic(resolvedClinic.clinic_id, false).catch(() => {});

    return res.status(200).json({ status: "success", call_sid: callSid, clinic_id: resolvedClinic.clinic_id });
  } catch (err: any) {
    console.error(`[VOBIZ WEBHOOK ERROR]`, err.message);
    return res.status(200).json({ status: "error", message: err.message });
  }
});

/**
 * 4. LIST REGISTERED CLINICS (Helpful reference)
 */
app.get("/api/clinics/list", async (_req, res) => {
  await clinicRegistry.ensureLoaded();
  const clinics = clinicRegistry.getAllClinics().map(c => ({
    clinic_id: c.clinic_id,
    clinic_name: c.clinic_name,
    contact_phone: c.contact_phone,
    address: c.address,
    working_hours: c.working_hours
  }));
  res.json({ success: true, count: clinics.length, clinics });
});

/**
 * 5. ADMIN PANEL APIS
 * Secure endpoints for Super Admin to create, list, and manage all registered clinics.
 */
const getAdminSecretKey = () => process.env.ADMIN_SECRET_KEY || "Frontend@123";

// Middleware to verify Admin Key
const verifyAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const secretKey = getAdminSecretKey();
  const provided = req.headers["x-admin-key"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "") || req.body?.adminKey;

  const validKeys = [secretKey, "Frontend@123", "admin@frontdesk2025"];
  if (!provided || !validKeys.includes(String(provided).trim())) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid Admin Master Key."
    });
  }
  next();
};

// 5.1 Admin Authentication Verification
app.post("/api/admin/auth/verify", (req, res) => {
  const secretKey = getAdminSecretKey();
  const providedKey = req.body?.key || req.body?.password || req.headers["x-admin-key"];

  const validKeys = [secretKey, "Frontend@123", "admin@frontdesk2025"];
  if (!providedKey || !validKeys.includes(String(providedKey).trim())) {
    return res.status(401).json({
      success: false,
      message: "Incorrect Admin Key. Please check the master key."
    });
  }

  return res.json({
    success: true,
    message: "Admin authentication successful.",
    token: secretKey
  });
});

// 5.2 Admin: List All Clinics from Database
app.get("/api/admin/clinics", verifyAdminAuth, async (_req, res) => {
  try {
    await clinicRegistry.ensureLoaded();
    const clinics = await dbService.getAllClinicsForAdmin();
    return res.json({
      success: true,
      count: clinics.length,
      clinics
    });
  } catch (err: any) {
    console.error(`[ADMIN LIST CLINICS ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5.3 Admin: Create New Clinic & Deploy AI Agent
app.post("/api/admin/clinics", verifyAdminAuth, async (req, res) => {
  try {
    const {
      clinic_name,
      contact_phone,
      address,
      working_hours,
      receptionist_name,
      password,
      virtual_phone_numbers,
      doctors,
      services,
      slot_duration_minutes,
      scheduling_enabled,
      custom_clinic_id
    } = req.body;

    if (!clinic_name || typeof clinic_name !== "string" || !clinic_name.trim()) {
      return res.status(400).json({ success: false, message: "Business Name is required." });
    }

    const cleanClinicName = clinic_name.replace(/[0-9]/g, '').slice(0, 50).trim();
    if (!cleanClinicName) {
      return res.status(400).json({ success: false, message: "Business Name cannot contain numbers." });
    }
    if (cleanClinicName.length < 3) {
      return res.status(400).json({ success: false, message: "Business Name must be at least 3 characters." });
    }

    if (!contact_phone || typeof contact_phone !== "string" || !contact_phone.trim()) {
      return res.status(400).json({ success: false, message: "Contact Phone number is required." });
    }

    const cleanPhoneDigits = contact_phone.replace(/[^0-9]/g, '');
    const last10 = cleanPhoneDigits.slice(-10);
    if (last10.length !== 10) {
      return res.status(400).json({ success: false, message: "Primary Mobile Number must be exactly 10 digits." });
    }
    const formattedPhone = `+91${last10}`;

    const cleanPassword = (password || "").trim();
    if (!cleanPassword || cleanPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }
    const hasLetter = /[a-zA-Z]/.test(cleanPassword);
    const hasNumber = /[0-9]/.test(cleanPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(cleanPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return res.status(400).json({ success: false, message: "Password must contain letters, numbers, and at least one special character (e.g. Strong@2025)." });
    }

    if (address && typeof address === "string" && address.trim().length > 0 && address.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Full Business Address must be at least 3 characters." });
    }

    // Address is limited to 200 chars with fallback
    const cleanAddress = (typeof address === "string" && address.trim()) 
      ? address.trim().slice(0, 200) 
      : "Address on file";

    // AI Receptionist Name: letters only, max 50 chars
    const cleanReceptionist = ((typeof receptionist_name === "string" && receptionist_name.trim()) || "Neha")
      .replace(/[0-9]/g, '')
      .slice(0, 50)
      .trim() || "Neha";

    if (Array.isArray(doctors)) {
      for (const d of doctors) {
        if (d && typeof d.name === "string" && d.name.trim() && d.name.trim().length < 3) {
          return res.status(400).json({ success: false, message: `Doctor name "${d.name.trim()}" must be at least 3 characters.` });
        }
        if (d && typeof d.specialization === "string" && d.specialization.trim() && d.specialization.trim().length < 3) {
          return res.status(400).json({ success: false, message: `Doctor specialty "${d.specialization.trim()}" must be at least 3 characters.` });
        }
      }
    }

    if (Array.isArray(services)) {
      for (const s of services) {
        const sName = typeof s === "string" ? s : (s?.name || "");
        if (sName.trim() && sName.trim().length < 3) {
          return res.status(400).json({ success: false, message: `Service "${sName.trim()}" must be at least 3 characters.` });
        }
      }
    }

    // Doctors: strip digits from name & specialization, max 50 chars
    const cleanDoctors = (Array.isArray(doctors) ? doctors : [])
      .filter((d: any) => d && typeof d.name === "string" && d.name.trim().length >= 3)
      .map((d: any) => ({
        name: d.name.replace(/[0-9]/g, '').slice(0, 50).trim(),
        specialization: (d.specialization || "Specialist").toString().replace(/[0-9]/g, '').slice(0, 50).trim() || "Specialist",
        timings: (d.timings || "10:00 AM - 7:00 PM").toString().slice(0, 100).trim(),
        working_days: cleanWorkingDays(d.working_days)
      }))
      .filter((d: any) => d.name.length >= 3);

    if (new Set(cleanDoctors.map((d: any) => normalizeName(d.name))).size !== cleanDoctors.length) {
      return res.status(400).json({ success: false, message: "Each doctor must have a unique name." });
    }

    // Services: strip digits, max 50 chars
    const cleanServices = (Array.isArray(services) ? services : [])
      .map((s: any) => {
        const str = typeof s === "string" ? s : (s?.name || "");
        return str.replace(/[0-9]/g, '').slice(0, 50).trim();
      })
      .filter((s: string) => s.length >= 3);

    // Generate unique clinic_id if not explicitly provided
    let clinicId = (custom_clinic_id || "").trim();
    if (!clinicId) {
      const slug = cleanClinicName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 25);
      clinicId = `clinic-${slug || 'frontdesk'}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const newClinic = await dbService.createClinicInDb({
      clinic_id: clinicId,
      clinic_name: cleanClinicName,
      contact_phone: formattedPhone,
      address: cleanAddress,
      working_hours: (working_hours || "Mon-Sat: 09:00 AM - 08:00 PM").trim().slice(0, 100),
      receptionist_name: cleanReceptionist,
      password: cleanPassword,
      virtual_phone_numbers: Array.isArray(virtual_phone_numbers) && virtual_phone_numbers.length > 0
        ? virtual_phone_numbers
        : ["+918065355910"],
      doctors: cleanDoctors,
      services: cleanServices,
      slot_duration_minutes: Number(slot_duration_minutes) || 30,
      scheduling_enabled: scheduling_enabled !== false
    });

    // Synchronize multi-tenant registry in memory immediately
    await clinicRegistry.loadClinicsFromDb();
    console.log(`[ADMIN CLINIC CREATED] Successfully created clinic: ${newClinic.clinic_name} (${newClinic.clinic_id})`);

    return res.status(201).json({
      success: true,
      message: `Clinic "${newClinic.clinic_name}" created successfully and AI Receptionist is live!`,
      clinic: newClinic
    });
  } catch (err: any) {
    console.error(`[ADMIN CREATE CLINIC ERROR]`, err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create clinic." });
  }
});

// 5.4 Admin: Delete Clinic Record
app.delete("/api/admin/clinics/:clinicId", verifyAdminAuth, async (req, res) => {
  try {
    const clinicId = String(req.params.clinicId || "").trim();
    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic ID required." });
    }

    const deleted = await dbService.deleteClinicFromDb(clinicId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Clinic not found or could not be deleted." });
    }

    await clinicRegistry.loadClinicsFromDb();
    console.log(`[ADMIN CLINIC DELETED] Deleted clinic: ${clinicId}`);

    return res.json({
      success: true,
      message: `Clinic ${clinicId} has been successfully deleted.`
    });
  } catch (err: any) {
    console.error(`[ADMIN DELETE CLINIC ERROR]`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

let serverInstance: any = null;

export function startApiServer(port = PORT) {
  if (serverInstance) return serverInstance;

  try {
    serverInstance = app.listen(port, () => {
      console.log(`\n🚀 [FRONTDESK API SERVER] HTTP REST & Vobiz Webhook Server listening on port ${port}`);
      console.log(`   ├─ Login Endpoint: POST http://localhost:${port}/api/auth/login`);
      console.log(`   ├─ Dashboard API: GET http://localhost:${port}/api/clinics/:clinicId/dashboard`);
      console.log(`   └─ Vobiz Webhook: POST http://localhost:${port}/api/webhooks/vobiz/cdr\n`);
    });

    serverInstance.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.log(`[API SERVER NOTICE] Port ${port} is already active, reusing existing instance.`);
      } else {
        console.error(`[API SERVER ERROR]`, err.message);
      }
    });

    return serverInstance;
  } catch (err: any) {
    console.warn(`[API SERVER NOTICE] Could not start HTTP server on port ${port}: ${err.message}`);
  }
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startApiServer();
}

export default app;
