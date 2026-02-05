import React from 'react';

interface ContactBlockProps {
  companyName: string;
  address: string;
  primaryColor: string;
}

export function ContactBlock({ companyName, address, primaryColor }: ContactBlockProps) {
  return (
    <section className="py-24 px-6 bg-slate-900">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Kontaktieren Sie uns</h2>
        <p className="text-slate-400 mb-12">
          Haben Sie Fragen? Wir sind bereit, Ihr Projekt mit Ihnen zu besprechen.
        </p>
        
        <div className="p-12 rounded-3xl bg-slate-950 border border-slate-800 inline-block text-left w-full">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">{companyName}</h3>
              <p className="text-slate-400">{address}</p>
            </div>
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="E-Mail ADresse" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <button 
                className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Nachricht senden
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
