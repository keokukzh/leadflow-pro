// Voice Agent API Routes
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  createCall, 
  getCallHistory, 
  getAllCalls, 
  handleVoiceResponse,
  getTwilioConfig,
  getElevenLabsConfig,
  VOICE_SCRIPTS 
} from "@/services/voice/voiceAgent";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CallRequestSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  phoneNumber: z.string().min(1, "phoneNumber is required"),
  script: z.enum(["cold_call", "follow_up", "demo_discussion", "closing"]).optional().default("cold_call")
});

const VoiceResponseSchema = z.object({
  Digits: z.string().optional()
});

// ============================================
// POST /api/voice/call - Initiate a call
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CallRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { leadId, phoneNumber, script } = validationResult.data;
    
    // Create the call
    const result = await createCall({
      leadId,
      phoneNumber,
      script
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      callSid: result.callSid,
      status: result.status,
      message: result.message,
      script: VOICE_SCRIPTS[script]
    });
    
  } catch (error) {
    console.error("Voice call error:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/voice - Get voice agent config
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  
  try {
    if (leadId) {
      // Get call history for specific lead
      const history = await getCallHistory(leadId);
      return NextResponse.json({
        leadId,
        calls: history
      });
    }
    
    // Get all calls and config
    const calls = await getAllCalls();
    const twilioConfig = getTwilioConfig();
    const elevenLabsConfig = getElevenLabsConfig();
    
    return NextResponse.json({
      config: {
        twilio: {
          configured: !!twilioConfig.accountSid,
          phoneNumber: twilioConfig.phoneNumber
        },
        elevenlabs: {
          configured: !!elevenLabsConfig.apiKey,
          voiceName: elevenLabsConfig.voiceName
        }
      },
      scripts: VOICE_SCRIPTS,
      stats: {
        totalCalls: calls.length,
        queuedCalls: calls.filter(c => c.status === 'queued').length,
        completedCalls: calls.filter(c => c.status === 'completed').length
      },
      recentCalls: calls.slice(0, 10)
    });
    
  } catch (error) {
    console.error("Voice config error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice config" },
      { status: 500 }
    );
  }
}
