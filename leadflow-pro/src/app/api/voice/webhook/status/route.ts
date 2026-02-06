import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { validateTwilioRequest } from '@/lib/twilio-verify';
import { logger } from '@/lib/logger';

const VOICE_LOGS_FILE = 'voice_calls.json';

interface VoiceCallLog {
  id: string;
  status: string;
  duration?: number;
  endTime?: string;
}

/**
 * @env TWILIO_AUTH_TOKEN
 * @env NEXT_PUBLIC_APP_URL
 * @throws {403} - If signature invalid
 */
export async function POST(req: NextRequest) {
  const url = req.url;
  const signature = req.headers.get('x-twilio-signature');
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';

  try {
    const formData = await req.formData();
    // Convert FormData to a plain record of strings for Twilio validation
    const params: Record<string, string | undefined> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // 🛡️ Webhook Signature Verification
    if (process.env.NODE_ENV === 'production') {
      const isValid = validateTwilioRequest(authToken, signature, url, params);
      if (!isValid) {
        logger.warn({ url, signature }, "Invalid Twilio signature rejected");
        return new NextResponse('Invalid signature', { status: 403 });
      }
    }

    const callSid = params.CallSid;
    const callStatus = params.CallStatus;
    const duration = params.CallDuration;

    if (!callSid || !callStatus) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    logger.info({ callSid, callStatus }, "Processing Twilio Status Webhook");

    const logs = await readData<VoiceCallLog[]>(VOICE_LOGS_FILE, []);
    const logIndex = logs.findIndex(log => log.id === callSid);

    if (logIndex !== -1) {
      const currentLog = logs[logIndex];
      currentLog.status = callStatus.toUpperCase();
      if (duration) {
        currentLog.duration = parseInt(duration);
        currentLog.endTime = new Date().toISOString();
      }
      await writeData(VOICE_LOGS_FILE, logs);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Webhook Status Error");
    return new NextResponse('Error', { status: 500 });
  }
}
