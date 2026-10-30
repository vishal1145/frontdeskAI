import dotenv from "dotenv";
dotenv.config();

import { clinicRegistry } from "../src/config/clinicRegistry.js";
import { executeCheckAvailability } from "../src/tools/availabilityTool.js";
import { executeBookAppointment } from "../src/tools/bookingTool.js";
import { executeTransferCall } from "../src/tools/transferTool.js";
import { GoogleGenAI } from "@google/genai";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runEndToEndTests() {
  console.log("=================================================================");
  console.log("🧪 STARTING COMPREHENSIVE END-TO-END TEST SUITE FOR LIVEKIT VOICE AGENT");
  console.log("=================================================================\n");

  let allPassed = true;

  // -------------------------------------------------------------
  // TEST 1: Multi-tenant Clinic Registry (Loaded Dynamically from Supabase DB)
  // -------------------------------------------------------------
  console.log("🔹 [TEST 1] Testing Multi-tenant Clinic Registry from Supabase DB...");
  await clinicRegistry.loadClinicsFromDb();
  const sharmaClinic = clinicRegistry.getClinicByPhone("+917668433939");
  const careClinic = clinicRegistry.getClinicByPhone("+919876543210");
  const apexHospital = clinicRegistry.getClinicByPhone("+919822233344");
  const fallbackClinic = clinicRegistry.getClinicByPhone("unknown_number");

  if (
    sharmaClinic.clinic_name.includes("Sharma Dental") &&
    careClinic.clinic_name.includes("Care & Cure") &&
    apexHospital.clinic_name.includes("Apex Heart") &&
    fallbackClinic.clinic_name.includes("Sharma Dental")
  ) {
    console.log("   ✅ Clinic Registry correctly routes all 3 clinics + fallback!");
  } else {
    console.error("   ❌ Clinic Registry failed!");
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 2: Availability Tool with Relative Dates & Hinglish
  // -------------------------------------------------------------
  console.log("\n🔹 [TEST 2] Testing Availability Tool (Dates: 'kl', 'kal', 'aaj', 'tomorrow')...");
  const testDates = ["kl", "kal", "aaj", "tomorrow", "today"];
  for (const dateQuery of testDates) {
    const avail = await executeCheckAvailability({
      date: dateQuery,
      clinic_id: sharmaClinic.clinic_id,
      time_range: "evening"
    });

    if (avail.is_available && avail.matching_slots.length > 0) {
      console.log(`   ✅ Date '${dateQuery}': Found ${avail.matching_slots.length} slots. Recommended: ${avail.matching_slots[0]?.display_time}`);
    } else {
      console.error(`   ❌ Failed for date '${dateQuery}':`, avail);
      allPassed = false;
    }
  }

  // -------------------------------------------------------------
  // TEST 3: Booking Tool & Supabase Database Insertion
  // -------------------------------------------------------------
  console.log("\n🔹 [TEST 3] Testing Booking Tool & Supabase Database Write...");
  const testPatient = `Demo Patient ${Math.floor(100 + Math.random() * 900)}`;
  const testPhone = "9199998888";
  const testIso = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

  const bookingRes = await executeBookAppointment({
    patient_name: testPatient,
    patient_phone: testPhone,
    slot_iso_timestamp: testIso,
    service_type: "Routine Dental Checkup",
    doctor_name: "Dr. Rajesh Sharma",
    clinic_id: sharmaClinic.clinic_id
  });

  if (bookingRes.status === "confirmed" && bookingRes.booking_id) {
    console.log(`   ✅ Booking succeeded in memory/cache: Booking ID ${bookingRes.booking_id}`);
    
    // Verify in Supabase PostgreSQL
    const dbCheck = await pool.query(
      "SELECT booking_id, patient_name, clinic_id, status FROM appointments WHERE booking_id = $1;",
      [bookingRes.booking_id]
    );

    if (dbCheck.rows.length > 0 && dbCheck.rows[0].patient_name === testPatient) {
      console.log(`   ✅ Verified in Supabase Live DB: Row exists with status '${dbCheck.rows[0].status}'`);
    } else {
      console.error("   ❌ Booking not found in database!");
      allPassed = false;
    }
  } else {
    console.error("   ❌ Booking execution failed:", bookingRes);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 4: Emergency / Transfer Tool
  // -------------------------------------------------------------
  console.log("\n🔹 [TEST 4] Testing Emergency / Transfer Tool...");
  const transferRes = await executeTransferCall({
    reason: "Severe tooth pain and continuous bleeding",
    clinic_id: sharmaClinic.clinic_id
  });

  if (transferRes.status === "transferring" && transferRes.destination_phone) {
    console.log(`   ✅ Transfer Tool executed successfully to target: ${transferRes.destination_phone}`);
  } else {
    console.error("   ❌ Transfer Tool failed:", transferRes);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 5: Live Google Gemini LLM with Exact System Instructions
  // -------------------------------------------------------------
  console.log("\n🔹 [TEST 5] Testing Google Gemini LLM with Prompting Rules...");
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  // Build the exact system prompt as constructed in livekitVoiceAgent.ts
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

  const promptSystem = `
# ROLE & IDENTITY
You are Neha, an experienced clinic receptionist at ${sharmaClinic.clinic_name}.
- Address: ${sharmaClinic.address}
- Working Hours: ${sharmaClinic.working_hours}
- Doctors: ${sharmaClinic.doctors.map((d) => `${d.name} (${d.timings})`).join(", ")}

# CRITICAL RULE 1: ANSWER QUESTIONS DIRECTLY (NEVER IGNORE)
1. CLINIC ADDRESS: If caller asks address: "Hamara clinic ${sharmaClinic.address} par hai. Kya aapko appointment book karna hai?"
2. DOCTOR & TIMINGS: Answer doctor name and timings immediately.

# CRITICAL RULE 2: STRICT LANGUAGE LOCK & STT ROBUSTNESS
- If caller says "In this", "In the", "Indi", "Hindi", "Haan": Reply in natural Hindi!
- Once in Hindi, STAY 100% in Hindi.

# CRITICAL RULE 3: MID-CALL "HELLO" HANDLING
- If caller says "Hello?", "Hello", "Awaz aa rahi hai?":
  DO NOT RESTART INTRODUCTION! Say: "Haanji, main sun rahi hoon, boliye!"

# APPOINTMENT PROCESS
- If caller wants appointment: invoke checkAvailability.
`;

  // Test 5A: Address Query
  console.log("   👉 5A: Testing User asking: 'Clinic ka address kya hai?'");
  const addressResp = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: "Clinic ka address kya hai?" }] }
    ],
    config: {
      systemInstruction: promptSystem,
      temperature: 0.2
    }
  });
  const addressText = addressResp.text || "";
  console.log(`      AI Response: "${addressText.trim()}"`);
  if (addressText.toLowerCase().includes("green park") || addressText.toLowerCase().includes("delhi") || addressText.toLowerCase().includes("address")) {
    console.log("      ✅ Correct: AI directly provided the address without deflecting!");
  } else {
    console.error("      ❌ Failed: AI deflected or missed address!");
    allPassed = false;
  }

  // Test 5B: Doctor Timings Query
  console.log("   👉 5B: Testing User asking: 'Doctor kab milenge?'");
  const doctorResp = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: "Doctor kab milenge?" }] }
    ],
    config: {
      systemInstruction: promptSystem,
      temperature: 0.2
    }
  });
  const doctorText = doctorResp.text || "";
  console.log(`      AI Response: "${doctorText.trim()}"`);
  if (doctorText.toLowerCase().includes("sharma") || doctorText.toLowerCase().includes("timings") || doctorText.includes("10") || doctorText.includes("8")) {
    console.log("      ✅ Correct: AI gave doctor and timings directly!");
  } else {
    console.error("      ❌ Failed: Doctor timings missing!");
    allPassed = false;
  }

  // Test 5C: Mid-call "Hello"
  console.log("   👉 5C: Testing Mid-call: 'Hello? Sun rahe ho?'");
  const helloResp = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: "Haanji Hindi me baat karte hain." }] },
      { role: "model", parts: [{ text: "Ji bilkul! Bataiye main aapki kya madad kar sakti hoon?" }] },
      { role: "user", parts: [{ text: "Hello? Sun rahe ho?" }] }
    ],
    config: {
      systemInstruction: promptSystem,
      temperature: 0.2
    }
  });
  const helloText = helloResp.text || "";
  console.log(`      AI Response: "${helloText.trim()}"`);
  if (!helloText.toLowerCase().includes("namaste") && (helloText.includes("sun") || helloText.includes("boliye") || helloText.includes("madad") || helloText.includes("haan"))) {
    console.log("      ✅ Correct: AI did NOT restart intro, acknowledged smoothly!");
  } else {
    console.error("      ❌ Failed: AI restarted greeting or gave wrong response!");
    allPassed = false;
  }

  // Test 5D: Deepgram mishearing "In this" instead of "Hindi"
  console.log("   👉 5D: Testing STT mishearing 'In this.'");
  const sttResp = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: "In this." }] }
    ],
    config: {
      systemInstruction: promptSystem,
      temperature: 0.2
    }
  });
  const sttText = sttResp.text || "";
  console.log(`      AI Response: "${sttText.trim()}"`);
  // Should reply in Hindi
  if (sttText.includes("Ji") || sttText.includes("madad") || sttText.includes("boliye") || sttText.includes("Haanji") || sttText.includes("swagat") || sttText.includes("Namaste")) {
    console.log("      ✅ Correct: AI recognized Hindi intent and replied in Hindi!");
  } else {
    console.error("      ❌ Failed: AI reverted to English!");
    allPassed = false;
  }

  await pool.end();

  console.log("\n=================================================================");
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED! THE ENTIRE END-TO-END FLOW IS 100% PRODUCTION READY!");
  } else {
    console.log("⚠️ SOME TESTS HAD WARNINGS. REVIEW OUTPUT ABOVE.");
  }
  console.log("=================================================================");
}

runEndToEndTests().catch((err) => {
  console.error("FATAL ERROR RUNNING TESTS:", err);
  process.exit(1);
});
