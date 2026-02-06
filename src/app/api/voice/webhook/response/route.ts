// Twilio Voice Response Handler
import { NextRequest, NextResponse } from "next/server";
import { handleVoiceResponse } from "@/services/voice/voiceAgent";

// ============================================
// POST /api/voice/webhook/response
// Handle user input (DTMF) during calls
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const digits = formData.get("Digits") as string;
    const from = formData.get("From") as string;
    
    console.log(`📞 Call ${callSid}: User pressed "${digits}" from ${from}`);
    
    // Generate response based on user input
    const twiml = handleVoiceResponse(digits);
    
    // Log the response for analytics
    await logVoiceInteraction({
      callSid,
      from,
      digits,
      timestamp: new Date().toISOString()
    });
    
    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml"
      }
    });
    
  } catch (error) {
    console.error("Voice response error:", error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="de-CH">
    Entschuldigung, es git e Problem. Auf wiederhöre!
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

// Log voice interaction
async function logVoiceInteraction(data: any): Promise<void> {
  // In production, save to Supabase:
  // await supabase.from('voice_interactions').insert(data);
  console.log('📝 Voice interaction logged:', data);
}
