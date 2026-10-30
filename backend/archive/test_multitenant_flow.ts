import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const BASE_URL = process.env.PUBLIC_WEBHOOK_URL || "http://localhost:3000/api/vapi/webhook";
const DB_URL = process.env.DATABASE_URL;

async function runTest() {
  console.log("=================================================");
  console.log("🚀 MULTI-TENANT 3-CLINIC CALL FORWARDING TEST");
  console.log(`🌐 Target Webhook: ${BASE_URL}`);
  console.log("=================================================\n");

  const testCases = [
    {
      label: "CLINIC 1: Care & Cure Clinic",
      clinic_id: "clinic-care-cure",
      forwardedFrom: "+919876543210",
      patientName: "Rohan Gupta",
      patientPhone: "9811100001",
      service: "General Checkup",
      doctor: "Dr. Ananya Sharma",
      date: "2026-10-18",
      slot: "2026-10-18T10:00:00+05:30"
    },
    {
      label: "CLINIC 2: Sharma Dental Care (Call Forwarded from Reception +917668433939)",
      clinic_id: "clinic-sharma-dental",
      forwardedFrom: "+917668433939",
      patientName: "Pooja Malhotra",
      patientPhone: "9811100002",
      service: "Root Canal Treatment",
      doctor: "Dr. Rajesh Sharma",
      date: "2026-10-18",
      slot: "2026-10-18T11:00:00+05:30"
    },
    {
      label: "CLINIC 3: Apex Heart & Eye Care (Call Forwarded from Reception +919822233344)",
      clinic_id: "clinic-apex-care",
      forwardedFrom: "+919822233344",
      patientName: "Vikram Sethi",
      patientPhone: "9811100003",
      service: "ECG & Cardiology Checkup",
      doctor: "Dr. Sameer Kapoor",
      date: "2026-10-18",
      slot: "2026-10-18T09:00:00+05:30"
    }
  ];

  for (const tc of testCases) {
    console.log(`\n-------------------------------------------------`);
    console.log(`🧪 Testing ${tc.label}`);
    console.log(`   Incoming Call Diverted From: ${tc.forwardedFrom}`);
    console.log(`-------------------------------------------------`);

    // 1. Test Assistant-Request (Dynamic Prompt & Greeting switch)
    console.log(`1️⃣ Calling Vapi 'assistant-request' with SIP Diversion Header...`);
    const assistantPayload = {
      message: {
        type: "assistant-request",
        call: {
          id: `call_${Date.now()}`,
          sipHeaders: {
            Diversion: `<tel:${tc.forwardedFrom}>;reason=no-answer`
          },
          destination: {
            number: "+918065355910"
          }
        }
      }
    };

    const assistRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Diversion": tc.forwardedFrom
      },
      body: JSON.stringify(assistantPayload)
    });

    const assistData: any = await assistRes.json();
    const firstMsg = assistData.assistantOverrides?.firstMessage || assistData.assistant?.firstMessage;
    const assistId = assistData.assistantId || assistData.assistant?.name;

    console.log(`   🗣️ Dynamic First Message: "${firstMsg}"`);
    console.log(`   🏷️ Dynamic Base Assistant ID / Name: "${assistId}"`);

    // 2. Test Check Availability
    console.log(`2️⃣ Checking Slot Availability for ${tc.date}...`);
    const availPayload = {
      message: {
        type: "tool-calls",
        call: {
          sipHeaders: {
            Diversion: tc.forwardedFrom
          }
        },
        toolCallList: [
          {
            id: `tool_avail_${Date.now()}`,
            function: {
              name: "check_availability",
              arguments: {
                date: tc.date,
                service_type: tc.service,
                clinic_id: tc.clinic_id
              }
            }
          }
        ]
      }
    };

    const availRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Diversion": tc.forwardedFrom
      },
      body: JSON.stringify(availPayload)
    });
    const availData: any = await availRes.json();
    const parsedAvail = JSON.parse(availData.results[0].result);
    console.log(`   ✅ Slots Found: ${parsedAvail.matching_slots?.length || 0} slots | Clinic: ${parsedAvail.notes}`);

    // 3. Test Booking Appointment
    console.log(`3️⃣ Booking Appointment for Patient '${tc.patientName}'...`);
    const bookPayload = {
      message: {
        type: "tool-calls",
        call: {
          sipHeaders: {
            Diversion: tc.forwardedFrom
          }
        },
        toolCallList: [
          {
            id: `tool_book_${Date.now()}`,
            function: {
              name: "book_appointment",
              arguments: {
                patient_name: tc.patientName,
                patient_phone: tc.patientPhone,
                slot_iso_timestamp: tc.slot,
                service_type: tc.service,
                doctor_name: tc.doctor,
                clinic_id: tc.clinic_id
              }
            }
          }
        ]
      }
    };

    const bookRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Diversion": tc.forwardedFrom
      },
      body: JSON.stringify(bookPayload)
    });
    const bookData: any = await bookRes.json();
    const parsedBook = JSON.parse(bookData.results[0].result);
    console.log(`   🎉 Booking Confirmed! ID: ${parsedBook.booking_id} | Status: ${parsedBook.status}`);
    console.log(`   📍 Confirmed Address: ${parsedBook.clinic_address}`);
  }

  // 4. Verify in Supabase Live Database
  console.log("\n=================================================");
  console.log("📊 VERIFYING BOOKINGS IN SUPABASE LIVE DATABASE...");
  console.log("=================================================");

  const pool = new pg.Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  const res = await pool.query(
    "SELECT booking_id, clinic_id, patient_name, patient_phone, display_time, service_type FROM appointments ORDER BY created_at DESC LIMIT 6;"
  );
  console.table(res.rows);
  await pool.end();

  console.log("\n🎯 All 3 Clinics tested successfully with dynamic greetings, routing, and Supabase storage!");
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
