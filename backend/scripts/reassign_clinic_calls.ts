import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function reassignCallsClinicWise() {
  const allLogs = await pool.query("SELECT * FROM call_logs ORDER BY created_at DESC;");

  // Parse transcripts log
  const transcriptContent = fs.existsSync("logs/call_transcripts.log")
    ? fs.readFileSync("logs/call_transcripts.log", "utf-8")
    : "";
  const transcriptLines = transcriptContent.split("\n");

  const transcriptMap: { time: number; caller: string; clinicName: string }[] = [];
  for (const line of transcriptLines) {
    const match = line.match(/\[(.*?)\] \[Caller: (.*?) \| Clinic: (.*?)\]/);
    if (match) {
      const time = new Date(match[1]).getTime();
      const caller = match[2].replace(/[^0-9]/g, "").slice(-10);
      const clinicName = match[3];
      transcriptMap.push({ time, caller, clinicName });
    }
  }

  // Clinic numbers
  const clinics: Record<string, string[]> = {
    "clinic-care-cure": ["9936074690", "9852237735", "9876543210"],
    "clinic-apex-care": ["7880649711", "8040010003", "9822233344"],
    "clinic-sharma-dental": ["7668433939"]
  };

  const appts = await pool.query("SELECT clinic_id, patient_phone FROM appointments;");
  const apptClinicMap = new Map<string, string>();
  for (const a of appts.rows) {
    const clean = a.patient_phone.replace(/[^0-9]/g, "").slice(-10);
    apptClinicMap.set(clean, a.clinic_id);
  }

  let updatedCount = 0;

  for (const row of allLogs.rows) {
    const callerDigits = (row.caller_phone || "").replace(/[^0-9]/g, "").slice(-10);
    const rowTime = new Date(row.created_at).getTime();

    let targetClinic = "clinic-sharma-dental";

    // 1. Direct clinic contact number check
    if (clinics["clinic-care-cure"].some(p => p.endsWith(callerDigits))) {
      targetClinic = "clinic-care-cure";
    } else if (clinics["clinic-apex-care"].some(p => p.endsWith(callerDigits))) {
      targetClinic = "clinic-apex-care";
    } else if (clinics["clinic-sharma-dental"].some(p => p.endsWith(callerDigits))) {
      targetClinic = "clinic-sharma-dental";
    } else {
      // 2. Transcript match
      for (const t of transcriptMap) {
        if (t.caller === callerDigits && Math.abs(t.time - rowTime) < 180000) {
          if (t.clinicName.includes("Care & Cure")) targetClinic = "clinic-care-cure";
          else if (t.clinicName.includes("Apex")) targetClinic = "clinic-apex-care";
          else if (t.clinicName.includes("Sharma")) targetClinic = "clinic-sharma-dental";
          break;
        }
      }

      // 3. Appointment match
      if (targetClinic === "clinic-sharma-dental" && apptClinicMap.has(callerDigits)) {
        targetClinic = apptClinicMap.get(callerDigits)!;
      }
    }

    if (targetClinic !== row.clinic_id) {
      await pool.query("UPDATE call_logs SET clinic_id = $1 WHERE call_sid = $2;", [targetClinic, row.call_sid]);
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} calls to their proper clinic.`);

  const summary = await pool.query(`
    SELECT clinic_id, COUNT(*) as call_count, SUM(cost_inr) as total_bill, SUM(duration_seconds) as total_duration
    FROM call_logs 
    GROUP BY clinic_id;
  `);
  console.log("\n--- REASSIGNED CLINIC BREAKDOWN ---");
  console.table(summary.rows);

  await pool.end();
}

reassignCallsClinicWise().catch(e => {
  console.error("Reassign error:", e);
  process.exit(1);
});
