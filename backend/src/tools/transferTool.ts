import { FunctionDeclaration, Type } from "@google/genai";
import { clinicRegistry } from "../config/clinicRegistry.js";

export const transferCallDeclaration: FunctionDeclaration = {
  name: "transfer_call",
  description:
    "Transfers the call to a human receptionist, doctor, or emergency contact when requested by the caller or during medical emergencies.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: "Reason for transferring the call e.g. 'Caller requested human agent', 'Acute medical emergency'."
      },
      doctor_phone: {
        type: Type.STRING,
        description: "Optional destination phone number to transfer the call to."
      },
      clinic_id: {
        type: Type.STRING,
        description: "Optional clinic ID or virtual phone number."
      }
    },
    required: ["reason"]
  }
};

export interface TransferCallResult {
  status: "transferring" | "failed";
  destination_phone: string;
  reason: string;
  sip_refer_payload?: Record<string, any>;
  message: string;
}

/**
 * Executes warm call transfer to doctor's emergency mobile or clinic front desk.
 * Grounded in PRD Section 8.4 (Human Fallback & Escalation).
 */
export async function executeTransferCall(params: {
  reason: string;
  doctor_phone?: string;
  clinic_id?: string;
}): Promise<TransferCallResult> {
  const { reason, doctor_phone, clinic_id } = params;
  const clinic = clinicRegistry.getClinicByPhone(clinic_id || "");

  const targetPhone = doctor_phone || clinic.contact_phone || clinic.virtual_phone_numbers[0] || "Clinic Desk";

  console.log(`[HUMAN ESCALATION] Call Transfer Triggered for ${clinic.clinic_name}`);
  console.log(`  ├─ Target Phone: ${targetPhone}`);
  console.log(`  └─ Escalation Reason: "${reason}"`);

  return {
    status: "transferring",
    destination_phone: targetPhone,
    reason,
    sip_refer_payload: {
      destination: {
        type: "number",
        number: targetPhone
      }
    },
    message: `Transferring call to clinic team at ${targetPhone}. Please hold...`
  };
}
