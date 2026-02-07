# LeadFlow Pro - VAPI.ai + Database Setup Guide

## Quick Start

```bash
# 1. Copy environment template
cp .env.local.example .env.local

# 2. Get credentials from:
#    - VAPI.ai: https://dashboard.vapi.ai
#    - Supabase: https://dashboard.supabase.com

# 3. Edit .env.local and fill in:
#    - VAPI_API_KEY
#    - VAPI_ASSISTANT_ID
#    - VAPI_PHONE_NUMBER
#    - SUPABASE credentials

# 4. Run database schema in Supabase SQL Editor
#    → database/schema_enhanced.sql

# 5. Start development server
npm run dev

# 6. Verify setup
node scripts/setup-check.js
```

## File Structure

```
leadflow-pro/
├── database/
│   └── schema_enhanced.sql      ← Run in Supabase!
├── src/
│   ├── lib/db/
│   │   ├── types.ts             ← TypeScript types
│   │   ├── client.ts            ← Database operations
│   │   └── index.ts             ← Exports
│   └── services/voice/vapi/
│       ├── vapiService.ts       ← VAPI integration
│       └── index.ts             ← Exports
│   └── app/api/voice/vapi/
│       ├── route.ts             ← POST/GET endpoints
│       └── webhook/
│           └── route.ts         ← Webhook handler
├── .env.local.example           ← Environment template
└── scripts/
    └── setup-check.js           ← Verification script
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `leads` | Main lead records |
| `voice_calls` | Call logs and recordings |
| `email_logs` | Email tracking |
| `activities` | Timeline of interactions |
| `preview_sents` | Website preview sends |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/vapi` | Initiate call |
| GET | `/api/voice/vapi?action=test` | Test connection |
| POST | `/api/voice/vapi/webhook` | VAPI status webhooks |

## Usage Example

```typescript
import { createVapiService } from '@/services/voice/vapi';
import { getLeadById } from '@/lib/db/client';

const vapi = createVapiService();
const lead = await getLeadById('lead-uuid');

const result = await vapi.initiateColdCall(lead);

if (result.success) {
  console.log(`Call initiated: ${result.callId}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

## Troubleshooting

### "VAPI not configured"
→ Fill in `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER` in `.env.local`

### "No phone number"
→ Ensure lead has a phone number in the database

### "Database connection failed"
→ Check Supabase credentials in `.env.local`

### "Call not connecting"
→ Check VAPI Dashboard for errors
→ Verify phone number format (+41...)

## Next Steps

After setup, consider implementing:
1. Workflow Automation → `src/services/workflow/`
2. Enhanced Analytics → `src/components/analytics/`
3. Export/Import → `src/lib/export/`

See `OPTIMIZATION_PLAN.md` for full roadmap.
