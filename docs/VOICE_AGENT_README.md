# LeadFlow Pro - Voice Agent Integration

## Overview

LeadFlow Pro includes a fully integrated Voice Agent system powered by:
- **Twilio** - Cloud communications platform for phone calls
- **ElevenLabs** - AI-powered text-to-speech for natural voice

## Features

- 📞 **Automated Cold Calls** - AI-powered outreach in Swiss German
- 📧 **Follow-up Calls** - Automated follow-up after demo emails
- 💬 **Interactive Voice Response** - DTMF input handling (1, 2, 3)
- 🎙️ **Natural Voice** - ElevenLabs "Sarah" voice in Swiss German
- 📊 **Call Logging** - Track all calls with recordings and transcriptions
- 🔗 **CRM Integration** - Calls linked to leads automatically

## Prerequisites

### 1. Twilio Account

1. Create account at https://www.twilio.com
2. Buy a phone number (Swiss: +41 XX XXX XX XX)
3. Get Account SID and Auth Token from Console

```bash
# Environment Variables
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+4155XXXYYYY
```

### 2. ElevenLabs Account

1. Create account at https://elevenlabs.io
2. Get API Key from Profile Settings
3. Choose a voice (recommended: Sarah - EXAVITQu4vr4xnSDxMaL)

```bash
# Environment Variables
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

## Installation

### 1. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API keys:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

### 2. Configure Twilio Webhooks

In Twilio Console → Phone Numbers → Your Number:

1. **Voice & Fax** → **Call incoming**
   - Webhook: `https://your-domain.com/api/voice/webhook/incoming`
   - Method: POST

2. **Status Callback**
   - Webhook: `https://your-domain.com/api/voice/webhook/status`
   - Method: POST

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Dashboard Integration

```tsx
import { VoiceAgentPanel, VoiceCallLog } from "@/components/voice";

<VoiceAgentPanel 
  leadId={lead.id}
  leadName={lead.company_name}
  phoneNumber={lead.phone}
  onCallComplete={(result) => console.log(result)}
/>

<VoiceCallLog leadId={lead.id} limit={10} />
```

### API Endpoints

#### Initiate Call
```bash
POST /api/voice
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "phoneNumber": "+41791234567",
  "script": "cold_call"
}
```

Response:
```json
{
  "success": true,
  "callSid": "CA1234567890",
  "status": "queued",
  "message": "Call initiated successfully"
}
```

#### Get Voice Config
```bash
GET /api/voice
```

Response:
```json
{
  "config": {
    "twilio": { "configured": true, "phoneNumber": "+4155XXXYYYY" },
    "elevenlabs": { "configured": true, "voiceName": "Sarah" }
  },
  "scripts": { "cold_call": {...}, "follow_up": {...} },
  "stats": { "totalCalls": 42, "completedCalls": 38 }
}
```

## Call Scripts (Swiss German)

### Cold Call
```
"Grüezi, hie isch dr Bottie vo LeadFlow Pro.
Ich ha gwüsst, dass Sie sehr viele positive Bewertungen ha.
Mir vo LeadFlow Pro mached professionelli Websites für Schweizer Unternehmen.
Mir möchten Ihne e gratis Website-Vorschau zeige - komplett gratis, keini Verpflichtig.
Hänt Sie 5 Minute Zyt für e kurze Besprechi?"
```

### Follow-up
```
"Grüezi, hie isch dr Bottie vo LeadFlow Pro.
Ich rüefe äu, well mir Ihne vorgster e Website-Vorschau gschickt häi.
Händ Sie d Vorschau chöne aalue?
Was denke Sie? Wärd e professionelli Website för ihr Gschäft intressant?"
```

### Demo Discussion
```
"Grüezi, dr Bottie vo LeadFlow Pro.
Vielen Dank für Ihr Interässe a unserer Website-Lösung.
Mir sind spezialisiert uf moderne, performant Websites für KMUs.
Söll ich Ihne näberi Details zeige oder e Termin vereinbara?"
```

### Closing
```
"Grüezi, dr Bottie vo LeadFlow Pro.
Super, dass Sie sich für e professionelli Website entschiede häi!
Mir werde-jetzt gli mit der Implementierig starten.
Söll ich Ihne no Details zur Timeline oder zum Design sende?"
```

## Voice Response Options

Callers can press:
- **1** → Terminvereinbarung (Schedule appointment)
- **2** → Mehr Infos (More info)
- **3** → Auflegen (Hang up)

## Testing

### Test Locally with ngrok

```bash
# Start ngrok tunnel
nohup ngrok http 3000 > /tmp/ngrok.log 2>&1 &

# Use the ngrok URL for Twilio webhooks
# https://xxxx-xx-xxx-xx.ngrok.io/api/voice/webhook/incoming
```

### Test Voice API

```bash
# Initiate test call
curl -X POST http://localhost:3000/api/voice \
  -H "Content-Type: application/json" \
  -d '{"leadId":"test_001","phoneNumber":"+41791234567","script":"cold_call"}'
```

## Troubleshooting

### Call Failed Immediately
- Check Twilio credentials in `.env.local`
- Verify phone number format (+41...)
- Check Twilio Console for error logs

### Voice Not Playing
- Verify ElevenLabs API key
- Check voice ID is correct
- Ensure API credits available

### Webhooks Not Working
- Use ngrok for local testing
- Verify webhook URLs in Twilio Console
- Check server logs for errors

### Swiss German Not Natural
- ElevenLabs multilingual model recommended
- Use "Sarah" voice for female Swiss German
- Adjust voice settings (stability: 0.5, similarity: 0.8)

## Production Deployment

### Environment Variables (Vercel/Netlify)

Set in your deployment platform:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

### Domain Requirements

For Twilio webhooks, your app must be accessible via HTTPS:
- Vercel: Automatic HTTPS
- Netlify: Automatic HTTPS
- Custom server: Configure SSL certificate

### Scaling Considerations

- Twilio pricing: ~$0.01/min for incoming calls
- ElevenLabs pricing: ~$0.30/1K characters
- Monitor usage in respective dashboards

## File Structure

```
src/
├── app/
│   └── api/
│       └── voice/
│           ├── route.ts              # Main voice API
│           └── webhook/
│               ├── incoming/route.ts  # Incoming call handler
│               ├── response/route.ts  # DTMF response handler
│               └── status/route.ts    # Status callback
├── services/
│   └── voice/
│       └── voiceAgent.ts             # Core voice service
└── components/
    └── voice/
        ├── index.ts
        ├── VoiceAgentPanel.tsx       # Dashboard component
        └── VoiceCallLog.tsx          # Call history
```

## License

MIT License - LeadFlow Pro
