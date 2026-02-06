import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { readData, writeData } from '@/lib/storage';

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
  try {
    const { leadId, phoneNumber, script } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, callId: call.sid });
  } catch (error) {
    console.error('Twilio Error:', error);
    return NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 });
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
        twilioNumber,
        hasApiKey: !!process.env.ELEVENLABS_API_KEY,
      },
      recentCalls: logs.slice(-10).reverse(),
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
