/**
 * ============================================================================
 * [OPTION 2 ACTIVE - VAPI BYPASS MODE]
 * As requested, the project has transitioned to Option 2:
 * Direct Vobiz SIP -> LiveKit Voice Agent (Zero Vapi Intermediary).
 *
 * This assistant configuration is preserved and retained as backup as requested.
 * ============================================================================
 */

import { clinicRegistry, ClinicRegistration } from "./clinicRegistry.js";
import { checkAvailabilityDeclaration } from "../tools/availabilityTool.js";
import { bookAppointmentDeclaration } from "../tools/bookingTool.js";
import { transferCallDeclaration } from "../tools/transferTool.js";

export interface VapiAssistantConfigOptions {
  clinicIdOrPhone?: string;
  serverUrl?: string;
  modelProvider?: string; // "google" | "openai" | "groq"
  modelName?: string;     // "gemini-2.5-flash" | "gpt-4o-mini"
  voiceProvider?: string; // "azure" | "cartesia" | "11labs"
  voiceId?: string;       // "hi-IN-SwaraNeural" | "21m00Tcm4TlvDq8ikWAM"
}

/**
 * Dynamically builds an ultra-realistic, low-latency Vapi Voice Receptionist configuration.
 * Configured for natural Indian Hindi/Hinglish & English telephony.
 */
