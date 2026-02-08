import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCall } from "@/services/voice/voiceAgent";
import { logger } from '@/lib/logger';
import { apiRateLimit } from '@/lib/rate-limit';

const CallRequestSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{6,14}$/, "Ungültiges Telefonformat (E.164 empfohlen)"),
  leadId: z.string().min(1, "Lead ID ist erforderlich"),
  script: z.enum(['cold_call', 'follow_up', 'demo_discussion', 'closing']).default('cold_call'),
  templateData: z.record(z.unknown()).optional()
});

/**
 * Modular Twilio Interface
 * Handles outbound calls and webhook signature verification
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success: limitOk } = await apiRateLimit.check(10, ip);
  
  if (!limitOk) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validation = CallRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validierungsfehler", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { phoneNumber, leadId, script, templateData } = validation.data;

    const result = await createCall({
      leadId,
      phoneNumber,
      script,
      templateData
    });

    return NextResponse.json({
      success: result.success,
      data: result.success ? { callSid: result.callSid } : undefined,
      error: !result.success ? result.message : undefined
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Twilio API Route Error");
    return NextResponse.json({ success: false, error: "Interner Serverfehler" }, { status: 500 });
  }
}
