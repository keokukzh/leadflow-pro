// Moved from outer src to inner leadflow-pro/src/app/api/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendTemplatedEmail } from '@/services/email/emailService';
import { apiRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1).max(200).optional(),
  html: z.string().optional(),
  leadId: z.string().optional(),
  template: z.enum(["lead_intro", "demo_sent", "follow_up", "newsletter"]).optional()
});

const TemplatedEmailSchema = z.object({
  to: z.string().email(),
  template: z.enum(["lead_intro", "demo_sent", "follow_up", "newsletter"]),
  data: z.object({
    company_name: z.string(),
    contact_name: z.string(),
    preview_url: z.string().url()
  }),
  leadId: z.string().optional()
});

/**
 * @env RESEND_API_KEY
 * @throws {429} - Rate limit exceeded
 * @throws {400} - Validation error
 * @throws {500} - Email service error
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success: limitOk } = await apiRateLimit.check(10, ip);
  
  if (!limitOk) {
    logger.warn({ ip }, "Rate limit exceeded for email API");
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
  }

  try {
    const jsonBody = await req.json();
    
    // Check if it's a templated request
    if (jsonBody.data && jsonBody.template) {
      const validation = TemplatedEmailSchema.safeParse(jsonBody);
      if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
      }
      
      const { to, template, data, leadId } = validation.data;
      const result = await sendTemplatedEmail(to, template, data, leadId);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    // Normal email request
    const validation = SendEmailSchema.safeParse(jsonBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
    }

    const result = await sendEmail(validation.data);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });

  } catch (error) {
    logger.error({ error: String(error) }, "Email API Error");
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
