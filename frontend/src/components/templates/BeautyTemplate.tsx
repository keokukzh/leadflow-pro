import { TemplateProps } from "./HandwerkTemplate";

export function BeautyTemplate({ companyName, brandTone, keySells, colors }: TemplateProps) {
  const primaryColor = colors[0]?.hex || "#db2777"; // Pinkish default

  return (
    <div className="min-h-screen bg-[#fafafa] text-stone-800 font-serif">
      {/* Navigation */}
      <nav className="py-8 px-12 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-100">
        <span className="text-2xl tracking-[0.2em] font-light uppercase">{companyName}</span>
        <div className="hidden md:flex gap-8 text-xs tracking-widest uppercase text-stone-400">
          <span>Treatments</span>
          <span>Galerie</span>
          <span>Kontakt</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-32 px-6 flex flex-col items-center text-center">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-6xl font-extralight tracking-tight leading-tight">
            Deine Schönheit in <br /> 
            <span className="italic" style={{ color: primaryColor }}>besten Händen</span>
          </h1>
          <p className="text-stone-500 font-sans tracking-wide max-w-xl mx-auto uppercase text-xs">
            {brandTone}
          </p>
          <div className="pt-10">
            <button className="px-12 py-5 border border-stone-200 text-stone-800 text-xs tracking-[0.3em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-700">
              Booking anfragen
            </button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          {keySells.map((sell, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="text-4xl" style={{ color: primaryColor }}>✧</div>
              <h3 className="text-xl font-light italic">{sell}</h3>
              <div className="h-px w-8 bg-stone-200 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* Visual Content */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-square bg-stone-100 flex items-center justify-center text-stone-300 italic">
          [Atmosphärisches Bild]
        </div>
        <div className="p-24 flex flex-col justify-center space-y-8 bg-white">
          <h2 className="text-4xl font-light">Exzellenz & Entspannung</h2>
          <p className="text-stone-500 font-sans leading-relaxed">
            Bei {companyName} glauben wir daran, dass wahre Schönheit von innen kommt und außen perfektioniert wird. 
            Entfliehen Sie dem Alltag in unserem modernen Studio-Ambiente.
          </p>
        </div>
      </section>

      <footer className="py-20 text-center text-[10px] tracking-[0.4em] uppercase text-stone-400">
        &copy; 2026 {companyName} &mdash; Aesthetic & Spa
      </footer>
    </div>
  );
}
