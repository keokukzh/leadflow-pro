import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// VALIDATION SCHEMAS (P0 FIX #1)
// ============================================

const PreviewRequestSchema = z.object({
  leadId: z.string().uuid({ message: "Invalid leadId format" }),
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
// CACHE WITH SIZE LIMIT (P0 FIX #3)
// ============================================

interface CacheEntry {
  html: string;
  shareUrl: string;
  expires: Date;
}

const MAX_CACHE_SIZE = 1000;
const previewCache = new Map<string, CacheEntry>();

function setCache(key: string, entry: CacheEntry): void {
  // Evict oldest if at capacity
  if (previewCache.size >= MAX_CACHE_SIZE) {
    const firstKey = previewCache.keys().next().value;
    if (firstKey) {
      previewCache.delete(firstKey);
    }
  }
  previewCache.set(key, entry);
}

function getCache(key: string): CacheEntry | undefined {
  const entry = previewCache.get(key);
  if (entry && entry.expires > new Date()) {
    return entry;
  }
  if (entry) {
    previewCache.delete(key);
  }
  return undefined;
}

// ============================================
// XSS ESCAPING UTILITY (P0 FIX #2)
// ============================================

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string | number | boolean | null | undefined): string {
  if (text === null || text === undefined) {
    return "";
  }
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

/**
 * Safely interpolate user data into HTML
 */
function safeInterpolate(value: string | number | null | undefined): string {
  return escapeHtml(value);
}

// ============================================
// PREVIEW GENERATION API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // P0 FIX #1: Validate input with Zod
    const validationResult = PreviewRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }
    
    const { leadId, templateStyle, variant, device } = validationResult.data;
    
    // Fetch lead data
    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();
    
    if (error || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    
    // Check cache
    const cacheKey = `${leadId}:${templateStyle}:${variant}:${device}`;
    const cached = getCache(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        html: cached.html,
        shareUrl: cached.shareUrl,
        cached: true
      });
    }
    
    // Generate preview HTML with XSS protection
    const html = generatePreviewHtml(lead, templateStyle, variant);
    
    // Use environment variable for domain (P0 FIX #3)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://leadflow.pro";
    const shareToken = generateShareToken();
    const shareUrl = `${appUrl}/preview/share/${shareToken}`;
    
    // Store share mapping
    setCache(`share:${shareToken}`, {
      html,
      shareUrl,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Cache preview
    setCache(cacheKey, {
      html,
      shareUrl,
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    
    return NextResponse.json({
      html,
      shareUrl,
      shareToken,
      cached: false
    });
    
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}

// ============================================
// SHARE LINK API
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const shareId = searchParams.get("id");
    
    // Check by share token
    if (token) {
      const cached = getCache(`share:${token}`);
      if (cached) {
        return new NextResponse(cached.html, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY"
          }
        });
      }
    }
    
    // Check by lead ID
    if (shareId) {
      const cached = getCache(`${shareId}:swiss_neutral:professional:desktop`);
      if (cached) {
        return new NextResponse(cached.html, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=3600",
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
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generatePreviewHtml(lead: any, style: string, variant: string): string {
  const headline = generateHeadline(lead, variant);
  const colors = getIndustryColors(lead.industry);
  
  // P0 FIX #2: Use safeInterpolate for all user data
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
  <title>${safeLead.company_name} - Website Vorschau</title>
  <meta name="description" content="${safeInterpolate(headline)}">
  <meta property="og:title" content="${safeLead.company_name}">
  <meta property="og:description" content="${safeInterpolate(headline)}">
  <meta property="og:type" content="website">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="robots" content="noindex, nofollow">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${safeLead.company_name}",
    "address": { "@type": "PostalAddress", "addressLocality": "${safeLead.location}" },
    "telephone": "${safeLead.phone}",
    "priceRange": "${safeInterpolate(getPriceRange(lead.industry))}",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ${lead.rating || 0},
      "reviewCount": ${lead.review_count || 0}
    }
  }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .hero {
      background: linear-gradient(135deg, ${escapeHtml(colors.primary)} 0%, ${escapeHtml(colors.accent)} 100%);
      color: white;
      padding: 60px 20px;
      text-align: center;
    }
    .hero h1 { font-size: 32px; font-weight: 800; margin-bottom: 16px; line-height: 1.2; }
    .hero p { font-size: 18px; opacity: 0.9; margin-bottom: 24px; }
    .badges { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; }
    .cta { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-top: 24px; }
    .btn { padding: 12px 28px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
    .btn-primary { background: white; color: ${escapeHtml(colors.primary)}; }
    .btn-secondary { background: transparent; border: 2px solid white; color: white; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .section { padding: 50px 20px; }
    .section-light { background: ${escapeHtml(colors.secondary)}; }
    .container { max-width: 1000px; margin: 0 auto; }
    h2 { font-size: 28px; text-align: center; margin-bottom: 32px; color: #1f2937; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
    .feature { background: white; padding: 28px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .feature-icon { font-size: 36px; margin-bottom: 12px; }
    .about { background: white; padding: 44px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .about p { color: #4b5563; line-height: 1.8; text-align: center; max-width: 700px; margin: 0 auto; }
    .stats { display: flex; justify-content: center; gap: 48px; margin-top: 32px; flex-wrap: wrap; }
    .stat { text-align: center; }
    .stat-value { display: block; font-size: 22px; font-weight: 700; color: ${escapeHtml(colors.primary)}; }
    .stat-label { font-size: 13px; color: #6b7280; text-transform: uppercase; }
    .cta-final { background: ${escapeHtml(colors.primary)}; color: white; padding: 60px 20px; text-align: center; }
    .cta-final h2 { color: white; }
    .cta-final p { margin-bottom: 28px; opacity: 0.9; font-size: 18px; }
    .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .service { background: white; padding: 20px; border-radius: 10px; text-align: center; }
    .service-icon { width: 100%; height: 100px; background: ${escapeHtml(colors.secondary)}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
    .service h4 { color: #1f2937; font-size: 14px; }
    footer { background: #1f2937; color: white; padding: 36px 20px; text-align: center; }
    footer p { opacity: 0.8; }
    @media (max-width: 640px) {
      .hero h1 { font-size: 26px; }
      .section { padding: 36px 16px; }
      .stats { gap: 24px; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="badges">
      <span class="badge">⭐ Google ${safeLead.rating}</span>
      <span class="badge">📍 ${safeLead.location}</span>
      <span class="badge">🛡️ Schweizer Qualität</span>
    </div>
    <h1>${safeInterpolate(headline)}</h1>
    <p>Professionelle Webpräsenz für Ihr ${safeLead.industry}-Business in ${safeLead.location}</p>
    <div class="cta">
      <button class="btn btn-primary">${escapeHtml(getPrimaryCTA(lead.industry))}</button>
      <button class="btn btn-secondary">${escapeHtml(getSecondaryCTA(lead.industry))}</button>
    </div>
  </header>
  
  <section class="section section-light">
    <div class="container">
      <h2>Warum ${safeLead.company_name}?</h2>
      <div class="features">
        ${getFeatures(lead.industry).map((f: string, i: number) => `
          <div class="feature">
            <div class="feature-icon">${["✨", "⭐", "🎯", "🚀"][i % 4]}</div>
            <h3>${escapeHtml(f)}</h3>
          </div>
        `).join("")}
      </div>
    </div>
  </section>
  
  <section class="section">
    <div class="container">
      <div class="about">
        <h2>Über uns</h2>
        <p>
          ${safeLead.company_name} ist Ihr zuverlässiger Partner für ${safeLead.industry} in ${safeLead.location}. 
          Mit Erfahrung und Engagement setzen wir uns für Ihre Projekte ein. 
          Qualität, Zuverlässigkeit und persönlicher Service stehen bei uns an erster Stelle.
        </p>
        <div class="stats">
          <div class="stat"><span class="stat-value">${escapeHtml(getPriceRange(lead.industry))}</span><span class="stat-label">Preisbereich</span></div>
          <div class="stat"><span class="stat-value">⭐ ${safeLead.rating}</span><span class="stat-label">Bewertung</span></div>
          <div class="stat"><span class="stat-value">✓</span><span class="stat-label">CH Qualität</span></div>
        </div>
      </div>
    </div>
  </section>
  
  <section class="section section-light">
    <div class="container">
      <h2>Unsere Leistungen</h2>
      <div class="services">
        ${getServices(lead.industry).map((s: string) => `
          <div class="service">
            <div class="service-icon">🖼️</div>
            <h4>${escapeHtml(s)}</h4>
          </div>
        `).join("")}
      </div>
    </div>
  </section>
  
  <section class="cta-final">
    <div class="container">
      <h2>Bereit?</h2>
      <p>Kontaktieren Sie uns jetzt für ein unverbindliches Gespräch.</p>
      <div class="cta">
        <button class="btn btn-primary" style="background: white; color: ${escapeHtml(colors.primary)};">${escapeHtml(getPrimaryCTA(lead.industry))}</button>
        <button class="btn btn-secondary">${safeLead.phone || "Anrufen"}</button>
      </div>
    </div>
  </section>
  
  <footer>
    <p>© 2026 ${safeLead.company_name}. Alle Rechte vorbehalten.</p>
    <p style="margin-top: 8px;">🇨🇭 Schweizer Qualität aus ${safeLead.location}</p>
  </footer>
</body>
</html>`;
}

function generateHeadline(lead: any, variant: string): string {
  const patterns: Record<string, string[]> = {
    professional: [
      `${lead.company_name}: Ihre neue Website in ${lead.location}`,
      `Professionelle Webpräsenz für ${lead.company_name}`,
      `${lead.company_name} verdient einen modernen Webauftritt`
    ],
    friendly: [
      `Willkommen bei ${lead.company_name} - neu im Web`,
      `${lead.company_name} stellt sich vor`,
      `Entdecken Sie ${lead.company_name} online`
    ],
    urgent: [
      `${lead.company_name}: Zeit für eine Website`,
      `Ohne Website verliert ${lead.company_name} Kunden`,
      `${lead.company_name} - noch nicht online? Das ändern wir`
    ],
    story: [
      `${lead.company_name}: Eine Geschichte, die erzählt werden muss`,
      `Von ${lead.location} in die weite Welt: ${lead.company_name}`,
      `${lead.company_name} - Tradition trifft Innovation`
    ]
  };
  
  const set = patterns[variant] || patterns.professional;
  return set[Math.floor(Math.random() * set.length)];
}

function getIndustryColors(industry: string): { primary: string; secondary: string; accent: string } {
  const colors: Record<string, { primary: string; secondary: string; accent: string }> = {
    restaurant: { primary: "#c2410c", secondary: "#fff7ed", accent: "#f97316" },
    beauty: { primary: "#be185d", secondary: "#fdf2f8", accent: "#ec4899" },
    handwerk: { primary: "#b45309", secondary: "#fffbeb", accent: "#d97706" },
    medical: { primary: "#0e7490", secondary: "#ecfeff", accent: "#06b6d4" },
    retail: { primary: "#1e40af", secondary: "#eff6ff", accent: "#3b82f6" },
    service: { primary: "#475569", secondary: "#f8fafc", accent: "#64748b" }
  };
  return colors[industry.toLowerCase()] || colors.service;
}

function getPrimaryCTA(industry: string): string {
  const ctas: Record<string, string> = {
    restaurant: "🍽️ Tisch reservieren",
    beauty: "💄 Termin buchen",
    handwerk: "🔨 Offerte anfordern",
    medical: "🏥 Termin vereinbaren",
    retail: "🛍️ Besuchen Sie uns",
    service: "📞 Kontakt aufnehmen"
  };
  return ctas[industry.toLowerCase()] || "📞 Kontakt aufnehmen";
}

function getSecondaryCTA(industry: string): string {
  const ctas: Record<string, string> = {
    restaurant: "📋 Menü ansehen",
    beauty: "💰 Preise",
    handwerk: "📁 Projekte",
    medical: "✉️ Kontakt",
    retail: "🛒 Sortiment",
    service: "ℹ️ Mehr erfahren"
  };
  return ctas[industry.toLowerCase()] || "ℹ️ Mehr erfahren";
}

function getFeatures(industry: string): string[] {
  const features: Record<string, string[]> = {
    restaurant: ["Frische Zutaten", "Saisonale Küche", "Gemütliches Ambiente", "Regional & lokal"],
    beauty: ["Entspannung", "Premium-Produkte", "Erfahrenes Team", "Hygienisch & sauber"],
    handwerk: ["Qualitätsarbeit", "Jahre Erfahrung", "Zuverlässig", "Termingerecht"],
    medical: ["Kompetenz", "Erfahrung", "Moderne Ausstattung", "Einfühlsam"],
    retail: ["Grosse Auswahl", "Faire Preise", "Persönliche Beratung", "Qualität"],
    service: ["Professionell", "Zuverlässig", "Individuell", "Erfahren"]
  };
  return features[industry.toLowerCase()] || features.service;
}

function getServices(industry: string): string[] {
  const services: Record<string, string[]> = {
    restaurant: ["Mittagsmenü", "Abendessen", "Events", "Catering"],
    beauty: ["Haarschnitt", "Farbe", "Styling", "Pflege"],
    handwerk: ["Neubau", "Renovation", "Reparatur", "Beratung"],
    medical: ["Beratung", "Behandlung", "Kontrolle", "Notfall"],
    retail: ["Beratung", "Produkte", "Service", "Reparatur"],
    service: ["Beratung", "Planung", "Umsetzung", "Support"]
  };
  return services[industry.toLowerCase()] || services.service;
}

function getPriceRange(industry: string): string {
  const ranges: Record<string, string> = {
    restaurant: "CHF 30-80",
    beauty: "CHF 50-250",
    handwerk: "Offerte",
    medical: "KVG / UVG",
    retail: "Verschieden",
    service: "Offerte"
  };
  return ranges[industry.toLowerCase()] || "Offerte";
}
