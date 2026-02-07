import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioRequest } from '@/lib/twilio-verify';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

const authToken = process.env.TWILIO_AUTH_TOKEN || '';

/**
 * Twilio Status Webhook (Modular)
 * Receives real-time updates on call progress (ringing, in-progress, completed)
 */
export async function POST(req: NextRequest) {
  const url = req.url;
  const signature = req.headers.get('x-twilio-signature');

  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // 1. Signature Verification
    if (authToken && signature) {
      const isValid = validateTwilioRequest(authToken, signature, url, params);
      if (!isValid) {
        logger.warn({ url, signature }, "Twilio status signature failure");
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const { CallSid: callSid, CallStatus: callStatus, CallDuration: duration } = params;

    if (!callSid || !callStatus) {
      return new NextResponse('Missing params', { status: 400 });
    }

    logger.info({ callSid, callStatus }, "Twilio modular status update");

    const updateData: { status: string; duration?: number; endTime?: string } = { 
      status: callStatus.toUpperCase() 
    };
    
    if (duration) {
      updateData.duration = parseInt(duration);
      updateData.endTime = new Date().toISOString();
    }

    // 2. Sync to Supabase
    const { error } = await supabase
      .from('voice_calls')
      .update(updateData)
      .eq('callSid', callSid);
      
    if (error) logger.error({ error: error.message, callSid }, "Supabase status sync failed");

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Twilio status webhook error");
    return new NextResponse('Error', { status: 500 });
  }
}
