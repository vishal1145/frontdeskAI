import { checkAvailabilityDeclaration, executeCheckAvailability } from "./availabilityTool.js";
import { bookAppointmentDeclaration, executeBookAppointment } from "./bookingTool.js";
import { transferCallDeclaration, executeTransferCall } from "./transferTool.js";
import { endCallDeclaration, executeEndCall } from "./endCallTool.js";
import { AvailabilityParams, BookingParams } from "../types/index.js";

export const frontDeskToolsDeclarations = [
  checkAvailabilityDeclaration,
  bookAppointmentDeclaration,
  transferCallDeclaration,
  endCallDeclaration
];

export async function executeToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case "check_availability":
      return await executeCheckAvailability(args as AvailabilityParams);
    case "book_appointment":
      return await executeBookAppointment(args as BookingParams);
    case "transfer_call":
      return await executeTransferCall(args as any);
    case "end_call":
      return await executeEndCall(args as any);
    default:
      throw new Error(`Unknown tool call: ${name}`);
  }
}

