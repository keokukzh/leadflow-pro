import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readData } from "@/lib/storage";

const LEADS_FILE = "leads.json";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PreviewRequestSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  templateStyle: z
    .enum(["swiss_neutral", "alpine_fresh", "premium", "modern"])
    .optional()
    .default("swiss_neutral"),
  variant: z
    .enum(["professional", "friendly", "urgent", "story"])
    .optional()
    .default("professional"),
  device: z
    .enum(["desktop", "tablet", "mobile"])
    .optional()
    .default("desktop"),
});

// ============================================
// CACHE WITH SIZE LIMIT
// ============================================

interface CacheEntry {
  html: string;
  shareUrl: string;
  expires: Date;
}

const MAX_CACHE_SIZE = 1000;
const previewCache = new Map<string, CacheEntry>();

function setCache(key: string, entry: CacheEntry): void {
  if (previewCache.size >= MAX_CACHE_SIZE) {
    const firstKey = previewCache.keys().next().value;
    if (firstKey) previewCache.delete(firstKey);
  }
  previewCache.set(key, entry);
}

function getCache(key: string): CacheEntry | undefined {
  const entry = previewCache.get(key);
  if (entry && entry.expires > new Date()) return entry;
  if (entry) previewCache.delete(key);
  return undefined;
}

// ============================================
// XSS ESCAPING UTILITY
// ============================================

function escapeHtml(text: string | number | boolean | null | undefined): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#x60;")
    .replace(/=/g, "&#x3D;");
}

function safeInterpolate(value: string | number | null | undefined): string {
  return escapeHtml(value);
}

// ============================================
// PREVIEW GENERATION API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = PreviewRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.errors }, { status: 400 });
    }
    
    const { leadId, templateStyle, variant, device } = validationResult.data;
    const leads = await readData<Record<string, any>[]>(LEADS_FILE, []);
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    
    const cacheKey = `${leadId}:${templateStyle}:${variant}:${device}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json({ ...cached, cached: true });
    
    const html = generatePreviewHtml(lead, templateStyle, variant);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://leadflow.pro";
    const shareToken = generateShareToken();
    const shareUrl = `${appUrl}/preview/share/${shareToken}`;
    
    setCache(`share:${shareToken}`, { html, shareUrl, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    setCache(cacheKey, { html, shareUrl, expires: new Date(Date.now() + 60 * 60 * 1000) });
    
    return NextResponse.json({ html, shareUrl, shareToken, cached: false });
    
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const shareId = searchParams.get("id");
    
    if (token) {
      const cached = getCache(`share:${token}`);
      if (cached) {
        return new NextResponse(cached.html, {
          headers: {
            "Content-Type": "text/html",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY"
          }
        });
      }
    }
    
    if (shareId) {
      const cached = getCache(`${shareId}:swiss_neutral:professional:desktop`);
      if (cached) {
        return new NextResponse(cached.html, {
          headers: {
            "Content-Type": "text/html",
            "X-Content-Type-Options": "nosniff"
          }
        });
      }
    }
    
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  } catch (error) {
    console.error("Share retrieval error:", error);
    return NextResponse.json({ error: "Failed to retrieve preview" }, { status: 500 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

function generatePreviewHtml(lead: Record<string, any>, style: string, variant: string): string {
  const strategy = lead.analysis?.strategy || {};
  const headline = strategy.headline || generateHeadline(lead, variant);
  const colors = strategy.colorPalette || getIndustryColors(lead.industry);
  const primaryColor = colors.primary || colors[0] || "#000000";
  
  const safeLead = {
    company_name: safeInterpolate(lead.company_name),
    industry: safeInterpolate(lead.industry),
    location: safeInterpolate(lead.location),
    rating: safeInterpolate(lead.rating || "Neu"),
    phone: safeInterpolate(lead.phone || ""),
    review_count: safeInterpolate(lead.review_count || 0),
  };
  
  return `<!DOCTYPE html>
