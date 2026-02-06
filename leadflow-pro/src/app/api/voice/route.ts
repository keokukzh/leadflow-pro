import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { readData, writeData } from '@/lib/storage';
import { apiRateLimit } from '@/lib/rate-limit';
import { VoiceCallSchema, ApiResponse, VoiceCallData } from '@/lib/schemas';
import { logger } from '@/lib/logger';

const VOICE_LOGS_FILE = 'voice_calls.json';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const client = twilio(accountSid, authToken);

interface VoiceCall {
  id: string;
  leadId: string;
  phoneNumber: string;
  status: 'PENDING' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  script: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Check
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success: limitOk } = await apiRateLimit.check(req as any, 5, ip); // Stricter limit for voice
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

    logger.info({ leadId, phoneNumber }, "Initiating voice call via Twilio");

    // Initiate call via Twilio
    const call = await client.calls.create({
      url: `${appUrl}/api/voice/webhook/incoming?script=${encodeURIComponent(script || 'cold_call')}`,
      to: phoneNumber,
      from: twilioNumber!,
      statusCallback: `${appUrl}/api/voice/webhook/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    const newCall: VoiceCall = {
      id: call.sid,
      leadId,
      phoneNumber,
      status: 'PENDING',
      script: script || 'cold_call',
      startTime: new Date().toISOString(),
    };

    const logs = await readData<VoiceCall[]>(VOICE_LOGS_FILE, []);
    logs.push(newCall);
    await writeData(VOICE_LOGS_FILE, logs);

    return NextResponse.json<ApiResponse>({ success: true, data: { callId: call.sid } });
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Twilio Call Initiation Failed");
    return NextResponse.json<ApiResponse>({ success: false, error: 'Anruf konnte nicht initiiert werden' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    
    const logs = await readData<VoiceCall[]>(VOICE_LOGS_FILE, []);
    
    if (leadId) {
      return NextResponse.json(logs.filter(log => log.leadId === leadId));
    }

    return NextResponse.json({
      config: {
        twilio: {
          accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING',
          phoneNumber: twilioNumber || 'MISSING',
          status: accountSid && authToken && twilioNumber ? 'CONFIGURED' : 'INCOMPLETE'
        },
        elevenlabs: {
          voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
          hasApiKey: !!process.env.ELEVENLABS_API_KEY,
          status: process.env.ELEVENLABS_API_KEY ? 'CONFIGURED' : 'MISSING_API_KEY'
        }
      },
      recentCalls: logs.slice(-10).reverse(),
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
