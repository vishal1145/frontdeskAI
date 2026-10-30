import pg from "pg";
import dotenv from "dotenv";
import { ClinicConfig } from "../types/index.js";

dotenv.config();

export interface ClinicRegistration extends ClinicConfig {
  clinic_id: string;
  virtual_phone_numbers: string[];
  password?: string;
  calendly_link?: string;
  calendly_api_key?: string;
  scheduling_enabled?: boolean;
  slot_duration_minutes?: number;
  is_active?: boolean;
}

/**
 * 100% Dynamic Multi-tenant Registry of clinics.
 * Loads dynamic clinic metadata directly from Supabase PostgreSQL database ('clinics' table).
 * Supports Model A (Dedicated Virtual Number per clinic) and Model B (Shared Number with Diversion Header).
 */
class ClinicRegistry {
  private clinics: Map<string, ClinicRegistration> = new Map();
  private phoneMap: Map<string, string> = new Map(); // phone number -> clinic_id
  private contactPhoneMap: Map<string, string> = new Map(); // direct clinic contact_phone -> clinic_id
  private pgPool: pg.Pool | null = null;
  public isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes("your_db_password")) {
      try {
        this.pgPool = new pg.Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false }
        });
      } catch (err: any) {
        console.warn(`[CLINIC REGISTRY] Warning initializing DB pool: ${err.message}`);
      }
    }

    // Trigger initial asynchronous load from Supabase Database
    this.loadPromise = this.loadClinicsFromDb().catch((err) => {
      console.warn(`[CLINIC REGISTRY] Initial DB sync notice: ${err.message}`);
    });

    // Auto-refresh clinic registry from database every 5 minutes so newly added clinics in Supabase are live instantly
    setInterval(() => {
      this.loadClinicsFromDb().catch(() => { });
    }, 5 * 60 * 1000).unref();
  }

  public async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) {
      await this.loadPromise;
    }
  }

  /**
   * Dynamically queries the Supabase 'clinics' table and synchronizes all active clinics into memory.
   */
  public async loadClinicsFromDb(): Promise<void> {
    if (!this.pgPool) return;

    try {
      const res = await this.pgPool.query(
        "SELECT clinic_id, clinic_name, address, working_hours, contact_phone, receptionist_name, virtual_phone_numbers, doctors, services, password, calendly_link, calendly_api_key, scheduling_enabled, slot_duration_minutes, is_active FROM clinics ORDER BY created_at ASC;"
      );

      if (res.rows.length > 0) {
        this.clinics.clear();
        this.phoneMap.clear();
        this.contactPhoneMap.clear();
        for (const row of res.rows) {
          const rawDoctors = row.doctors;
          const parsedDoctors = Array.isArray(rawDoctors)
            ? rawDoctors
            : (typeof rawDoctors === "string" ? JSON.parse(rawDoctors) : []);

          const normalizedDoctors = parsedDoctors.map((doc: any) => {
            if (typeof doc === "string") {
              return { name: doc, specialties: ["Specialist"], specialization: "Specialist", timings: row.working_hours || "10:00 AM - 7:00 PM" };
            }
            const specList = Array.isArray(doc?.specialties) && doc.specialties.length > 0
              ? doc.specialties
              : (doc?.specialization ? [doc.specialization] : (doc?.specialty ? [doc.specialty] : ["Specialist"]));
            return {
              name: doc?.name || "Doctor",
              specialties: specList,
              specialization: doc?.specialization || specList.join(", "),
              timings: doc?.timings || row.working_hours || "10:00 AM - 7:00 PM"
            };
          });

          const rawServices = row.services;
          const parsedServices = Array.isArray(rawServices)
            ? rawServices
            : (typeof rawServices === "string" ? JSON.parse(rawServices) : []);
          const normalizedServices = parsedServices.map((s: any) => (typeof s === "string" ? s : (s?.name || String(s))));

          const rawPhones = row.virtual_phone_numbers;
          const parsedPhones = Array.isArray(rawPhones)
            ? rawPhones
            : (typeof rawPhones === "string" ? [rawPhones] : (row.contact_phone ? [row.contact_phone] : []));

          const clinic: ClinicRegistration = {
            clinic_id: row.clinic_id,
            clinic_name: row.clinic_name,
            address: row.address,
            working_hours: row.working_hours,
            contact_phone: row.contact_phone,
            password: row.password || "123456",
            receptionist_name: row.receptionist_name || "Neha",
            virtual_phone_numbers: parsedPhones,
            doctors: normalizedDoctors,
            services: normalizedServices,
            calendly_link: row.calendly_link || "",
            calendly_api_key: row.calendly_api_key || "",
            scheduling_enabled: row.scheduling_enabled !== false,
            slot_duration_minutes: Number(row.slot_duration_minutes) || 30,
            is_active: row.is_active !== false
          };

          this.registerClinic(clinic);
        }
        this.isLoaded = true;
        console.log(`[DYNAMIC CLINIC REGISTRY] Successfully synchronized ${res.rows.length} clinics dynamically from Supabase database!`);
      }
    } catch (err: any) {
      console.error(`[DYNAMIC CLINIC REGISTRY ERROR] Failed to load clinics from Supabase: ${err.message}`);
    }
  }

  public getDefaultClinicId(): string {
    return process.env.DEFAULT_CLINIC_ID || "clinic-sharma-dental";
  }

  public registerClinic(clinic: ClinicRegistration): void {
    this.clinics.set(clinic.clinic_id, clinic);

    // If virtual phone is centralized, ensure the default clinic owns the virtual number mapping in phoneMap
    const isDefault = clinic.clinic_id === this.getDefaultClinicId();
    for (const phone of clinic.virtual_phone_numbers) {
      const clean = this.normalizePhone(phone);
      if (!this.phoneMap.has(clean) || isDefault) {
        this.registerPhoneVariations(phone, clinic.clinic_id);
      }
    }

    // Direct clinic contact phone (always unique to each clinic)
    if (clinic.contact_phone) {
      this.registerPhoneVariations(clinic.contact_phone, clinic.clinic_id);
      this.registerContactPhoneVariations(clinic.contact_phone, clinic.clinic_id);
    }
  }

  public updateClinicScheduling(clinicId: string, enabled: boolean, slotDuration?: number): void {
    const clinic = this.clinics.get(clinicId);
    if (clinic) {
      clinic.scheduling_enabled = enabled;
      if (slotDuration) {
        clinic.slot_duration_minutes = slotDuration;
      }
      this.clinics.set(clinicId, clinic);
    }
  }

  public updateClinicActiveStatus(clinicId: string, isActive: boolean): void {
    const clinic = this.clinics.get(clinicId);
    if (clinic) {
      clinic.is_active = isActive;
      this.clinics.set(clinicId, clinic);
    }
  }

  private registerPhoneVariations(phone: string, clinicId: string): void {
    const raw = this.normalizePhone(phone);
    if (!raw) return;
    this.phoneMap.set(raw, clinicId);

    const digits = phone.replace(/[^0-9]/g, "");
    if (digits) {
      this.phoneMap.set(digits, clinicId);
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        this.phoneMap.set(last10, clinicId);
        this.phoneMap.set(`+91${last10}`, clinicId);
        this.phoneMap.set(`91${last10}`, clinicId);
        this.phoneMap.set(`0${last10}`, clinicId);
      }
    }
  }

  private registerContactPhoneVariations(phone: string, clinicId: string): void {
    const raw = this.normalizePhone(phone);
    if (!raw) return;
    this.contactPhoneMap.set(raw, clinicId);

    const digits = phone.replace(/[^0-9]/g, "");
    if (digits) {
      this.contactPhoneMap.set(digits, clinicId);
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        this.contactPhoneMap.set(last10, clinicId);
        this.contactPhoneMap.set(`+91${last10}`, clinicId);
        this.contactPhoneMap.set(`91${last10}`, clinicId);
        this.contactPhoneMap.set(`0${last10}`, clinicId);
      }
    }
  }

  /**
   * Directly look up a clinic by its registered contact phone number (returns null if not a registered clinic).
   */
  public getClinicByContactPhone(phone: any): ClinicRegistration | null {
    let searchPhone = "";
    if (typeof phone === "string") {
      searchPhone = phone.trim();
    } else if (phone && typeof phone === "object") {
      searchPhone = String(phone.number || phone.phone || phone.phoneNumber || "").trim();
    } else if (phone) {
      searchPhone = String(phone).trim();
    }

    if (!searchPhone) return null;

    const sipMatch = searchPhone.match(/sip:(\+?[0-9]{10,13})@/i) || searchPhone.match(/(\+?[0-9]{10,13})/);
    if (sipMatch) {
      searchPhone = sipMatch[1];
    }

    const cleanPhone = this.normalizePhone(searchPhone);
    if (this.contactPhoneMap.has(cleanPhone)) {
      const clinicId = this.contactPhoneMap.get(cleanPhone)!;
      return this.clinics.get(clinicId) || null;
    }

    const digits = searchPhone.replace(/[^0-9]/g, "");
    if (digits) {
      if (this.contactPhoneMap.has(digits)) {
        const clinicId = this.contactPhoneMap.get(digits)!;
        return this.clinics.get(clinicId) || null;
      }
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        if (this.contactPhoneMap.has(last10)) {
          const clinicId = this.contactPhoneMap.get(last10)!;
          return this.clinics.get(clinicId) || null;
        }
      }
    }

    return null;
  }

  public getClinicById(clinicId: string): ClinicRegistration | undefined {
    return this.clinics.get(clinicId) || this.getDefaultClinic();
  }

  /**
   * Returns the configured default clinic based on environment variables or falls back gracefully.
   */
  public getDefaultClinic(): ClinicRegistration {
    const defaultClinicId = process.env.DEFAULT_CLINIC_ID;
    if (defaultClinicId && this.clinics.has(defaultClinicId)) {
      return this.clinics.get(defaultClinicId)!;
    }

    const defaultClinicName = process.env.DEFAULT_CLINIC_NAME;
    if (defaultClinicName) {
      for (const clinic of this.clinics.values()) {
        if (clinic.clinic_name.toLowerCase().includes(defaultClinicName.toLowerCase())) {
          return clinic;
        }
      }
    }

    const first = (
      this.clinics.get("clinic-sharma-dental") ||
      this.clinics.get("clinic-care-cure") ||
      Array.from(this.clinics.values())[0]
    );

    if (first) return first;

    // Resilient fallback structure in case called before DB async fetch completes
    return {
      clinic_id: "clinic-sharma-dental",
      clinic_name: "Sharma Dental Clinic",
      address: "Shop 12, Main Market, Sector 14, Gurgaon",
      working_hours: "10:00 AM - 8:00 PM (Mon-Sat)",
      contact_phone: "+919876543210",
      receptionist_name: "Neha",
      virtual_phone_numbers: ["+919876543210"],
      doctors: [{ name: "Dr. Sharma", specialties: ["Dentist", "Dental Surgeon"], timings: "10:00 AM - 8:00 PM" }],
      services: ["Dental Consultation", "Root Canal Treatment", "Teeth Cleaning", "Dental Implants"]
    };
  }

  /**
   * Resolves a clinic by virtual number or SIP Diversion Header number.
   * Resilient to string or object phone payload.
   */
  public getClinicByPhone(phone: any): ClinicRegistration {
    let searchPhone = "";
    if (typeof phone === "string") {
      searchPhone = phone.trim();
    } else if (phone && typeof phone === "object") {
      searchPhone = String(phone.number || phone.phone || phone.phoneNumber || "").trim();
    } else if (phone) {
      searchPhone = String(phone).trim();
    }

    if (searchPhone) {
      // If this is a SIP URI (e.g. "<sip:917668433939@10.162.200.6>;reason=no-answer;counter=1"), extract phone number directly
      const sipMatch = searchPhone.match(/sip:(\+?[0-9]{10,13})@/i) || searchPhone.match(/(\+?[0-9]{10,13})/);
      if (sipMatch) {
        searchPhone = sipMatch[1];
      }

      if (this.clinics.has(searchPhone)) {
        return this.clinics.get(searchPhone)!;
      }
      const cleanPhone = this.normalizePhone(searchPhone);
      if (this.phoneMap.has(cleanPhone)) {
        const clinicId = this.phoneMap.get(cleanPhone)!;
        return this.clinics.get(clinicId)!;
      }
      const digits = searchPhone.replace(/[^0-9]/g, "");
      if (digits && digits.length >= 10) {
        const last10 = digits.slice(-10);
        if (this.phoneMap.has(last10)) {
          const clinicId = this.phoneMap.get(last10)!;
          return this.clinics.get(clinicId)!;
        }
      }
    }

    // Configurable default clinic fallback
    return this.getDefaultClinic();
  }

  public getAllClinics(): ClinicRegistration[] {
    return Array.from(this.clinics.values());
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, "");
  }
}

export const clinicRegistry = new ClinicRegistry();
