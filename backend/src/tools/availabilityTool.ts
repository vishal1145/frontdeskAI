import { FunctionDeclaration, Type } from "@google/genai";
import { AvailabilityParams, AvailabilityResult, SlotOption } from "../types/index.js";
import { slotLockManager } from "../services/slotLockManager.js";
import { clinicRegistry, ClinicRegistration } from "../config/clinicRegistry.js";
import { calendarService } from "../services/calendarService.js";
import { dbService } from "../services/dbService.js";

export const checkAvailabilityDeclaration: FunctionDeclaration = {
  name: "check_availability",
  description:
    "Checks clinic appointment slot availability for a given date, time range, doctor, or service.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description:
          "Target date in YYYY-MM-DD format or relative expression like 'today', 'tomorrow', '2026-10-02'."
      },
      time_range: {
        type: Type.STRING,
        description:
          "Preferred time range e.g. 'morning', 'afternoon', 'evening', 'around 6 PM', '6:00 PM'."
      },
      service_type: {
        type: Type.STRING,
        description: "Reason for visit or service e.g. 'General Checkup', 'Dental Checkup'."
      },
      doctor_name: {
        type: Type.STRING,
        description: "Optional doctor name requested by caller."
      },
      clinic_id: {
        type: Type.STRING,
        description: "Optional clinic ID or virtual phone number for multi-tenant routing."
      }
    },
    required: ["date"]
  }
};

/**
 * Helper to generate dynamic appointment slots for a given clinic schedule and doctor.
 */
export function generateDynamicClinicSlots(
  targetDate: string,
  doctorName: string,
  clinic?: ClinicRegistration
): SlotOption[] {
  // Clinical slot times spanning morning and evening shifts (Custom In-House Calendar Engine)
  const slotConfigs = [
    { time: "10:00 AM", isoHour: "10:00:00" },
    { time: "10:30 AM", isoHour: "10:30:00" },
    { time: "11:00 AM", isoHour: "11:00:00" },
    { time: "11:30 AM", isoHour: "11:30:00" },
    { time: "12:00 PM", isoHour: "12:00:00" },
    { time: "12:30 PM", isoHour: "12:30:00" },
    { time: "05:00 PM", isoHour: "17:00:00" },
    { time: "05:30 PM", isoHour: "17:30:00" },
    { time: "06:00 PM", isoHour: "18:00:00" },
    { time: "06:30 PM", isoHour: "18:30:00" },
    { time: "07:00 PM", isoHour: "19:00:00" },
    { time: "07:30 PM", isoHour: "19:30:00" },
    { time: "08:00 PM", isoHour: "20:00:00" }
  ];

  return slotConfigs.map((cfg) => ({
    slot_iso: `${targetDate}T${cfg.isoHour}+05:30`,
    display_time: cfg.time,
    doctor_name: doctorName,
    available: true
  }));
}

/**
 * Checks available slots for target date, dynamically excluding locked/taken slots from DB & Google Calendar.
 */
