export interface ClinicDoctor {
  name: string;
  specialties?: string[];
  specialization?: string;
  specialty?: string;
  timings?: string;
  services?: string[];
  working_days?: number[]; // 0 = Sunday ... 6 = Saturday
}

export interface ClinicConfig {
  clinic_name: string;
  address: string;
  working_hours: string;
  contact_phone: string;
  receptionist_name?: string;
  doctors: ClinicDoctor[];
  services: string[];
}

export interface AgentConfig {
  agent_id: string;
  name: string;
  version: string;
  default_model: string;
  temperature: number;
  top_p: number;
  supported_languages: string[];
  clinic_defaults: ClinicConfig;
  tools: string[];
}

export interface AvailabilityParams {
  date: string; // ISO date string YYYY-MM-DD or relative like "tomorrow"
  time_range?: string; // "morning" | "afternoon" | "evening" | "6 PM"
  service_type?: string;
  doctor_name?: string;
}

export interface SlotOption {
  slot_iso: string; // ISO string e.g. "2026-10-02T18:00:00+05:30"
  display_time: string; // e.g. "6:00 PM"
  doctor_name: string;
  available: boolean;
}

export interface AvailabilityResult {
  requested_date: string;
  is_available: boolean;
  matching_slots: SlotOption[];
  alternative_slots: SlotOption[];
  needs_doctor_selection?: boolean;
  eligible_doctors?: string[];
  notes?: string;
}

export interface BookingParams {
  patient_name: string;
  patient_phone: string;
  slot_iso_timestamp: string;
  service_type: string;
  doctor_name?: string;
  notes?: string;
}

export interface BookingResult {
  status: "confirmed" | "failed" | "slot_taken";
  booking_id?: string;
  patient_name: string;
  slot_iso_timestamp: string;
  display_time: string;
  doctor_name: string;
  clinic_address: string;
  error_message?: string;
}

export interface MessageTurn {
  role: "user" | "model";
  text: string;
}

export interface AgentSessionOptions {
  apiKey?: string;
  model?: string;
  clinicConfig?: Partial<ClinicConfig>;
  systemInstructionOverride?: string;
}
