import { createVapiWebhookServer } from "../src/server/vapiWebhookServer.js";
import http from "http";
import { slotLockManager } from "../src/services/slotLockManager.js";

const TEST_PORT = 3098;

function makePostRequest(
  url: string,
  body: object,
  headers: Record<string, string> = {}
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const parsedUrl = new URL(url);

    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          ...headers
        }
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(responseBody);
            resolve({ statusCode: res.statusCode || 500, data });
          } catch {
            resolve({ statusCode: res.statusCode || 500, data: responseBody });
          }
        });
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function runWebhookTests() {
  console.log("=================================================");
  console.log("  Vapi Webhook Full Compatibility & Test Suite");
  console.log("=================================================\n");

  slotLockManager.resetLocks();

  const server = createVapiWebhookServer();
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));

  const targetUrl = `http://localhost:${TEST_PORT}/api/vapi/webhook`;
  const validHeaders = process.env.VAPI_WEBHOOK_SECRET
    ? { "x-vapi-secret": process.env.VAPI_WEBHOOK_SECRET }
    : {};

  try {
    // 1. Current Vapi toolCallList payload format & check_availability
    console.log("1️⃣ Test Current Vapi 'toolCallList' format & check_availability...");
    const toolCallListPayload = {
      message: {
        type: "tool-calls",
        toolCallList: [
          {
            id: "call_tcl_001",
            type: "function",
            function: {
              name: "check_availability",
              arguments: {
                date: "tomorrow",
                time_range: "evening",
                service_type: "General Checkup"
              }
            }
          }
        ]
      }
    };

    const res1 = await makePostRequest(targetUrl, toolCallListPayload, validHeaders);
    console.log(`   HTTP Status: ${res1.statusCode}`);
    console.log(`   Response:`, JSON.stringify(res1.data, null, 2));

    const item1 = res1.data.results?.[0];
    const isResultString1 = typeof item1?.result === "string";
    let parsedResult1 = {};
    if (isResultString1) {
      parsedResult1 = JSON.parse(item1.result);
    }

    if (
      res1.statusCode === 200 &&
      item1?.toolCallId === "call_tcl_001" &&
      isResultString1 &&
      (parsedResult1 as any).is_available === true
    ) {
      console.log("   ✅ 'toolCallList' & check_availability test PASSED! (Verified 'result' is string)\n");
    } else {
      console.error("   ❌ 'toolCallList' test FAILED!\n");
    }

    // 2. Legacy Vapi toolCalls payload format
    console.log("2️⃣ Test Legacy Vapi 'toolCalls' format & book_appointment...");
    const legacyToolCallsPayload = {
      message: {
        type: "tool-calls",
        toolCalls: [
          {
            id: "call_tc_002",
            type: "function",
            function: {
              name: "book_appointment",
              arguments: {
                patient_name: "Rahul Sharma",
                patient_phone: "9876543210",
                slot_iso_timestamp: "2026-10-02T18:00:00+05:30",
                service_type: "General Checkup"
              }
            }
          }
        ]
      }
    };

    const res2 = await makePostRequest(targetUrl, legacyToolCallsPayload, validHeaders);
    console.log(`   HTTP Status: ${res2.statusCode}`);
    console.log(`   Response:`, JSON.stringify(res2.data, null, 2));

    const item2 = res2.data.results?.[0];
    const isResultString2 = typeof item2?.result === "string";
    let parsedResult2 = {};
    if (isResultString2) {
      parsedResult2 = JSON.parse(item2.result);
    }

    if (
      res2.statusCode === 200 &&
      item2?.toolCallId === "call_tc_002" &&
      isResultString2 &&
      (parsedResult2 as any).status === "confirmed"
    ) {
      console.log("   ✅ Legacy 'toolCalls' & book_appointment test PASSED! (Verified 'result' is string)\n");
    } else {
      console.error("   ❌ Legacy 'toolCalls' test FAILED!\n");
    }

    // 3. Validation Failure (Missing required arguments)
    console.log("3️⃣ Test Argument Validation Failure (Missing booking fields)...");
    const malformedArgsPayload = {
      message: {
        type: "tool-calls",
        toolCallList: [
          {
            id: "call_err_003",
            type: "function",
            function: {
              name: "book_appointment",
              arguments: {
                patient_name: "Rahul Sharma"
              }
            }
          }
        ]
      }
    };

    const res3 = await makePostRequest(targetUrl, malformedArgsPayload, validHeaders);
    console.log(`   HTTP Status: ${res3.statusCode}`);
    console.log(`   Response:`, JSON.stringify(res3.data, null, 2));

    const item3 = res3.data.results?.[0];
    if (res3.statusCode === 200 && item3?.toolCallId === "call_err_003" && typeof item3?.error === "string") {
      console.log("   ✅ Validation Failure test PASSED!\n");
    } else {
      console.error("   ❌ Validation Failure test FAILED!\n");
    }

    // 4. End-of-Call Report & WhatsApp/SMS Dispatch Test
    console.log("4️⃣ Test 'end-of-call-report' Event & Post-Call WhatsApp/SMS Dispatch...");
    const endOfCallPayload = {
      message: {
        type: "end-of-call-report",
        call: {
          id: "vapi_call_8899",
          phoneNumber: "+919876543210",
          customer: { number: "+919876543210", name: "Rahul Sharma" }
        },
        analysis: {
          summary: "Patient Rahul Sharma requested appointment for tomorrow evening. Slot booked for 6:00 PM.",
          structuredData: {
            booking_id: "BK-9912",
            patient_name: "Rahul Sharma",
            patient_phone: "9876543210",
            slot_iso_timestamp: "2026-10-02T18:00:00+05:30",
            display_time: "6:00 PM (Oct 2)",
            doctor_name: "Dr. Ananya Sharma"
          }
        }
      }
    };

    const res4 = await makePostRequest(targetUrl, endOfCallPayload, validHeaders);
    console.log(`   HTTP Status: ${res4.statusCode}`);
    console.log(`   Response:`, JSON.stringify(res4.data, null, 2));

    if (
      res4.statusCode === 200 &&
      res4.data.status === "acknowledged" &&
      res4.data.dispatch_result?.whatsapp?.status === "sent"
    ) {
      console.log("   ✅ 'end-of-call-report' & Post-Call WhatsApp Dispatch test PASSED!\n");
    } else {
      console.error("   ❌ End-of-call report test FAILED!\n");
    }

    // 5. Concurrency Slot Lock Collision Test over HTTP
    console.log("5️⃣ Test Concurrency Slot Lock Collision over Webhook...");
    const collisionSlot = "2026-10-15T10:00:00+05:30";

    const payloadA = {
      message: {
        type: "tool-calls",
        toolCallList: [
          {
            id: "call_col_A",
            type: "function",
            function: {
              name: "book_appointment",
              arguments: {
                patient_name: "Patient A",
                patient_phone: "9998887771",
                slot_iso_timestamp: collisionSlot,
                service_type: "Consultation"
              }
            }
          }
        ]
      }
    };

    const payloadB = {
      message: {
        type: "tool-calls",
        toolCallList: [
          {
            id: "call_col_B",
            type: "function",
            function: {
              name: "book_appointment",
              arguments: {
                patient_name: "Patient B",
                patient_phone: "9998887772",
                slot_iso_timestamp: collisionSlot,
                service_type: "Consultation"
              }
            }
          }
        ]
      }
    };

    const resA = await makePostRequest(targetUrl, payloadA, validHeaders);
    const resB = await makePostRequest(targetUrl, payloadB, validHeaders);

    const resultA = JSON.parse(resA.data.results[0].result);
    const resultB = JSON.parse(resB.data.results[0].result);

    console.log(`   Caller A Status: ${resultA.status}`);
    console.log(`   Caller B Status: ${resultB.status}`);

    if (resA.statusCode === 200 && resultA.status === "confirmed" && resultB.status === "slot_taken") {
      console.log("   ✅ Concurrency Slot Lock Collision test PASSED!\n");
    } else {
      console.error("   ❌ Concurrency Slot Lock test FAILED!\n");
    }

    // 6. Dynamic Assistant Request (Model, Prompt & Tools Control from Backend Code)
    console.log("6️⃣ Test 'assistant-request' (Dynamic Model, Prompt & Tools Control from Code)...");
    const assistantReqPayload = {
      message: {
        type: "assistant-request",
        call: {
          id: "call_asst_77",
          phoneNumber: "+919876543210"
        }
      }
    };

    const res6 = await makePostRequest(targetUrl, assistantReqPayload, validHeaders);
    console.log(`   HTTP Status: ${res6.statusCode}`);
    console.log(`   Response:`, JSON.stringify(res6.data, null, 2));

    if (
      res6.statusCode === 200 &&
      res6.data.assistant?.model?.provider === "google" &&
      res6.data.assistant?.model?.tools?.length >= 2
    ) {
      console.log("   ✅ 'assistant-request' Dynamic Model & Config Control test PASSED!\n");
    } else {
      console.error("   ❌ Dynamic Assistant Request test FAILED!\n");
    }
  } finally {
    server.close();
    console.log("=================================================");
    console.log("  All Vapi Webhook Compatibility Tests Completed!");
    console.log("=================================================");
  }
}

runWebhookTests();
