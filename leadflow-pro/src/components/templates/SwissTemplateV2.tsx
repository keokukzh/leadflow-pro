import { Lead } from "@/lib/actions/server-actions";

// ============================================
// 🎨 SWISS TEMPLATE V2 - With AI Content
// ============================================

interface SwissTemplateV2Props {
  lead: Lead;
  config?: TemplateConfig;
}

interface TemplateConfig {
  heroImage?: string;
  heroImageCredit?: string;
  brandTone?: string;
  primaryColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  showDebug?: boolean;
}

// Enhanced Swiss Color Palettes
export const SWISS_COLORS_V2 = {
  "swiss-neutral": {
    name: "Schweizer Neutral",
    primary: "#1a1a1a",
    accent: "#dc2626",
    secondary: "#f5f5f5",
    gradient: "from-slate-900 to-slate-800"
  },
  "alpine-fresh": {
    name: "Alpine Fresh",
    primary: "#0891b2",
    accent: "#f59e0b",
    secondary: "#ecfeff",
    gradient: "from-cyan-600 to-cyan-800"
  },
  "premium-schweiz": {
    name: "Premium Schweiz",
    primary: "#0f172a",
    accent: "#ca8a04",
    secondary: "#fefce8",
    gradient: "from-slate-950 to-slate-900"
  },
  "modern-zuerich": {
    name: "Modern Zürich",
    primary: "#6366f1",
    accent: "#ec4899",
    secondary: "#fafafa",
    gradient: "from-indigo-600 to-purple-600"
  },
  "eco-organic": {
    name: "Eco Organic",
    primary: "#166534",
    accent: "#84cc16",
    secondary: "#f0fdf4",
    gradient: "from-green-700 to-green-900"
  },
  "handwerk-tradition": {
    name: "Handwerk Tradition",
    primary: "#78350f",
    accent: "#b45309",
    secondary: "#fffbeb",
    gradient: "from-amber-800 to-amber-950"
  },
};

// ============================================
// 🎯 TRUST BADGES
// ============================================

export const TRUST_BADGES = {
  "beauty": [
    "⭐ Google 4.8+",
    "💄 Zertifizierte Kosmetik",
    "✨ Premium Produkte",
    "🛡️ 100% Swiss Made"
  ],
  "handwerk": [
    "🔨 Meisterbetrieb",
    "📋 SUISA zertifiziert",
    "🛡️ 5 Jahre Garantie",
    "⭐ Google Bewertungen"
  ],
  "restaurant": [
    "👨‍🍳 HACCP zertifiziert",
    "🍽️ Frische Zutaten",
    "⭐ Google 4.5+",
    "🛡️ regional & saisonal"
  ],
  "retail": [
    "⭐ Top Bewertungen",
    "🛡️ 30 Tage Rückgabe",
    "✨ Premium Qualität",
    "📞 Persönliche Beratung"
  ],
  "service": [
    "⭐ Google 4.8+",
    "📋 Zertifiziert",
    "🛡️ Fair & Transparent",
    "💼 Professionell"
  ],
  "default": [
    "⭐ Google Bewertungen",
    "🛡️ Qualität aus der Schweiz",
    "📞 Kostenlose Beratung",
    "✨ Seit über 10 Jahren"
  ]
};

// ============================================
// 🎨 TEMPLATE V2
// ============================================