<html lang="de-CH">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeLead.company_name} - Premium Webpräsenz</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; line-height: 1.5; color: #1a1a1a; background: #ffffff; }
    .hero {
      padding: 120px 40px;
      background: #f8f9fa;
      border-bottom: 1px solid #eeeeee;
      position: relative;
    }
    .hero-label {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${escapeHtml(primaryColor)};
      margin-bottom: 24px;
      display: block;
    }
    .hero h1 {
      font-size: 64px;
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 1.1;
      margin-bottom: 32px;
      max-width: 800px;
    }
    .hero p {
      font-size: 20px;
      color: #666666;
      max-width: 600px;
      margin-bottom: 48px;
    }
    .cta-group { display: flex; gap: 16px; }
    .btn {
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
      border-radius: 4px;
    }
    .btn-primary { background: ${escapeHtml(primaryColor)}; color: white; }
    .btn-secondary { background: transparent; border: 2px solid #eeeeee; color: #1a1a1a; }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    
    .section { padding: 100px 40px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .section-title { font-size: 32px; font-weight: 900; margin-bottom: 60px; letter-spacing: -0.02em; }
    
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
    .card { padding: 40px; border: 1px solid #eeeeee; border-radius: 8px; }
    .card h3 { font-size: 24px; font-weight: 700; margin-bottom: 16px; }
    .card p { color: #666666; }
    
    footer { padding: 60px 40px; background: #000000; color: white; display: flex; justify-content: space-between; align-items: center; }
    .swiss-icon { font-weight: 900; color: #ff0000; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <span class="hero-label">Schweizer Qualität in ${safeLead.location}</span>
      <h1>${safeInterpolate(headline)}</h1>
      <p>Exzellenter Service für ${safeLead.company_name}. Wir gestalten Ihren digitalen Erfolg mit Präzision und Ästhetik.</p>
      <div class="cta-group">
        <a href="#" class="btn btn-primary">${escapeHtml(getPrimaryCTA(lead.industry))}</a>
        <a href="#" class="btn btn-secondary">${safeLead.phone || "Anrufen"}</a>
      </div>
    </div>
  </header>
  
  <section class="section">
    <div class="container">
      <h2 class="section-title">Warum uns wählen?</h2>
      <div class="grid">
        ${(strategy.keySells || getFeatures(lead.industry)).slice(0, 3).map((f: string) => `
          <div class="card">
            <h3>${escapeHtml(f)}</h3>
            <p>Maximale Professionalität und Hingabe für jedes Detail Ihrer Projekte.</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <footer>
    <div class="container" style="display: flex; justify-content: space-between; width: 100%;">
      <div>
        <strong>${safeLead.company_name}</strong>
        <p style="opacity: 0.6; margin-top: 8px;">© 2026 Alle Rechte vorbehalten.</p>
      </div>
      <div class="swiss-icon">✚ SWISS MADE</div>
    </div>
  </footer>
</body>
</html>`;
}

function generateHeadline(lead: Record<string, any>, variant: string): string {
  const patterns: Record<string, string[]> = {
    professional: [`${lead.company_name}: Exzellenz in ${lead.location}`, `Ihr Partner für ${lead.industry}`],
    friendly: [`Willkommen bei ${lead.company_name}`, `Wir sind für Sie da in ${lead.location}`],
    urgent: [`${lead.company_name}: Jetzt digital durchstarten`, `Sichern Sie sich Ihren Vorsprung`],
    story: [`Die Tradition von ${lead.company_name}`, `Leidenschaft für ${lead.industry}`]
  };
  const set = patterns[variant] || patterns.professional;
  return set[Math.floor(Math.random() * set.length)];
}

function getIndustryColors(industry: string): Record<string, string> {
  const colors: Record<string, Record<string, string>> = {
    restaurant: { primary: "#c2410c" },
    beauty: { primary: "#be185d" },
    handwerk: { primary: "#b45309" },
    medical: { primary: "#0e7490" },
    retail: { primary: "#1e40af" },
    service: { primary: "#475569" }
  };
  return colors[industry.toLowerCase()] || colors.service;
}

function getPrimaryCTA(industry: string): string {
  const ctas: Record<string, string> = {
    restaurant: "Tisch reservieren",
    beauty: "Termin buchen",
    handwerk: "Offerte anfordern",
    medical: "Termin vereinbaren",
    retail: "Sortiment ansehen",
    service: "Kontakt aufnehmen"
  };
  return ctas[industry.toLowerCase()] || "Kontakt aufnehmen";
}

function getFeatures(industry: string): string[] {
  const feats: Record<string, string[]> = {
    restaurant: ["Frische Zutaten", "Saisonale Küche", "Lokaler Genuss"],
    beauty: ["Premium-Pflege", "Erfahrene Stylisten", "Wohlfühlatmosphäre"],
    handwerk: ["Präzision", "Zuverlässigkeit", "Meisterhandwerk"],
    medical: ["Kompetente Beratung", "Moderne Technik", "Persönliche Betreuung"],
    retail: ["Grosse Auswahl", "Faire Preise", "Exzellenter Service"],
    service: ["Massgeschneidert", "Effizient", "Erfahren"]
  };
  return feats[industry.toLowerCase()] || feats.service;
}
