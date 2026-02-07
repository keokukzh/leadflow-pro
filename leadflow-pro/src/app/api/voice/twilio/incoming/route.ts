import { NextRequest, NextResponse } from "next/server";
import { buildTwiML } from "@/services/voice/voiceAgent";
import { validateTwilioRequest } from "@/lib/twilio-verify";
import { logger } from "@/lib/logger";

const authToken = process.env.TWILIO_AUTH_TOKEN || '';

/**
 * Twilio Incoming/Initiated Webhook (Modular)
 */
export async function POST(request: NextRequest) {
  const url = request.url;
  const signature = request.headers.get('x-twilio-signature');

  try {
    const { searchParams } = new URL(request.url);
    const scriptType = (searchParams.get('script') || 'cold_call') as any;
    
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Signature Verification
    if (authToken && signature) {
      const isValid = validateTwilioRequest(authToken, signature, url, params);
      if (!isValid) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const { CallSid: callSid, From: from } = params;
    logger.info({ callSid, from, scriptType }, `📥 Twilio modular incoming called`);
    
    const twiml = buildTwiML(scriptType);
    
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" }
    });
    
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Twilio incoming error");
    return new NextResponse('Error', { status: 500 });
  }
}
