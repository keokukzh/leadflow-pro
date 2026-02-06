"use client";

import { useMemo } from "react";
import { Lead } from "@/lib/actions/server-actions";

interface VariantSelectorProps {
  lead: Lead;
  currentVariant: string;
  onSelect: (variant: string) => void;
  onClose: () => void;
}

const VARIANTS = [
  { id: "professional", name: "Professionell", icon: "👔", desc: "Seriös & kompetent" },
  { id: "friendly", name: "Freundlich", icon: "😊", desc: "Warm & einladend" },
  { id: "urgent", name: "Dringend", icon: "🔥", desc: "Handlungsorientiert" },
  { id: "story", name: "Story", icon: "📖", desc: "Narrativ & emotional" }
];

export function VariantSelector({ lead, currentVariant, onSelect, onClose }: VariantSelectorProps) {
  const headlines = useMemo(() => {
    const patterns: Record<string, string[]> = {
      professional: [`${lead.company_name}: Ihre Website`, `Professionell für ${lead.company_name}`],
      friendly: [`Willkommen bei ${lead.company_name}`, `${lead.company_name} stellt sich vor`],
      urgent: [`${lead.company_name}: Zeit für Web`, `${lead.company_name} braucht Online`],
      story: [`${lead.company_name}: Story`, `Die Geschichte von ${lead.company_name}`]
    };
    return patterns;
  }, [lead]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">🎨 Headline-Varianten</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {VARIANTS.map((variant) => {
              const isSelected = currentVariant === variant.id;
              const headline = headlines[variant.id]?.[0] || "";
              
              return (
                <button
                  key={variant.id}
                  onClick={() => onSelect(variant.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{variant.icon}</span>
                    <span className="font-medium">{variant.name}</span>
                    {isSelected && <span className="ml-auto text-blue-500">✓</span>}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{variant.desc}</p>
                  <p className="text-sm text-slate-700 truncate">"{headline}"</p>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onSelect(currentVariant)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Auswahl behalten
          </button>
        </div>
      </div>
    </div>
  );
}
