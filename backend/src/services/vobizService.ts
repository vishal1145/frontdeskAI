import fs from "fs";
import dotenv from "dotenv";
import { dbService } from "./dbService.js";
import { clinicRegistry } from "../config/clinicRegistry.js";

dotenv.config();

export interface VobizCdrRecord {
  id?: number;
  uuid?: string;
  call_uuid?: string;
  CallUUID?: string;
  call_id?: string;
  caller_id_number?: string;
  caller_id_name?: string;
  actual_cli?: string;
  from?: string;
  From?: string;
  destination_number?: string;
  to?: string;
  To?: string;
  start_time?: string;
  answer_time?: string;
  end_time?: string;
  duration?: number | string;
  billsec?: number | string;
  cost?: number | string;
  total_cost?: number | string;
  hangup_cause?: string;
  hangup_cause_name?: string;
  call_direction?: string;
  [key: string]: any;
}

/**
 * Service to interact directly with Vobiz Telephony & CDR APIs.
 * Endpoint: GET https://api.vobiz.ai/api/v1/Account/{auth_id}/cdr
 */
export class VobizTelephonyService {
  private authId: string;
  private authToken: string;
  private baseUrl: string = "https://api.vobiz.ai/api/v1";

  private lastSyncTime: number = 0;

  constructor() {
    this.authId = process.env.VOBIZ_AUTH_ID || "";
    this.authToken = process.env.VOBIZ_AUTH_TOKEN || "";
  }

  public isConfigured(): boolean {
    this.authId = process.env.VOBIZ_AUTH_ID || "";
    this.authToken = process.env.VOBIZ_AUTH_TOKEN || "";
    return Boolean(this.authId && this.authToken);
  }

