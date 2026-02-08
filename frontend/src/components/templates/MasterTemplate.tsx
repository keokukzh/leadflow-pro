import React from 'react';
import { Phone, CheckCircle, Star } from 'lucide-react';
import { TemplateData } from '@/lib/actions/server-actions';

const placeholderImages = {
    hero: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    grid1: "https://images.unsplash.com/photo-1581092921461-eab62e97a783?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80",
    grid2: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80"
}

const MasterTemplate: React.FC<{ data: TemplateData }> = ({ data }) => {
  if (!data) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-medium">Lade Vorschau...</p>
        </div>
    </div>
  );

  const {
    businessName,
    primaryColor,
    heroHeadline,
    heroSubheadline,
    heroImageUrl,
    usps,
    reviewScore,
    reviewCount,
    location,
    phoneNumber,
    layoutType = 'modern-split'
  } = data;

  const bgPrimaryStyle = { backgroundColor: primaryColor };
  const textPrimaryStyle = { color: primaryColor };

  // --- RENDER HELPERS ---

  const renderHero = () => {
    switch (layoutType) {
      case 'minimal-soft':
        return (
          <section className="relative bg-white py-32 px-6 text-center overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="inline-flex items-center text-blue-600 font-bold tracking-widest uppercase text-xs mb-6">
                 {reviewScore} / 5 Sterne Rating
              </div>
              <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-8 text-slate-900 leading-[1.1]">
                {heroHeadline}
              </h1>
              <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                {heroSubheadline}
              </p>
              <button className="px-10 py-5 rounded-full text-white text-lg font-medium transition-all hover:scale-105 shadow-xl shadow-blue-500/10" style={bgPrimaryStyle}>
                Jetzt Termin buchen
              </button>
            </div>
            <div className="mt-20 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
                <img 
                    src={heroImageUrl || placeholderImages.hero} 
                    alt={businessName} 
                    className="w-full h-[400px] object-cover"
                />
            </div>
          </section>
        );

      case 'emotional-dark':
        return (
          <section className="relative bg-slate-950 text-white min-h-[90vh] flex items-center px-6 overflow-hidden">
             <div className="absolute inset-0">
                <img 
                    src={heroImageUrl || placeholderImages.hero} 
                    alt={businessName} 
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-slate-950/60 to-slate-950"></div>
             </div>
             <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center pt-20">
                <div className="space-y-8 text-center md:text-left">
                    <div className="inline-block px-4 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-sm">
                        Exklusiv in {location}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                        {heroHeadline}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-lg">
                        {heroSubheadline}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <button className="px-8 py-4 rounded-lg text-lg font-black uppercase tracking-wider shadow-2xl transition-transform hover:-translate-y-1" style={bgPrimaryStyle}>
                            Tisch reservieren
                        </button>
                    </div>
                </div>
                <div className="hidden md:block relative">
                    <div className="absolute -inset-4 border border-white/10 rounded-2xl -rotate-3 transition-transform"></div>
                    <img 
                        src={heroImageUrl || placeholderImages.hero} 
                        alt="Experience" 
                        className="rounded-2xl shadow-xl relative z-10 rotate-3 transition-transform hover:rotate-0 duration-700"
                    />
                </div>
             </div>
          </section>
        );

      case 'clean-professional':
        return (
          <section className="bg-slate-50 py-24 px-6 border-b border-slate-200">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-blue-700 font-semibold">
                        <div className="w-8 h-1 bg-blue-700"></div>
                        <span>Ihre Experten in {location}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                        {heroHeadline}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        {heroSubheadline}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-8 py-4 rounded-md text-white font-bold shadow-lg" style={bgPrimaryStyle}>
                            Beratung vereinbaren
                        </button>
                        <div className="flex items-center gap-3 px-6">
                            <Star className="text-yellow-500 fill-current w-5 h-5" />
                            <span className="font-bold text-slate-900">{reviewScore} Sterne</span>
                            <span className="text-slate-400">({reviewCount} Rezensionen)</span>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <div className="bg-white p-4 rounded-2xl shadow-xl relative z-10 border border-slate-100">
                        <img 
                            src={heroImageUrl || placeholderImages.hero} 
                            alt="Trust" 
                            className="rounded-xl w-full h-[400px] object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl -z-10 opacity-10" style={bgPrimaryStyle}></div>
                </div>
            </div>
          </section>
        );

      default: // modern-split
        return (
          <section className="relative bg-white pt-20 pb-0 md:pt-32 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="relative z-10 pb-20 md:pb-32">
                <div className="inline-flex items-center bg-slate-100 rounded-full px-4 py-1 text-sm font-semibold text-slate-600 mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Lokal & Zuverlässig
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[0.95] tracking-tighter mb-8">
                  {heroHeadline}
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                  {heroSubheadline}
                </p>
                <div className="flex gap-4">
                   <button className="px-10 py-5 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all" style={bgPrimaryStyle}>
                     Jetzt anfragen
                   </button>
                </div>
              </div>
              <div className="relative h-[400px] md:h-full min-h-[500px]">
                <div className="absolute inset-0 translate-x-12 translate-y-12 rounded-3xl opacity-10" style={bgPrimaryStyle}></div>
                <img 
                    src={heroImageUrl || placeholderImages.hero} 
                    alt={businessName}
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl relative z-10"
                />
              </div>
            </div>
          </section>
        );
    }
  };

  return (
    <div className={`antialiased ${layoutType === 'minimal-soft' ? 'bg-white' : 'bg-slate-50'}`}>
      {/* NAVBAR */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="text-xl font-black tracking-tighter" style={textPrimaryStyle}>
          {businessName}
        </div>
        <div className="hidden md:flex space-x-8 font-bold text-[13px] uppercase tracking-wider text-slate-500">
          <a href="#services" className="hover:text-slate-900 transition-colors">Leistungen</a>
        </div>
        <a href={`tel:${phoneNumber}`} className="px-5 py-2.5 rounded-full text-white font-bold text-sm shadow-md" style={bgPrimaryStyle}>
          {phoneNumber}
        </a>
      </nav>

      {renderHero()}

      {/* SERVICES SECTION */}
      <section id="services" className={`py-24 px-6 ${layoutType === 'emotional-dark' ? 'bg-slate-950 text-white' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Unsere Leistungen</h2>
            <div className="w-20 h-2" style={bgPrimaryStyle}></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {usps.slice(0, 3).map((usp, index) => (
              <div key={index} className={`p-8 rounded-3xl border transition-all hover:scale-[1.02] ${layoutType === 'emotional-dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                <CheckCircle className="w-10 h-10 mb-6" style={textPrimaryStyle} />
                <h3 className="text-xl font-bold mb-3">{usp.title}</h3>
                <p className={`${layoutType === 'emotional-dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                  {usp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-24 px-6 text-center text-white relative overflow-hidden" style={bgPrimaryStyle}>
        <div className="max-w-4xl mx-auto relative z-10">
           <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Bereit für {businessName}?</h2>
           <p className="text-xl mb-12 opacity-90 font-medium">Vereinbaren Sie noch heute Ihren Termin in {location}.</p>
           <a href={`tel:${phoneNumber}`} className="inline-flex items-center gap-4 bg-white text-slate-900 px-10 py-6 rounded-2xl text-3xl font-black shadow-2xl hover:scale-105 transition-transform">
              <Phone className="w-8 h-8" style={textPrimaryStyle} />
              {phoneNumber}
           </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        © {new Date().getFullYear()} {businessName} • {location}
      </footer>
    </div>
  );
};

export default MasterTemplate;
