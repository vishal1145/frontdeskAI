import { GoogleGenAI } from "@google/genai";
import { loadAgentConfig, loadSystemPrompt } from "../config/promptLoader.js";
import { frontDeskToolsDeclarations, executeToolCall } from "../tools/index.js";
import { AgentSessionOptions, MessageTurn } from "../types/index.js";

export class FrontDeskAgent {
  private ai: GoogleGenAI | null = null;
  private model: string;
  private systemInstruction: string;
  private history: Array<{ role: "user" | "model"; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }> = [];

  constructor(options: AgentSessionOptions = {}) {
    const config = loadAgentConfig();
    this.model = options.model || config.default_model || "gemini-3.8-flash";
    this.systemInstruction = options.systemInstructionOverride || loadSystemPrompt(options.clinicConfig);

    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Send a user utterance (in English or Hinglish) and get the FrontDesk AI response.
   * Automatically executes any requested tools (check_availability, book_appointment) and feeds results back.
   */
  async sendMessage(userUtterance: string): Promise<{
    text: string;
    toolCallsExecuted: Array<{ name: string; args: any; result: any }>;
  }> {
    const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];

    // Push user message to history
    this.history.push({
      role: "user",
      parts: [{ text: userUtterance }]
    });

    if (!this.ai) {
      // Offline fallback simulation mode for testing prompt logic without API key
      return this.simulateOfflineResponse(userUtterance, toolCallsExecuted);
    }

    try {
      // Call Gemini API with system instructions, tools, and conversation history
      let response = await this.ai.models.generateContent({
        model: this.model,
        contents: this.history as any,
        config: {
          systemInstruction: this.systemInstruction,
          temperature: 0.2,
          tools: [{ functionDeclarations: frontDeskToolsDeclarations }]
        }
      });

      let candidate = response.candidates?.[0];
      let functionCalls = candidate?.content?.parts?.filter((p) => p.functionCall)?.map((p) => p.functionCall);

      // Loop to handle potential multi-step function calling
      while (functionCalls && functionCalls.length > 0) {
        // Record model response with function calls
        this.history.push({
          role: "model",
          parts: candidate?.content?.parts || []
        });

        const functionResponseParts = [];

        for (const fc of functionCalls) {
          if (!fc || !fc.name) continue;
          const fnName = fc.name;
          const fnArgs = (fc.args as Record<string, any>) || {};

          const result = await executeToolCall(fnName, fnArgs);
          toolCallsExecuted.push({
            name: fnName,
            args: fnArgs,
            result
          });

          functionResponseParts.push({
            functionResponse: {
              name: fnName,
              response: { result }
            }
          });
        }

        // Push tool execution results to conversation history
        this.history.push({
          role: "user",
          parts: functionResponseParts
        });

        // Get final turn after tool responses
        response = await this.ai.models.generateContent({
          model: this.model,
          contents: this.history as any,
          config: {
            systemInstruction: this.systemInstruction,
            temperature: 0.2,
            tools: [{ functionDeclarations: frontDeskToolsDeclarations }]
          }
        });

        candidate = response.candidates?.[0];
        functionCalls = candidate?.content?.parts?.filter((p) => p.functionCall)?.map((p) => p.functionCall);
      }

      const responseText = response.text || "Ji, main aapki kya madad kar sakti hoon?";

      // Push final model text turn to history
      this.history.push({
        role: "model",
        parts: [{ text: responseText }]
      });

      return {
        text: responseText,
        toolCallsExecuted
      };
    } catch (error: any) {
      console.error("[FrontDeskAgent Error]:", error?.message || error);
      return {
        text: "Sorry, abhi main system access nahi kar pa rahi hoon. Kya main aapko clinic representative se connect kar doon?",
        toolCallsExecuted
      };
    }
  }

