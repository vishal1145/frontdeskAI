import { FunctionDeclaration, Type } from "@google/genai";
import { AvailabilityParams, AvailabilityResult, SlotOption } from "../types/index.js";
import { slotLockManager } from "../services/slotLockManager.js";
import { clinicRegistry, ClinicRegistration } from "../config/clinicRegistry.js";
import { dbService } from "../services/dbService.js";
import {
  doctorOffersService,
  doctorSlotKey,
  findDoctor,
  generateDoctorSlots,
  getEligibleDoctors,
  todayInIst
} from "../services/doctorScheduleService.js";

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
 * Generates a doctor's slots from their timings and working days, using the clinic slot duration.
 */
export function generateDynamicClinicSlots(
  targetDate: string,
  doctorName: string,
  clinic?: ClinicRegistration
): SlotOption[] {
  return generateDoctorSlots(targetDate, findDoctor(clinic, doctorName), clinic).map((slot) => ({
    ...slot,
    doctor_name: doctorName,
    available: true
  }));
}

/**
 * Checks available slots for target date, dynamically excluding locked/taken slots from DB & Google Calendar.
 */
export async function executeCheckAvailability(params: AvailabilityParams & { clinic_id?: string }): Promise<AvailabilityResult> {
  const { date, time_range, service_type, doctor_name, clinic_id } = params;

  // Ensure registry is loaded
  await clinicRegistry.ensureLoaded();

  const clinic = clinicRegistry.getClinicById(clinic_id || "") || clinicRegistry.getClinicByPhone(clinic_id || "") || clinicRegistry.getDefaultClinic();
  const clinicId = clinic?.clinic_id || clinic_id || "clinic-sharma-dental";

  // Resolve target date string
  let targetDate = date.toLowerCase().trim();

  if (targetDate === "today" || targetDate === "aaj") {
    targetDate = todayInIst();
  } else if (targetDate === "tomorrow" || targetDate === "kal" || targetDate === "kl") {
    targetDate = todayInIst(1);
  } else if (targetDate === "day after tomorrow" || targetDate === "parso") {
    targetDate = todayInIst(2);
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

  // 2. Resolve which doctor this request is for
  const noSlots = (notes: string, extra: Partial<AvailabilityResult> = {}): AvailabilityResult => ({
    requested_date: targetDate,
    is_available: false,
    matching_slots: [],
    alternative_slots: [],
    notes,
    ...extra
  });

  const hasDoctors = (clinic?.doctors?.length || 0) > 0;
  const requestedDoctor = findDoctor(clinic, doctor_name);
  const eligibleDoctors = getEligibleDoctors(clinic, service_type);
  const eligibleNames = eligibleDoctors.map((d) => d.name);

  if (doctor_name && hasDoctors && !requestedDoctor) {
    return noSlots(`${doctor_name} is not registered at this clinic. Ask the caller to choose from: ${eligibleNames.join(", ")}.`, {
      needs_doctor_selection: true,
      eligible_doctors: eligibleNames
    });
  }
  if (requestedDoctor && !doctorOffersService(requestedDoctor, clinic, service_type)) {
    return noSlots(
      `${requestedDoctor.name} does not provide ${service_type}. ${eligibleNames.length > 0 ? `Offer: ${eligibleNames.join(", ")}.` : "Transfer the call to reception."}`,
      { needs_doctor_selection: eligibleNames.length > 0, eligible_doctors: eligibleNames }
    );
  }
  if (!requestedDoctor && hasDoctors && eligibleDoctors.length === 0) {
    return noSlots(`${service_type} is not available with any doctor right now. Tell the caller politely and offer to transfer them to reception.`);
  }
  if (!requestedDoctor && eligibleDoctors.length > 1) {
    return noSlots(
      `More than one doctor is available. Ask the caller which doctor they prefer: ${eligibleNames.join(", ")}. If they have no preference, call checkAvailability again with doctor_name="${eligibleNames[0]}".`,
      { needs_doctor_selection: true, eligible_doctors: eligibleNames }
    );
  }

  const doctor = requestedDoctor?.name || eligibleNames[0] || doctor_name || "Clinic Doctor";

  // 3. Generate this doctor's slots and drop past, locked and booked ones
  const rawSlots: SlotOption[] = generateDynamicClinicSlots(targetDate, doctor, clinic);
  const dbBookedSlots = await dbService.getBookedDoctorSlotsFromDb(clinicId);

  const now = new Date();
  const slots = rawSlots.map((s) => {
    const slotDate = new Date(s.slot_iso);
    const isPast = slotDate.getTime() < now.getTime();
    if (isPast || slotLockManager.isLocked(clinicId, s.slot_iso, doctor) || dbBookedSlots.has(doctorSlotKey(s.slot_iso, doctor))) {
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
      ? `Found ${matchingSlots.length} available slot(s) with ${doctor} for ${targetDate} at ${clinicName}. Pass doctor_name="${doctor}" when booking.`
      : `No matching slot with ${doctor} on ${targetDate} at ${clinicName}. ${rawSlots.length === 0 ? "This doctor is not working on this day." : "Alternatives offered."}`
  };
}
