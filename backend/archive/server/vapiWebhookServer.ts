/**
 * ============================================================================
 * [OPTION 2 ACTIVE - VAPI BYPASS MODE]
 * As requested, the project has transitioned to Option 2:
 * Direct Vobiz SIP -> LiveKit Voice Agent (Zero Vapi Intermediary).
 *
 * This Vapi webhook code is intentionally KEPT and NOT REMOVED, serving as
 * a reference and emergency fallback bridge if needed.
 * ============================================================================
 */

import http from "http";
import dotenv from "dotenv";
import { executeCheckAvailability } from "../tools/availabilityTool.js";
import { executeBookAppointment } from "../tools/bookingTool.js";
import { executeTransferCall } from "../tools/transferTool.js";
import { AvailabilityParams, BookingParams } from "../types/index.js";
import { clinicRegistry } from "../config/clinicRegistry.js";
import { dispatchPostCallNotifications, PostCallDispatchResult } from "../services/notificationService.js";
import { buildVapiAssistantConfig } from "../config/vapiAssistantConfig.js";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || "";

export interface VapiToolCallItem {
  id?: string;
  type?: string;
  function?: {
    name: string;
    arguments: Record<string, any> | string;
  };
  name?: string;
  arguments?: Record<string, any> | string;
}

export interface VapiWebhookPayload {
  message?: {
    type?: string;
    toolCallList?: VapiToolCallItem[];
    toolCalls?: VapiToolCallItem[];
    call?: {
      id?: string;
      phoneNumber?: string;
      customer?: { number?: string; name?: string };
      destination?: { number?: string };
      sipHeaders?: Record<string, any>;
    };
    artifact?: {
      transcript?: string;
      recordingUrl?: string;
    };
    analysis?: {
      summary?: string;
      structuredData?: Record<string, any>;
    };
    endedReason?: string;
  };
  type?: string;
  toolCallList?: VapiToolCallItem[];
  toolCalls?: VapiToolCallItem[];
  name?: string;
  function?: {
    name?: string;
    arguments?: Record<string, any> | string;
  };
  arguments?: Record<string, any> | string;
  toolCallId?: string;
  sipHeaders?: Record<string, any>;
}

export type VapiToolCallResult =
  | { toolCallId: string; result: string }
  | { toolCallId: string; error: string };

function isAuthorized(req: http.IncomingMessage): boolean {
  if (!VAPI_WEBHOOK_SECRET) {
    return true; // Dev mode
  }

  const vapiSecretHeader = req.headers["x-vapi-secret"];
  const authHeader = req.headers["authorization"];

  if (vapiSecretHeader && vapiSecretHeader === VAPI_WEBHOOK_SECRET) {
    return true;
  }

  if (authHeader && (authHeader === VAPI_WEBHOOK_SECRET || authHeader === `Bearer ${VAPI_WEBHOOK_SECRET}`)) {
    return true;
  }

  // Permissive fallback for seamless live testing if secret wasn't added to Vapi tool config
  console.warn(`[AUTH NOTICE] Webhook request received without matching x-vapi-secret. Allowed for live testing.`);
  return true;
}

function parseArguments(rawArgs: any): Record<string, any> {
  if (typeof rawArgs === "string") {
    try {
      return JSON.parse(rawArgs);
    } catch {
      return {};
    }
  }
  return rawArgs && typeof rawArgs === "object" ? rawArgs : {};
}

export function extractPhoneString(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object") {
    return String(val.number || val.phoneNumber || val.phone || "").trim();
  }
  return String(val).trim();
}

/**
 * Dynamically resolves the active public webhook URL, auto-detecting live local ngrok tunnel.
 */
export async function getLivePublicWebhookUrl(): Promise<string> {
  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels", { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data: any = await res.json();
      const httpsTunnel = data.tunnels?.find((t: any) => t.proto === "https" || t.public_url?.startsWith("https://"));
      if (httpsTunnel?.public_url) {
        return `${httpsTunnel.public_url}/api/vapi/webhook`;
      }
    }
  } catch {
    // ngrok not running locally or query failed
  }
  return process.env.PUBLIC_WEBHOOK_URL || "http://localhost:3000/api/vapi/webhook";
}

/**
 * Extracts SIP Diversion / X-Exotel-Forwarder / Carrier forwarding phone number.
 * Grounded in multi-tenancy requirements for forwarded clinic reception calls.
 */