  /**
   * Offline simulation runner for deterministic guardrail testing when API key is not present.
   */
  private async simulateOfflineResponse(
    userUtterance: string,
    toolCallsExecuted: Array<{ name: string; args: any; result: any }>
  ): Promise<{ text: string; toolCallsExecuted: Array<{ name: string; args: any; result: any }> }> {
    const textLower = userUtterance.toLowerCase();

    // 1. Emergency Safety Check
    if (
      textLower.includes("unconscious") ||
      textLower.includes("bleeding") ||
      textLower.includes("chest pain") ||
      textLower.includes("sans nahi")
    ) {
      const resp = "Ye emergency situation ho sakti hai. Please abhi nearest hospital emergency ya local emergency service se immediate medical help lijiye.";
      this.history.push({ role: "model", parts: [{ text: resp }] });
      return { text: resp, toolCallsExecuted };
    }

    // 2. Medical Advice Refusal
    if (
      textLower.includes("medicine") ||
      textLower.includes("dawa") ||
      textLower.includes("tablet") ||
      textLower.includes("pain")
    ) {
      const resp = "Main medical advice ya medicine prescribe nahi kar sakti, lekin main aapke liye doctor ka appointment arrange kar sakti hoon. Kya aap appointment book karna chahenge?";
      this.history.push({ role: "model", parts: [{ text: resp }] });
      return { text: resp, toolCallsExecuted };
    }

    // 3. Availability Check Simulation
    if (textLower.includes("appointment") || textLower.includes("availability") || textLower.includes("shaam") || textLower.includes("time")) {
      const dateStr = textLower.includes("kal") ? "tomorrow" : "today";
      const timeStr = textLower.includes("shaam") || textLower.includes("evening") ? "evening" : "morning";
      
      const availResult = await executeToolCall("check_availability", {
        date: dateStr,
        time_range: timeStr,
        service_type: "General Checkup"
      });

      toolCallsExecuted.push({
        name: "check_availability",
        args: { date: dateStr, time_range: timeStr },
        result: availResult
      });

      const slotTime = availResult.matching_slots[0]?.display_time || "6:00 PM";
      const resp = `Ji, bilkul. Kal shaam ${slotTime} ka slot available hai. Kya main ise Rahul ji ke naam se book kar doon?`;
      this.history.push({ role: "model", parts: [{ text: resp }] });
      return { text: resp, toolCallsExecuted };
    }

    // 4. Confirmation simulation
    if (textLower.includes("book kar do") || textLower.includes("confirm") || textLower.includes("ha")) {
      const bookResult = await executeToolCall("book_appointment", {
        patient_name: "Rahul Sharma",
        patient_phone: "9876543210",
        slot_iso_timestamp: "2026-10-02T18:00:00+05:30",
        service_type: "General Checkup"
      });

      toolCallsExecuted.push({
        name: "book_appointment",
        args: { patient_name: "Rahul Sharma", slot_iso_timestamp: "2026-10-02T18:00:00+05:30" },
        result: bookResult
      });

      const resp = `Perfect, Rahul ji. Aapka appointment kal shaam 6 baje confirm ho gaya hai. Aapki booking ID ${bookResult.booking_id} hai.`;
      this.history.push({ role: "model", parts: [{ text: resp }] });
      return { text: resp, toolCallsExecuted };
    }

    // Default polite response
    const defaultResp = "Ji, main Care & Cure Clinic se FrontDesk AI reception assistant hoon. Aap appointment book, check ya cancel karne ke liye bataiye.";
    this.history.push({ role: "model", parts: [{ text: defaultResp }] });
    return { text: defaultResp, toolCallsExecuted };
  }

  /**
   * Returns current conversation history.
   */
  getHistory(): MessageTurn[] {
    const turns: MessageTurn[] = [];
    for (const h of this.history) {
      const textPart = h.parts.find((p) => p.text);
      if (textPart && textPart.text) {
        turns.push({ role: h.role, text: textPart.text });
      }
    }
    return turns;
  }
}
