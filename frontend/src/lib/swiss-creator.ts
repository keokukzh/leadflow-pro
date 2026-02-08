import { Lead } from "@/lib/actions/server-actions";

// ============================================
// SWISS CREATOR AGENT - VERBESSERTE VERSION
// ============================================

// Swiss-specific color palettes
export const SWISS_PALETTES = {
  "swiss-neutral": {
    name: "Schweizer Neutral",
    colors: [
      { name: "Primary", hex: "#1a1a1a" },
      { name: "Accent", hex: "#dc2626" },
      { name: "Secondary", hex: "#f5f5f5" },
    ],
  },
  "alpine-fresh": {
    name: "Alpine Fresh",
    colors: [
      { name: "Primary", hex: "#0891b2" },
      { name: "Accent", hex: "#f59e0b" },
      { name: "Secondary", hex: "#ecfeff" },
    ],
  },
  "premium-schweiz": {
    name: "Premium Schweiz",
    colors: [
      { name: "Primary", hex: "#0f172a" },
      { name: "Accent", hex: "#ca8a04" },
      { name: "Secondary", hex: "#fefce8" },
    ],
  },
  "modern-zuerich": {
    name: "Modern Zürich",
    colors: [
      { name: "Primary", hex: "#6366f1" },
      { name: "Accent", hex: "#ec4899" },
      { name: "Secondary", hex: "#fafafa" },
    ],
  },
  "eco-organic": {
    name: "Eco Organic",
    colors: [
      { name: "Primary", hex: "#166534" },
      { name: "Accent", hex: "#84cc16" },
      { name: "Secondary", hex: "#f0fdf4" },
    ],
  },
  "handwerk-tradition": {
    name: "Handwerk Tradition",
    colors: [
      { name: "Primary", hex: "#78350f" },
      { name: "Accent", hex: "#b45309" },
      { name: "Secondary", hex: "#fffbeb" },
    ],
  },
};

// Swiss font recommendations
export const SWISS_FONTS = {
  "premium": { heading: "Playfair Display", body: "Inter" },
  "modern": { heading: "Space Grotesk", body: "Inter" },
  "traditional": { heading: "Merriweather", body: "Open Sans" },
  "minimal": { heading: "Geist", body: "Geist" },
  "organic": { heading: "Outfit", body: "Outfit" },
};

// ============================================
// VERBESSERTE PROMPTS
// ============================================

export const SWISS_STRATEGY_PROMPT = (lead: Lead) => `
  Du bist ein Schweizer Webdesign-Stratege mit Fokus auf KMU.
  
  UNTERNEHMEN:
  Name: ${lead.company_name}
  Branche: ${lead.industry}
  Ort: ${lead.location}
  Google Rating: ${lead.rating || "Unbekannt"}
  ${lead.review_count ? `Bewertungen: ${lead.review_count}` : ""}

  ${lead.analysis ? `
  RESEARCH:
  - Pain Points: ${lead.analysis.painPoints?.join(", ") || "Unbekannt"}
  - Sentiment: ${lead.analysis.mainSentiment || "Neutral"}
  ` : ""}

  SCHWEIZER KONTEXT:
  - Zielgruppe erwartet Professionalität und Vertrauen
  - Mehrsprachigkeit (D-CH Standard)
  - Qualität statt Quantität
  - Lokale Verankerung wichtig

  AUFGABE:
  Erstelle eine Verkaufsstrategie für eine professionelle Website:

  JSON:
  {
    "brandTone": "Charakteristische Tonalität (2-3 Wörter)",
    "keySells": ["Unique Selling Point 1", "USP 2", "USP 3"],
    "colorPalette": "swiss-neutral | alpine-fresh | premium-schweiz | modern-zuerich | eco-organic | handwerk-tradition",
    "fontStyle": "premium | modern | traditional | minimal | organic",
    "layoutType": "hero-focused | services-first | trust-building | portfolio-centered",
    "swissSpecific": {
      "localKeywords": ["${lead.location} regional", "Schweiz", "D-CH"],
      "trustSignals": ["MEISTER", "REGIONAL", "ERFAHREN"],
      "pricingNote": "Ab CHF 50.-" | "Individuelles Angebot"
    },
    "urgencyFactor": "Warum JETZT handeln?",
    "priorityScore": 1-10
  }

  Antworte NUR mit validem JSON.
`;