export function buildVapiAssistantConfig(options: VapiAssistantConfigOptions = {}): Record<string, any> {
  const {
    clinicIdOrPhone,
    serverUrl = process.env.PUBLIC_WEBHOOK_URL || "http://localhost:3000/api/vapi/webhook",
    modelProvider = process.env.VAPI_MODEL_PROVIDER || "google",
    modelName = process.env.VAPI_MODEL_NAME || "gemini-2.5-flash",
    voiceProvider = process.env.VAPI_VOICE_PROVIDER || "azure",
    voiceId = process.env.VAPI_VOICE_ID || "hi-IN-SwaraNeural"
  } = options;

  // Resolve Multi-Tenant Clinic
  const clinic: ClinicRegistration = clinicRegistry.getClinicByPhone(clinicIdOrPhone || "");

  // Real-time clock formatted for Indian Standard Time
  const now = new Date();
  const dateString = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata"
  });
  const timeString = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });

  const receptionistName = clinic.receptionist_name || "Neha";

  // Masterpiece Human Receptionist System Prompt
  const systemPrompt = `
# ROLE & IDENTITY
You are ${receptionistName}, an experienced, warm, and highly professional clinic receptionist at ${clinic.clinic_name}.
You are speaking directly with patients on a live telephone call.

# REAL-TIME CONTEXT
- Current Date & Time: ${dateString}, ${timeString} (IST, Asia/Kolkata)
- Today ISO Date: ${now.toISOString().split("T")[0]}
- Clinic Name: ${clinic.clinic_name}
- Address: ${clinic.address}
- Working Hours: ${clinic.working_hours}
- Contact Phone: ${clinic.contact_phone}
- Available Doctors:
${clinic.doctors.map((d) => `  * ${d.name} (${d.specialties.join(", ")}) - Timings: ${d.timings}`).join("\n")}
- Services Provided:
${clinic.services.map((s) => `  * ${s}`).join("\n")}

# VOCAL DELIVERY & CONVERSATIONAL STYLE (CRITICAL FOR LIVE CALLS)
1. SOUND COMPLETELY HUMAN: Be warm, friendly, polite, empathetic, and attentive. Speak just like a real person sitting at the clinic reception desk.
2. ULTRA-CONCISE RESPONSES: Keep every response short and conversational (1 to 2 sentences max, 10 to 25 words). NEVER speak in long paragraphs, bullet points, asterisks, or markdown.
3. NATURAL INDIAN CONVERSATIONAL PHRASING:
   - In Hindi/Hinglish, use natural expressions: "Ji bilkul", "Haanji", "Zaroor", "Aap bilkul chinta mat kijiye", "Main abhi check karti hoon".
   - In English, use warm phrases: "Sure, let me check that for you right away", "Certainly! I'd be happy to help."
4. ZERO-FRICTION LANGUAGE MATCHING:
   - NEVER ask "Aap Hindi me baat karenge ya English me?". That sounds like a robot.
   - If the caller speaks Hindi or Hinglish, speak back warmly in natural Hindi/Hinglish.
   - If the caller speaks English, smoothly speak back in fluent, polite English.
   - Match the caller's language naturally and instantly.

# APPOINTMENT BOOKING PROCESS
1. When caller wants an appointment or asks when doctor is free, ask their preferred date and time:
   "Ji, aap kis din aur time par aana chahenge?"
2. IMMEDIATELY call the 'check_availability' tool to find open slots.
3. Offer the open slot concisely:
   "Ji, kal shaam 6 baje ka slot khali hai. Kya main ise confirm kar doon?"
4. If they agree, ask for their name and phone number if not already known.
5. Call 'book_appointment' tool to finalize.
6. Once the tool returns success, confirm warmly:
   "Aapka appointment confirm ho gaya hai. Hum aapko WhatsApp aur SMS par confirmation bhej rahe hain. Thank you!"

# MEDICAL SAFETY
- You are a receptionist, NOT a doctor. Never prescribe medicines or give medical diagnosis.
- If caller asks for medicine:
  "Main dawa suggest nahi kar sakti, par main doctor se appointment fix kar sakti hoon."

# EMERGENCY & HUMAN TRANSFER
- If caller describes an emergency (severe chest pain, heavy bleeding, loss of consciousness) or insists on speaking with a doctor or human, call 'transfer_call' tool immediately.
`;

  // Natural, welcoming human greeting (No robotic slashes or language menus)
  const firstMessage = `Namaste! ${clinic.clinic_name} me aapka swagat hai, main clinic reception se ${receptionistName} bol rahi hoon. Bataiye, main aapki kya madad kar sakti hoon?`;

  // Dynamic inline tools wired directly to this server's public webhook URL
  const dynamicTools = [
    {
      type: "function",
      function: {
        name: "check_availability",
        description: "Checks clinic appointment slot availability for a given date, time range, doctor, or service.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Target date in YYYY-MM-DD format or relative words like 'today', 'tomorrow', '2026-10-18'."
            },
            time_range: {
              type: "string",
              description: "Preferred time range, e.g. 'morning', 'afternoon', 'evening', 'around 6 PM'."
            },
            service_type: {
              type: "string",
              description: "Reason for visit or service type, e.g. 'General Checkup', 'Dental Checkup'."
            },
            doctor_name: {
              type: "string",
              description: "Optional doctor name requested by caller."
            }
          },
          required: ["date"]
        }
      },
      server: {
        url: serverUrl
      }
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Books a confirmed appointment when the caller confirms their name, phone, slot ISO timestamp, and service.",
        parameters: {
          type: "object",
          properties: {
            patient_name: {
              type: "string",
              description: "Full name of the patient."
            },
            patient_phone: {
              type: "string",
              description: "10-digit phone number of the patient."
            },
            slot_iso_timestamp: {
              type: "string",
              description: "Exact ISO timestamp of confirmed slot, e.g. '2026-10-18T18:00:00+05:30'."
            },
            service_type: {
              type: "string",
              description: "Reason for visit or treatment."
            },
            doctor_name: {
              type: "string",
              description: "Doctor assigned for the visit."
            }
          },
          required: ["patient_name", "patient_phone", "slot_iso_timestamp", "service_type"]
        }
      },
      server: {
        url: serverUrl
      }
    },
    {
      type: "function",
      function: {
        name: "transfer_call",
        description: "Transfers the call to clinic human receptionist or doctor in case of emergency or direct human request.",
        parameters: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              description: "Reason for transfer."
            }
          },
          required: ["reason"]
        }
      },
      server: {
        url: serverUrl
      }
    }
  ];

  // Configure high-definition natural human voice
  let voiceConfig: Record<string, any>;
  if (voiceProvider === "11labs") {
    voiceConfig = {
      provider: "11labs",
      voiceId: voiceId || "21m00Tcm4TlvDq8ikWAM",
      model: "eleven_turbo_v2_5",
      stability: 0.5,
      similarityBoost: 0.8
    };
  } else if (voiceProvider === "cartesia") {
    voiceConfig = {
      provider: "cartesia",
      voiceId: voiceId || "f114a46a-760a-4247-a877-544e05f6d6e0",
      model: "sonic-multilingual"
    };
  } else if (voiceProvider === "google") {
    voiceConfig = {
      provider: "google",
      voiceId: voiceId || "hi-IN-Neural2-A"
    };
  } else {
    // Default: Azure hi-IN-SwaraNeural (Award-winning natural Indian Hindi/English female voice)
    voiceConfig = {
      provider: "azure",
      voiceId: voiceId || "hi-IN-SwaraNeural"
    };
  }

  const assistantDefinition = {
    name: `FrontDesk AI - ${clinic.clinic_name}`,
    firstMessage,
    firstMessageMode: "assistant-speaks-first",
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 1800,
    backgroundDenoisingEnabled: true,
    serverUrl,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || undefined,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "multi",
      smartFormat: true,
      endpointing: 250 // Ultra-fast 250ms silence detection for snappy human turn-taking
    },
    model: {
      provider: modelProvider,
      model: modelName,
      temperature: 0.3,
      maxTokens: 150, // Ultra-fast concise responses
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      tools: dynamicTools
    },
    voice: voiceConfig
  };

  return {
    assistant: assistantDefinition,
    assistantOverrides: assistantDefinition
  };
}
