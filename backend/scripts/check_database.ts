import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL is not defined in .env file.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("=================================================");
  console.log("🔍 Checking Supabase Live PostgreSQL Database...");
  console.log("=================================================");

  try {
    // 1. Check Clinics Table
    const clinicsRes = await pool.query("SELECT clinic_id, clinic_name, contact_phone, working_hours FROM clinics;");
    console.log(`\n🏥 CLINICS REGISTERED (${clinicsRes.rows.length}):`);
    if (clinicsRes.rows.length === 0) {
      console.log("   (No clinics found in database)");
    } else {
      console.table(clinicsRes.rows);
    }

    // 2. Check Appointments Table
    const appointmentsRes = await pool.query(
      "SELECT booking_id, clinic_id, patient_name, patient_phone, display_time, doctor_name, service_type, status, created_at FROM appointments ORDER BY created_at DESC;"
    );
    console.log(`\n📅 APPOINTMENTS BOOKED (${appointmentsRes.rows.length}):`);
    if (appointmentsRes.rows.length === 0) {
      console.log("   (No appointments booked yet. Call your number +918065355910 to book one!)");
    } else {
      console.table(appointmentsRes.rows);
    }

    console.log("\n✅ Database connection is healthy and working!");
  } catch (err: any) {
    console.error("❌ Database query error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
