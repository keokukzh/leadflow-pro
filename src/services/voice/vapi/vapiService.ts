// ============================================
// LeadFlow Pro - VAPI.ai Service
// ============================================

import { logVoiceCall, logActivity } from '@/lib/db/client';
import type { Lead } from '@/lib/db/types';

interface VapiConfig {
  apiKey: string;
  assistantId: string;
  phoneNumber: string;
}

interface VapiCallResponse {
  success: boolean;
  callId?: string;
  status?: string;
  error?: string;
}

interface VapiCallStatus {
  id: string;
  status: string;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  cost?: number;
  started_at?: string;
  ended_at?: string;
}

// Swiss German System Prompt for VAPI
export const VAPI_SYSTEM_PROMPT = `You are "Bottie", the AI sales representative for LeadFlow Pro.
LeadFlow Pro creates professional websites for Swiss small businesses (KMUs).
You are calling on behalf of LeadFlow Pro.

# YOUR GOAL
Your goal is to:
1. Introduce LeadFlow Pro's free website preview service
2. Gauge interest in professional websites
3. Schedule a callback if interested

# TARGET CUSTOMERS
Ideal leads have:
- 4+ star Google rating
- 20+ Google reviews
- No website OR outdated website
- Located in Switzerland (German-speaking)

# CONVERSATION STRUCTURE

## GREETING (First 10 seconds)
"Grüezi, hie isch dr Bottie vo LeadFlow Pro. 
Ich ruffälä äu a, well mir gmaint häi, dass Ihri Firma sehr gueti 
Bewärtige uf Google het. Stimmt das?"

## IF CONFIRMS/ENGAGES
"Exzellent! Mir vo LeadFlow Pro sind spezialisiert uf professionelli 
Websites für Schweizer KMUs wie dini Firma.

Mir mached äne, wo gueti Bewärtige aber keini Website hend, 
e komplett gratis Website-Vorschau. Das heisst:
- Du siehsch din professionelle Website, bevor du üscht gschnällsch
- Du bisch nöd verpflichtet
- Alles gratis

Hänt Sie 2 Minute Zyt, dass ich Ihne das genauer erkläre könnt?"

## CLOSING (If interested)
"Perfekt! Ich schicke Ihne per SMS oder Email en Link zur 
Website-Vorschau. Sie chönd die aalue und mir chömed denn 
über dini Fräge rede.

Wälschi E-Mail-Adresse chönt Sie mir ge?"

## IF NOT INTERESTED
"Verstande. Das machet nüt. Villicht chönt Sie speter mol 
interessiert si? Ich chönt Ihne ou üsi Kontaktdatä gäh, 
falls Sie sich anders überlegd."

# COMMUNICATION RULES

## MUST DO:
✅ Speak Swiss German (Schweizerdeutsch)
✅ Be friendly and professional
✅ Listen more than talk
✅ Keep calls under 3 minutes
✅ Confirm understanding of the business
✅ Thank for their time

## MUST NOT:
❌ Never mention "AI", "bot", or "robot"
❌ Never be pushy or aggressive
❌ Never lie about services
❌ Never ask for credit card
❌ Never call outside 9am-6pm
❌ Never talk more than 50% of the time

# COMMON RESPONSES

## If they ask "Wer sind Sie?"
"Ich bi dr Bottie vo LeadFlow Pro. Mir sind e digitale 
Assistent, wo Schweizer Firmen hilft, professionelli 
Online-Präsenz ufzbaue."

## If they ask "Wie händ Sie meine Nummer?"
"Wir hänt din Google-Eintrag gsee und dass du sehr gueti 
Bewärtige häsch. Das heisst, dini Kunde sind zufriede - 
und das isch genau, woni mit dir wott rede."

## If they say "Ich habe schon en Website"
"Wunderbar! Mir au. Aber mir händ gmaint, villicht chönt 
Sie mol vergliche, öb die aktuelli Website no den 
hütige Standards entspricht."

# ENDING EVERY CALL POSITIVELY
"Vielläch hets glich Spaass! Ich danke Ihne für Ihre Zyt. 
En schöne Tag no! Adieu!"

---

Model Settings:
- Temperature: 0.7
- Max Tokens: 500
- Voice: ElevenLabs (Sarah - EXAVITQu4vr4xnSDxMaL)`;

export class VapiService {
  private config: VapiConfig;
  private baseUrl = 'https://api.vapi.ai';

  constructor(config: VapiConfig) {
    this.config = config;
  }