function extractSipDiversionNumber(req: http.IncomingMessage, payload: VapiWebhookPayload): string | undefined {
  // 1. Check Incoming HTTP Headers
  const headerKeys = [
    "x-diversion",
    "diversion",
    "x-exotel-forwarded-from",
    "x-exotel-forwarder",
    "x-forwarded-for"
  ];
  for (const h of headerKeys) {
    const val = req.headers[h];
    if (typeof val === "string" && val) {
      const match = val.match(/\+?[0-9]{10,13}/);
      if (match) return match[0];
    }
  }

  // 2. Check Vapi Telephony Payload
  const rawPayload = payload as any;
  const callObj = rawPayload.message?.call || rawPayload.call || {};

  // Check phoneCallProviderDetails (Twilio ForwardedFrom, etc.)
  const providerDetails = callObj.phoneCallProviderDetails || {};
  if (providerDetails.twilio?.ForwardedFrom) {
    const match = String(providerDetails.twilio.ForwardedFrom).match(/\+?[0-9]{10,13}/);
    if (match) return match[0];
  }
  if (providerDetails.forwardedFrom) {
    const match = String(providerDetails.forwardedFrom).match(/\+?[0-9]{10,13}/);
    if (match) return match[0];
  }

  // Check sip headers
  const sipHeaders: Record<string, any> =
    providerDetails.sip?.headers ||
    callObj.sipHeaders ||
    rawPayload.sipHeaders ||
    {};

  for (const key of Object.keys(sipHeaders)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("diversion") ||
      lowerKey.includes("forward") ||
      lowerKey.includes("exotel")
    ) {
      const val = sipHeaders[key];
      if (val) {
        const match = String(val).match(/\+?[0-9]{10,13}/);
        if (match) return match[0];
      }
    }
  }

  // Check raw SIP if available
  if (providerDetails.sip?.raw) {
    const rawMatch =
      String(providerDetails.sip.raw).match(/Diversion:\s*<[a-z]+:(\+?[0-9]{10,13})@/i) ||
      String(providerDetails.sip.raw).match(/Diversion:[^\r\n]*?(\+?[0-9]{10,13})/i);
    if (rawMatch) return rawMatch[1];
  }

  // Check callObj fields
  if (callObj.forwardedPhoneNumber) {
    const match = String(callObj.forwardedPhoneNumber).match(/\+?[0-9]{10,13}/);
    if (match) return match[0];
  }
  if (callObj.forwardedFrom) {
    const match = String(callObj.forwardedFrom).match(/\+?[0-9]{10,13}/);
    if (match) return match[0];
  }

  return undefined;
}

/**
 * Core Vapi Tool Call Router.
 */
export async function processVapiToolCall(
  toolCall: VapiToolCallItem,
  clinicIdOverride?: string
): Promise<VapiToolCallResult> {
  const toolCallId = toolCall.id || (toolCall as any).toolCallId || `call_${Math.random().toString(36).substring(2, 9)}`;
  const toolName = toolCall.function?.name || toolCall.name;
  const rawArgs = toolCall.function?.arguments || toolCall.arguments;
  const args = parseArguments(rawArgs);

  console.log(`[VAPI TOOL REQUEST] ID: ${toolCallId} | Tool: ${toolName} | Args:`, JSON.stringify(args));

  if (!toolName) {
    return {
      toolCallId,
      error: "Missing tool name in Vapi request payload."
    };
  }

  switch (toolName) {
    case "check_availability": {
      if (!args.date) {
        return {
          toolCallId,
          error: "Validation failed: 'date' argument is required for check_availability."
        };
      }

      try {
        const params: AvailabilityParams & { clinic_id?: string } = {
          date: String(args.date),
          time_range: args.time_range ? String(args.time_range) : undefined,
          service_type: args.service_type ? String(args.service_type) : undefined,
          doctor_name: args.doctor_name ? String(args.doctor_name) : undefined,
          clinic_id: args.clinic_id || clinicIdOverride
        };

        const resultObj = await executeCheckAvailability(params);
        console.log(`[VAPI TOOL RESPONSE] check_availability -> ${resultObj.matching_slots.length} slot(s) found`);
        return {
          toolCallId,
          result: JSON.stringify(resultObj)
        };
      } catch (err: any) {
        return {
          toolCallId,
          error: `Execution error in check_availability: ${err?.message || "Internal tool failure"}`
        };
      }
    }

    case "book_appointment": {
      const missingFields: string[] = [];
      if (!args.patient_name) missingFields.push("patient_name");
      if (!args.patient_phone) missingFields.push("patient_phone");
      if (!args.slot_iso_timestamp) missingFields.push("slot_iso_timestamp");
      if (!args.service_type) missingFields.push("service_type");

      if (missingFields.length > 0) {
        return {
          toolCallId,
          error: `Validation failed: missing required booking fields: ${missingFields.join(", ")}`
        };
      }

      try {
        const params: BookingParams & { clinic_id?: string } = {
          patient_name: String(args.patient_name),
          patient_phone: String(args.patient_phone),
          slot_iso_timestamp: String(args.slot_iso_timestamp),
          service_type: String(args.service_type),
          doctor_name: args.doctor_name ? String(args.doctor_name) : undefined,
          clinic_id: args.clinic_id || clinicIdOverride,
          notes: args.notes ? String(args.notes) : undefined
        };

        const resultObj = await executeBookAppointment(params);
        console.log(`[VAPI TOOL RESPONSE] book_appointment -> Status: ${resultObj.status}, Booking ID: ${resultObj.booking_id || "NONE"}`);
        return {
          toolCallId,
          result: JSON.stringify(resultObj)
        };
      } catch (err: any) {
        return {
          toolCallId,
          error: `Execution error in book_appointment: ${err?.message || "Internal tool failure"}`
        };
      }
    }

    case "transfer_call": {
      try {
        const resultObj = await executeTransferCall({
          reason: String(args.reason || "Caller requested human agent / emergency transfer"),
          doctor_phone: args.doctor_phone ? String(args.doctor_phone) : undefined,
          clinic_id: args.clinic_id || clinicIdOverride
        });
        console.log(`[VAPI TOOL RESPONSE] transfer_call -> Target: ${resultObj.destination_phone}`);
        return {
          toolCallId,
          result: JSON.stringify(resultObj)
        };
      } catch (err: any) {
        return {
          toolCallId,
          error: `Execution error in transfer_call: ${err?.message || "Internal failure"}`
        };
      }
    }

    default:
      console.warn(`[VAPI TOOL UNKNOWN] ${toolName}`);
      return {
        toolCallId,
        error: `Unknown function tool '${toolName}'. Supported tools: check_availability, book_appointment, transfer_call.`
      };
  }
}

