// Twilio Status Callback Handler
import { NextRequest, NextResponse } from "next/server";

// ============================================
// POST /api/voice/webhook/status
// Handle call status updates from Twilio
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const transcriptionText = formData.get("TranscriptionText") as string;
    
    console.log(`📊 Call ${callSid}: ${callStatus}`);
    
    // Update call record in database
    await updateCallStatus({
      callSid,
      status: mapTwilioStatus(callStatus),
      duration: callDuration ? parseInt(callDuration) : undefined,
      recordingUrl: recordingUrl || undefined,
      transcription: transcriptionText || undefined,
      completedAt: callStatus === 'completed' ? new Date().toISOString() : undefined
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Status webhook error:", error);
    return NextResponse.json(
      { error: "Status update failed" },
      { status: 500 }
    );
  }
}

// Map Twilio status to our status
function mapTwilioStatus(twilioStatus: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'queued',
    'ringing': 'ringing',
    'in-progress': 'in_progress',
    'completed': 'completed',
    'busy': 'failed',
    'failed': 'failed',
    'no-answer': 'failed',
    'canceled': 'failed'
  };
  
  return statusMap[twilioStatus] || 'unknown';
}

// Update call status in database
async function updateCallStatus(data: any): Promise<void> {
  // In production, update Supabase:
  // await supabase.from('voice_calls').update(data).eq('call_sid', data.callSid);
  console.log('📝 Call status updated:', data);
}