export const SWISS_TEMPLATE_PROMPT = (lead: Lead) => `
  Du bist ein Schweizer Webdesigner. Erstelle Inhalte für KMU.

  UNTERNEHMEN:
  ${lead.company_name} | ${lead.industry} | ${lead.location}

  STRATEGIE:
  ${JSON.stringify(lead.strategy_brief || {})}

  SCHWEIZER BEST PRACTICES:
  - Termine: "Vereinbaren Sie jetzt Ihren Termin"
  - Kontakt: "+41 44 XXX XX XX"
  - Preise: "Ab CHF 50.-" oder "Auf Anfrage"
  - Sprache: Hochdeutsch mit regionalem Verständnis
  - Vertrauen: Meisterbrief, Erfahrung, regional verwurzelt

  CONTENT STRUKTUR:
  {
    "hero": {
      "headline": "Power-Statement (max 60 Zeichen)",
      "subheadline": "Unterstützende Aussage (max 100 Zeichen)",
      "cta": "Termin vereinbaren",
      "trustBadge": "Meisterbetrieb | Seit 1995 | Regional"
    },
    "services": [
      { "title": "Dienstleistung 1", "description": "Kurzbeschreibung" },
      { "title": "Dienstleistung 2", "description": "Kurzbeschreibung" },
      { "title": "Dienstleistung 3", "description": "Kurzbeschreibung" }
    ],
    "trustSection": {
      "badge": "Bewertung: ${lead.rating || "5.0"}/5",
      "reviewSource": "Google Bewertungen",
      "yearsActive": "Seit XX Jahren",
      "certifications": ["Meisterbrief", "REGIONAL"]
    },
    "about": {
      "headline": "Regional verwurzelt, Qualität orientiert",
      "story": "Kurze Unternehmensgeschichte (max 200 Zeichen)"
    },
    "contact": {
      "phone": "+41 44 XXX XX XX",
      "email": "info@${lead.company_name.toLowerCase().replace(/\s+/g, '')}.ch",
      "address": "${lead.location}",
      "hours": "Mo-Fr: 08:00-18:00 | Sa: Nach Vereinbarung"
    }
  }

  Antworte NUR mit validem JSON.
`;

// ============================================
// INDUSTRY-SPECIFIC TEMPLATES
// ============================================

export const INDUSTRY_TEMPLATES = {
  "restaurant": {
    name: "Restaurant & Gastro",
    sections: ["Speisekarte", "Reservierung", "Atmosphäre", "Bewertungen"],
    colors: ["warm-orange", "elegant-black", "natural-green"],
    cta: "Tisch reservieren",
    trustScore: ["Google 4.5+", "Michelin", "GaultMillau"],
  },
  "medical": {
    name: "Arzt & Praxis",
    sections: ["Sprechstunden", "Team", "Notfall", "Online-Anmeldung"],
    colors: ["medical-blue", "clean-white", "trust-green"],
    cta: "Termin buchen",
    trustScore: ["FMH", "Weiterbildung", "Patientenbewertungen"],
  },
  "retail": {
    name: "Laden & Shop",
    sections: ["Sortiment", "Öffnungszeiten", "Kontakt", "Highlights"],
    colors: ["modern-purple", "urban-gray", "accent-pink"],
    cta: "Besuchen Sie uns",
    trustScore: ["Stammkunden", "Qualität", "Beratung"],
  },
  "service": {
    name: "Dienstleister",
    sections: ["Leistungen", "Prozess", "Referenzen", "Kontakt"],
    colors: ["professional-blue", "dark-navy", "gold-accent"],
    cta: "Angebot anfordern",
    trustScore: ["Projekte", "Referenzen", "Zertifizierungen"],
  },
  "realestate": {
    name: "Immobilien",
    sections: ["Portfolio", "Suchen", "Verkaufen", "Kontakt"],
    colors: ["luxury-gold", "premium-black", "clean-white"],
    cta: "Objekt besichtigen",
    trustScore: ["Verkaufserfolge", "Marktkenntnis", "Lokal"],
  },
};

// ============================================
// TEMPLATE GENERATOR
// ============================================

export function generateTemplateConfig(lead: Lead) {
  const industry = lead.industry?.toLowerCase() || "service";
  
  // Map industry to template config
  const templateConfig = INDUSTRY_TEMPLATES[industry as keyof typeof INDUSTRY_TEMPLATES] || 
                         INDUSTRY_TEMPLATES.service;
  
  return {
    template: templateConfig.name,
    sections: templateConfig.sections,
    colors: templateConfig.colors,
    cta: templateConfig.cta,
    trustSignals: templateConfig.trustScore,
  };
}

// ============================================
// QUICK TEMPLATE FOR FAST GENERATION
// ============================================

export const QUICK_TEMPLATE = (lead: Lead) => `
  ${lead.company_name}
  ${lead.industry} in ${lead.location}
  
  ${lead.strategy_brief?.brandTone || "Professionell & Regional"}
  
  Angebot: ${lead.strategy_brief?.keySells?.[0] || "Qualität aus der Region"}
  
  Kontakt: +41 44 XXX XX XX
  Website: ${lead.company_name.toLowerCase().replace(/\s+/g, '')}.ch
`;
