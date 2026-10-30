import { executeBookAppointment } from "../src/tools/bookingTool.js";
import { executeCheckAvailability } from "../src/tools/availabilityTool.js";
import { clinicRegistry } from "../src/config/clinicRegistry.js";
import { dispatchPostCallNotifications } from "../src/services/notificationService.js";
import { slotLockManager } from "../src/services/slotLockManager.js";

async function runMultiTenantConcurrencyDemo() {
  console.log("========================================================================");
  console.log("  FrontDesk AI - Multi-Tenant, Concurrency Locking & WhatsApp Dispatch Demo");
  console.log("========================================================================\n");

  slotLockManager.resetLocks();

  // 1. Multi-Tenant Clinic Resolution Test
  console.log("📍 1. MULTI-TENANT CLINIC RESOLUTION TEST");
  console.log("--------------------------------------------------");
  const clinic1 = clinicRegistry.getClinicByPhone("+919876543210");
  const clinic2 = clinicRegistry.getClinicByPhone("+919811111111");

  console.log(`Call to +919876543210 -> Resolved to: ${clinic1.clinic_name} (${clinic1.clinic_id})`);
  console.log(`Call to +919811111111 -> Resolved to: ${clinic2.clinic_name} (${clinic2.clinic_id})\n`);

  // 2. Atomic Slot Concurrency Locking Test (Simultaneous 10:00 AM Callers)
  console.log("🔒 2. ATOMIC SLOT CONCURRENCY LOCKING TEST (Race Condition Handling)");
  console.log("--------------------------------------------------");
  const targetSlotIso = "2026-10-10T18:00:00+05:30";

  console.log(`Scenario: Patient A (Rahul) and Patient B (Priya) both click 'Confirm 6:00 PM Slot' at the exact same millisecond...\n`);

  // Execute 2 concurrent bookings in parallel using Promise.all
  const [bookingCallerA, bookingCallerB] = await Promise.all([
    executeBookAppointment({
      patient_name: "Rahul Sharma",
      patient_phone: "9876543210",
      slot_iso_timestamp: targetSlotIso,
      service_type: "General Checkup",
      clinic_id: clinic1.clinic_id
    }),
    executeBookAppointment({
      patient_name: "Priya Verma",
      patient_phone: "9812345678",
      slot_iso_timestamp: targetSlotIso,
      service_type: "General Checkup",
      clinic_id: clinic1.clinic_id
    })
  ]);

  console.log("RESULT FOR CALLER A (Rahul):");
  console.log(`  └─ Status: ${bookingCallerA.status.toUpperCase()}`);
  if (bookingCallerA.status === "confirmed") {
    console.log(`  └─ Booking ID: ${bookingCallerA.booking_id}`);
    console.log(`  └─ Confirmation: Slot locked successfully for Rahul Sharma.`);
  }

  console.log("\nRESULT FOR CALLER B (Priya):");
  console.log(`  └─ Status: ${bookingCallerB.status.toUpperCase()}`);
  if (bookingCallerB.status === "slot_taken") {
    console.log(`  └─ Error Message: "${bookingCallerB.error_message}"`);
    console.log(`  └─ AI Response: "I apologize, but that 6:00 PM slot was just filled a moment ago! Would 5:00 PM or 7:00 PM work for you instead?"`);
  }

  // Verify availability now reflects taken slot
  console.log("\nChecking live availability after race condition...");
  const updatedAvailability = await executeCheckAvailability({
    date: "2026-10-10",
    time_range: "evening",
    clinic_id: clinic1.clinic_id
  });
  console.log(`Available slots remaining: ${updatedAvailability.matching_slots.map((s) => s.display_time).join(", ")}\n`);

  // 3. Post-Call Meta WhatsApp Cloud API & SMS Dispatch Test
  console.log("📲 3. POST-CALL WHATSAPP CLOUD API & SMS DISPATCH TEST");
  console.log("--------------------------------------------------");
  const successfulBooking = bookingCallerA.status === "confirmed" ? bookingCallerA : bookingCallerB;

  const dispatchResult = await dispatchPostCallNotifications({
    patientName: successfulBooking.patient_name,
    patientPhone: "9876543210",
    doctorName: successfulBooking.doctor_name,
    clinicName: clinic1.clinic_name,
    clinicAddress: clinic1.address,
    slotIsoTimestamp: targetSlotIso,
    displayTime: successfulBooking.display_time,
    bookingId: successfulBooking.booking_id!,
    deviceType: "smartphone"
  });

  console.log("\nWhatsApp Dispatch Status:", dispatchResult.whatsapp.status);
  console.log("WhatsApp Message ID:    ", dispatchResult.whatsapp.messageId);
  console.log("SMS Fallback Text:      ", dispatchResult.smsFallback.smsText);
  console.log("Doctor Alert:           ", dispatchResult.doctorAlert.alertSummary);

  console.log("\n========================================================================");
  console.log("  Multi-Tenant, Concurrency & Dispatch Test Completed Successfully!");
  console.log("========================================================================");
}

runMultiTenantConcurrencyDemo().catch(console.error);
