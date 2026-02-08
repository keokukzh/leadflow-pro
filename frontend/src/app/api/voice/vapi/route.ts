import { NextRequest, NextResponse } from 'next/server';

/**
 * Modular Vapi Interface (Placeholder)
 * Ready for future Vapi integration
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "Vapi integration is not yet implemented. Please use /api/voice/twilio."
  }, { status: 501 });
}
