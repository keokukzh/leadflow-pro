# VAPI.ai Integration Guide for LeadFlow Pro

## Overview

VAPI.ai is a voice AI platform that provides:
- Easy API integration for voice calls
- Support for ElevenLabs voices (already configured!)
- No complex phone number setup
- AI-powered voice agents
- Cheaper than Twilio for AI voice calls

## Why VAPI.ai?

| Feature | Twilio | VAPI.ai |
|---------|--------|---------|
| Setup Time | 1-3 days | 10 minutes |
| Phone Number | Need to buy/configure | Included |
| AI Voice | Separate (ElevenLabs) | Built-in ElevenLabs |
| Pricing | ~$0.01/min | ~$0.10/min |
| Schweizer Nr | Requires documents | Easy |

## Step 1: Create VAPI.ai Account

### 1.1 Sign Up

```
1. Go to: https://vapi.ai
2. Click "Sign Up" (use GitHub or Email)
3. Complete registration
```

### 1.2 Get API Key

```
1. Login to VAPI dashboard: https://dashboard.vapi.ai
2. Left sidebar → "API Keys"
3. Copy your API Key:
   vapi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 2: Configure VAPI.ai

### 2.1 Create Assistant

```
1. Dashboard → "Assistants" → "+ Create Assistant"
2. Settings:
   Name: "Bottie - LeadFlow Pro"
   
   Voice:
   Provider: "ElevenLabs"
   Voice ID: "EXAVITQu4vr4xnSDxMaL" (Sarah)
   
   Model:
   Provider: "OpenAI" or "Groq"
   Model: "gpt-4" or "llama-3.1-70b"
   
3. Save Assistant
4. Copy Assistant ID: asst_xxxxxxxxxxxxx
```

### 2.2 Configure LLM (Optional)

**Using Groq (Fast & Cheap):**
```
1. Get Groq API Key: https://console.groq.com
2. In VAPI Dashboard → "Providers" → "Groq"
3. Add API Key
4. Model: "llama-3.1-70b-versatile"
```

**Using OpenAI:**
```
1. In VAPI Dashboard → "Providers" → "OpenAI"
2. Add API Key
```

### 2.3 Create Phone Number (Optional - VAPI Provides)

```
1. Dashboard → "Phone Numbers" → "+ Add"
2. Search for Swiss number (+41)
3. Select number
4. Assign to Assistant
5. Done! Number is ready to use
```

## Step 3: Add VAPI to LeadFlow Pro

### 3.1 Environment Variables

```bash
# Add to .env.local
VAPI_API_KEY=vapi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_PHONE_NUMBER=+41XXXXXXXXX
```

### 3.2 Create VAPI Service

```typescript
// leadflow-pro/src/services/voice/vapiService.ts

interface VapiConfig {
  apiKey: string;
  assistantId: string;
  phoneNumber: string;
}

interface CallRequest {
  leadPhone: string;
  assistantId: string;
  variables?: Record<string, string>;
}

interface CallResult {
  success: boolean;
  callId?: string;
  status: string;
  message?: string;
}

// Swiss German Call Script
export const VAPI_CALL_SCRIPT = `
Du bist Bottie von LeadFlow Pro.
Du rufst Schweizer KMUs an.

Dein Ziel:
1. Grüezi sagen und vorstellen
2. Erwähnen, dass du gesehen hast, dass sie viele positive Bewertungen haben
3. Kostenlose Website-Vorschau anbieten
4. Nach 5 Minuten fragen

Wichtig:
- Sprich Schweizer Deutsch
- Sei freundlich und professionell
- Nicht aufdringlich
- Bei Interesse: Email senden für Demo-Link
`;

export class VapiService {
  private config: VapiConfig;

  constructor(config: VapiConfig) {
    this.config = config;
  }

