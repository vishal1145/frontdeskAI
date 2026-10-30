import { FrontDeskAgent } from "../src/index.js";

async function runHinglishBookingDemo() {
  console.log("=================================================");
  console.log("  FrontDesk AI Receptionist - Hinglish Booking Demo");
  console.log("=================================================\n");

  const agent = new FrontDeskAgent();

  const conversationTurns = [
    "Mujhe kal shaam doctor se checkup ke liye appointment chahiye.",
    "Haan, 6 baje ka slot perfect hai. Mera naam Rahul Sharma hai and phone number 9876543210. Is slot ko book kar do.",
  ];

  for (const userUtterance of conversationTurns) {
    console.log(`\n🗣️ CALLER: "${userUtterance}"`);
    const result = await agent.sendMessage(userUtterance);
    
    if (result.toolCallsExecuted.length > 0) {
      console.log(`🛠️ [TOOLS EXECUTED]:`);
      for (const tc of result.toolCallsExecuted) {
        console.log(`   └─ ${tc.name}(${JSON.stringify(tc.args)}) -> ${JSON.stringify(tc.result.status || tc.result.matching_slots ? "SUCCESS" : tc.result)}`);
      }
    }

    console.log(`🤖 FRONTDESK AI: "${result.text}"`);
  }

  console.log("\n=================================================");
  console.log("  Demo completed successfully!");
  console.log("=================================================");
}

runHinglishBookingDemo();
