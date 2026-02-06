// Email API Routes
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  sendEmail, 
  sendTemplatedEmail, 
  getEmailHistory, 
  getAllEmails,
  getEmailStats,
  EMAIL_TEMPLATES 
} from "@/services/email/emailService";

// ============================================
// VALIDATION SCHEMAS
// ============================================

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

// ============================================
// POST /api/email - Send email
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if using template or custom email
    if (body.template && body.data) {
      // Templated email
      const validationResult = TemplatedEmailSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.errors },
          { status: 400 }
        );
      }
      
      const { to, template, data, leadId } = validationResult.data;
      const result = await sendTemplatedEmail(to, template, data, leadId);
      
      return NextResponse.json(result);
    } else {
      // Custom email
      const validationResult = SendEmailSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.errors },
          { status: 400 }
        );
      }
      
      const result = await sendEmail(validationResult.data);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/email - Get email info
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  
  try {
    if (leadId) {
      // Get email history for specific lead
      const history = await getEmailHistory(leadId);
      return NextResponse.json({
        leadId,
        emails: history
      });
    }
    
    // Get all emails and stats
    const emails = await getAllEmails();
    const stats = await getEmailStats();
    
    return NextResponse.json({
      templates: Object.keys(EMAIL_TEMPLATES),
      stats,
      recentEmails: emails.slice(0, 20)
    });
    
  } catch (error) {
    console.error("Email fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