  async initiateCall(leadPhone: string): Promise<CallResult> {
    try {
      const response = await fetch('https://api.vapi.ai/call', {
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
            number: leadPhone,
          },
          variables: {
            company_name: 'Company',
            contact_name: 'Customer',
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
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    return await response.json();
  }

  async endCall(callId: string): Promise<boolean> {
    try {
      await fetch(`https://api.vapi.ai/call/${callId}/end`, {
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

// Factory function
export function createVapiService(): VapiService {
  return new VapiService({
    apiKey: process.env.VAPI_API_KEY || '',
    assistantId: process.env.VAPI_ASSISTANT_ID || '',
    phoneNumber: process.env.VAPI_PHONE_NUMBER || '',
  });
}
```

### 3.3 Create API Route

```typescript
// leadflow-pro/src/app/api/voice/vapi/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createVapiService } from '@/services/voice/vapiService';

export async function POST(request: NextRequest) {
  try {
    const { leadId, phoneNumber, script } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const vapi = createVapiService();
    const result = await vapi.initiateCall(phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    // Log call to database
    await logCall({
      leadId,
      callId: result.callId,
      phoneNumber,
      script: script || 'cold_call',
      status: 'initiated',
      provider: 'vapi',
    });

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

async function logCall(data: any): Promise<void> {
  // In production, save to Supabase:
  // await supabase.from('voice_calls').insert(data);
  console.log('📞 VAPI Call logged:', data);
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

### 3.4 Update Environment Example

```bash
# leadflow-pro/.env.local.example

# ============================================
# VAPI.AI (Voice Agent - Alternative to Twilio)
# ============================================
# Sign up: https://vapi.ai
# Dashboard: https://dashboard.vapi.ai
VAPI_API_KEY=vapi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_PHONE_NUMBER=+41XXXXXXXXX

# ============================================
# ELEVENLABS (Voice - Works with VAPI)
# ============================================
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# ============================================
# SUPABASE (Database)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test VAPI Integration

### 4.1 Test API Key

```bash
# Test VAPI connection
curl -X GET "https://api.vapi.ai/me" \
  -H "Authorization: Bearer YOUR_VAPI_KEY"
```

### 4.2 Create Test Call

```bash
# Send test call
curl -X POST "https://api.vapi.ai/call" \
  -H "Authorization: Bearer YOUR_VAPI_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "YOUR_ASSISTANT_ID",
    "phone_number": {
      "number": "+4155XXXXXXX",
      "display_name": "LeadFlow Pro"
    },
    "customer": {
      "number": "+41791234567"
    }
  }'
```

## Step 5: VAPI Dashboard

### 5.1 Monitor Calls

```
Dashboard → "Calls"
- View all calls
- Listen to recordings
- See transcripts
- Check duration and costs
```

### 5.2 Analytics

```
Dashboard → "Analytics"
- Call success rate
- Average call duration
- Costs per call
- Peak calling hours
```

## Pricing Comparison

| | Twilio | VAPI.ai |
|---|--------|---------|
| Setup | 1-3 days | 10 minutes |
| Number (CH) | $1-10/month | Included |
| Per minute | $0.01-0.05 | $0.10 |
| AI Voice | Separate ($$) | Built-in |
| Total Cost/mo | ~$20-50 | ~$30-50 |

## Migration from Twilio

### Before (Twilio)
```typescript
// Old code using Twilio
const call = await client.calls.create({
  twiml: voiceResponse,
  to: phoneNumber,
  from: twilioNumber,
});
```

### After (VAPI)
```typescript
// New code using VAPI
const vapi = createVapiService();
const result = await vapi.initiateCall(phoneNumber);
```

## Troubleshooting

### Issue: Call not connecting
```
1. Check VAPI dashboard for errors
2. Verify assistant is active
3. Check phone number format (+41...)
```

### Issue: Wrong voice
```
1. Verify ElevenLabs voice ID in assistant settings
2. Check API key has ElevenLabs access
```

### Issue: Script not working
```
1. Test assistant in VAPI playground
2. Check variable names match
3. Verify Swiss German is set
```

## Next Steps

1. ✅ Create VAPI account
2. ✅ Get API Key
3. ⬜ Create Assistant with ElevenLabs
4. ⬜ Test call
5. ⬜ Update .env.local
6. ⬜ Deploy to production

## Support

- VAPI Docs: https://docs.vapi.ai
- VAPI Discord: https://discord.gg/vapi
- Pricing: https://vapi.ai/pricing
