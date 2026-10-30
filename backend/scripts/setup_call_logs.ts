import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  console.log("Setting up call_logs table in Supabase...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id SERIAL PRIMARY KEY,
      clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(clinic_id),
      call_sid VARCHAR(128),
      caller_phone VARCHAR(32) NOT NULL,
      called_number VARCHAR(32),
      call_direction VARCHAR(16) DEFAULT 'inbound',
      duration_seconds INT DEFAULT 0,
      billable_minutes INT DEFAULT 1,
      is_transferred BOOLEAN DEFAULT false,
      transfer_destination VARCHAR(64),
      transfer_reason TEXT,
      call_status VARCHAR(32) DEFAULT 'completed',
      cost_inr NUMERIC(8, 2) DEFAULT 0.00,
      recording_url TEXT,
      summary TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_call_logs_clinic ON call_logs (clinic_id, created_at DESC);
  `);

  console.log("call_logs table ensured!");

  // Check how many call_logs exist
  const countRes = await pool.query("SELECT COUNT(*) FROM call_logs;");
  const count = parseInt(countRes.rows[0].count, 10);
  console.log(`Current call_logs count: ${count}`);

  console.log(`Current dynamic call_logs in database: ${count}`);
  console.log("No mock data seeded. Call logs are 100% dynamic from Vobiz / LiveKit.");

  const check = await pool.query("SELECT clinic_id, count(*), sum(duration_seconds) as total_sec, sum(cost_inr) as total_bill, count(*) filter (where is_transferred = true) as transferred_count FROM call_logs GROUP BY clinic_id;");
  console.table(check.rows);

  await pool.end();
}

setup().catch(err => {
  console.error("Setup error:", err);
  process.exit(1);
});
