import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Service {
  title: string;
  description: string;
}

interface ServicesBlockProps {
  title: string;
  services: Service[];
  primaryColor: string;
}

export function ServicesBlock({ title, services, primaryColor }: ServicesBlockProps) {
  return (
    <section className="py-24 px-6 bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-16 text-center">{title || "Unsere Leistungen"}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(services || []).map((service, i) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center bg-slate-900 group-hover:scale-110 transition-transform"
                style={{ color: primaryColor || "#3b82f6" }}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
