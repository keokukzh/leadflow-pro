// Twilio Voice Webhook Handler
import { NextRequest, NextResponse } from "next/server";
import { handleVoiceResponse, buildTwiML } from "@/services/voice/voiceAgent";

// ============================================
// POST /api/voice/webhook/incoming
// Handle incoming calls to the Twilio number
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    
    console.log(`📥 Incoming call: ${callSid} from ${from}`);
    
    // Build TwiML for the call
    const twiml = buildTwiML("cold_call");
    
    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml"
      }
    });
    
  } catch (error) {
    console.error("Webhook error:", error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="de-CH">
    Es git e technisches Problem. Bitte rufen Sie spiter nochemal an.
    Adieu!
  </Say>
  <Hangup/>
</Response>`;
    
    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml"
      }
    });
  }
}
