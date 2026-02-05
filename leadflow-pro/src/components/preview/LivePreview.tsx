"use client";

import { useState, useEffect, useRef } from "react";
import { Lead } from "@/lib/types";

// ============================================
// LIVE PREVIEW COMPONENT
// ============================================

interface LivePreviewProps {
  lead: Lead;
  templateStyle?: "swiss_neutral" | "alpine_fresh" | "premium" | "modern";
  initialDevice?: "desktop" | "tablet" | "mobile";
}

type DeviceType = "desktop" | "tablet" | "mobile";

export function LivePreview({ 
  lead, 
  templateStyle = "swiss_neutral",
  initialDevice = "desktop" 
}: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceType>(initialDevice);
  const [variant, setVariant] = useState<string>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showVariants, setShowVariants] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load preview on mount
  useEffect(() => {
    generatePreview();
  }, [lead, templateStyle, variant]);

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/preview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          templateStyle,
          variant,
          device
        })
      });
      
      const data = await response.json();
      setPreviewHtml(data.html);
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error("Preview generation failed:", error);
      // Fallback to embedded preview
      setPreviewHtml(generateFallbackPreview());
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackPreview = (): string => {
    // Generate preview directly in component
    return generatePreviewHtml(lead, templateStyle, variant);
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Share URL copied to clipboard!");
  };

  const deviceDimensions = {
    desktop: { width: "100%", height: "100%" },
    tablet: { width: "768px", height: "1024px" },
    mobile: { width: "375px", height: "812px" }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Preview Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">
            🎨 Live Preview
          </h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {lead.company_name}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Device Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <DeviceButton 
              icon="🖥️" 
              label="Desktop" 
              isActive={device === "desktop"} 
              onClick={() => setDevice("desktop")}
            />
            <DeviceButton 
              icon="📱" 
              label="Tablet" 
              isActive={device === "tablet"} 
              onClick={() => setDevice("tablet")}
            />
            <DeviceButton 
              icon="📲" 
              label="Mobile" 
              isActive={device === "mobile"} 
              onClick={() => setDevice("mobile")}
            />
          </div>
          
          {/* Variant Selector */}
          <button
            onClick={() => setShowVariants(!showVariants)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            🎨 Varianten
          </button>
          
          {/* Share Button */}
          <button
            onClick={copyShareUrl}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            🔗 Teilen
          </button>
          
          {/* Refresh */}
          <button
            onClick={generatePreview}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? "⏳" : "🔄"} Neu laden
          </button>
        </div>
      </header>

      {/* Variants Panel */}
      {showVariants && (
        <VariantPanel 
          lead={lead}
          currentVariant={variant}
          onSelect={(v) => {
            setVariant(v);
            setShowVariants(false);
          }}
        />
      )}

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div 
          className="transition-all duration-300 ease-in-out bg-white shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: deviceDimensions[device].width,
            maxWidth: device === "desktop" ? "100%" : "100%",
            height: device === "mobile" || device === "tablet" ? deviceDimensions[device].height : "calc(100vh - 200px)",
            minHeight: "600px"
          }}
        >
          {isLoading ? (
            <LoadingState device={device} />
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
              title={`Preview for ${lead.company_name}`}
            />
          )}
        </div>
      </div>

      {/* Share URL Display */}
      {shareUrl && (
        <div className="fixed bottom-20 right-6 bg-white rounded-lg shadow-lg p-4 max-w-md">
          <p className="text-sm text-slate-600 mb-2">Share URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-xs truncate">
              {shareUrl}
            </code>
            <button
              onClick={copyShareUrl}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              📋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DEVICE BUTTON
// ============================================

function DeviceButton({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: string; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
        isActive 
          ? "bg-white shadow text-slate-800" 
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <span>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// ============================================
// VARIANT PANEL
// ============================================

interface VariantPanelProps {
  lead: Lead;
  currentVariant: string;
  onSelect: (variant: string) => void;
}

const VARIANTS = [
  { id: "professional", name: "Professionell", icon: "👔", description: "Seriös & kompetent" },
  { id: "friendly", name: "Freundlich", icon: "😊", description: "Warm & einladend" },
  { id: "urgent", name: "Dringend", icon: "🔥", description: "Handlungsorientiert" },
  { id: "story", name: "Story", icon: "📖", description: "Narrativ & emotional" }
];

function VariantPanel({ lead, currentVariant, onSelect }: VariantPanelProps) {
  const headlines = getHeadlineVariants(lead);
  
  return (
    <div className="bg-white border-b p-4">
      <h3 className="font-semibold mb-4">🎨 Headline-Varianten</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {VARIANTS.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onSelect(variant.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              currentVariant === variant.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-2xl mb-2">{variant.icon}</div>
            <div className="font-medium">{variant.name}</div>
            <div className="text-xs text-slate-500">{variant.description}</div>
            <div className="mt-2 text-sm text-slate-700 truncate">
              "{headlines[variant.id as keyof typeof headlines]}"
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

function LoadingState({ device }: { device: DeviceType }) {
  const dimensions = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[1024px]",
    mobile: "w-[375px] h-[812px]"
  };
  
  return (
    <div className={`${dimensions[device]} flex flex-col items-center justify-center bg-slate-50`}>
      <div className="animate-spin text-4xl mb-4">⏳</div>
      <p className="text-slate-600">Preview wird geladen...</p>
      <div className="mt-4 w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-pulse" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

// ============================================
// PREVIEW HTML GENERATOR
// ============================================

function generatePreviewHtml(lead: Lead, style: string, variant: string): string {
  const headline = getHeadlineVariants(lead)[variant] || `${lead.company_name}: Professionelle Webpräsenz`;
  const colors = getIndustryColors(lead.industry);
  
  return `<!DOCTYPE html>
<html lang="de-CH">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lead.company_name} - Vorschau</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .hero {
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%);
      color: white;
      padding: 60px 20px;
      text-align: center;
    }
    .hero h1 { font-size: 36px; font-weight: 800; margin-bottom: 16px; line-height: 1.2; }
    .hero p { font-size: 18px; opacity: 0.9; margin-bottom: 24px; }
    .badges { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .badge { background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 13px; }
    .cta { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: all 0.3s; }
    .btn-primary { background: white; color: ${colors.primary}; }
    .btn-secondary { background: transparent; border: 2px solid white; color: white; }
    .section { padding: 40px 20px; }
    .section-light { background: ${colors.secondary}; }
    .container { max-width: 900px; margin: 0 auto; }
    h2 { font-size: 28px; text-align: center; margin-bottom: 32px; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .feature { background: white; padding: 24px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .feature-icon { font-size: 32px; margin-bottom: 12px; }
    .about { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stats { display: flex; justify-content: center; gap: 40px; margin-top: 24px; }
    .stat { text-align: center; }
    .stat-value { font-size: 20px; font-weight: 700; }
    .stat-label { font-size: 13px; color: #6b7280; }
    .cta-final { background: ${colors.primary}; color: white; padding: 50px 20px; text-align: center; }
    .cta-final h2 { color: white; }
    .cta-final p { margin-bottom: 24px; opacity: 0.9; }
    footer { background: #1f2937; color: white; padding: 30px 20px; text-align: center; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="badges">
      <span class="badge">⭐ Google ${lead.rating || "Neu"}</span>
      <span class="badge">📍 ${lead.location}</span>
      <span class="badge">🛡️ Schweizer Qualität</span>
    </div>
    <h1>${headline}</h1>
    <p>Professionelle Webpräsenz für Ihr ${lead.industry}-Business in ${lead.location}</p>
    <div class="cta">
      <button class="btn btn-primary">${getPrimaryCTA(lead.industry)}</button>
      <button class="btn btn-secondary">${getSecondaryCTA(lead.industry)}</button>
    </div>
  </header>
  
  <section class="section section-light">
    <div class="container">
      <h2>Warum ${lead.company_name}?</h2>
      <div class="features">
        ${getFeatures(lead.industry).map((f, i) => `
          <div class="feature">
            <div class="feature-icon">${["✨", "⭐", "🎯", "🚀"][i % 4]}</div>
            <h3>${f}</h3>
          </div>
        `).join("")}
      </div>
    </div>
  </section>
  
  <section class="section">
    <div class="container">
      <div class="about">
        <h2>Über uns</h2>
        <p style="text-align: center; color: #4b5563; line-height: 1.7;">
          ${lead.company_name} ist Ihr zuverlässiger Partner für ${lead.industry} in ${lead.location}. 
          Mit Erfahrung und Engagement setzen wir uns für Ihre Projekte ein. 
          Qualität, Zuverlässigkeit und persönlicher Service stehen bei uns an erster Stelle.
        </p>
        <div class="stats">
          <div class="stat"><span class="stat-value">${getPriceRange(lead.industry)}</span><span class="stat-label">Preisbereich</span></div>
          <div class="stat"><span class="stat-value">⭐ ${lead.rating || "Neu"}</span><span class="stat-label">Bewertung</span></div>
          <div class="stat"><span class="stat-value">✓</span><span class="stat-label">CH Qualität</span></div>
        </div>
      </div>
    </div>
  </section>
  
  <section class="cta-final">
    <h2>Bereit?</h2>
    <p>Kontaktieren Sie uns jetzt für ein unverbindliches Gespräch.</p>
    <div class="cta">
      <button class="btn btn-primary" style="background: white; color: ${colors.primary};">${getPrimaryCTA(lead.industry)}</button>
      <button class="btn btn-secondary">${lead.phone || "Anrufen"}</button>
    </div>
  </section>
  
  <footer>
    <p>© 2026 ${lead.company_name}. Alle Rechte vorbehalten.</p>
    <p style="margin-top: 8px; opacity: 0.7;">🇨🇭 Schweizer Qualität aus ${lead.location}</p>
  </footer>
</body>
</html>`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getHeadlineVariants(lead: Lead): Record<string, string> {
  const patterns: Record<string, Record<string, string[]>> = {
    no_website: {
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
    }
  };
  
  const set = patterns.no_website;
  const result: Record<string, string> = {};
  
  Object.keys(set).forEach(key => {
    result[key] = set[key][Math.floor(Math.random() * set[key].length)];
  });
  
  return result;
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

// ============================================
// EXPORTS
// ============================================

export default LivePreview;
