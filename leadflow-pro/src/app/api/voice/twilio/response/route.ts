import { NextRequest, NextResponse } from "next/server";
import { handleVoiceResponse } from "@/services/voice/voiceAgent";
import { validateTwilioRequest } from "@/lib/twilio-verify";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";

const authToken = process.env.TWILIO_AUTH_TOKEN || '';

/**
 * Twilio Response Webhook
 * Handles user input (DTMF) specifically for Twilio calls
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("X-Twilio-Signature");
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as Record<string, string>;
    
    // 1. Verify Twilio Signature
    const url = request.url;
    if (authToken && signature) {
      const isValid = validateTwilioRequest(authToken, signature, url, params);
      if (!isValid) {
        logger.warn({ url, signature }, "Invalid Twilio signature on response webhook");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const { CallSid: callSid, Digits: digits, From: from } = params;
    
    logger.info({ callSid, digits, from }, `📞 Twilio response received`);
    
    // 2. Generate response based on digits
    const twiml = handleVoiceResponse(digits);
    
    // 3. Log interaction and update call reaction
    const reaction = digits === '1' ? 'Appointment Requested' : 
                     digits === '2' ? 'More Info Requested' : 
                     digits === '3' ? 'Opt-out/Hanging up' : 'Unknown';

    await Promise.all([
      logVoiceInteraction({
        callSid,
        from,
        digits,
        timestamp: new Date().toISOString()
      }),
      updateCallReaction(callSid, reaction)
    ]);
    
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" }
    });
    
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Twilio response error");
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="de-CH">Entschuldigung, es git e Problem.</Say>
  <Hangup/>
</Response>`;
    
    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" }
    });
  }
}

async function updateCallReaction(callSid: string, reaction: string) {
  try {
    const { error } = await supabase
      .from('voice_calls')
      .update({ reaction })
      .eq('callSid', callSid);
    if (error) logger.error({ error: error.message, callSid }, "Failed to update call reaction");
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Supabase update reaction exception");
  }
}

async function logVoiceInteraction(data: { callSid: string; from: string; digits: string; timestamp: string }): Promise<void> {
  try {
    const { error } = await supabase.from('voice_interactions').insert(data);
    if (error) logger.error({ error: error.message }, "Failed to log voice interaction");
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Supabase interaction log exception");
  }
}