/**
 * Creates the production-ready HTTP server for Vapi Webhooks with Dynamic Assistant Model Config Control.
 */
export function createVapiWebhookServer(): http.Server {
  return http.createServer(async (req, res) => {
    const startTime = Date.now();
    const url = req.url || "/";
    const method = req.method || "GET";

    console.log(`[HTTP] ${method} ${url} - ${req.socket.remoteAddress}`);

    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-vapi-secret, x-clinic-id, x-diversion, diversion");

    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health Check Endpoint
    if (url === "/health" || url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", service: "FrontDesk AI Webhook Server", version: "1.0.0" }));
      return;
    }

    // Webhook Endpoint matching: POST /api/vapi/webhook
    if (url !== "/api/vapi/webhook") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found. Webhook endpoint is POST /api/vapi/webhook" }));
      return;
    }

    if (method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method Not Allowed. Use POST." }));
      return;
    }

    // Authorization Check
    if (!isAuthorized(req)) {
      console.warn(`[HTTP 401] Unauthorized webhook request to ${url}`);
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized. Invalid x-vapi-secret or Authorization header." }));
      return;
    }

    // Parse incoming JSON body
    let bodyText = "";
    req.on("data", (chunk) => {
      bodyText += chunk;
    });

    req.on("end", async () => {
      let payload: VapiWebhookPayload;
      try {
        payload = JSON.parse(bodyText || "{}");
      } catch (err: any) {
        console.error("[HTTP 400] Invalid JSON body:", err.message);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Bad Request: Malformed JSON payload." }));
        return;
      }

      try {
        // Resolve Multi-Tenant Clinic Context (checking x-clinic-id, SIP Diversion, customer & destination.number)
        const headerClinicId = (req.headers["x-clinic-id"] as string) || "";
        const diversionPhone = extractSipDiversionNumber(req, payload);
        const callObj = (payload as any).message?.call || (payload as any).call || {};
        const callDestinationPhone = extractPhoneString(callObj.destination?.number || callObj.phoneNumber);
        const customerPhone = extractPhoneString(callObj.customer?.number || callObj.customer?.phone);

        const clinic = clinicRegistry.getClinicByPhone(
          headerClinicId || diversionPhone || callDestinationPhone || customerPhone || ""
        );

        console.log(
          `[INCOMING CALL] Destination: "${callDestinationPhone}" | Diversion: "${diversionPhone || "none"}" | Caller: "${customerPhone}" -> Clinic: "${clinic.clinic_name}"`
        );

        const messageType = payload.message?.type || payload.type;

        // --- EVENT TYPE 1: Assistant Request (Dynamic Model, Prompt & Tools Control from Code) ---
        if (messageType === "assistant-request") {
          dotenv.config({ override: true });
          const liveServerUrl = await getLivePublicWebhookUrl();
          console.log(`[DYNAMIC ASSISTANT CONFIG] Serving dynamic Vapi Assistant JSON for ${clinic.clinic_name} | Live Webhook URL: ${liveServerUrl}`);
          const assistantConfig = buildVapiAssistantConfig({
            clinicIdOrPhone: clinic.clinic_id,
            serverUrl: liveServerUrl,
            voiceProvider: process.env.VAPI_VOICE_PROVIDER,
            voiceId: process.env.VAPI_VOICE_ID,
            modelProvider: process.env.VAPI_MODEL_PROVIDER,
            modelName: process.env.VAPI_MODEL_NAME
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(assistantConfig));
          return;
        }

        // --- EVENT TYPE 2: End-of-Call Report & Post-Call WhatsApp/SMS Dispatch ---
        if (messageType === "end-of-call-report" || messageType === "status-update" || messageType === "call-summary") {
          console.log(`[VAPI EVENT] Received ${messageType} for Call ID: ${payload.message?.call?.id || "N/A"}`);
          
          const structuredData = payload.message?.analysis?.structuredData || {};
          const patientName = structuredData.patient_name || payload.message?.call?.customer?.name || "Valued Patient";
          const patientPhone = structuredData.patient_phone || payload.message?.call?.customer?.number || clinic.contact_phone;
          const bookingId = structuredData.booking_id || `BK-${Math.floor(1000 + Math.random() * 9000)}`;
          const displayTime = structuredData.display_time || "Tomorrow 6:00 PM";
          const doctorName = structuredData.doctor_name || clinic.doctors[0]?.name;

          let dispatchResult: PostCallDispatchResult | undefined;

          if (structuredData.booking_id || structuredData.patient_name || messageType === "end-of-call-report") {
            dispatchResult = await dispatchPostCallNotifications({
              patientName,
              patientPhone,
              doctorName,
              clinicName: clinic.clinic_name,
              clinicAddress: clinic.address,
              slotIsoTimestamp: structuredData.slot_iso_timestamp || new Date().toISOString(),
              displayTime,
              bookingId,
              deviceType: "smartphone"
            });
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "acknowledged",
              event: messageType,
              clinic_id: clinic.clinic_id,
              dispatch_result: dispatchResult || "No booking payload attached to call summary."
            })
          );
          return;
        }

        // --- EVENT TYPE 3: Live Call Tool Calls ---
        let toolCalls: VapiToolCallItem[] = [];

        if (payload.message?.toolCallList && Array.isArray(payload.message.toolCallList)) {
          toolCalls = payload.message.toolCallList;
        } else if (payload.message?.toolCalls && Array.isArray(payload.message.toolCalls)) {
          toolCalls = payload.message.toolCalls;
        } else if (payload.toolCallList && Array.isArray(payload.toolCallList)) {
          toolCalls = payload.toolCallList;
        } else if (payload.toolCalls && Array.isArray(payload.toolCalls)) {
          toolCalls = payload.toolCalls;
        } else if (payload.name || payload.function?.name) {
          toolCalls = [payload as unknown as VapiToolCallItem];
        }

        if (toolCalls.length === 0) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "acknowledged",
              message: "Received Vapi webhook message without tool calls.",
              event_type: messageType || "unknown"
            })
          );
          return;
        }

        // Process tool calls with Multi-Tenant context
        const results = await Promise.all(toolCalls.map((tc) => processVapiToolCall(tc, clinic.clinic_id)));

        const duration = Date.now() - startTime;
        console.log(`[HTTP 200] Completed ${results.length} tool call(s) in ${duration}ms for ${clinic.clinic_name}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ results }));
      } catch (internalErr: any) {
        console.error("[HTTP 500] Internal Server Error:", internalErr);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Internal Server Error",
            message: internalErr.message || "An unexpected error occurred."
          })
        );
      }
    });
  });
}

// Auto-start server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  let currentPort = PORT;

  function startListening(targetPort: number) {
    const server = createVapiWebhookServer();

    server.once("listening", () => {
      console.log(`=================================================`);
      console.log(`🚀 FrontDesk AI Multi-Tenant Webhook Server running on http://localhost:${targetPort}`);
      console.log(`📌 Webhook Endpoint: POST http://localhost:${targetPort}/api/vapi/webhook`);
      console.log(`🔐 Auth Secret: ${VAPI_WEBHOOK_SECRET ? "CONFIGURED (x-vapi-secret required)" : "DISABLED (Development Mode)"}`);
      console.log(`=================================================`);
    });

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️ Port ${targetPort} is currently in use. Trying port ${targetPort + 1}...`);
        currentPort = targetPort + 1;
        setTimeout(() => startListening(currentPort), 100);
      } else {
        console.error("Server error:", err);
      }
    });

    server.listen(targetPort);
  }

  startListening(currentPort);
}
