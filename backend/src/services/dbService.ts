import dotenv from "dotenv";
import { BookingParams, BookingResult } from "../types/index.js";
import { slotLockManager } from "./slotLockManager.js";
import { doctorSlotKey } from "./doctorScheduleService.js";
import { clinicRegistry } from "../config/clinicRegistry.js";

dotenv.config();

export interface DatabaseAppointmentRecord {
  booking_id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  slot_iso_timestamp: string;
  display_time: string;
  doctor_name: string;
  service_type: string;
  status: "confirmed" | "cancelled" | "rescheduled";
  created_at: string;
}

export interface DatabaseCallLogRecord {
  id?: number;
  clinic_id: string;
  call_sid: string;
  caller_phone: string;
  called_number?: string;
  call_direction?: string;
  duration_seconds: number;
  billable_minutes: number;
  is_transferred: boolean;
  transfer_destination?: string | null;
  transfer_reason?: string | null;
  call_status?: string;
  cost_inr: number;
  recording_url?: string | null;
  summary?: string | null;
  created_at?: string;
}

export interface ClinicBillingSummary {
  clinic_id: string;
  clinic_name: string;
  total_calls: number;
  transferred_calls: number;
  ai_handled_calls: number;
  total_duration_seconds: number;
  total_duration_formatted: string;
  total_bill_inr: number;
  rate_per_minute: number;
  rate_per_transfer: number;
}

export interface CallerProfileRecord {
  isRepeatCaller: boolean;
  customerName?: string;
  savedAddress?: string;
  lastOrder?: {
    order_id: string;
    medicines: string;
    order_type: string;
    delivery_address?: string;
    status: string;
    created_at: string;
  };
  lastAppointment?: {
    booking_id: string;
    doctor_name: string;
    service_type: string;
    display_time: string;
    status: string;
    created_at: string;
  };
}

import pg from "pg";

/**
 * Production Database Service (PostgreSQL / Supabase Integration).
 * Handles persistent database CRUD operations and atomic SQL transaction locking (`SELECT ... FOR UPDATE`).
 */
class ProductionDatabaseService {
  private dbUrl: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private isConnected: boolean = false;
  private pgPool: pg.Pool | null = null;
  private mockAppointmentsTable: Map<string, DatabaseAppointmentRecord> = new Map();

  constructor() {
    this.dbUrl = process.env.DATABASE_URL || "";
    this.supabaseUrl = process.env.SUPABASE_URL || "";
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (this.dbUrl && !this.dbUrl.includes("your_db_password")) {
      try {
        this.pgPool = new pg.Pool({
          connectionString: this.dbUrl,
          ssl: { rejectUnauthorized: false }
        });
        this.isConnected = true;
        console.log(`[PRODUCTION DB] Initialized PostgreSQL connection pool to: ${this.maskDbUrl(this.dbUrl)}`);
        this.ensureSuperAdmin();
      } catch (err: any) {
        console.warn(`[PRODUCTION DB] Could not initialize pg pool: ${err.message}`);
      }
    } else if (this.supabaseUrl && this.supabaseKey) {
      this.isConnected = true;
      console.log(`[PRODUCTION DB] Supabase Database client configured to: ${this.supabaseUrl}`);
    } else {
      console.log(`[PRODUCTION DB] Database service initialized with in-memory atomic lock fallback (Set SUPABASE_URL / DATABASE_URL for live DB persistence).`);
    }
  }

  private maskDbUrl(url: string): string {
    return url.replace(/:([^:@]+)@/, ":****@");
  }

  /**
   * Initializes PostgreSQL / Supabase SQL Schema for FrontDesk AI.
   */
  public getSqlSchemaDDL(): string {
    return `
-- FrontDesk AI Production PostgreSQL / Supabase DDL Schema

CREATE TABLE IF NOT EXISTS clinics (
    clinic_id VARCHAR(64) PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(32) NOT NULL,
    address TEXT NOT NULL,
    working_hours VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    booking_id VARCHAR(32) PRIMARY KEY,
    clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(clinic_id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(32) NOT NULL,
    slot_iso_timestamp VARCHAR(64) NOT NULL,
    display_time VARCHAR(128) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS super_admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Super Admin',
    phone VARCHAR(32) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'superadmin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments (clinic_id, slot_iso_timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS unique_clinic_doctor_slot ON appointments (clinic_id, doctor_name, slot_iso_timestamp) WHERE status <> 'cancelled';
    `;
  }

  /**
   * Automatically initializes the super_admins table and seeds credentials in Supabase.
   */
  public async ensureSuperAdmin(): Promise<void> {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS super_admins (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) DEFAULT 'Super Admin',
          phone VARCHAR(32) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(32) DEFAULT 'superadmin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await this.pgPool.query(`
        INSERT INTO super_admins (name, phone, password, role)
        VALUES ('Super Admin', '1234567890', 'Frontend@123', 'superadmin')
        ON CONFLICT (phone) DO UPDATE 
        SET password = EXCLUDED.password, role = EXCLUDED.role;
      `);
      await this.pgPool.query(`
        ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE clinics ADD COLUMN IF NOT EXISTS business_type VARCHAR(32) DEFAULT 'clinic';
        ALTER TABLE clinics ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT true;
        ALTER TABLE clinics ADD COLUMN IF NOT EXISTS min_delivery_order VARCHAR(64) DEFAULT 'None';
        ALTER TABLE clinics ADD COLUMN IF NOT EXISTS profile_icon TEXT DEFAULT 'building';
      `);

      // 1. Dedicated Table for Medical Stores in Supabase
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS medical_stores (
          store_id VARCHAR(64) PRIMARY KEY,
          store_name VARCHAR(255) NOT NULL,
          contact_phone VARCHAR(32) NOT NULL,
          address TEXT NOT NULL,
          working_hours VARCHAR(255) NOT NULL,
          pharmacist_name VARCHAR(255) DEFAULT 'Pharmacist In-Charge',
          delivery_available BOOLEAN DEFAULT true,
          min_delivery_order VARCHAR(64) DEFAULT 'None',
          receptionist_name VARCHAR(255) DEFAULT 'Neha',
          password VARCHAR(255) DEFAULT '123456',
          virtual_phone_numbers TEXT[] DEFAULT ARRAY['+918065355910'],
          services JSONB DEFAULT '["Prescription Medicines", "OTC & First Aid", "Home Delivery", "Health Supplements"]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          profile_icon TEXT DEFAULT 'pill',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE medical_stores ADD COLUMN IF NOT EXISTS profile_icon TEXT DEFAULT 'pill';
      `);

