import { TemplateProps } from "./HandwerkTemplate";

export function TechTemplate({ companyName, brandTone, keySells, colors }: TemplateProps) {
  const primaryColor = colors[0]?.hex || "#0ea5e9"; // Blue default
  const secondaryColor = colors[1]?.hex || "#8b5cf6"; // Purple default

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[50%] h-[50%] rounded-full blur-[150px] opacity-10"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      <nav className="relative z-10 py-8 px-12 flex justify-between items-center max-w-7xl mx-auto">
        <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-slate-500">
          {companyName.toUpperCase()}
        </span>
        <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 py-32 px-6 text-center max-w-5xl mx-auto space-y-12">
        <div className="space-y-6">
          <div 
            className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase border"
            style={{ color: primaryColor, borderColor: primaryColor + '40', backgroundColor: primaryColor + '10' }}
          >
            Powered by Excellence
          </div>
          <h1 className="text-7xl font-extrabold tracking-tighter leading-tight bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
            {brandTone}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
          {keySells.map((sell, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors text-left group">
              <div 
                className="w-10 h-10 rounded-xl mb-6 flex items-center justify-center font-black"
                style={{ backgroundColor: primaryColor }}
              >
                {i + 1}
              </div>
              <p className="text-lg text-slate-300 group-hover:text-white transition-colors">{sell}</p>
            </div>
          ))}
        </div>

        <div className="pt-24 opacity-20 flex justify-center gap-12 text-sm font-bold tracking-widest grayscale">
          <span>MICROSOFT</span>
          <span>NVIDIA</span>
          <span>SPACEX</span>
          <span>OPENAI</span>
        </div>
      </main>

      <footer className="relative z-10 py-20 border-t border-white/5 text-center text-slate-600 text-xs">
        &copy; 2026 {companyName}. Build with LeadFlow Pro.
      </footer>
    </div>
  );
}