  /**
   * Initiate a cold call to a lead
   */
  async initiateColdCall(lead: Lead): Promise<VapiCallResponse> {
    if (!lead.phone) {
      return { success: false, error: 'Lead has no phone number' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          assistant_id: this.config.assistantId,
          phone_number: {
            number: this.config.phoneNumber,
            display_name: 'LeadFlow Pro',
          },
          customer: {
            number: lead.phone,
            name: lead.company_name,
          },
          variables: {
            company_name: lead.company_name,
            contact_name: this.extractContactName(lead.company_name),
            industry: lead.industry || 'local business',
            location: lead.location || 'Switzerland',
          },
          metadata: {
            lead_id: lead.id,
            lead_source: 'cold_outreach',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Call failed' };
      }

      const data = await response.json();
      
      // Log call to database
      await logVoiceCall({
        lead_id: lead.id,
        provider: 'vapi',
        call_sid: data.id,
        phone_number: lead.phone,
        status: 'queued',
      });

      // Log activity
      await logActivity({
        lead_id: lead.id,
        type: 'call',
        description: 'Cold call initiated via VAPI.ai',
      });

      console.log(`📞 VAPI Call initiated: ${data.id} → ${lead.phone}`);
      
      return {
        success: true,
        callId: data.id,
        status: 'queued',
      };
    } catch (error) {
      console.error('❌ VAPI Error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get the status of a call
   */
  async getCallStatus(callId: string): Promise<VapiCallStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Update database
      await this.updateCallInDb(callId, data);
      
      return data as VapiCallStatus;
    } catch (error) {
      console.error('❌ Error fetching call status:', error);
      return null;
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/call/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      
      // Update database
      await this.updateCallInDb(callId, { status: 'completed' });
      
      return true;
    } catch (error) {
      console.error('❌ Error ending call:', error);
      return false;
    }
  }

  /**
   * Get the recording URL for a completed call
   */
  async getCallRecording(callId: string): Promise<string | null> {
    const status = await this.getCallStatus(callId);
    return status?.recording_url || null;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get assistant details
   */
  async getAssistantDetails(): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/assistant/${this.config.assistantId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Update call record in database
   */
  private async updateCallInDb(callSid: string, updates: any): Promise<void> {
    try {
      // Import dynamically to avoid circular dependency
      const { supabase } = await import('@/lib/db/client');
      
      await supabase
        .from('voice_calls')
        .update({
          status: updates.status,
          duration: updates.duration,
          recording_url: updates.recording_url,
          transcript: updates.transcript,
          cost: updates.cost,
          ended_at: updates.ended_at,
        })
        .eq('call_sid', callSid);
    } catch (error) {
      console.error('❌ Error updating call in DB:', error);
    }
  }

  /**
   * Extract contact name from company name
   */
  private extractContactName(companyName: string): string {
    // Simple extraction - take first word
    const parts = companyName.split(' ');
    if (parts.length > 0) {
      // Remove common prefixes
      const prefix = ['Restaurant', 'Hotel', 'Café', 'Bar', 'Shop', 'Store'];
      const first = parts[0];
      if (!prefix.includes(first)) {
        return first;
      }
      return parts.length > 1 ? parts[1] : first;
    }
    return companyName;
  }
}

// ============================================
// Factory Function
// ============================================

export function createVapiService(): VapiService {
  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumber = process.env.VAPI_PHONE_NUMBER;

  if (!apiKey || !assistantId || !phoneNumber) {
    console.warn('⚠️ VAPI credentials not configured. Set VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER in .env.local');
    
    // Return a mock service for development
    return new VapiService({
      apiKey: 'placeholder',
      assistantId: 'placeholder',
      phoneNumber: '+41000000000',
    });
  }

  return new VapiService({
    apiKey,
    assistantId,
    phoneNumber,
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if VAPI is configured
 */
export function isVapiConfigured(): boolean {
  return !!(
    process.env.VAPI_API_KEY &&
    process.env.VAPI_ASSISTANT_ID &&
    process.env.VAPI_PHONE_NUMBER &&
    process.env.VAPI_API_KEY !== 'placeholder'
  );
}

/**
 * Get VAPI configuration status
 */
export function getVapiStatus(): {
  configured: boolean;
  missingKeys: string[];
} {
  const keys = ['VAPI_API_KEY', 'VAPI_ASSISTANT_ID', 'VAPI_PHONE_NUMBER'];
  const missingKeys = keys.filter(key => !process.env[key]);

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}
