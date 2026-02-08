# LeadFlow Pro - Email Integration (Resend)

## Overview

LeadFlow Pro includes a fully integrated Email automation system powered by **Resend** - the email platform for developers.

## Features

- 📧 **Transactional Emails** - Lead notifications, confirmations
- 📬 **Email Templates** - Pre-built Swiss German templates
- 📊 **Email Analytics** - Open rates, click tracking
- 🔗 **CRM Integration** - Emails linked to leads automatically
- 🎯 **Automated Follow-ups** - Schedule follow-up emails

## Prerequisites

### Resend Account

1. Create account at https://resend.com
2. Verify your domain (optional for testing)
3. Get API Key from https://resend.com/api-keys

```bash
# Environment Variables
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

## Installation

### 1. Configure Environment

Copy `.env.local.example` to `.env.local` and add your Resend API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### 2. Install Dependencies

Resend is already included in the Next.js project dependencies.

## Email Templates

### 1. Lead Intro Email

```
Subject: 🎁 Kostenlose Website-Vorschau für {{company_name}}

Use case: First contact with a lead
Trigger: When new lead is discovered
Goal: Send free website preview
```

### 2. Demo Sent Email

```
Subject: 📋 Ihre Website-Vorschau ist bereit – {{company_name}}

Use case: After preview is generated
Trigger: Manual or automatic after preview creation
Goal: Notify lead that preview is ready
```

### 3. Follow-up Email

```
Subject: 📞 Haben Sie die Website-Vorschau gesehen? – {{company_name}}

Use case: 48 hours after demo sent
Trigger: Manual or automated workflow
Goal: Re-engage interested leads
```

### 4. Newsletter Email

```
Use case: Monthly newsletter to engaged leads
Trigger: Manual
Goal: Nurture leads over time
```

## Usage

### Dashboard Integration

```tsx
import { EmailPanel } from "@/components/email";

<EmailPanel 
  leadId={lead.id}
  leadName={lead.company_name}
  leadEmail={lead.email}
  previewUrl={previewUrl}
  onEmailSent={(result) => console.log("Sent!", result)}
/>
```

### API Endpoints

#### Send Email
```bash
POST /api/email
Content-Type: application/json

{
  "to": "lead@example.com",
  "template": "lead_intro",
  "data": {
    "company_name": "Restaurant Limmat",
    "contact_name": "Mario Rossi",
    "preview_url": "https://leadflow.pro/preview/lead_123"
  },
  "leadId": "lead_123"
}
```

#### Get Email History
```bash
GET /api/email?leadId=lead_123
```

Response:
```json
{
  "leadId": "lead_123",
  "emails": [
    {
      "id": "email_456",
      "template": "lead_intro",
      "status": "sent",
      "sentAt": "2026-02-06T10:00:00Z"
    }
  ]
}
```

## Domain Verification

### For Production

To send emails from your own domain:

1. **Resend Dashboard** → Domain Settings
2. Add your domain (e.g., `leadflow.pro`)
3. Verify DNS records (SPF, DKIM, DMARC)
4. Wait for verification (up to 24 hours)

### DNS Records to Add

```
Type: TXT
Name: @ or leadflow.pro
Value: v=spf1 include:_spf.resend.com ~all

Type: CNAME
Name: mail
Value: resend.com

Type: TXT
Name: resend._domainkey
Value: (from Resend dashboard)
```

## Testing

### Test Email Sending

```bash
# Send test email
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "template": "lead_intro",
    "data": {
      "company_name": "Test Restaurant",
      "contact_name": "Test User",
      "preview_url": "https://leadflow.pro/preview/test"
    }
  }'
```

### Resend Dashboard

View sent emails, delivery rates, and opens at:
- https://resend.com/dashboard

## Email Analytics

### Track Opens and Clicks

Resend automatically tracks:
- 📬 Deliveries
- 👁️ Opens
- 🖱️ Clicks
- 🚫 Bounces
- 🏷️ Spam complaints

### Get Stats

```bash
GET /api/email
```

Response:
```json
{
  "stats": {
    "sent": 150,
    "delivered": 145,
    "opened": 89,
    "clicked": 34,
    "deliveryRate": "96.7%",
    "openRate": "61.4%"
  }
}
```

## Troubleshooting

### Email Not Sending

1. **Check API Key**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check Resend Dashboard**
   - Verify credits remaining
   - Check for errors

3. **Check Spam Folder**
   - First emails often go to spam

### Emails Going to Spam

1. **Verify Domain**
   - Use custom domain
   - Add SPF/DKIM records

2. **Warm Up**
   - Start with low volume
   - Gradually increase

### Invalid Addresses

1. **Validate Emails**
   ```bash
   # Use email-validator package
   npm install email-validator
   ```

2. **Handle Bounces**
   - Remove invalid addresses
   - Update lead status

## Pricing

Resend Free Tier:
- 3,000 emails/month
- Single domain

Resend Pro:
- $20/month for 50,000 emails
- Multiple domains
- Priority support

## File Structure

```
src/
├── services/
│   └── email/
│       └── emailService.ts     # Core email service
├── app/
│   └── api/
│       └── email/
│           └── route.ts        # API endpoints
└── components/
    └── email/
        ├── index.ts
        └── EmailPanel.tsx     # Dashboard component
```

## Integration with Workflows

### Automated Follow-up Workflow

```typescript
// After demo sent, schedule follow-up
const scheduleFollowUp = async (leadId: string) => {
  // In production, use a job queue like BullMQ
  setTimeout(async () => {
    await sendTemplatedEmail(leadEmail, "follow_up", {
      company_name: leadName,
      contact_name: contactName,
      preview_url: previewUrl
    }, leadId);
  }, 48 * 60 * 60 * 1000); // 48 hours
};
```

## License

MIT License - LeadFlow Pro
