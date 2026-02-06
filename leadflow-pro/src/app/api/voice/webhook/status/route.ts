import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';

const VOICE_LOGS_FILE = 'voice_calls.json';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const duration = formData.get('CallDuration');

    const logs = await readData<any[]>(VOICE_LOGS_FILE, []);
    const logIndex = logs.findIndex(log => log.id === callSid);

    if (logIndex !== -1) {
      logs[logIndex].status = callStatus.toUpperCase();
      if (duration) {
        logs[logIndex].duration = parseInt(duration as string);
        logs[logIndex].endTime = new Date().toISOString();
      }
      await writeData(VOICE_LOGS_FILE, logs);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook Status Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
