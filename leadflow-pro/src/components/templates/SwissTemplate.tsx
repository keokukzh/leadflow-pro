import { Lead } from "@/lib/actions/server-actions";
import { TemplateProps } from "./HandwerkTemplate";

interface SwissTemplateProps extends Partial<TemplateProps> {
  lead?: Lead;
  showDebug?: boolean;
}

// Swiss color palettes
const SWISS_COLORS = {
  neutral: { primary: "#1a1a1a", accent: "#dc2626", secondary: "#f5f5f5" },
  alpine: { primary: "#0891b2", accent: "#f59e0b", secondary: "#ecfeff" },
  premium: { primary: "#0f172a", accent: "#ca8a04", secondary: "#fefce8" },
  modern: { primary: "#6366f1", accent: "#ec4899", secondary: "#fafafa" },
  eco: { primary: "#166534", accent: "#84cc16", secondary: "#f0fdf4" },
};

export function SwissTemplate({ lead, showDebug = false, ...props }: SwissTemplateProps) {
  const colors = SWISS_COLORS.neutral; // Default
  const companyName = lead?.company_name || props.companyName || "Company";
  const location = lead?.location || "Schweiz";
  const rating = lead?.rating || "Neu";
  const industry = lead?.industry || "Branche";
  const strategy: any = lead?.strategy_brief || { brandTone: props.brandTone, keySells: props.keySells, swissSpecific: {} };
  
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Debug Info */}
      {showDebug && (
        <div className="bg-yellow-100 p-4 text-xs">
          <pre>{JSON.stringify({ lead, strategy }, null, 2)}</pre>
        </div>
      )}

      {/* Header */}
      <header 
        className="relative py-20 px-6 text-center text-white"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center gap-2 text-sm opacity-80">
            <span>📍 {location}</span>
            <span>|</span>
            <span>⭐ {rating}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            {companyName}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
            {strategy.brandTone || `${industry} mit Qualität und Erfahrung`}
          </p>

          {/* Trust Signals */}
          <div className="flex justify-center gap-4 pt-4 text-sm">
            {strategy.swissSpecific?.trustSignals?.map((signal: string, i: number) => (
              <span key={i} className="bg-white/20 px-3 py-1 rounded-full">
                {signal}
              </span>
            )) || (
              <>
                <span className="bg-white/20 px-3 py-1 rounded-full">Meisterbetrieb</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">Regional</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">Erfahren</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Key Selling Points */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Warum {companyName}?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(strategy.keySells || ["Qualität aus der Region", "Persönliche Beratung", "Flexible Öffnungszeiten"]).map((sell, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white font-bold"
                  style={{ backgroundColor: colors.accent }}
                >
                  {i + 1}
                </div>
                <p className="font-medium text-slate-700">{sell}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Unsere Leistungen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Dienstleistung 1", "Dienstleistung 2", "Dienstleistung 3", "Dienstleistung 4", "Dienstleistung 5", "Dienstleistung 6"].map((service, i) => (
              <div key={i} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {i + 1}
                  </div>
                  <span className="font-medium">{service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Reviews */}
      <section 
        className="py-16 px-6 text-white text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="text-6xl font-bold">⭐ {rating}</span>
            <div className="text-left">
              <p className="font-bold text-xl">Google Bewertungen</p>
              <p className="opacity-80">{lead?.review_count || "0"} Bewertungen</p>
            </div>
          </div>
          
          <p className="text-xl opacity-90">
            &quot;{strategy.brandTone || "Ihre Zufriedenheit ist unser Ziel"}&quot;
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Über uns</h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            {companyName} ist Ihr {industry}-Partner in {location}. 
            Mit Erfahrung und Engagement setzen wir uns für Ihre Anliegen ein.
            {" "}{strategy.swissSpecific?.urgencyFactor || "Profitieren Sie von unserer Expertise."}
          </p>
        </div>
      </section>

      {/* CTA / Contact */}
      <section 
        className="py-20 px-6 text-center text-white"
        style={{ backgroundColor: colors.accent }}
      >
        <h2 className="text-3xl font-bold mb-6">Bereit für {strategy.brandTone?.split(" ")[0] || "unsere Leistungen"}?</h2>
        <p className="text-xl mb-8 opacity-90">
          Kontaktieren Sie uns jetzt für ein unverbindliches Gespräch.
        </p>
        
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">
            📞 Anrufen
          </button>
          <button className="bg-transparent border-2 border-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
            📧 Email schreiben
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-sm opacity-80">
          <div>
            <p className="font-bold mb-2">📞</p>
            <p>+41 44 XXX XX XX</p>
          </div>
          <div>
            <p className="font-bold mb-2">📧</p>
            <p>info@{companyName?.toLowerCase().replace(/\s+/g, "")}.ch</p>
          </div>
          <div>
            <p className="font-bold mb-2">📍</p>
            <p>{location}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© 2026 {companyName}. Alle Rechte vorbehalten.</p>
        <p className="mt-2">🇨🇭 Schweizer Qualität aus {location}</p>
      </footer>
    </div>
  );
}

export default SwissTemplate;
