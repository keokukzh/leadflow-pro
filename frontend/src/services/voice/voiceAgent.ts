// Moved from outer src to inner leadflow-pro/src/services/voice/voiceAgent.ts
// Voice Agent Service - Twilio + ElevenLabs Integration
import { supabase } from '@/lib/supabase';

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

// Help prevent TwiML injection
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Mask sensitive phone numbers for privacy
function maskPhone(phone: string): string {
  if (!phone) return 'unknown';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 4) return '****';
  return clean.slice(0, -4).replace(/\d/g, '*') + clean.slice(-4);
}

/**
 * Build TwiML from script with strict XSS protection
 */
export function buildTwiML(script: keyof typeof VOICE_SCRIPTS, templateData?: Record<string, any>): string {
  const content = VOICE_SCRIPTS[script];
  
  // Apply escaping to all dynamic content and fallback to standard text if missing
  const intro = escapeXml(templateData?.company_name ? `Grüezi, hie isch dr Bottie vo LeadFlow Pro für ${templateData.company_name}.` : content.intro);
  const hook = escapeXml(content.hook);
  const value = escapeXml(content.value);
  const cta = escapeXml(content.cta);
  
  const fullText = `${intro} ${hook} ${value} ${cta}`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="de-CH">
    ${fullText}
  </Say>
  <Gather numDigits="1" action="/api/voice/twilio/response" method="POST">
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
    buildTwiML(request.script, request.templateData);
    
    // For now, return mock response
    const callSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Log call to database with masked phone
    await logCall({
      leadId: request.leadId,
      callSid,
      phoneNumber: maskPhone(request.phoneNumber),
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
async function logCall(callData: { 
  leadId: string; 
  callSid: string; 
  phoneNumber: string; 
  script: string; 
  status: string; 
  timestamp: string; 
}): Promise<void> {
  try {
    const { error } = await supabase.from('voice_calls').insert(callData);
    if (error) console.error('Supabase voice log error:', error.message);
  } catch (err) {
    console.error('Voice log sync failed:', err);
  }
  
  console.log('📞 Call logged:', callData);
}

// Get call history for a lead
export async function getCallHistory(leadId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('leadId', leadId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch call history:', err);
    return [];
  }
}

// Get all calls
export async function getAllCalls(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('voice_calls')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch all calls:', err);
    return [];
  }
}

// Handle Twilio webhook response
export function handleVoiceResponse(digits: string): string {
  const digitActions: Record<string, string> = {
    '1': 'Terminvereinbarung',
    '2': 'Mehr Infos',
    '3': 'Auflegen'
  };
  
  const action = escapeXml(digitActions[digits] || 'Unbekannt');
  
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
