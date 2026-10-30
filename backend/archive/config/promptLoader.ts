import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AgentConfig, ClinicConfig } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base paths relative to package root
const PROMPTS_DIR = path.resolve(__dirname, "../../prompts");

export function loadAgentConfig(): AgentConfig {
  const configPath = path.join(PROMPTS_DIR, "frontdesk_config.json");
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as AgentConfig;
}

export function loadSystemPrompt(customClinic?: Partial<ClinicConfig>): string {
  const promptPath = path.join(PROMPTS_DIR, "frontdesk_agent.system.md");
  let rawPrompt = fs.readFileSync(promptPath, "utf-8");

  const defaultConfig = loadAgentConfig();
  const clinic = { ...defaultConfig.clinic_defaults, ...customClinic };

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

  const clinicContext = `

# CURRENT CLINIC CONTEXT & REAL-TIME CLOCK

- Current Date & Time: ${dateString}, ${timeString} (IST, Asia/Kolkata)
- ISO Date Today: ${now.toISOString().split("T")[0]}
- Clinic Name: ${clinic.clinic_name}
- Address: ${clinic.address}
- Working Hours: ${clinic.working_hours}
- Contact Phone: ${clinic.contact_phone}
- Available Doctors:
${clinic.doctors.map((d) => `  * ${d.name} (${d.specialties.join(", ")}) - Timings: ${d.timings}`).join("\n")}
- Standard Services Provided:
${clinic.services.map((s) => `  * ${s}`).join("\n")}
`;

  return rawPrompt + "\n" + clinicContext;
}
