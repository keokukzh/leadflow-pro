import React from 'react';

interface HeroBlockProps {
  title: string;
  subtitle: string;
  ctaText: string;
  primaryColor: string;
  accentColor: string;
}

export function HeroBlock({ title, subtitle, ctaText, primaryColor, accentColor }: HeroBlockProps) {
  return (
    <section className="relative py-24 px-6 overflow-hidden bg-slate-950">
      {/* Abstract Background Elements */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 opacity-20 blur-3xl rounded-full"
        style={{ backgroundColor: primaryColor }}
      />
      <div 
        className="absolute bottom-0 left-0 w-64 h-64 opacity-10 blur-3xl rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          {(title || "Firmen-Website").split(' ').map((word, i) => (
            <span key={i} className={i % 3 === 0 ? "" : "text-slate-400"}>
              {word}{' '}
            </span>
          ))}
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          {subtitle || "Ihr Partner für professionelle Lösungen."}
        </p>
        <button 
          className="px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
          style={{ backgroundColor: primaryColor || "#3b82f6", color: 'white' }}
        >
          {ctaText || "Jetzt Kontaktieren"}
        </button>
      </div>
    </section>
  );
}