export async function executeCheckAvailability(params: AvailabilityParams & { clinic_id?: string }): Promise<AvailabilityResult> {
  const { date, time_range, service_type = "General Checkup", doctor_name, clinic_id } = params;

  // Ensure registry is loaded
  await clinicRegistry.ensureLoaded();

  const clinic = clinicRegistry.getClinicById(clinic_id || "") || clinicRegistry.getClinicByPhone(clinic_id || "") || clinicRegistry.getDefaultClinic();
  const clinicId = clinic?.clinic_id || clinic_id || "clinic-sharma-dental";

  // Resolve target date string
  let targetDate = date.toLowerCase().trim();
  const today = new Date();

  if (targetDate === "today" || targetDate === "aaj") {
    targetDate = today.toISOString().split("T")[0];
  } else if (targetDate === "tomorrow" || targetDate === "kal" || targetDate === "kl") {
    const tmr = new Date(today);
    tmr.setDate(today.getDate() + 1);
    targetDate = tmr.toISOString().split("T")[0];
  } else if (targetDate === "day after tomorrow" || targetDate === "parso") {
    const dat = new Date(today);
    dat.setDate(today.getDate() + 2);
    targetDate = dat.toISOString().split("T")[0];
  }

  // 1. Feature Flag Check: If scheduling is turned OFF for this clinic, immediately decline with clear message
  if (clinic && clinic.scheduling_enabled === false) {
    return {
      requested_date: targetDate,
      is_available: false,
      matching_slots: [],
      alternative_slots: [],
      notes: "Online calendar scheduling is currently paused for this clinic. Please inform the caller that appointments are only accepted in-person or offer to transfer the call to the clinic reception."
    };
  }

  const defaultDoctor = clinic?.doctors?.[0]?.name || "Dr. Sharma";
  const doctor = doctor_name || (service_type.toLowerCase().includes("dent")
    ? (clinic?.doctors?.find(d => {
        const specArr = Array.isArray(d?.specialties) ? d.specialties : [];
        const specStr = typeof (d as any)?.specialization === "string" ? (d as any).specialization : "";
        return specArr.some((s: string) => s.toLowerCase().includes("dent")) || specStr.toLowerCase().includes("dent");
      })?.name || defaultDoctor)
    : defaultDoctor);

  // 2. In-House Native Calendar Slot Generation
  // NOTE: External Calendly API call preserved and commented out below as requested by user.
  /*
  // CALENDLY / EXTERNAL CALENDAR INTEGRATION (PRESERVED - COMMENTED OUT)
  let rawSlots: SlotOption[] = [];
  try {
    const calendarPromise = calendarService.getLiveCalendarSlots(clinicId, targetDate, doctor);
    const timeoutPromise = new Promise<{ provider: string; slots: SlotOption[] } | null>((resolve) =>
      setTimeout(() => resolve(null), 1200)
    );
    const liveCalendarResult = await Promise.race([calendarPromise, timeoutPromise]);
    if (liveCalendarResult && liveCalendarResult.slots && liveCalendarResult.slots.length > 0) {
      rawSlots = liveCalendarResult.slots;
    } else {
      rawSlots = generateDynamicClinicSlots(targetDate, doctor, clinic);
    }
  } catch (err: any) {
    console.warn(`[AVAILABILITY CALENDAR TIMEOUT/NOTICE] ${err.message}`);
    rawSlots = generateDynamicClinicSlots(targetDate, doctor, clinic);
  }
  */
  const rawSlots: SlotOption[] = generateDynamicClinicSlots(targetDate, doctor, clinic);

  // 2. Fetch booked slots from DB
  const dbBookedSlots = new Set(await dbService.getBookedSlotsFromDb(clinicId));

  // 3. Dynamically check atomic lock manager state, DB state & past slots
  const now = new Date();
  const slots = rawSlots.map((s) => {
    const slotDate = new Date(s.slot_iso);
    const isPast = slotDate.getTime() < now.getTime();
    if (isPast || slotLockManager.isLocked(clinicId, s.slot_iso) || dbBookedSlots.has(s.slot_iso)) {
      return { ...s, available: false };
    }
    return s;
  });

  let matchingSlots = slots.filter((s) => s.available);

  if (time_range && time_range.toLowerCase() !== "all" && time_range.toLowerCase() !== "any") {
    const timeRangeLower = time_range.toLowerCase();
    if (timeRangeLower.includes("morning") || timeRangeLower.includes("subah")) {
      matchingSlots = matchingSlots.filter((s) => s.display_time.includes("AM"));
    } else if (
      timeRangeLower.includes("evening") ||
      timeRangeLower.includes("shaam") ||
      timeRangeLower.includes("afternoon") ||
      timeRangeLower.includes("dopahar")
    ) {
      matchingSlots = matchingSlots.filter((s) => s.display_time.includes("PM"));
    } else if (timeRangeLower.includes("6") || timeRangeLower.includes("18:00")) {
      const exact6 = matchingSlots.find((s) => s.display_time.startsWith("6:"));
      if (exact6) matchingSlots = [exact6];
    } else if (timeRangeLower.includes("5") || timeRangeLower.includes("17:00")) {
      const exact5 = matchingSlots.find((s) => s.display_time.startsWith("5:"));
      if (exact5) matchingSlots = [exact5];
    } else if (timeRangeLower.includes("7") || timeRangeLower.includes("19:00")) {
      const exact7 = matchingSlots.find((s) => s.display_time.startsWith("7:"));
      if (exact7) matchingSlots = [exact7];
    }
  }

  const isAvailable = matchingSlots.length > 0;
  const alternativeSlots = slots.filter((s) => s.available && !matchingSlots.includes(s));

  const clinicName = clinic?.clinic_name || "Sharma Dental Clinic";

  return {
    requested_date: targetDate,
    is_available: isAvailable,
    matching_slots: matchingSlots,
    alternative_slots: alternativeSlots,
    notes: isAvailable
      ? `Found ${matchingSlots.length} available slot(s) for ${targetDate} at ${clinicName}.`
      : `Requested slot unavailable on ${targetDate} at ${clinicName}. Alternatives offered.`
  };
}
