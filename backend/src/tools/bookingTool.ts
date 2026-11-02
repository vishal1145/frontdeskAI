import { FunctionDeclaration, Type } from "@google/genai";
import { BookingParams, BookingResult } from "../types/index.js";
import { slotLockManager } from "../services/slotLockManager.js";
import { clinicRegistry } from "../config/clinicRegistry.js";
import { dbService } from "../services/dbService.js";
import { selectDoctorForBooking } from "../services/doctorScheduleService.js";

export const bookAppointmentDeclaration: FunctionDeclaration = {
  name: "book_appointment",
  description:
    "Books a confirmed appointment ONLY after caller confirms the selected slot and required details (name, phone, slot ISO timestamp, service type).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patient_name: {
        type: Type.STRING,
        description: "Full name of the patient e.g. 'Rahul Sharma'."
      },
      patient_phone: {
        type: Type.STRING,
        description: "10-digit contact phone number of the patient e.g. '9876543210'."
      },
      slot_iso_timestamp: {
        type: Type.STRING,
        description: "Exact ISO timestamp of confirmed slot e.g. '2026-10-02T18:00:00+05:30'."
      },
      service_type: {
        type: Type.STRING,
        description: "Reason for visit / service type e.g. 'General Checkup'."
      },
      doctor_name: {
        type: Type.STRING,
        description: "Name of attending doctor."
      },
      clinic_id: {
        type: Type.STRING,
        description: "Optional clinic ID or virtual phone number for multi-tenant routing."
      },
      notes: {
        type: Type.STRING,
        description: "Any special instructions or caller notes."
      }
    },
    required: ["patient_name", "slot_iso_timestamp", "service_type"]
  }
};

/**
 * Executes booking logic with Atomic Slot Concurrency Locking, DB Persistence & Live Google Calendar Sync.
 */
export async function executeBookAppointment(params: BookingParams & { clinic_id?: string }): Promise<BookingResult> {
  const {
    patient_name,
    patient_phone,
    slot_iso_timestamp,
    service_type,
    doctor_name,
    clinic_id,
    notes
  } = params;

  // Multi-tenant clinic lookup
  await clinicRegistry.ensureLoaded();
  const clinic = clinicRegistry.getClinicById(clinic_id || "") || clinicRegistry.getClinicByPhone(clinic_id || "") || clinicRegistry.getDefaultClinic();
  const clinicId = clinic?.clinic_id || clinic_id || "clinic-sharma-dental";
  const resolvedPhone = patient_phone || clinic?.contact_phone || "Incoming Caller";

  // Feature Flag: Check if scheduling is enabled for this clinic
  if (clinic && clinic.scheduling_enabled === false) {
    return {
      status: "failed",
      patient_name: patient_name || "Unknown",
      slot_iso_timestamp: slot_iso_timestamp || "",
      display_time: "",
      doctor_name: doctor_name || clinic?.doctors?.[0]?.name || "Clinic Doctor",
      clinic_address: clinic?.address || "",
      error_message: "Maaf kijiye, is clinic ke liye online appointment booking abhi paused hai. Kripya direct clinic walk-in visit karein ya reception se baat karein."
    };
  }

  if (!patient_name || !slot_iso_timestamp) {
    return {
      status: "failed",
      patient_name: patient_name || "Unknown",
      slot_iso_timestamp: slot_iso_timestamp || "",
      display_time: "",
      doctor_name: doctor_name || clinic?.doctors?.[0]?.name || "Clinic Doctor",
      clinic_address: clinic?.address || "",
      error_message: "Missing mandatory booking fields: patient_name or slot_iso_timestamp."
    };
  }

  // Parse display time from ISO timestamp
  let displayTime = slot_iso_timestamp;
  try {
    const d = new Date(slot_iso_timestamp);
    displayTime = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }) + " (" + d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + ")";
  } catch {
    // fallback
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const bookingId = `BK-${randomNum}`;

  // 1. Pick a doctor who offers this service, works at this time and is still free
  const selection = selectDoctorForBooking(clinic, {
    doctorName: doctor_name,
    serviceType: service_type,
    slotIso: slot_iso_timestamp,
    bookedKeys: await dbService.getBookedDoctorSlotsFromDb(clinicId)
  });

  if (selection.status !== "ok") {
    console.warn(`[BOOKING REJECTED] ${slot_iso_timestamp}: ${selection.message}`);
    return {
      status: selection.status,
      patient_name,
      slot_iso_timestamp,
      display_time: displayTime,
      doctor_name: doctor_name || "Clinic Doctor",
      clinic_address: clinic?.address || "",
      error_message: selection.message
    };
  }
  const resolvedDoctor = selection.doctorName;

  // 2. Atomic Slot Concurrency Lock
  const lockResult = await slotLockManager.acquireLock(
    clinicId,
    slot_iso_timestamp,
    resolvedDoctor,
    patient_name,
    resolvedPhone,
    bookingId
  );

  if (!lockResult.success) {
    console.warn(`[SLOT COLLISION] Slot ${slot_iso_timestamp} already locked by ${lockResult.existingLock?.patientName}`);
    return {
      status: "slot_taken",
      patient_name,
      slot_iso_timestamp,
      display_time: displayTime,
      doctor_name: resolvedDoctor,
      clinic_address: clinic?.address || "",
      error_message: `Maaf kijiye, ${displayTime} ka slot abhi kisi doosre patient ne lock kar liya hai. Kripya koi doosra time chunein.`
    };
  }

  // 3. Primary Persistence in DB (PostgreSQL / Supabase). The lock only covers this write: once it
  // finishes the database is the source of truth, and a kept lock would outlive a later cancellation.
  let dbResult: BookingResult;
  try {
    dbResult = await dbService.bookAppointmentInDb({
      clinic_id: clinicId,
      patient_name,
      patient_phone: resolvedPhone,
      slot_iso_timestamp,
      service_type,
      doctor_name: resolvedDoctor,
      notes
    });
  } finally {
    slotLockManager.releaseLock(clinicId, slot_iso_timestamp, resolvedDoctor);
  }

  if (dbResult.status !== "confirmed") {
    return dbResult;
  }

  const finalBookingId = dbResult.booking_id || bookingId;

  // 4. In-House Booking Confirmed!


  return {
    status: "confirmed",
    booking_id: finalBookingId,
    patient_name,
    slot_iso_timestamp,
    display_time: displayTime,
    doctor_name: resolvedDoctor,
    clinic_address: clinic?.address || ""
  };
}
