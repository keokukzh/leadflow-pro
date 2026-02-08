// Moved from outer src to inner leadflow-pro/src/services/email/emailService.ts
// Resend Email Service for LeadFlow Pro
import { supabase } from '@/lib/supabase';

// Email Templates
interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  leadId?: string;
  template?: 'lead_intro' | 'demo_sent' | 'follow_up' | 'newsletter';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email Templates
export const EMAIL_TEMPLATES = {
  lead_intro: {
    subject: "🎁 Kostenlose Website-Vorschau für {{company_name}}",
    template: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .cta { display: inline-block; background: #FF0000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
    .company { font-size: 14px; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LeadFlow Pro</h1>
      <p>Professionelle Websites für Schweizer KMUs</p>
    </div>
    <div class="content">
      <p>Grüezi {{contact_name}},</p>
      
      <p>Wir von <strong>LeadFlow Pro</strong> haben gesehen, dass <strong>{{company_name}}</strong> sehr viele positive Bewertungen hat – aber noch keine professionelle Website!</p>
      
      <p>Wir haben für Sie eine <strong>kostenlose Website-Vorschau</strong> erstellt:</p>
      
      <center>
        <a href="{{preview_url}}" class="cta">📋 Website-Vorschau ansehen</a>
      </center>
      
      <p>Keine Verpflichtung – einfach anschauen und entscheiden!</p>
      
      <p>Freundliche Grüße<br>
      <strong>Ihr LeadFlow Pro Team</strong></p>
    </div>
    <div class="footer">
      <p>LeadFlow Pro – Schweiz<br>
      {{company_name}} wurde empfohlen wegen 4+ Sterne Bewertungen</p>
    </div>
  </div>
</body>
</html>
    `
  },

  demo_sent: {
    subject: "📋 Ihre Website-Vorschau ist bereit – {{company_name}}",
    template: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .cta { display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .features { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Website-Vorschau</h1>
      <p>für {{company_name}}</p>
    </div>
    <div class="content">
      <p>Grüezi {{contact_name}},</p>
      
      <p>Ihre Website-Vorschau ist jetzt online!</p>
      
      <center>
        <a href="{{preview_url}}" class="cta">🔗 Vorschau öffnen</a>
      </center>
      
      <div class="features">
        <strong>Enthalten:</strong>
        <ul>
          <li>✅ Modernes Schweizer Design</li>
          <li>✅ Mobile-optimiert</li>
          <li>✅ Schnell ladend</li>
          <li>✅ SEO-optimiert</li>
        </ul>
      </div>
      
      <p>Haben Sie Fragen? Antworten Sie einfach auf dieses Email.</p>
      
      <p>Freundliche Grüße<br>
      <strong>Ihr LeadFlow Pro Team</strong></p>
    </div>
    <div class="footer">
      LeadFlow Pro – Schweiz<br>
      <a href="https://leadflow.pro">leadflow.pro</a>
    </div>
  </div>
</body>
</html>
    `
  },

  follow_up: {
    subject: "📞 Haben Sie die Website-Vorschau gesehen? – {{company_name}}",
    template: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .cta { display: inline-block; background: #22C55E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📞 Kurze Nachfrage</h1>
      <p>zu Ihrer Website-Vorschau</p>
    </div>
    <div class="content">
      <p>Grüezi {{contact_name}},</p>
      
      <p>vor ein paar Tagen haben wir Ihnen eine Website-Vorschau für <strong>{{company_name}}</strong> gesendet.</p>
      
      <p>Haben Sie die Vorschau schon gesehen? Wir sind gespannt auf Ihr Feedback!</p>
      
      <center>
        <a href="{{preview_url}}" class="cta">📋 Vorschau ansehen</a>
      </center>
      
      <p>Falls Sie Fragen haben oder einen Termin für ein Gespräch wünschen, sind wir gerne für Sie da.</p>
      
      <p>Freundliche Grüße<br>
      <strong>Ihr LeadFlow Pro Team</strong></p>
    </div>
    <div class="footer">
      LeadFlow Pro – Schweiz<br>
      Sie erhalten diese Email weil Sie eine Website-Vorschau angefordert haben.
    </div>
  </div>
</body>
</html>
    `
  },

  newsletter: {
    subject: "🗞️ LeadFlow Pro News: Monatliches Update",
    template: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗞️ Newsletter</h1>
      <p>LeadFlow Pro Updates</p>
    </div>
    <div class="content">
      <p>Grüezi {{contact_name}},</p>
      <p>hier sind die neuesten Updates von LeadFlow Pro für Ihr Unternehmen <strong>{{company_name}}</strong>.</p>
      <p>{{message_body}}</p>
      <p>Freundliche Grüße,<br>Ihr LeadFlow Pro Team</p>
    </div>
    <div class="footer">
      LeadFlow Pro – Schweiz
    </div>
  </div>
</body>
</html>
    `
  }
};

// Replace template variables
function interpolateTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
}

// Send Email via Resend
export async function sendEmail(request: EmailRequest): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const template = EMAIL_TEMPLATES[request.template || 'lead_intro'];
    const html = request.template 
      ? interpolateTemplate(template.template, {
          company_name: 'Company',
          contact_name: 'Customer',
          preview_url: request.html
        })
      : request.html;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'LeadFlow Pro <info@leadflow.pro>',
        to: request.to,
        subject: request.subject || template.subject || 'LeadFlow Pro Notification',
        html: html || 'No content provided',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to send email' };
    }

    const data = await response.json();
    
    // Log email to database
    await logEmail({
      leadId: request.leadId,
      to: request.to,
      subject: request.subject,
      template: request.template,
      messageId: data.id,
      status: 'sent'
    });

    return { success: true, messageId: data.id };
    
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, error: String(error) };
  }
}

// Send email from template
export async function sendTemplatedEmail(
  to: string,
  template: 'lead_intro' | 'demo_sent' | 'follow_up' | 'newsletter',
  data: Record<string, string>,
  leadId?: string
): Promise<EmailResult> {
  const templateConfig = EMAIL_TEMPLATES[template];
  
  const html = interpolateTemplate(templateConfig.template, data);
  const subject = interpolateTemplate(templateConfig.subject, data);
  
  return sendEmail({
    to,
    subject,
    html,
    leadId,
    template
  });
}

// Get email history for a lead
export async function getEmailHistory(leadId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('email_logs').select('*').eq('leadId', leadId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch email history:', err);
    return [];
  }
}

// Get all email logs
export async function getAllEmails(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch all emails:', err);
    return [];
  }
}

// Log email to database
async function logEmail(data: any): Promise<void> {
  try {
    const { error } = await supabase.from('email_logs').insert(data);
    if (error) console.error('Supabase email log error:', error.message);
  } catch (err) {
    console.error('Email log sync failed:', err);
  }
  console.log('📧 Email logged:', data);
}

// Email statistics
export async function getEmailStats(): Promise<{
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}> {
  return {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0
  };
}
