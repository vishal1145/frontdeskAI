import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

// Run AFTER restarting the backend on the per-doctor booking code. The previous code's
// ON CONFLICT clause needs unique_clinic_slot, so dropping it earlier would break live bookings.
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not defined in .env file.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_clinic_doctor_slot
      ON appointments (clinic_id, doctor_name, slot_iso_timestamp)
      WHERE status <> 'cancelled';
    `);
    await client.query("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS unique_clinic_slot;");
    await client.query("COMMIT");
    console.log("Done: bookings are now unique per clinic, doctor and slot.");
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(`Migration failed, nothing was changed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
