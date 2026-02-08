import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSettings } from '@/lib/settings';
import { updateLeadStatus, logInteraction } from '@/lib/actions/server-actions';

export async function POST(req: Request) {
  try {
    const { lead, subject, body } = await req.json();
    const settings = await getSettings();
    const apiKey = settings.resendApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: "Resend API Key ist nicht konfiguriert." }, { status: 400 });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'LeadFlow Pro <onboarding@resend.dev>', // Resend test sender
      to: 'delivered@resend.dev', // In production: lead.email (not available in our mock)
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="color: #1e293b;">${subject}</h2>
          <div style="white-space: pre-wrap; color: #475569; line-height: 1.6; margin-bottom: 24px;">
            ${body}
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Versendet via LeadFlow Pro Automatisierung.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update lead status and log interaction
    await updateLeadStatus(lead.id, 'CONTACTED');
    await logInteraction(lead.id, 'EMAIL', subject, 'Sent');

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Email API Route Error:", error);
    return NextResponse.json({ error: "Interner Fehler beim Senden der Email." }, { status: 500 });
  }
}
