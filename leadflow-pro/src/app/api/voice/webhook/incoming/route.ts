import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scriptType = searchParams.get('script') || 'cold_call';

  const scripts: Record<string, string> = {
    "cold_call": "Grüezi, hie isch dr Bottie vo LeadFlow Pro. Ich ha gwüsst, dass Sie sehr viele positive Bewertungen ha. Mir vo LeadFlow Pro mached professionelli Websites für Schweizer Unternehmen - gratis Website-Vorschau für Sie! Hänt Sie 5 Minute Zyt?"
  };

  const text = scripts[scriptType] || "Grüezi, wie cha ich Ihne helfe?";

  const twiml = new VoiceResponse();
  
  // For now, use Twilio's standard TTS which supports de-CH
  // In a real scenario, we could use <Play> with an ElevenLabs generated URL
  twiml.say({
    voice: 'Polly.Marlene', // Standard German voice, de-CH isn't directly in Say yet for all regions
    language: 'de-DE'
  }, text);

  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
