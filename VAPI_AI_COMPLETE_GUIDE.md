# LeadFlow Pro - Complete VAPI.ai Setup Guide

## Table of Contents
1. [VAPI.ai Account Setup](#1-vapai-account-setup)
2. [Optimal System Prompt](#2-optimal-system-prompt)
3. [Environment Configuration](#3-environment-configuration)
4. [Voice Service Integration](#4-voice-service-integration)
5. [Testing Guide](#5-testing-guide)
6. [Complete Workflow](#6-complete-workflow)

---

## 1. VAPI.ai Account Setup

### 1.1 Create Account
```
🌐 Go to: https://vapi.ai
📧 Sign up with GitHub or Email
✅ Verify email
```

### 1.2 Get API Credentials
```
1. Login to: https://dashboard.vapi.ai
2. Left sidebar → "API Keys"
3. Click "Create API Key"
4. Copy: vapi_live_xxxxxxxxxxxxxxxxxxxx
```

### 1.3 Create Assistant

#### Go to: Dashboard → Assistants → "+ Create Assistant"

**Settings:**

```
Name: "Bottie - LeadFlow Pro"

Voice Settings:
├─ Provider: ElevenLabs
├─ Voice ID: EXAVITQu4vr4xnSDxMaL
├─ Voice Stability: 0.5
├─ Voice Similarity: 0.75
├─ Style: 0.5
└─ Use Speaker Boost: ✅ Yes

Model Settings:
├─ Provider: Groq (recommended for speed/cost)
│  └─ Model: llama-3.1-70b-versatile
└─ Provider: OpenAI (alternative)
   └─ Model: gpt-4

Temperature: 0.7 (balanced)
Max Output Tokens: 500
```

**Important - Behavior Instructions:**

```
CRITICAL: Use the System Prompt below (Section 2)
This controls how Bottie behaves on calls.
```

### 1.4 Get Phone Number (Swiss)

```
Dashboard → Phone Numbers → "+ Add Number"

Search for Swiss number:
├─ Country: Switzerland (+41)
├─ Region: Zürich/Bern/Geneva
├─ Type: Mobile or Toll-Free
└─ Price: Usually $1-10/month

Click "Assign to Assistant"
✅ Done! Number is active immediately
```

---

## 2. Optimal System Prompt

### 2.1 Complete System Prompt

**Copy and paste this ENTIRE prompt into VAPI Assistant Settings:**

```
# IDENTITY
You are "Bottie", the AI sales representative for LeadFlow Pro.
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
```
"Grüezi, hie isch dr Bottie vo LeadFlow Pro. 
Ich ruffälä äu a, well mir gmaint häi, dass Ihri Firma sehr gueti 
Bewärtige uf Google het. Stimmt das?"
```

## IF CONFIRMS/ENGAGES
```
"Exzellent! Mir vo LeadFlow Pro sind spezialisiert uf professionelli 
Websites für Schweizer KMUs wie dini Firma.

Mir mached äne, wo gueti Bewärtige aber keini Website hend, 
e komplett gratis Website-Vorschau. Das heisst:
- Du siehsch din professionelle Website, bevor du üscht gschnällsch
- Du bisch nöd verpflichtet
- Alles gratis

Hänt Sie 2 Minute Zyt, dass ich Ihne das genauer erkläre könnt?"
```

## IF INTERESTED
```
"Wie ich gseit hä, mir mached Ihne e gratis Website-Vorschau 
mit Ihrem Logo,Ihren Farben und dini Dienstleistige.

Mir hänt ou e paar Beispile vo ähnliche Firmen, wo scho 
Website-Vorschläg übercho hänt.

Wäred Sie a vileicht interessiert, die Vorschau amächue?"
```

## CLOSING (If interested)
```
"Perfekt! Ich schicke Ihne per SMS oder Email en Link zur 
Website-Vorschau. Sie chönd die aalue und mir chömed denn 
über dini Fräge rede.

Wälschi E-Mail-Adresse chönt Sie mir ge?"
```

## IF NOT INTERESTED
```
"Verstande. Das machet nüt. Villicht chönt Sie speter mol 
interessiert si? Ich chönt Ihne ou üsi Kontaktdatä gäh, 
falls Sie sich anders überleged.

Vielläch sind Sie ou an andere Dienstleistige vo LeadFlow 
Pro interessiert, wie zum Bispil e Online-Shop oder 
e Buchigssystem?"

(If still no): "Kein Problem! Villach hets glich Spaass. 
En schöne Tag no! Adieu!"
```

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

# CONVERSATION TIPS

## If they ask "Wer sind Sie?"
```
"Ich bi dr Bottie vo LeadFlow Pro. Mir sind e digitale 
Assistent, wo Schweizer Firmen hilft, professionelli 
Online-Präsenz ufzbaue."
```

## If they ask "Wie händ Sie meine Nummer?"
"Wir hänt din Google-Eintrag gsee und dass du sehr gueti 
Bewärtige häsch. Das heisst, dini Kunde sind zufriede - 
und das isch genau, woni mit dir wott rede."

## If they say "Ich habe schon en Website"
"Wunderbar! Mir au. Aber mir händ gmaint, villicht chönt 
Sie mol vergliche, öb die aktuelli Website no den 
hütige Standards entspricht. Ohne Verpflichtig natürlich."

## If they speak High German instead of Swiss German
Adapt to their language, but still be warm and conversational.

# CONVERSATION FLOW

```
1. GREETING (10 sec)
   → Acknowledge their business/reviews
   
2. HOOK (15 sec)  
   → Free website preview offer
   
3. QUALIFY (30 sec)
   → Confirm interest
   
4. OFFER (20 sec)
   → Send preview link offer
   
5. CLOSE (10 sec)
   → Get email/confirm next step
```

# RESPONSE EXAMPLES

## Confused/Unsure
```
"Kein Problem, ich erklär das gerne no eis Mal. 
Kurz: Mir zeiged Ihne, wie dini Website chönnt ussee. 
Alles gratis, keini Verpflichtig."
```

## Too busy
```
"Verstande, ich wott Sie au nid ufhalte. 
Ich schicke Ihne per Email en kurze Link zur Vorschau. 
Sie chönd das ganz en ahne Lütig aalue, ok?"
```

## Not the right person
```
"Ah verstande. Wer isch den für sochi Entscheidige 
verantwortlich? chönt Sie mir sage, wen ich chönt kontaktiere?" 
```

## Pricing question
"Die erste Website-Vorschau isch komplett gratis. 
Erst wänn Sie wirklech en Website wänd, das isch dan 
e separates Angebot. Das heisst: siägeder am Anfang nüt."

# ENDING EVERY CALL POSITIVELY

Regardless of outcome:
```
"Vielläch hets glich Spass! Ich danke Ihne für Ihre Zyt. 
En schöne Tag no! Adieu!"
```

---

## 2.2 Variables for Personalization

In VAPI dashboard, set these variables for each lead:

```json
{
  "company_name": "Restaurant Limmat",
  "contact_name": "Mario",
  "industry": "Restaurant",
  "location": "Zürich",
  "specialty": "italienische Küche"
}
```

Then use in prompt:
```
"...für {{company_name}} in {{location}}, wo für {{specialty}} bekannt ist..."
```

---

## 3. Environment Configuration

### 3.1 Create .env.local

```bash
cd leadflow-pro

cat > .env.local << 'EOF'
# ============================================
# VAPI.AI (Voice Agent)
# ============================================
# Get from: https://dashboard.vapi.ai
VAPI_API_KEY=vapi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_PHONE_NUMBER=+4155XXXXXXXXX

# ============================================
# ELEVENLABS (Voice)
# ============================================
# Already configured in VAPI, but useful for reference
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# ============================================
# SUPABASE (Database)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# LEADFLOW APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LeadFlow Pro
EOF
```

### 3.2 .gitignore

```bash
# Add to .gitignore (if not already):
echo ".env.local" >> .gitignore
```

---

## 4. Voice Service Integration

### 4.1 Create VAPI Service

```typescript
// leadflow-pro/src/services/voice/vapiService.ts

interface VapiConfig {
  apiKey: string;
  assistantId: string;
  phoneNumber: string;
}

interface Lead {
  id: string;
  company_name: string;
  phone: string;
  email?: string;
  industry?: string;
  location?: string;
}

interface CallResult {
  success: boolean;
  callId?: string;
  status: string;
  message?: string;
}

export class VapiService {
  private config: VapiConfig;
  private baseUrl = 'https://api.vapi.ai';

  constructor(config: VapiConfig) {
    this.config = config;
  }

  async initiateCall(lead: Lead): Promise<CallResult> {
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
            contact_name: lead.company_name.split(' ')[0],
            industry: lead.industry || 'local business',
            location: lead.location || 'Switzerland',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'failed',
          message: error.message || 'Call failed',
        };
      }

      const data = await response.json();
      
      // Log call
      console.log(`📞 VAPI Call initiated: ${data.id} → ${lead.phone}`);
      
      return {
        success: true,
        callId: data.id,
        status: 'initiated',
        message: 'Call started successfully',
      };
    } catch (error) {
      console.error('VAPI Error:', error);
      return {
        success: false,
        status: 'error',
        message: String(error),
      };
    }
  }

  async getCallStatus(callId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
    return await response.json();
  }

  async endCall(callId: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/call/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return true;
    } catch (error) {
      console.error('End call error:', error);
      return false;
    }
  }
}

export function createVapiService(): VapiService {
  return new VapiService({
    apiKey: process.env.VAPI_API_KEY || '',
    assistantId: process.env.VAPI_ASSISTANT_ID || '',
    phoneNumber: process.env.VAPI_PHONE_NUMBER || '',
  });
}
```

### 4.2 Create API Route

```typescript
// leadflow-pro/src/app/api/voice/vapi/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createVapiService } from '@/services/voice/vapiService';

export async function POST(request: NextRequest) {
  try {
    const { leadId, phoneNumber, leadData } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const vapi = createVapiService();
    
    const lead = {
      id: leadId,
      company_name: leadData?.company_name || 'Customer',
      phone: phoneNumber,
      email: leadData?.email,
      industry: leadData?.industry,
      location: leadData?.location,
    };

    const result = await vapi.initiateCall(lead);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    console.error('VAPI voice error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');

  if (!callId) {
    return NextResponse.json({
      configured: true,
      status: 'ready',
      provider: 'vapi',
    });
  }

  const vapi = createVapiService();
  const status = await vapi.getCallStatus(callId);

  return NextResponse.json(status);
}
```

### 4.3 Update Voice Panel Component

```tsx
// In your VoiceAgentPanel.tsx component

async function initiateCall() {
  setIsCalling(true);
  
  const response = await fetch('/api/voice/vapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: lead.id,
      phoneNumber: lead.phone,
      leadData: {
        company_name: lead.company_name,
        industry: lead.industry,
        location: lead.location,
      },
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    setCallStatus('connected');
    console.log('📞 Call initiated:', result.callId);
  } else {
    setError(result.error);
  }
  
  setIsCalling(false);
}
```

---

## 5. Testing Guide

### 5.1 Local Testing

```bash
# Start development server
cd leadflow-pro
npm run dev

# Open browser
# http://localhost:3000/creator

# Select a lead with phone number
# Click "Voice Agent"
# Click "Anrufen"
```

### 5.2 Dashboard Monitoring

```
1. VAPI Dashboard → https://dashboard.vapi.ai
2. Calls → View all calls
3. Listen to recordings
4. Check transcripts
```

### 5.3 Troubleshooting

| Issue | Solution |
|-------|----------|
| Call not connecting | Check VAPI dashboard for errors |
| Wrong voice | Verify ElevenLabs voice ID in assistant |
| Script not triggering | Check variable names match |
| Call rejected | Verify phone number format (+41...) |

---

## 6. Complete Workflow

### 6.1 Daily Lead Flow

```
1. FIND LEADS
   └─ python swiss_lead_finder.py --city "Zürich" --industry "restaurant" --real
   
2. IMPORT TO DASHBOARD
   └─ Leads appear in LeadFlow Pro UI
   
3. SEND PREVIEW EMAIL
   └─ EmailPanel → "Lead Intro" template
   
4. WAIT 48 HOURS
   └─ Automated follow-up reminder
   
5. INITIATE CALL
   └─ VoiceAgentPanel → "Anrufen"
   
6. LOG RESULT
   └─ Supabase → voice_calls table
```

### 6.2 Voice Call Flow

```
Lead receives call
    ↓
Bottie introduces (Swiss German)
    ↓
Lead engaged? → Yes → Send preview link
                 → No → Thank and close
    ↓
Call logged to database
    ↓
Follow-up scheduled if needed
```

---

## Quick Reference

| Component | URL |
|-----------|-----|
| VAPI Dashboard | https://dashboard.vapi.ai |
| VAPI Docs | https://docs.vapi.ai |
| ElevenLabs Voice | EXAVITQu4vr4xnSDxMaL |
| Groq Console | https://console.groq.com |

## Support

- VAPI Discord: https://discord.gg/vapi
- LeadFlow Pro Issues: GitHub Issues

---

*Last Updated: 2026-02-06*
*For LeadFlow Pro - Swiss Lead Generation Platform*