export function SwissTemplateV2({ lead, config }: SwissTemplateV2Props) {
  const colors = SWISS_COLORS_V2["swiss-neutral"];
  const industry = lead.industry?.toLowerCase() || "service";
  
  // Get industry-specific badges
  const badges = TRUST_BADGES[industry as keyof typeof TRUST_BADGES] || TRUST_BADGES["default"];
  
  // AI-generated content (or fallback)
  const brandTone = config?.brandTone || lead.strategy_brief?.brandTone || 
    `${lead.industry} mit Qualität und Erfahrung`;
  
  const heroImage = config?.heroImage || 
    `https://images.unsplash.com/photo-${getRandomImageId(industry)}?w=1200`;
  
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Debug Info */}
      {config?.showDebug && (
        <div className="bg-yellow-100 p-4 text-xs">
          <pre>{JSON.stringify({ lead, config }, null, 2)}</pre>
        </div>
      )}

      {/* 🎨 HERO SECTION */}
      <header 
        className="relative py-24 px-6 text-white overflow-hidden"
        style={{ backgroundColor: colors.primary }}
      >
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className={`absolute inset- bg-gradient-to-r ${colors.gradient} opacity-80`} />
        
        <div className="relative max-w-5xl mx-auto space-y-8">
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {badges.map((badge, i) => (
              <span 
                key={i}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-center leading-tight">
            {lead.company_name}
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-center opacity-90 max-w-3xl mx-auto">
            {brandTone}
          </p>

          {/* Location & Rating */}
          <div className="flex justify-center items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              📍 {lead.location}
            </span>
            <span className="flex items-center gap-2">
              ⭐ {lead.rating || "Neu"} ({lead.review_count || 0})
            </span>
          </div>

          {/* CTA */}
          <div className="flex justify-center gap-4 pt-4">
            <button 
              className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl"
              style={{ color: colors.primary }}
            >
              📞 Anrufen
            </button>
            <button 
              className="border-2 border-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
            >
              ✉️ Email
            </button>
          </div>
        </div>
      </header>

      {/* 🎯 KEY SELLING POINTS */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Warum {lead.company_name}?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(lead.strategy_brief?.keySells || [
              "Qualität aus der Region",
              "Persönliche Beratung",
              "Flexible Öffnungszeiten"
            ]).map((sell, i) => (
              <div 
                key={i}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4"
                  style={{ backgroundColor: colors.accent }}
                >
                  {i + 1}
                </div>
                <p className="text-lg font-medium text-slate-700">{sell}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🖼️ SERVICES / PORTFOLIO */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Unsere Leistungen
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Professioneller Service für Ihre Bedürfnisse
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Dienstleistung 1", "Dienstleistung 2", "Dienstleistung 3", 
              "Dienstleistung 4", "Dienstleistung 5", "Dienstleistung 6"].map((service, i) => (
              <div 
                key={i}
                className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-slate-200"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundImage: `url(https://images.unsplash.com/photo-${getServiceImageId(industry, i)}?w=600)` 
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-bold text-lg">{service}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐ TESTIMONIALS */}
      <section 
        className="py-20 px-6 text-white text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center gap-4 mb-8">
            <span className="text-7xl font-bold">{lead.rating || "Neu"}</span>
            <div className="text-left">
              <p className="text-xl font-bold">Google Bewertungen</p>
              <p className="opacity-80">{lead.review_count || 0} Bewertungen</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <p className="text-lg italic mb-4">
                "Sehr zufrieden mit der Arbeit. Jederzeit wieder!"
              </p>
              <p className="font-medium">⭐⭐⭐⭐⭐ Google Review</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <p className="text-lg italic mb-4">
                "Professioneller Service, faire Preise, top Ergebnis."
              </p>
              <p className="font-medium">⭐⭐⭐⭐⭐ Google Review</p>
            </div>
          </div>
        </div>
      </section>

      {/* ℹ️ ABOUT */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Über uns</h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            {lead.company_name} ist Ihr {lead.industry}-Partner in {lead.location}. 
            Mit Erfahrung und Engagement setzen wir uns für Ihre Projekte ein. 
            Qualität, Zuverlässigkeit und persönlicher Service stehen bei uns an erster Stelle.
          </p>
        </div>
      </section>

      {/* 📞 CTA / CONTACT */}
      <section 
        className="py-24 px-6 text-center text-white"
        style={{ backgroundColor: colors.accent }}
      >
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Bereit für {brandTone.split(" ")[0] || "uns"}?
          </h2>
          <p className="text-xl opacity-90">
            Kontaktieren Sie uns jetzt für ein unverbindliches Gespräch.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
            <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl">
              📞 Anrufen
            </button>
            <button className="border-2 border-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
              ✉️ Email schreiben
            </button>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-base opacity-80">
            <div>
              <p className="font-bold mb-2">📞</p>
              <p>+41 44 XXX XX XX</p>
            </div>
            <div>
              <p className="font-bold mb-2">📧</p>
              <p>info@{lead.company_name?.toLowerCase().replace(/\s+/g, "")}.ch</p>
            </div>
            <div>
              <p className="font-bold mb-2">📍</p>
              <p>{lead.location}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-sm">
        <p>© 2026 {lead.company_name}. Alle Rechte vorbehalten.</p>
        <p className="mt-2">🇨🇭 Schweizer Qualität aus {lead.location}</p>
      </footer>
    </div>
  );
}

// Helper functions
function getRandomImageId(industry: string): string {
  const ids: Record<string, number[]> = {
    "beauty": [1560428, 1524596, 1523973],
    "handwerk": [1600589, 1509427, 1509035],
    "restaurant": [1517244, 1514933, 1504673],
    "retail": [1441986, 1443848, 1443885],
    "service": [1600888, 1600105, 1571043],
  };
  
  const pool = ids[industry] || ids["service"];
  return pool[Math.floor(Math.random() * pool.length)].toString();
}

function getServiceImageId(industry: string, index: number): string {
  const ids: Record<string, number[][]> = {
    "beauty": [[1560428], [1524596], [1523973], [1560428], [1524596], [1523973]],
    "handwerk": [[1600589], [1509427], [1509035], [1600589], [1509427], [1509035]],
    "restaurant": [[1517244], [1514933], [1504673], [1517244], [1514933], [1504673]],
  };
  
  const pool = ids[industry] || ids["restaurant"];
  const imgIds = pool[index] || pool[0];
  return imgIds[0].toString();
}

export default SwissTemplateV2;
