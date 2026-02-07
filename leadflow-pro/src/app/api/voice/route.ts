import { NextRequest, NextResponse } from 'next/server';
import { 
  createCall, 
  getCallHistory, 
  getAllCalls, 
  getTwilioConfig,
  getElevenLabsConfig,
  VOICE_SCRIPTS 
} from "@/services/voice/voiceAgent";
import { apiRateLimit } from '@/lib/rate-limit';
import { VoiceCallSchema, ApiResponse, VoiceCallData } from '@/lib/schemas';
import { logger } from '@/lib/logger';

/**
 * @env TWILIO_ACCOUNT_SID
 * @env TWILIO_AUTH_TOKEN
 * @env TWILIO_PHONE_NUMBER
 * @env NEXT_PUBLIC_APP_URL
 * @throws {429} - Rate limit exceeded
 * @throws {400} - Validation error
 * @throws {500} - Configuration or Twilio error
 */
export async function POST(req: NextRequest) {
  // 1. Rate Limiting Check
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success: limitOk } = await apiRateLimit.check(req as any, 5, ip);
  
  if (!limitOk) {
    logger.warn({ ip }, "Rate limit exceeded for voice call");
    return NextResponse.json<ApiResponse>({ success: false, error: "Zu viele Anfragen. Bitte warten Sie eine Minute." }, { status: 429 });
  }

  try {
    const jsonBody = await req.json();

    // 2. Input Validation
    const validation = VoiceCallSchema.safeParse(jsonBody);
    if (!validation.success) {
      logger.error({ errors: validation.error.errors }, "Validation failed for voice call");
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: "Validierungsfehler: " + validation.error.errors.map(e => e.message).join(", ") 
      }, { status: 400 });
    }

    const { lead, prompt: script } = validation.data as VoiceCallData;
    const phoneNumber = lead.phone;
    const leadId = lead.id || 'unknown';

    if (!phoneNumber) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Lead hat keine Telefonnummer' }, { status: 400 });
    }

    logger.info({ leadId, phoneNumber }, "Initiating voice call via VoiceAgent Service");

    // 3. Create call via Service (handles Supabase sync)
    const result = await createCall({
      leadId,
      phoneNumber,
      script: (script || 'cold_call') as 'cold_call' | 'follow_up' | 'demo_discussion' | 'closing'
    });

    return NextResponse.json<ApiResponse>({
      success: result.success,
      data: result.success ? { callId: result.callSid } : undefined,
      error: !result.success ? result.message : undefined
    }, { status: result.success ? 200 : 500 });
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Twilio Call Initiation Failed");
    return NextResponse.json<ApiResponse>({ success: false, error: 'Anruf konnte nicht initiiert werden' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    
    if (leadId) {
      const history = await getCallHistory(leadId);
      return NextResponse.json<ApiResponse>({ success: true, data: history });
    }

    const logs = await getAllCalls();
    const twilioConfig = getTwilioConfig();
    const elevenLabsConfig = getElevenLabsConfig();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        config: {
          twilio: {
            accountSid: twilioConfig.accountSid ? `${twilioConfig.accountSid.substring(0, 10)}...` : 'MISSING',
            phoneNumber: twilioConfig.phoneNumber || 'MISSING',
            status: twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber ? 'CONFIGURED' : 'INCOMPLETE'
          },
          elevenlabs: {
            voiceId: elevenLabsConfig.voiceId || 'EXAVITQu4vr4xnSDxMaL',
            hasApiKey: !!elevenLabsConfig.apiKey,
            status: elevenLabsConfig.apiKey ? 'CONFIGURED' : 'MISSING_API_KEY'
          }
        },
        scripts: VOICE_SCRIPTS,
        recentCalls: logs.slice(0, 10),
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
