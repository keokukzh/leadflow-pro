"use client";

import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Lead } from "@/lib/actions/server-actions";
import { DeviceToggle } from "./DeviceToggle";
import { VariantSelector } from "./VariantSelector";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewFrame } from "./PreviewFrame";
import { ShareDialog } from "./ShareDialog";
import { LoadingOverlay } from "./LoadingOverlay";
import { ErrorMessage } from "./ErrorMessage";

interface LivePreviewProps {
  lead: Lead;
  templateStyle?: "swiss_neutral" | "alpine_fresh" | "premium" | "modern";
  initialDevice?: "desktop" | "tablet" | "mobile";
}

export type DeviceType = "desktop" | "tablet" | "mobile";

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
  const [shareToken, setShareToken] = useState<string>("");
  const [showVariants, setShowVariants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    generatePreview();
  }, [lead.id, templateStyle, variant]);

  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);
    
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
      
      if (!response.ok) {
        throw new Error("Preview generation failed");
      }
      
      const data = await response.json();
      setPreviewHtml(data.html);
      setShareUrl(data.shareUrl);
      setShareToken(data.shareToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      // Fallback to embedded preview
      setPreviewHtml(generateFallbackPreview());
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackPreview = (): string => {
    return generatePreviewHtml(lead, templateStyle, variant);
  };

  const handleCopyShareUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      // Could use toast notification here
      alert("Share URL copied to clipboard!");
    }
  };

  const handleDeviceChange = (newDevice: DeviceType) => {
    setDevice(newDevice);
  };

  const handleVariantChange = (newVariant: string) => {
    setVariant(newVariant);
    setShowVariants(false);
  };

  const deviceDimensions = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[1024px]",
    mobile: "w-[375px] h-[812px]"
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Preview Header */}
      <PreviewHeader
        lead={lead}
        device={device}
        onDeviceChange={handleDeviceChange}
        onShowVariants={() => setShowVariants(true)}
        onRefresh={generatePreview}
        isLoading={isLoading}
      />

      {/* Variant Selector Modal */}
      {showVariants && (
        <VariantSelector
          lead={lead}
          currentVariant={variant}
          onSelect={handleVariantChange}
          onClose={() => setShowVariants(false)}
        />
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={generatePreview}
          onUseFallback={() => {
            setError(null);
            setPreviewHtml(generateFallbackPreview());
          }}
        />
      )}

      {/* Main Preview Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-200">
        <div 
          className={`${deviceDimensions[device]} transition-all duration-300 bg-white shadow-2xl rounded-lg overflow-hidden`}
        >
          <PreviewFrame
            html={previewHtml}
            isLoading={isLoading}
            iframeRef={iframeRef}
          />
        </div>
      </div>

      {/* Share Dialog */}
      {shareUrl && (
        <ShareDialog
          url={shareUrl}
          token={shareToken}
          onCopy={handleCopyShareUrl}
          onClose={() => {}}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && !previewHtml && <LoadingOverlay />}
    </div>
  );
}

// Fallback preview generator
function generatePreviewHtml(lead: Lead, style: string, variant: string): string {
  const colors = getIndustryColors(lead.industry);
  const headline = getHeadline(lead, variant);
  
  return `<!DOCTYPE html>
<html lang="de-CH">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lead.company_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; }
    .hero { background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%); color: white; padding: 60px 20px; text-align: center; }
    .hero h1 { font-size: 36px; margin-bottom: 16px; }
    .section { padding: 40px 20px; }
    .section-light { background: ${colors.secondary}; }
    .container { max-width: 900px; margin: 0 auto; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .feature { background: white; padding: 24px; border-radius: 12px; text-align: center; }
    .badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 4px; }
    .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: white; color: ${colors.primary}; }
    .btn-secondary { background: transparent; border: 2px solid white; color: white; }
    h2 { font-size: 28px; text-align: center; margin-bottom: 32px; }
    footer { background: #1f2937; color: white; padding: 30px 20px; text-align: center; }
  </style>
</head>
<body>
  <header class="hero">
    <div style={{ marginBottom: 20 }}>
      <span class="badge">⭐ ${lead.rating || "Neu"}</span>
      <span class="badge">📍 ${lead.location}</span>
    </div>
    <h1>${headline}</h1>
    <p>Professionelle Webpräsenz für ${lead.industry}</p>
    <div style={{ marginTop: 24 }}>
      <button class="btn btn-primary">Kontakt</button>
      <button class="btn btn-secondary" style={{ marginLeft: 12 }}>Mehr</button>
    </div>
  </header>
  <section class="section section-light">
    <div class="container">
      <h2>Warum ${lead.company_name}?</h2>
      <div class="features">
        ${["Qualität", "Erfahrung", "Zuverlässig", "Lokal"].map((f, i) => `
          <div class="feature">
            <div style={{ fontSize: 32, marginBottom: 12 }}>${["✨", "⭐", "🎯", "🚀"][i]}</div>
            <div>${f}</div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container" style={{ textAlign: "center" }}>
      <h2>Über uns</h2>
      <p style={{ color: "#666", maxWidth: 600, margin: "0 auto", lineHeight: 1.8 }}>
        ${lead.company_name} ist Ihr Partner für ${lead.industry} in ${lead.location}.
      </p>
    </div>
  </section>
  <footer>
    <p>© 2026 ${lead.company_name}</p>
    <p style={{ marginTop: 8, opacity: 0.7 }}>🇨🇭 ${lead.location}</p>
  </footer>
</body>
</html>`;
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

function getHeadline(lead: Lead, variant: string): string {
  const patterns: Record<string, string[]> = {
    professional: [
      `${lead.company_name}: Ihre Website in ${lead.location}`,
      `Professionelle Webpräsenz für ${lead.company_name}`,
      `${lead.company_name} verdient einen modernen Webauftritt`
    ],
    friendly: [
      `Willkommen bei ${lead.company_name}`,
      `${lead.company_name} stellt sich vor`,
      `Entdecken Sie ${lead.company_name}`
    ],
    urgent: [
      `${lead.company_name}: Zeit für eine Website`,
      `Ohne Website verliert ${lead.company_name} Kunden`,
      `${lead.company_name} - noch nicht online?`
    ],
    story: [
      `${lead.company_name}: Eine Geschichte`,
      `Von ${lead.location} in die Welt: ${lead.company_name}`,
      `${lead.company_name} - Tradition trifft Innovation`
    ]
  };
  const set = patterns[variant] || patterns.professional;
  return set[Math.floor(Math.random() * set.length)];
}