      // 2. Dedicated Table for Medical Orders in Supabase
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS medical_orders (
          order_id VARCHAR(32) PRIMARY KEY,
          store_id VARCHAR(64) NOT NULL REFERENCES medical_stores(store_id) ON DELETE CASCADE,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(32) NOT NULL,
          medicines TEXT NOT NULL,
          order_type VARCHAR(32) DEFAULT 'store_pickup',
          delivery_address TEXT,
          status VARCHAR(32) DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Relax call_logs constraint so both clinics and medical stores can record call logs
      await this.pgPool.query(`
        ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_clinic_id_fkey;
      `);

      // 4. Migrate any medical store out of clinics table into medical_stores
      const medInClinics = await this.pgPool.query(
        "SELECT * FROM clinics WHERE business_type = 'medical_store' OR clinic_name ILIKE '%medicos%' OR clinic_name ILIKE '%pharmacy%';"
      );
      for (const row of medInClinics.rows) {
        const rawDocs = Array.isArray(row.doctors) ? row.doctors : (typeof row.doctors === 'string' ? JSON.parse(row.doctors) : []);
        const pharmName = rawDocs[0]?.name || 'Pharmacist Rahul';
        const rawSvcs = Array.isArray(row.services) ? row.services : (typeof row.services === 'string' ? JSON.parse(row.services) : []);
        await this.pgPool.query(`
          INSERT INTO medical_stores (
            store_id, store_name, contact_phone, address, working_hours,
            pharmacist_name, delivery_available, min_delivery_order,
            receptionist_name, password, virtual_phone_numbers, services, is_active, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          ) ON CONFLICT (store_id) DO UPDATE SET
            store_name = EXCLUDED.store_name,
            contact_phone = EXCLUDED.contact_phone,
            address = EXCLUDED.address,
            working_hours = EXCLUDED.working_hours,
            pharmacist_name = EXCLUDED.pharmacist_name,
            delivery_available = EXCLUDED.delivery_available,
            min_delivery_order = EXCLUDED.min_delivery_order,
            services = EXCLUDED.services,
            is_active = EXCLUDED.is_active;
        `, [
          row.clinic_id,
          row.clinic_name,
          row.contact_phone,
          row.address,
          row.working_hours,
          pharmName,
          row.delivery_available !== false,
          row.min_delivery_order || 'None',
          row.receptionist_name || 'Neha',
          row.password || '123456',
          Array.isArray(row.virtual_phone_numbers) ? row.virtual_phone_numbers : [row.contact_phone],
          JSON.stringify(rawSvcs),
          row.is_active !== false,
          row.created_at
        ]);
        await this.pgPool.query("DELETE FROM clinics WHERE clinic_id = $1;", [row.clinic_id]);
        console.log(`[PRODUCTION DB] Migrated ${row.clinic_name} (${row.clinic_id}) into dedicated medical_stores table.`);
      }

      // 5. Purge mistakenly imported October test calls from newly created medical stores
      await this.pgPool.query(`
        DELETE FROM call_logs cl
        USING medical_stores ms
        WHERE cl.clinic_id = ms.store_id
          AND cl.created_at < ms.created_at;
      `);

      console.log(`[PRODUCTION DB] Super Admin table, medical_stores & medical_orders schema verified in Supabase.`);
    } catch (err: any) {
      console.warn(`[SUPERADMIN INIT WARNING] ${err.message}`);
    }
  }

  /**
   * Atomically books an appointment in the Production Database with Row-Level Lock (`SELECT ... FOR UPDATE`).
   */
  public async bookAppointmentInDb(
    params: BookingParams & { clinic_id: string }
  ): Promise<BookingResult> {
    const { clinic_id, patient_name, patient_phone, slot_iso_timestamp, service_type, doctor_name } = params;

    const clinicInfo = clinicRegistry.getClinicById(clinic_id) || clinicRegistry.getClinicByPhone(clinic_id);
    const resolvedAddress = clinicInfo ? `${clinicInfo.clinic_name}, ${clinicInfo.address}` : "Clinic Reception Desk";
    const resolvedDoctor = doctor_name || clinicInfo?.doctors[0]?.name || "Clinic Doctor";
    const key = `${clinic_id}:${doctorSlotKey(slot_iso_timestamp, resolvedDoctor)}`;

    // 1. Atomic lock check. With PostgreSQL the unique index decides, because this in-memory copy
    // cannot see cancellations made by other processes.
    const existing = this.pgPool ? undefined : this.mockAppointmentsTable.get(key);
    if (existing && existing.status === "confirmed") {
      return {
        status: "slot_taken",
        patient_name,
        slot_iso_timestamp,
        display_time: existing.display_time,
        doctor_name: existing.doctor_name,
        clinic_address: resolvedAddress,
        error_message: `Apologies, the slot at ${existing.display_time} was already booked in the database by another caller.`
      };
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BK-DB-${randomNum}`;

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

    const saveFailed = (): BookingResult => ({
      status: "failed",
      patient_name,
      slot_iso_timestamp,
      display_time: displayTime,
      doctor_name: resolvedDoctor,
      clinic_address: resolvedAddress,
      error_message: "Maaf kijiye, abhi appointment save nahi ho payi. Kripya thodi der baad dobara try karein ya reception se baat karein."
    });

    const record: DatabaseAppointmentRecord = {
      booking_id: bookingId,
      clinic_id,
      patient_name,
      patient_phone,
      slot_iso_timestamp,
      display_time: displayTime,
      doctor_name: resolvedDoctor,
      service_type,
      status: "confirmed",
      created_at: new Date().toISOString()
    };

    // 2. Direct PostgreSQL / Supabase INSERT
    if (this.pgPool) {
      try {
        console.log(`[POSTGRES DB INSERT] Inserting appointment ${bookingId} into Supabase table 'appointments'...`);
        const insertRes = await this.pgPool.query(
          `INSERT INTO appointments (
            booking_id, clinic_id, patient_name, patient_phone, slot_iso_timestamp, display_time, doctor_name, service_type, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING`,
          [
            record.booking_id,
            record.clinic_id,
            record.patient_name,
            record.patient_phone,
            record.slot_iso_timestamp,
            record.display_time,
            record.doctor_name,
            record.service_type,
            record.status,
            record.created_at
          ]
        );
        if (insertRes.rowCount === 0) {
          console.warn(`[POSTGRES DB CONFLICT] Slot ${slot_iso_timestamp} was already taken in DB.`);
          return {
            status: "slot_taken",
            patient_name,
            slot_iso_timestamp,
            display_time: displayTime,
            doctor_name: resolvedDoctor,
            clinic_address: resolvedAddress,
            error_message: `Maaf kijiye, ${displayTime} ka slot pehle se booked hai. Kripya koi doosra slot chunein.`
          };
        }
        console.log(`[POSTGRES DB SUCCESS] Appointment ${bookingId} committed directly to Supabase PostgreSQL.`);
      } catch (dbErr: any) {
        console.error(`[POSTGRES DB ERROR] Failed to persist: ${dbErr.message}`);
        return saveFailed();
      }
    } else if (this.supabaseUrl && this.supabaseKey) {
      try {
        console.log(`[SUPABASE REST PERSIST] Inserting appointment ${bookingId} into table 'appointments'...`);
        const resp = await fetch(`${this.supabaseUrl}/rest/v1/appointments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": this.supabaseKey,
            "Authorization": `Bearer ${this.supabaseKey}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(record)
        });

        if (resp.ok) {
          console.log(`[SUPABASE SUCCESS] Appointment ${bookingId} committed to Supabase Cloud DB.`);
        } else {
          console.error(`[SUPABASE DB ERROR] Insert rejected with HTTP ${resp.status}`);
          return saveFailed();
        }
      } catch (err: any) {
        console.error(`[SUPABASE DB ERROR] ${err.message}`);
        return saveFailed();
      }
    }

    // Without PostgreSQL, this map is what later availability and booking checks read
    if (!this.pgPool) {
      this.mockAppointmentsTable.set(key, record);
    }
    console.log(`[PRODUCTION DB PERSIST] Inserted Appointment ${bookingId} into DB table 'appointments' for Clinic ${clinic_id}`);

    return {
      status: "confirmed",
      booking_id: bookingId,
      patient_name,
      slot_iso_timestamp,
      display_time: displayTime,
      doctor_name: record.doctor_name,
      clinic_address: resolvedAddress
    };
  }

  /**
   * Fetches booked slots for a clinic, keyed per doctor with doctorSlotKey().
   */
  public async getBookedDoctorSlotsFromDb(clinicId: string): Promise<Set<string>> {
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT slot_iso_timestamp, doctor_name FROM appointments WHERE clinic_id = $1 AND status = 'confirmed'`,
          [clinicId]
        );
        return new Set(res.rows.map((r: any) => doctorSlotKey(r.slot_iso_timestamp, r.doctor_name)));
      } catch (err: any) {
        console.error(`[POSTGRES FETCH ERROR] ${err.message}`);
      }
    }

    const bookedSlots = new Set<string>();
    for (const [key, record] of this.mockAppointmentsTable.entries()) {
      if (key.startsWith(`${clinicId}:`) && record.status === "confirmed") {
        bookedSlots.add(doctorSlotKey(record.slot_iso_timestamp, record.doctor_name));
      }
    }
    return bookedSlots;
  }

  /**
   * Records a completed call log into Supabase PostgreSQL.
   * Supports altSids (e.g. bridge_uuid, sip_call_id) to avoid duplicate entries
   * when LiveKit creates a row on disconnect and Vobiz CDR syncs later.
   */
  public async recordCallLogInDb(callLog: DatabaseCallLogRecord, altSids: string[] = []): Promise<boolean> {
    if (this.pgPool) {
      try {
        const candidateSids = Array.from(new Set([callLog.call_sid, ...altSids])).filter(Boolean);

        // 1. Check if a call with any of these candidate SIDs already exists in the database
        let existing = await this.pgPool.query(
          `SELECT id, call_sid, cost_inr, recording_url FROM call_logs WHERE call_sid = ANY($1::text[]) ORDER BY (CASE WHEN cost_inr > 0 THEN 0 ELSE 1 END), id ASC;`,
          [candidateSids]
        );

        // Fallback: If no SID match, check for an unbilled LiveKit log with same caller & clinic in the last 30 minutes
        if (existing.rows.length === 0 && callLog.caller_phone) {
          const rawDigits = callLog.caller_phone.replace(/[^0-9]/g, "").slice(-10);
          if (rawDigits.length >= 10) {
            existing = await this.pgPool.query(
              `SELECT id, call_sid, cost_inr, recording_url FROM call_logs 
               WHERE clinic_id = $1 
                 AND caller_phone LIKE '%' || $2 
                 AND cost_inr = 0.00 
                 AND created_at >= NOW() - INTERVAL '30 minutes'
               ORDER BY id DESC LIMIT 1;`,
              [callLog.clinic_id, rawDigits]
            );
          }
        }

        if (existing.rows.length > 0) {
          const primaryRow = existing.rows[0];

          // If duplicate rows already exist matching any candidate SIDs, remove the duplicates
          if (existing.rows.length > 1) {
            const extraIds = existing.rows.slice(1).map((r: any) => r.id);
            await this.pgPool.query(`DELETE FROM call_logs WHERE id = ANY($1::int[]);`, [extraIds]);
          }

          const preservedRecordingUrl =
            callLog.recording_url ||
            existing.rows.find((r: any) => r.recording_url)?.recording_url ||
            primaryRow.recording_url ||
            null;

          // Update the primary row with canonical details
          await this.pgPool.query(
            `UPDATE call_logs SET
              call_sid = $1,
              clinic_id = COALESCE($2, clinic_id),
              caller_phone = COALESCE($3, caller_phone),
              called_number = COALESCE($4, called_number),
              call_direction = COALESCE($5, call_direction),
              duration_seconds = CASE WHEN $6::int > 0 THEN $6::int ELSE duration_seconds END,
              billable_minutes = CASE WHEN $7::int > 0 THEN $7::int ELSE billable_minutes END,
              is_transferred = COALESCE($8::boolean, is_transferred),
              transfer_destination = COALESCE($9, transfer_destination),
              transfer_reason = COALESCE($10, transfer_reason),
              call_status = COALESCE($11, call_status),
              cost_inr = CASE WHEN $12::numeric > 0 THEN $12::numeric ELSE cost_inr END,
              recording_url = COALESCE($13, recording_url),
              summary = COALESCE($14, summary)
            WHERE id = $15::int;`,
            [
              callLog.call_sid,
              callLog.clinic_id,
              callLog.caller_phone,
              callLog.called_number || null,
              callLog.call_direction || null,
              callLog.duration_seconds,
              callLog.billable_minutes,
              callLog.is_transferred,
              callLog.transfer_destination || null,
              callLog.transfer_reason || null,
              callLog.call_status || null,
              callLog.cost_inr,
              preservedRecordingUrl,
              callLog.summary || null,
              primaryRow.id
            ]
          );
          return true;
        }

        // 2. If no existing candidate record exists, insert fresh record
        await this.pgPool.query(
          `INSERT INTO call_logs (
            clinic_id, call_sid, caller_phone, called_number, call_direction,
            duration_seconds, billable_minutes, is_transferred, transfer_destination,
            transfer_reason, call_status, cost_inr, recording_url, summary, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6::int, $7::int, $8::boolean, $9, $10, $11, $12::numeric, $13, $14, $15::timestamptz)
          ON CONFLICT (call_sid) DO UPDATE SET
            clinic_id = COALESCE(call_logs.clinic_id, EXCLUDED.clinic_id),
            cost_inr = CASE WHEN EXCLUDED.cost_inr > 0 THEN EXCLUDED.cost_inr ELSE call_logs.cost_inr END,
            duration_seconds = EXCLUDED.duration_seconds,
            billable_minutes = EXCLUDED.billable_minutes,
            call_status = EXCLUDED.call_status,
            recording_url = COALESCE(EXCLUDED.recording_url, call_logs.recording_url),
            summary = COALESCE(EXCLUDED.summary, call_logs.summary);`,
          [
            callLog.clinic_id,
            callLog.call_sid,
            callLog.caller_phone,
            callLog.called_number || "",
            callLog.call_direction || "inbound",
            callLog.duration_seconds,
            callLog.billable_minutes,
            callLog.is_transferred,
            callLog.transfer_destination || null,
            callLog.transfer_reason || null,
            callLog.call_status || "completed",
            callLog.cost_inr,
            callLog.recording_url || null,
            callLog.summary || null,
            callLog.created_at || new Date().toISOString()
          ]
        );
        return true;
      } catch (err: any) {
        console.error(`[CALL LOG DB ERROR] Failed to record call log: ${err.message}`);
      }
    }
    return false;
  }

  /**
   * Fetches all call logs for a specific clinic.
   */
  public async getCallLogsForClinic(clinicId: string): Promise<DatabaseCallLogRecord[]> {
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT * FROM call_logs WHERE clinic_id = $1 ORDER BY created_at DESC;`,
          [clinicId]
        );
        return res.rows;
      } catch (err: any) {
        console.error(`[POSTGRES FETCH CALL LOGS ERROR] ${err.message}`);
      }
    }
    return [];
  }

  /**
   * Calculates billing summary and call breakdown for a specific clinic.
   */
  public async getBillingSummaryForClinic(clinicId: string): Promise<ClinicBillingSummary> {
    const clinic = clinicRegistry.getClinicById(clinicId) || clinicRegistry.getClinicByPhone(clinicId);
    const clinicName = clinic?.clinic_name || clinicId;

    const ratePerMinute = parseFloat(process.env.BILLING_RATE_PER_MINUTE || "0.00");
    const ratePerTransfer = parseFloat(process.env.BILLING_RATE_PER_TRANSFER || "0.00");

    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT 
            COUNT(*)::int as total_calls,
            COUNT(*) FILTER (WHERE is_transferred = true)::int as transferred_calls,
            COUNT(*) FILTER (WHERE is_transferred = false)::int as ai_handled_calls,
            COALESCE(SUM(duration_seconds), 0)::int as total_duration_seconds,
            COALESCE(SUM(cost_inr), 0)::numeric as total_bill_inr
           FROM call_logs 
           WHERE clinic_id = $1;`,
          [clinicId]
        );

        if (res.rows.length > 0) {
          const row = res.rows[0];
          const totalDurationSec = row.total_duration_seconds || 0;
          const mins = Math.floor(totalDurationSec / 60);
          const secs = totalDurationSec % 60;
          const formattedDuration = `${mins}m ${secs}s`;

          return {
            clinic_id: clinicId,
            clinic_name: clinicName,
            total_calls: row.total_calls || 0,
            transferred_calls: row.transferred_calls || 0,
            ai_handled_calls: row.ai_handled_calls || 0,
            total_duration_seconds: totalDurationSec,
            total_duration_formatted: formattedDuration,
            total_bill_inr: parseFloat(row.total_bill_inr || "0"),
            rate_per_minute: ratePerMinute,
            rate_per_transfer: ratePerTransfer
          };
        }
      } catch (err: any) {
        console.error(`[POSTGRES BILLING SUMMARY ERROR] ${err.message}`);
      }
    }

    return {
      clinic_id: clinicId,
      clinic_name: clinicName,
      total_calls: 0,
      transferred_calls: 0,
      ai_handled_calls: 0,
      total_duration_seconds: 0,
      total_duration_formatted: "0m 0s",
      total_bill_inr: 0,
      rate_per_minute: ratePerMinute,
      rate_per_transfer: ratePerTransfer
    };
  }

  /**
   * Fetches appointments for a single clinic.
   */
  public async getAppointmentsForClinic(clinicId: string): Promise<DatabaseAppointmentRecord[]> {
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT * FROM appointments WHERE clinic_id = $1 ORDER BY created_at DESC;`,
          [clinicId]
        );
        return res.rows;
      } catch (err: any) {
        console.error(`[POSTGRES APPOINTMENTS ERROR] ${err.message}`);
      }
    }
    return Array.from(this.mockAppointmentsTable.values()).filter(a => a.clinic_id === clinicId);
  }

  /**
   * Cancels an appointment in PostgreSQL / Supabase and releases any slot locks.
   */
  public async cancelAppointmentInDb(clinicId: string, bookingId: string): Promise<boolean> {
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `UPDATE appointments SET status = 'cancelled' WHERE clinic_id = $1 AND booking_id = $2 RETURNING slot_iso_timestamp, doctor_name`,
          [clinicId, bookingId]
        );
        if (res.rows.length > 0) {
          const slotIso = res.rows[0].slot_iso_timestamp;
          if (slotIso) {
            slotLockManager.releaseLock(clinicId, slotIso, res.rows[0].doctor_name);
          }
          return true;
        }
      } catch (err: any) {
        console.error(`[POSTGRES CANCEL APPOINTMENT ERROR] ${err.message}`);
      }
    }

    // Mock table fallback
    for (const [key, record] of this.mockAppointmentsTable.entries()) {
      if (record.clinic_id === clinicId && record.booking_id === bookingId) {
        record.status = "cancelled";
        slotLockManager.releaseLock(clinicId, record.slot_iso_timestamp, record.doctor_name);
        return true;
      }
    }
    return false;
  }

  /**
   * Finds a superadmin in PostgreSQL / Supabase by mobile phone number.
   */
  public async findSuperAdminByPhone(rawMobile: string): Promise<any | null> {
    if (!rawMobile) return null;
    const cleanDigits = rawMobile.replace(/[^0-9]/g, "");
    if (!cleanDigits || cleanDigits.length < 10) return null;
    const last10 = cleanDigits.slice(-10);

    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT id, name, phone, password, role FROM super_admins WHERE phone LIKE $1;`,
          [`%${last10}`]
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err: any) {
        console.error(`[FIND SUPERADMIN ERROR] ${err.message}`);
      }
    }
    return null;
  }

  /**
   * Strictly authenticates a clinic by their registered mobile/phone number.
   * Returns clinic record if registered in DB, otherwise null.
   */
  public async findClinicByMobileNumber(rawMobile: string): Promise<any | null> {
    if (!rawMobile) return null;
    const cleanDigits = rawMobile.replace(/[^0-9]/g, "");
    if (!cleanDigits || cleanDigits.length < 10) return null;
    const last10 = cleanDigits.slice(-10);

    // 1. Check in PostgreSQL database
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT clinic_id, clinic_name, address, working_hours, contact_phone, receptionist_name, virtual_phone_numbers, doctors, services, password, is_active, business_type, delivery_available, min_delivery_order
           FROM clinics 
           WHERE contact_phone LIKE $1 
              OR virtual_phone_numbers::text LIKE $1;`,
          [`%${last10}%`]
        );

        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            clinic_id: row.clinic_id,
            clinic_name: row.clinic_name,
            address: row.address,
            working_hours: row.working_hours,
            contact_phone: row.contact_phone,
            password: row.password || "123456",
            receptionist_name: row.receptionist_name || "Neha",
            virtual_phone_numbers: Array.isArray(row.virtual_phone_numbers) ? row.virtual_phone_numbers : [row.contact_phone],
            doctors: Array.isArray(row.doctors) ? row.doctors : (typeof row.doctors === "string" ? JSON.parse(row.doctors) : []),
            services: Array.isArray(row.services) ? row.services : (typeof row.services === "string" ? JSON.parse(row.services) : []),
            is_active: row.is_active !== false,
            business_type: row.business_type || "clinic",
            delivery_available: row.delivery_available !== false,
            min_delivery_order: row.min_delivery_order || "None"
          };
        }

        // Also check medical_stores dedicated table
        const resMed = await this.pgPool.query(
          `SELECT store_id, store_name, address, working_hours, contact_phone, receptionist_name, virtual_phone_numbers, pharmacist_name, services, password, is_active, delivery_available, min_delivery_order
           FROM medical_stores
           WHERE contact_phone LIKE $1 
              OR virtual_phone_numbers::text LIKE $1;`,
          [`%${last10}%`]
        );
        if (resMed.rows.length > 0) {
          const row = resMed.rows[0];
          return {
            clinic_id: row.store_id,
            clinic_name: row.store_name,
            address: row.address,
            working_hours: row.working_hours,
            contact_phone: row.contact_phone,
            password: row.password || "123456",
            receptionist_name: row.receptionist_name || "Neha",
            virtual_phone_numbers: Array.isArray(row.virtual_phone_numbers) ? row.virtual_phone_numbers : [row.contact_phone],
            doctors: [{ name: row.pharmacist_name || "Pharmacist In-Charge", specialties: ["Pharmacist"], specialization: "Pharmacist", timings: row.working_hours }],
            services: Array.isArray(row.services) ? row.services : (typeof row.services === "string" ? JSON.parse(row.services) : []),
            is_active: row.is_active !== false,
            business_type: "medical_store",
            delivery_available: row.delivery_available !== false,
            min_delivery_order: row.min_delivery_order || "None"
          };
        }
      } catch (err: any) {
        console.error(`[FIND CLINIC ERROR] ${err.message}`);
      }
    }

    // 2. Check in memory clinicRegistry
    for (const clinic of clinicRegistry.getAllClinics()) {
      const regDigits = (clinic.contact_phone || "").replace(/[^0-9]/g, "");
      if (regDigits.endsWith(last10)) {
        return clinic;
      }
      for (const vNum of clinic.virtual_phone_numbers || []) {
        const vDigits = vNum.replace(/[^0-9]/g, "");
        if (vDigits.endsWith(last10)) {
          return clinic;
        }
      }
    }

    return null;
  }

  /**
   * Admin: Fetches all clinics & medical stores with summary stats from PostgreSQL database.
   */
  public async getAllClinicsForAdmin(): Promise<any[]> {
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(`
          SELECT 
            c.clinic_id,
            c.clinic_name,
            c.contact_phone,
            c.address,
            c.working_hours,
            c.receptionist_name,
            c.virtual_phone_numbers,
            c.doctors,
            c.services,
            c.password,
            c.scheduling_enabled,
            c.slot_duration_minutes,
            c.is_active,
            c.business_type,
            c.delivery_available,
            c.min_delivery_order,
            c.created_at,
            (SELECT COUNT(*) FROM appointments a WHERE a.clinic_id = c.clinic_id)::int as appointment_count,
            (SELECT COUNT(*) FROM call_logs cl WHERE cl.clinic_id = c.clinic_id)::int as call_count
          FROM clinics c
          UNION ALL
          SELECT 
            ms.store_id as clinic_id,
            ms.store_name as clinic_name,
            ms.contact_phone,
            ms.address,
            ms.working_hours,
            ms.receptionist_name,
            ms.virtual_phone_numbers,
            jsonb_build_array(jsonb_build_object('name', ms.pharmacist_name, 'specialties', jsonb_build_array('Pharmacist'), 'specialization', 'Pharmacist', 'timings', ms.working_hours)) as doctors,
            ms.services,
            ms.password,
            false as scheduling_enabled,
            0 as slot_duration_minutes,
            ms.is_active,
            'medical_store' as business_type,
            ms.delivery_available,
            ms.min_delivery_order,
            ms.created_at,
            (SELECT COUNT(*) FROM medical_orders mo WHERE mo.store_id = ms.store_id)::int as appointment_count,
            (SELECT COUNT(*) FROM call_logs cl WHERE cl.clinic_id = ms.store_id)::int as call_count
          FROM medical_stores ms
          ORDER BY created_at DESC;
        `);
        return res.rows;
      } catch (err: any) {
        console.error(`[ADMIN FETCH CLINICS ERROR] ${err.message}`);
        throw err;
      }
    }
    return [];
  }

  /**
   * Admin: Creates a new clinic or medical store record in the PostgreSQL database.
   */
  public async createClinicInDb(clinicData: {
    clinic_id: string;
    clinic_name: string;
    contact_phone: string;
    address: string;
    working_hours: string;
    receptionist_name?: string;
    password?: string;
    virtual_phone_numbers?: string[];
    doctors?: any[];
    services?: any[];
    slot_duration_minutes?: number;
    scheduling_enabled?: boolean;
    is_active?: boolean;
    business_type?: string;
    delivery_available?: boolean;
    min_delivery_order?: string;
  }): Promise<any> {
    if (!this.pgPool) {
      throw new Error("Database connection pool is not available.");
    }

    // Check if phone number is already registered in either clinics or medical_stores
    const cleanDigits = clinicData.contact_phone.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);

    const existingClinic = await this.pgPool.query(
      `SELECT clinic_id, clinic_name FROM clinics 
       WHERE contact_phone LIKE $1 OR virtual_phone_numbers::text LIKE $1;`,
      [`%${last10}%`]
    );
    if (existingClinic.rows.length > 0) {
      throw new Error(`Mobile number ending with ${last10} is already registered to "${existingClinic.rows[0].clinic_name}" (${existingClinic.rows[0].clinic_id}).`);
    }

    const existingStore = await this.pgPool.query(
      `SELECT store_id, store_name FROM medical_stores 
       WHERE contact_phone LIKE $1 OR virtual_phone_numbers::text LIKE $1;`,
      [`%${last10}%`]
    );
    if (existingStore.rows.length > 0) {
      throw new Error(`Mobile number ending with ${last10} is already registered to "${existingStore.rows[0].store_name}" (${existingStore.rows[0].store_id}).`);
    }

    // Insert into medical_stores if business_type is medical_store
    if (clinicData.business_type === 'medical_store') {
      const pharmName = clinicData.doctors?.[0]?.name || "Pharmacist In-Charge";
      const res = await this.pgPool.query(
        `INSERT INTO medical_stores (
          store_id, store_name, contact_phone, address, working_hours,
          pharmacist_name, delivery_available, min_delivery_order,
          receptionist_name, password, virtual_phone_numbers, services, is_active, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, NOW()
        ) RETURNING store_id as clinic_id, store_name as clinic_name, contact_phone, address, working_hours,
                    pharmacist_name, delivery_available, min_delivery_order, receptionist_name, password,
                    virtual_phone_numbers, services, is_active, created_at;`,
        [
          clinicData.clinic_id,
          clinicData.clinic_name.trim(),
          clinicData.contact_phone.trim(),
          clinicData.address.trim(),
          clinicData.working_hours.trim(),
          pharmName,
          clinicData.delivery_available !== false,
          clinicData.min_delivery_order || "None",
          clinicData.receptionist_name?.trim() || "Neha",
          clinicData.password?.trim() || "123456",
          clinicData.virtual_phone_numbers && clinicData.virtual_phone_numbers.length > 0
            ? clinicData.virtual_phone_numbers
            : [clinicData.contact_phone.trim()],
          JSON.stringify(clinicData.services || []),
          clinicData.is_active !== false
        ]
      );
      const row = res.rows[0];
      return {
        ...row,
        business_type: "medical_store",
        doctors: [{ name: row.pharmacist_name, specialties: ["Pharmacist"], specialization: "Pharmacist", timings: row.working_hours }]
      };
    }

    // Otherwise insert into standard clinics table
    const res = await this.pgPool.query(
      `INSERT INTO clinics (
        clinic_id, clinic_name, contact_phone, address, working_hours,
        receptionist_name, virtual_phone_numbers, doctors, services,
        slot_duration_minutes, scheduling_enabled, is_active, password,
        business_type, delivery_available, min_delivery_order, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, NOW()
      ) RETURNING *;`,
      [
        clinicData.clinic_id,
        clinicData.clinic_name.trim(),
        clinicData.contact_phone.trim(),
        clinicData.address.trim(),
        clinicData.working_hours.trim(),
        clinicData.receptionist_name?.trim() || "Neha",
        clinicData.virtual_phone_numbers && clinicData.virtual_phone_numbers.length > 0
          ? clinicData.virtual_phone_numbers
          : [clinicData.contact_phone.trim()],
        JSON.stringify(clinicData.doctors || []),
        JSON.stringify(clinicData.services || []),
        clinicData.slot_duration_minutes || 30,
        clinicData.scheduling_enabled !== false,
        clinicData.is_active !== false,
        clinicData.password?.trim() || "123456",
        clinicData.business_type || "clinic",
        clinicData.delivery_available !== false,
        clinicData.min_delivery_order || "None"
      ]
    );

    return res.rows[0];
  }

  /**
   * Admin: Deletes a clinic or medical store record from database along with related appointments & call logs.
   */
  public async deleteClinicFromDb(clinicId: string): Promise<boolean> {
    if (!this.pgPool) return false;
    try {
      await this.pgPool.query(`DELETE FROM appointments WHERE clinic_id = $1;`, [clinicId]);
      await this.pgPool.query(`DELETE FROM medical_orders WHERE store_id = $1;`, [clinicId]);
      await this.pgPool.query(`DELETE FROM call_logs WHERE clinic_id = $1;`, [clinicId]);
      const res1 = await this.pgPool.query(`DELETE FROM clinics WHERE clinic_id = $1;`, [clinicId]);
      const res2 = await this.pgPool.query(`DELETE FROM medical_stores WHERE store_id = $1;`, [clinicId]);
      return (res1.rowCount ?? 0) > 0 || (res2.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.error(`[ADMIN DELETE CLINIC ERROR] ${err.message}`);
      throw err;
    }
  }

  /**
   * Records or updates a customer's medicine order or inquiry into the dedicated medical_orders table.
   */
  public async createMedicalOrderInDb(params: {
    order_id?: string;
    store_id: string;
    customer_name: string;
    customer_phone: string;
    medicines: string;
    order_type?: string;
    delivery_address?: string;
    notes?: string;
  }): Promise<{ order_id: string; status: string }> {
    const orderId = params.order_id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    if (this.pgPool) {
      try {
        if (params.order_id) {
          const updateRes = await this.pgPool.query(
            `UPDATE medical_orders
             SET customer_name = $1, customer_phone = $2, medicines = $3, order_type = $4, delivery_address = $5, notes = $6
             WHERE order_id = $7;`,
            [
              params.customer_name,
              params.customer_phone,
              params.medicines,
              params.order_type || "store_pickup",
              params.delivery_address || null,
              params.notes || null,
              params.order_id
            ]
          );
          if (updateRes.rowCount && updateRes.rowCount > 0) {
            return { order_id: orderId, status: "confirmed" };
          }
        }

        await this.pgPool.query(
          `INSERT INTO medical_orders (
            order_id, store_id, customer_name, customer_phone, medicines, order_type, delivery_address, status, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());`,
          [
            orderId,
            params.store_id,
            params.customer_name,
            params.customer_phone,
            params.medicines,
            params.order_type || "store_pickup",
            params.delivery_address || null,
            "pending",
            params.notes || null
          ]
        );
        return { order_id: orderId, status: "confirmed" };
      } catch (err: any) {
        console.error(`[CREATE/UPDATE MEDICAL ORDER DB ERROR] ${err.message}`);
      }
    }

    return { order_id: orderId, status: "confirmed" };
  }

  /**
   * Fetches all medicine orders for a given store from medical_orders table.
   */
  public async getMedicalOrdersForStore(storeId: string): Promise<any[]> {
    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT order_id, store_id, customer_name, customer_phone, medicines, order_type, delivery_address, status, notes, created_at
           FROM medical_orders
           WHERE store_id = $1
           ORDER BY created_at DESC;`,
          [storeId]
        );
        return res.rows;
      } catch (err: any) {
        console.error(`[FETCH MEDICAL ORDERS ERROR] ${err.message}`);
      }
    }
    return [];
  }

  /**
   * Looks up past caller profile (name, last order, last appointment, saved address)
   * across medical_orders and appointments for repeat caller recognition.
   */
  public async getCallerProfile(clinicId: string, phone: string, isMedicalStore: boolean): Promise<CallerProfileRecord> {
    const cleanDigits = phone.replace(/[^0-9]/g, "").slice(-10);
    if (!cleanDigits || cleanDigits.length < 10 || !this.pgPool) {
      return { isRepeatCaller: false };
    }

    try {
      const phonePattern = `%${cleanDigits}%`;

      if (isMedicalStore) {
        // 1. Check medical_orders for this store
        const orderRes = await this.pgPool.query(
          `SELECT order_id, customer_name, medicines, order_type, delivery_address, status, created_at
           FROM medical_orders
           WHERE store_id = $1 AND customer_phone LIKE $2
           ORDER BY created_at DESC
           LIMIT 1;`,
          [clinicId, phonePattern]
        );

        if (orderRes.rows.length > 0) {
          const row = orderRes.rows[0];
          return {
            isRepeatCaller: true,
            customerName: row.customer_name,
            savedAddress: row.delivery_address || undefined,
            lastOrder: {
              order_id: row.order_id,
              medicines: row.medicines,
              order_type: row.order_type,
              delivery_address: row.delivery_address || undefined,
              status: row.status,
              created_at: new Date(row.created_at).toLocaleDateString("en-IN")
            }
          };
        }

        // Also check if they had booked under appointments for this clinicId
        const storeApptRes = await this.pgPool.query(
          `SELECT booking_id, patient_name, doctor_name, service_type, display_time, status, created_at
           FROM appointments
           WHERE clinic_id = $1 AND patient_phone LIKE $2
           ORDER BY created_at DESC
           LIMIT 1;`,
          [clinicId, phonePattern]
        );
        if (storeApptRes.rows.length > 0) {
          const row = storeApptRes.rows[0];
          return {
            isRepeatCaller: true,
            customerName: row.patient_name,
            lastAppointment: {
              booking_id: row.booking_id,
              doctor_name: row.doctor_name,
              service_type: row.service_type,
              display_time: row.display_time,
              status: row.status,
              created_at: new Date(row.created_at).toLocaleDateString("en-IN")
            }
          };
        }
      } else {
        // 2. Check appointments for this clinic
        const apptRes = await this.pgPool.query(
          `SELECT booking_id, patient_name, doctor_name, service_type, display_time, status, created_at
           FROM appointments
           WHERE clinic_id = $1 AND patient_phone LIKE $2
           ORDER BY created_at DESC
           LIMIT 1;`,
          [clinicId, phonePattern]
        );

        if (apptRes.rows.length > 0) {
          const row = apptRes.rows[0];
          return {
            isRepeatCaller: true,
            customerName: row.patient_name,
            lastAppointment: {
              booking_id: row.booking_id,
              doctor_name: row.doctor_name,
              service_type: row.service_type,
              display_time: row.display_time,
              status: row.status,
              created_at: new Date(row.created_at).toLocaleDateString("en-IN")
            }
          };
        }

        // Also check if they had placed an order under medical_orders for this clinicId
        const clinicOrderRes = await this.pgPool.query(
          `SELECT order_id, customer_name, medicines, order_type, delivery_address, status, created_at
           FROM medical_orders
           WHERE store_id = $1 AND customer_phone LIKE $2
           ORDER BY created_at DESC
           LIMIT 1;`,
          [clinicId, phonePattern]
        );
        if (clinicOrderRes.rows.length > 0) {
          const row = clinicOrderRes.rows[0];
          return {
            isRepeatCaller: true,
            customerName: row.customer_name,
            savedAddress: row.delivery_address || undefined,
            lastOrder: {
              order_id: row.order_id,
              medicines: row.medicines,
              order_type: row.order_type,
              delivery_address: row.delivery_address || undefined,
              status: row.status,
              created_at: new Date(row.created_at).toLocaleDateString("en-IN")
            }
          };
        }
      }

      // 3. Fallback: Check if caller previously ordered or booked anywhere in FrontDesk AI
      const fallbackOrderRes = await this.pgPool.query(
        `SELECT customer_name, delivery_address FROM medical_orders WHERE customer_phone LIKE $1 ORDER BY created_at DESC LIMIT 1;`,
        [phonePattern]
      );
      if (fallbackOrderRes.rows.length > 0 && fallbackOrderRes.rows[0].customer_name) {
        return {
          isRepeatCaller: true,
          customerName: fallbackOrderRes.rows[0].customer_name,
          savedAddress: fallbackOrderRes.rows[0].delivery_address || undefined
        };
      }

      const fallbackApptRes = await this.pgPool.query(
        `SELECT patient_name FROM appointments WHERE patient_phone LIKE $1 ORDER BY created_at DESC LIMIT 1;`,
        [phonePattern]
      );
      if (fallbackApptRes.rows.length > 0 && fallbackApptRes.rows[0].patient_name) {
        return {
          isRepeatCaller: true,
          customerName: fallbackApptRes.rows[0].patient_name
        };
      }
    } catch (err: any) {
      console.warn(`[REPEAT CALLER LOOKUP NOTICE] ${err.message}`);
    }

    return { isRepeatCaller: false };
  }
}

export const dbService = new ProductionDatabaseService();
