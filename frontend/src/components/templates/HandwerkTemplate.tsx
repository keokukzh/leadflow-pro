export interface TemplateProps {
  companyName: string;
  brandTone: string;
  keySells: string[];
  colors: { name: string; hex: string }[];
}

export function HandwerkTemplate({ companyName, brandTone, keySells, colors }: TemplateProps) {
  const primaryColor = colors[0]?.hex || "#2563eb";
  const secondaryColor = colors[1]?.hex || "#1e293b";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Hero Section */}
      <header className="relative py-24 px-6 text-center text-white" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl font-black tracking-tight">{companyName}</h1>
          <p className="text-xl opacity-90 font-medium max-w-2xl mx-auto">{brandTone}</p>
          <div className="pt-6">
            <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform">
              Jetzt Termin vereinbaren
            </button>
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-slate-50 py-12 border-b">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {keySells.map((sell, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                <span className="font-bold text-xl">{i + 1}</span>
              </div>
              <p className="font-semibold text-slate-700 leading-tight">{sell}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content simulation */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Qualität, die überzeugt.</h2>
          <p className="text-slate-600 leading-relaxed">
            Bei {companyName} setzen wir auf jahrelange Erfahrung und modernste Technik. 
            Unser Team garantiert Ihnen höchste Präzision und Zuverlässigkeit bei jedem Projekt.
          </p>
          <div className="flex gap-4">
            <div className="h-1 w-20 rounded-full" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>
        <div className="aspect-video bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-medium italic">
          [Bild: Professionelles Handwerk-Mockup]
        </div>
      </section>

      <footer className="py-12 bg-slate-900 text-slate-400 text-center text-sm">
        &copy; 2026 {companyName}. Alle Rechte vorbehalten.
      </footer>
    </div>
  );
}
