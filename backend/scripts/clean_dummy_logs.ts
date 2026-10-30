import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clean() {
  console.log("Removing all hardcoded / seeded sample call logs from Supabase...");
  const del = await pool.query("DELETE FROM call_logs;");
  console.log(`Deleted ${del.rowCount} hardcoded call logs.`);
  const check = await pool.query("SELECT COUNT(*) FROM call_logs;");
  console.log(`Remaining call logs in DB: ${check.rows[0].count}`);
  await pool.end();
}

clean().catch(err => {
  console.error("Error cleaning call logs:", err);
  process.exit(1);
});