  /**
   * Directly terminates an active phone call on Vobiz / Telecom Carrier network
   * Endpoint: DELETE https://api.vobiz.ai/api/v1/Account/{auth_id}/Call/{call_uuid}/
   */
  public async hangupCall(callUuid: string): Promise<boolean> {
    if (!this.isConfigured() || !callUuid) {
      console.warn(`[VOBIZ HANGUP] Skipped: Not configured or missing callUuid (${callUuid})`);
      return false;
    }

    try {
      const cleanUuid = callUuid.trim();
      const url = `${this.baseUrl}/Account/${this.authId}/Call/${cleanUuid}/`;
      console.log(`[VOBIZ API] Sending DELETE request to terminate call: ${cleanUuid}`);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-Auth-ID": this.authId,
          "X-Auth-Token": this.authToken,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 204 || response.ok) {
        console.log(`[VOBIZ API SUCCESS] Call ${cleanUuid} terminated successfully by carrier API.`);
        return true;
      } else {
        const errText = await response.text();
        console.warn(`[VOBIZ API WARNING] Call hangup HTTP ${response.status}:`, errText);
        return false;
      }
    } catch (err: any) {
      console.error(`[VOBIZ API ERROR] Failed to hang up call ${callUuid}:`, err.message);
      return false;
    }
  }

  /**
   * Fetches latest CDRs directly from Vobiz REST API with automatic multi-page fetching.
   */
  public async fetchAllVobizCdrs(maxPages = 3, perPage = 100): Promise<VobizCdrRecord[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const allRecords: VobizCdrRecord[] = [];

    try {
      for (let page = 1; page <= maxPages; page++) {
        const url = `${this.baseUrl}/Account/${this.authId}/cdr?page=${page}&per_page=${perPage}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-Auth-ID": this.authId,
            "X-Auth-Token": this.authToken,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          console.warn(`[VOBIZ API] CDR fetch page ${page} returned HTTP ${response.status}`);
          break;
        }

        const data: any = await response.json();
        const records: VobizCdrRecord[] = data.data || data.cdrs || (Array.isArray(data) ? data : []);
        if (!records || records.length === 0) {
          break;
        }

        allRecords.push(...records);

        // Check pagination if more pages available
        if (data.pagination && !data.pagination.has_next) {
          break;
        }
      }
      return allRecords;
    } catch (err: any) {
      console.error(`[VOBIZ API ERROR] Failed to fetch CDRs:`, err.message);
      return allRecords;
    }
  }

  /**
   * Syncs real Vobiz CDR records into PostgreSQL database for a specific clinic.
   * Directly uses Vobiz carrier actual cost without hardcoded rates.
   */
  public async syncVobizCdrsForClinic(clinicId?: string, forceAll = false): Promise<number> {
    if (!this.isConfigured()) {
      return 0;
    }

    const now = Date.now();
    if (!forceAll && (now - this.lastSyncTime < 30000)) {
      return 0; // Return immediately if synced in last 30s
    }
    this.lastSyncTime = now;

    try {
      // If forceAll, fetch up to 300 calls; else fetch latest page (fast 150ms)
      const pagesToFetch = forceAll ? 5 : 1;
      const cdrs = await this.fetchAllVobizCdrs(pagesToFetch, 100);
      if (!cdrs || !cdrs.length) return 0;

      await clinicRegistry.ensureLoaded();
      let importedCount = 0;

      // Load transcript sessions for caller cross-referencing
      const transcriptMap: { time: number; caller: string; clinicName: string }[] = [];
      try {
        if (fs.existsSync("logs/call_transcripts.log")) {
          const lines = fs.readFileSync("logs/call_transcripts.log", "utf-8").split("\n");
          for (const line of lines) {
            const m = line.match(/\[(.*?)\] \[Caller: (.*?) \| Clinic: (.*?)\]/);
            if (m) {
              transcriptMap.push({
                time: new Date(m[1]).getTime(),
                caller: m[2].replace(/[^0-9]/g, "").slice(-10),
                clinicName: m[3]
              });
            }
          }
        }
      } catch (e) {
        // Ignore transcript read errors
      }

      for (const cdr of cdrs) {
        const callSid = cdr.uuid || cdr.call_uuid || cdr.CallUUID || cdr.call_id || (cdr.id ? `vbz_${cdr.id}` : null);
        if (!callSid) continue;

        let callerPhone = cdr.caller_id_number || cdr.caller_id_name || cdr.actual_cli || cdr.from || cdr.From || "Unknown";
        if (callerPhone && !callerPhone.startsWith("+") && callerPhone !== "Unknown") {
          callerPhone = `+${callerPhone}`;
        }

        let destination = cdr.destination_number || cdr.to || cdr.To || "";
        if (destination && !destination.startsWith("+")) {
          destination = `+${destination}`;
        }

        const durationSec = parseInt(String(cdr.duration || cdr.billsec || 0), 10);
        const billableSec = parseInt(String(cdr.billsec || cdr.duration || 0), 10);
        const billableMins = Math.max(1, Math.ceil(billableSec / 60));
        const callTime = new Date(cdr.start_time || cdr.created_at || Date.now()).getTime();

        // Multi-tenant resolution: Map to the specific clinic dynamically via clinicRegistry
        const callerDigits = callerPhone.replace(/[^0-9]/g, "").slice(-10);
        const defaultClinicId = clinicRegistry.getDefaultClinic().clinic_id;
        let resolvedClinicId = defaultClinicId;

        // 1. Check if destination or diversion number matches a registered clinic
        const destinationClinic = clinicRegistry.getClinicByPhone(destination);
        if (destinationClinic && destinationClinic.clinic_id !== defaultClinicId) {
          resolvedClinicId = destinationClinic.clinic_id;
        } else {
          // 2. Check if caller phone matches a registered clinic's contact/virtual phone
          const callerClinic = clinicRegistry.getClinicByPhone(callerPhone);
          if (callerClinic && callerClinic.clinic_id !== defaultClinicId) {
            const clinicCreatedAt = callerClinic.created_at ? new Date(callerClinic.created_at).getTime() : 0;
            // Only attribute if call occurred after this clinic was registered
            if (clinicCreatedAt === 0 || callTime >= clinicCreatedAt - 60000) {
              resolvedClinicId = callerClinic.clinic_id;
            }
          } else {
            // 3. Check transcript map if matches within 3 mins for active AI calls
            const matchedTranscript = transcriptMap.find(
              (t) => t.caller === callerDigits && Math.abs(t.time - callTime) < 180000
            );
            if (matchedTranscript) {
              const matchedByName = clinicRegistry
                .getAllClinics()
                .find(
                  (c) =>
                    c.clinic_name.toLowerCase().includes(matchedTranscript.clinicName.toLowerCase()) ||
                    matchedTranscript.clinicName.toLowerCase().includes(c.clinic_name.toLowerCase())
                );
              if (matchedByName) {
                resolvedClinicId = matchedByName.clinic_id;
              }
            } else if (destinationClinic) {
              resolvedClinicId = destinationClinic.clinic_id;
            }
          }
        }

        // Never assign historical calls that happened before this business was created
        const targetBusiness = clinicRegistry.getClinicById(resolvedClinicId);
        if (targetBusiness && targetBusiness.created_at) {
          const createdAtTime = new Date(targetBusiness.created_at).getTime();
          if (callTime < createdAtTime - 60000) {
            continue;
          }
        }

        if (clinicId && resolvedClinicId !== clinicId) {
          continue;
        }

        // Use direct actual Vobiz cost (e.g. 0.38, 0.76, 0.00)
        const costVal = parseFloat(String(cdr.total_cost ?? cdr.cost ?? 0.00));
        const costInr = isNaN(costVal) ? 0.00 : costVal;

        const isTransferred = Boolean(cdr.is_transferred || cdr.forwarded);
        const hangupName = cdr.hangup_cause_name || cdr.hangup_cause || "Normal Hangup";

        const isShortCall = durationSec <= 10 || (cdr.hangup_cause || '').toUpperCase().includes('CANCEL');
        const cleanSummary = isTransferred
          ? `Forwarded to Doctor / Reception`
          : isShortCall
            ? `Missed / Short Call (${durationSec}s)`
            : `Patient Inquiry Handled by AI (${durationSec}s)`;

        const altSids = [cdr.bridge_uuid, cdr.sip_call_id].filter(Boolean);

        await dbService.recordCallLogInDb({
          clinic_id: resolvedClinicId,
          call_sid: callSid,
          caller_phone: callerPhone,
          called_number: destination,
          call_direction: cdr.call_direction || "inbound",
          duration_seconds: durationSec,
          billable_minutes: billableMins,
          is_transferred: isTransferred,
          transfer_destination: cdr.transfer_destination || null,
          transfer_reason: cdr.transfer_reason || null,
          call_status: cdr.hangup_cause || "completed",
          cost_inr: costInr,
          recording_url: cdr.recording_url || cdr.record_url || cdr.audio_url || null,
          summary: cleanSummary,
          created_at: cdr.start_time || cdr.created_at || new Date().toISOString()
        }, altSids);

        importedCount++;
      }

      console.log(`[VOBIZ SYNC COMPLETE] Successfully synced ${importedCount} live Vobiz call logs into database.`);
      return importedCount;
    } catch (err: any) {
      console.error(`[VOBIZ SYNC ERROR]`, err.message);
      return 0;
    }
  }
}

export const vobizService = new VobizTelephonyService();
