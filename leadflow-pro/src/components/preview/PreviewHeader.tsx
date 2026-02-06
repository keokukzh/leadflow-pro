"use client";

import { Lead } from "@/lib/types";
import { DeviceType } from "./LivePreview";
import { DeviceToggle } from "./DeviceToggle";

interface PreviewHeaderProps {
  lead: Lead;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  onShowVariants: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const VARIANTS = [
  { id: "professional", name: "Professionell", icon: "👔", desc: "Seriös & kompetent" },
  { id: "friendly", name: "Freundlich", icon: "😊", desc: "Warm & einladend" },
  { id: "urgent", name: "Dringend", icon: "🔥", desc: "Handlungsorientiert" },
  { id: "story", name: "Story", icon: "📖", desc: "Narrativ & emotional" }
];

export function PreviewHeader({
  lead,
  device,
  onDeviceChange,
  onShowVariants,
  onRefresh,
  isLoading
}: PreviewHeaderProps) {
  const getHeadlines = () => {
    const patterns: Record<string, string[]> = {
      professional: [`${lead.company_name}: Ihre Website`, `Professionell für ${lead.company_name}`],
      friendly: [`Willkommen bei ${lead.company_name}`, `${lead.company_name} stellt sich vor`],
      urgent: [`${lead.company_name}: Zeit für Web`, `${lead.company_name} braucht Online`],
      story: [`${lead.company_name}: Story`, `Die Geschichte von ${lead.company_name}`]
    };
    return patterns;
  };

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800">
          🎨 Live Preview
        </h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {lead.company_name}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <DeviceToggle device={device} onDeviceChange={onDeviceChange} />
        
        <button
          onClick={onShowVariants}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
        >
          🎨 Varianten
        </button>
        
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          🔄 {isLoading ? "..." : "Neu laden"}
        </button>
      </div>
    </header>
  );
}
