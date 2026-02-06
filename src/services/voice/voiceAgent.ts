// Voice Agent Service - Twilio + ElevenLabs Integration
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface VoiceConfig {
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  elevenlabs: {
    apiKey: string;
    voiceId: string;
    voiceName: string;
  };
}

export interface CallRequest {
  leadId: string;
  phoneNumber: string;
  script: 'cold_call' | 'follow_up' | 'demo_discussion' | 'closing';
  templateData?: Record<string, any>;
}

export interface CallResult {
  success: boolean;
  callSid?: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
  message: string;
  recordingUrl?: string;
  transcription?: string;
  duration?: number;
}

// Swiss German Scripts
export const VOICE_SCRIPTS = {
  cold_call: {
    intro: "Grüezi, hie isch dr Bottie vo LeadFlow Pro.",
    hook: "Ich ha gwüsst, dass Sie sehr viele positive Bewertungen ha.",
    value: "Mir vo LeadFlow Pro mached professionelli Websites für Schweizer Unternehmen.",
    offer: "Mir möchten Ihne e gratis Website-Vorschau zeige - komplett gratis, keini Verpflichtig.",
    cta: "Hänt Sie 5 Minute Zyt für e kurze Besprechi?"
  },
  follow_up: {
    intro: "Grüezi, hie isch dr Bottie vo LeadFlow Pro.",
    hook: "Ich rüefe äu, well mir Ihne vorgster e Website-Vorschau gschickt häi.",
    value: "Händ Sie d Vorschau chöne aalue?",
    cta: "Was denke Sie? Wärd e professionelli Website för Ihr Gschäft intressant?"
  },
  demo_discussion: {
    intro: "Grüezi, dr Bottie vo LeadFlow Pro.",
    hook: "Vielen Dank für Ihr Interässe a unserer Website-Lösung.",
    value: "Mir sind spezialisiert uf moderne, performant Websites für KMUs.",
    cta: "Söll ich Ihne näberi Details zeige oder e Termin vereinbare?"
  },
  closing: {
    intro: "Grüezi, dr Bottie vo LeadFlow Pro.",
    hook: "Super, dass Sie sich für e professionelli Website entschiede häi!",
    value: "Mir werde-jetzt gli mit der Implementierig starten.",
    cta: "Söll ich Ihne no Details zur Timeline oder zum Design sende?"
  }
};

// ElevenLabs Text-to-Speech
export async function generateSpeech(text: string, voiceId: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Build TwiML from script
export function buildTwiML(script: keyof typeof VOICE_SCRIPTS): string {
  const content = VOICE_SCRIPTS[script];
  const fullText = `${content.intro} ${content.hook} ${content.value} ${content.cta}`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="de-CH" style="calm">
    ${fullText}
  </Say>
  <Gather numDigits="1" action="/api/voice/response" method="POST">
    <Say voice="alice" language="de-CH">
      Drücke 1 für Terminvereinbarung.
      Drücke 2 für mehr Infos.
      Drücke 3 für Auflege.
    </Say>
  </Gather>
  <Say voice="alice" language="de-CH">Adieu und schöne Tag no!</Say>
  <Hangup/>
</Response>`;
}

// Create Twilio Call
export async function createCall(request: CallRequest): Promise<CallResult> {
  const twilioConfig = getTwilioConfig();
  
  if (!twilioConfig.accountSid || !twilioConfig.authToken) {
    return {
      success: false,
      status: 'failed',
      message: 'Twilio credentials not configured'
    };
  }

  try {
    const twiml = buildTwiML(request.script);
    
    // In production, use actual Twilio SDK:
    // const client = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);
    // const call = await client.calls.create({
    //   twiml,
    //   to: request.phoneNumber,
    //   from: twilioConfig.phoneNumber
    // });

    // For now, return mock response
    const callSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Log call to database
    await logCall({
      leadId: request.leadId,
      callSid,
      phoneNumber: request.phoneNumber,
      script: request.script,
      status: 'queued',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      callSid,
      status: 'queued',
      message: 'Call initiated successfully'
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get Twilio config from environment
export function getTwilioConfig(): VoiceConfig['twilio'] {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  };
}

// Get ElevenLabs config
export function getElevenLabsConfig(): VoiceConfig['elevenlabs'] {
  return {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Sarah
    voiceName: 'Sarah'
  };
}

// Log call to database
async function logCall(callData: any): Promise<void> {
  // In production, save to Supabase:
  // await supabase.from('voice_calls').insert(callData);
  
  console.log('📞 Call logged:', callData);
}

// Get call history for a lead
export async function getCallHistory(leadId: string): Promise<any[]> {
  // In production, fetch from Supabase:
  // const { data } = await supabase.from('voice_calls').select('*').eq('lead_id', leadId);
  // return data || [];
  
  return [];
}

// Get all calls
export async function getAllCalls(): Promise<any[]> {
  // In production, fetch from Supabase:
  // const { data } = await supabase.from('voice_calls').select('*').order('timestamp', { ascending: false });
  // return data || [];
  
  return [];
}

// Handle Twilio webhook response
export function handleVoiceResponse(digits: string): string {
  const digitActions: Record<string, string> = {
    '1': 'Terminvereinbarung',
    '2': 'Mehr Infos',
    '3': 'Auflegen'
  };
  
  const action = digitActions[digits] || 'Unbekannt';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="de-CH">
    Vielen Dank. Sie hend ${action} gwählt. 
    Es wird sich demnächst jemand vo unserem Team melde.
    Adieu!
  </Say>
  <Hangup/>
</Response>`;
}
