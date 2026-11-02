import type { ClinicRegistration } from "../config/clinicRegistry.js";
import type { ClinicDoctor } from "../types/index.js";

export interface DoctorShift {
  startMinutes: number;
  endMinutes: number;
}

export interface DoctorSchedule {
  days: number[]; // 0 = Sunday ... 6 = Saturday
  shifts: DoctorShift[];
}

export interface GeneratedSlot {
  slot_iso: string;
  display_time: string;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const TIME_RANGE = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
const DAY_TOKEN = /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b(?:\s*(?:-|–|to)\s*\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b)?/gi;

export const normalizeName = (value: string = ""): string =>
  value
    .toLowerCase()
    .replace(/^dr\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const doctorSlotKey = (slotIso: string, doctorName: string): string =>
  `${new Date(slotIso).getTime()}|${normalizeName(doctorName)}`;

const toMinutes = (hour: string, minute: string | undefined, meridiem: string): number =>
  ((Number(hour) % 12) + (meridiem.toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(minute || 0);

const parseDays = (text: string): number[] | null => {
  const clean = text.toLowerCase().replace(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\s+(closed|off|holiday)\b/g, "");
  if (/\b(all days|daily|every ?day)\b/.test(clean)) return ALL_DAYS;

  const days = new Set<number>();
  for (const match of clean.matchAll(DAY_TOKEN)) {
    const start = DAY_INDEX[match[1]];
    const end = match[2] ? DAY_INDEX[match[2]] : start;
    for (let day = start; ; day = (day + 1) % 7) {
      days.add(day);
      if (day === end) break;
    }
  }
  return days.size > 0 ? [...days].sort((a, b) => a - b) : null;
};

/** Reads stored timing text such as "Mon, Wed, Fri, 10:00 AM - 02:00 PM & 04:30 PM - 08:00 PM". */
export function parseTimingText(text: string = ""): { days: number[] | null; shifts: DoctorShift[] } {
  const shifts: DoctorShift[] = [];
  for (const match of text.matchAll(TIME_RANGE)) {
    const startMinutes = toMinutes(match[1], match[2], match[3]);
    const endMinutes = toMinutes(match[4], match[5], match[6]);
    if (endMinutes > startMinutes) shifts.push({ startMinutes, endMinutes });
  }
  return { days: parseDays(text.replace(TIME_RANGE, " ")), shifts };
}

export const cleanWorkingDays = (value: unknown): number[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b)
    : [];

/** Saved working_days win, then days in the timing text; anything missing uses the clinic's working hours. */
export function getDoctorSchedule(doctor: ClinicDoctor | undefined, clinic?: ClinicRegistration): DoctorSchedule {
  const own = parseTimingText(doctor?.timings);
  const clinicHours = parseTimingText(clinic?.working_hours);
  const workingDays = cleanWorkingDays(doctor?.working_days);
  return {
    days: workingDays.length > 0 ? workingDays : (own.days || clinicHours.days || ALL_DAYS),
    shifts: own.shifts.length > 0 ? own.shifts : clinicHours.shifts
  };
}

const formatTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${String(hours % 12 || 12).padStart(2, "0")}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
};

export function generateDoctorSlots(
  targetDate: string,
  doctor: ClinicDoctor | undefined,
  clinic?: ClinicRegistration
): GeneratedSlot[] {
  const noonIst = new Date(`${targetDate}T12:00:00+05:30`);
  if (Number.isNaN(noonIst.getTime())) return [];

  const schedule = getDoctorSchedule(doctor, clinic);
  if (!schedule.days.includes(noonIst.getUTCDay())) return [];

  const duration = Number(clinic?.slot_duration_minutes) || 30;
  const slots: GeneratedSlot[] = [];
  for (const shift of schedule.shifts) {
    for (let time = shift.startMinutes; time + duration <= shift.endMinutes; time += duration) {
      const hours = String(Math.floor(time / 60)).padStart(2, "0");
      const minutes = String(time % 60).padStart(2, "0");
      slots.push({ slot_iso: `${targetDate}T${hours}:${minutes}:00+05:30`, display_time: formatTime(time) });
    }
  }
  return slots;
}

export function findDoctor(clinic: ClinicRegistration | undefined, name?: string): ClinicDoctor | undefined {
  const target = normalizeName(name);
  if (!target) return undefined;
  return clinic?.doctors?.find((doctor) => normalizeName(doctor.name) === target);
}

const serviceMatches = (a: string, b: string): boolean => {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return false;
  return left === right || (Math.min(left.length, right.length) >= 4 && (left.includes(right) || right.includes(left)));
};

/** Names outside the clinic's list, such as "tooth pain", are treated as a general visit. */
export const isKnownService = (clinic: ClinicRegistration | undefined, service?: string): boolean =>
  Boolean(service) && (clinic?.services || []).some((name) => serviceMatches(name, service!));

/** A doctor with no assigned services handles every service. */
export function doctorOffersService(doctor: ClinicDoctor, clinic: ClinicRegistration | undefined, service?: string): boolean {
  const assigned = doctor.services || [];
  if (assigned.length === 0 || !isKnownService(clinic, service)) return true;
  return assigned.some((name) => serviceMatches(name, service!));
}

export const getEligibleDoctors = (clinic: ClinicRegistration | undefined, service?: string): ClinicDoctor[] =>
  (clinic?.doctors || []).filter((doctor) => doctorOffersService(doctor, clinic, service));

export const doctorHasSlot = (
  doctor: ClinicDoctor | undefined,
  clinic: ClinicRegistration | undefined,
  slotIso: string
): boolean => {
  const slotTime = new Date(slotIso).getTime();
  const dateIst = new Date(slotTime + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];
  return generateDoctorSlots(dateIst, doctor, clinic).some((slot) => new Date(slot.slot_iso).getTime() === slotTime);
};

export type DoctorSelection =
  | { status: "ok"; doctorName: string }
  | { status: "failed" | "slot_taken"; message: string };

/**
 * Picks the attending doctor for a booking and rejects doctors who do not offer the service or
 * are not working at that time. With no named doctor, the first eligible free doctor is used.
 */
export function selectDoctorForBooking(
  clinic: ClinicRegistration | undefined,
  params: { doctorName?: string; serviceType?: string; slotIso: string; bookedKeys: Set<string> }
): DoctorSelection {
  const { doctorName, serviceType, slotIso, bookedKeys } = params;
  const doctors = clinic?.doctors || [];
  if (doctors.length === 0) return { status: "ok", doctorName: doctorName || "Clinic Doctor" };

  const named = findDoctor(clinic, doctorName);
  if (doctorName && !named) {
    return { status: "failed", message: `${doctorName} is not registered at this clinic. Please choose: ${doctors.map((d) => d.name).join(", ")}.` };
  }
  if (named && !doctorOffersService(named, clinic, serviceType)) {
    const others = getEligibleDoctors(clinic, serviceType).map((d) => d.name).join(", ");
    return { status: "failed", message: `${named.name} does not provide ${serviceType}.${others ? ` Available with: ${others}.` : ""}` };
  }

  const candidates = named ? [named] : getEligibleDoctors(clinic, serviceType);
  if (candidates.length === 0) {
    return { status: "failed", message: `${serviceType} is not available with any doctor right now.` };
  }

  const working = candidates.filter((doctor) => doctorHasSlot(doctor, clinic, slotIso));
  if (working.length === 0) {
    return { status: "failed", message: "This doctor is not available at that time. Please choose another slot." };
  }

  const free = working.find((doctor) => !bookedKeys.has(doctorSlotKey(slotIso, doctor.name)));
  if (!free) {
    return { status: "slot_taken", message: "Maaf kijiye, yeh slot pehle se booked hai. Kripya koi doosra slot chunein." };
  }
  return { status: "ok", doctorName: free.name };
}

export const todayInIst = (offsetDays = 0): string =>
  new Date(Date.now() + 5.5 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
