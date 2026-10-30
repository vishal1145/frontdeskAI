import dotenv from "dotenv";
dotenv.config();

import { vobizService } from "../src/services/vobizService.js";
import { clinicRegistry } from "../src/config/clinicRegistry.js";
import pg from "pg";

async function main() {
  console.log("=== VOBIZ DIRECT LIVE SYNC STARTING ===");
  console.log("Vobiz Auth ID:", process.env.VOBIZ_AUTH_ID);
  console.log("Is Configured:", vobizService.isConfigured());

  await clinicRegistry.loadClinicsFromDb();
  
  // Sync for Sharma Dental (+917668433939 / virtual: 918065355910)
  const count = await vobizService.syncVobizCdrsForClinic("clinic-sharma-dental");
  console.log(`\nSuccessfully imported ${count} live calls from Vobiz console!`);

  // Verify directly from DB
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const dbCheck = await pool.query(`
    SELECT 
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE is_transferred = true) as transferred,
      COALESCE(SUM(cost_inr), 0) as total_vobiz_cost,
      MIN(created_at) as earliest_call,
      MAX(created_at) as latest_call
    FROM call_logs 
    WHERE clinic_id = 'clinic-sharma-dental';
  `);
  console.log("\nDatabase Verification Summary:");
  console.table(dbCheck.rows);

  const sampleCalls = await pool.query(`
    SELECT call_sid, caller_phone, called_number, duration_seconds, cost_inr, summary, created_at
    FROM call_logs
    WHERE clinic_id = 'clinic-sharma-dental'
    ORDER BY created_at DESC
    LIMIT 5;
  `);
  console.log("\nLatest 5 Live Vobiz Calls in DB:");
  console.table(sampleCalls.rows);

  await pool.end();
}

main().catch(err => {
  console.error("Sync error:", err);
  process.exit(1);
});
