import { FunctionDeclaration, Type } from "@google/genai";

export const endCallDeclaration: FunctionDeclaration = {
  name: "end_call",
  description:
    "Hangs up and disconnects the live phone call when conversation is finished, such as when caller says 'thank you', 'bye', 'theek hai bas' or after appointment confirmation when user has no further questions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description:
          "Reason for ending the call, e.g. 'caller_said_bye', 'appointment_confirmed', 'patient_satisfied', 'inactivity'."
      }
    },
    required: ["reason"]
  }
};

export interface EndCallResult {
  status: "call_ending";
  reason: string;
  message: string;
}

/**
 * Executes call hangup acknowledgment.
 */
export async function executeEndCall(params: { reason: string }): Promise<EndCallResult> {
  const { reason } = params;
  console.log(`[PHONE HANGUP] Auto-hangup triggered with reason: "${reason}"`);
  return {
    status: "call_ending",
    reason,
    message: "Call disconnection initiated."
  };
}
