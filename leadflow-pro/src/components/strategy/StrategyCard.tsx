"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Palette, Target, Sparkles } from "lucide-react";

export interface StrategyBrief {
  brandTone: string;
  keySells: string[];
  colorPalette: {
    name: string;
    hex: string;
  }[];
  vision?: string;
  creationToolPrompt?: string;
}

interface StrategyCardProps {
  strategy: StrategyBrief;
  companyName: string;
}

export function StrategyCard({ strategy, companyName }: StrategyCardProps) {
  return (
    <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Design Konzept: {companyName}
          </CardTitle>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">KI-Generiert</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8">
        {/* Brand Tone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <Target className="w-4 h-4" />
            Brand Tone & Tonalität
          </div>
          <p className="text-lg text-slate-200 font-medium bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            {strategy.brandTone}
          </p>
        </div>

        {/* Key Sells */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            Zentrale Verkaufsargumente
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.isArray(strategy.keySells) ? strategy.keySells.map((sell, idx) => (
              <li key={idx} className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl text-sm text-slate-300 relative overflow-hidden group">
                <span className="absolute -right-2 -bottom-2 text-blue-500/10 font-bold text-4xl group-hover:scale-110 transition-transform">
                  {idx + 1}
                </span>
                {sell}
              </li>
            )) : <li className="text-slate-500 italic">Keine Verkaufsargumente generiert</li>}
          </ul>
        </div>

        {/* Color Palette */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            Farbpalette
          </div>
          <div className="flex flex-wrap gap-4">
            {Array.isArray(strategy.colorPalette) ? strategy.colorPalette.map((color, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 h-16 rounded-2xl border border-white/10 shadow-lg transition-transform hover:scale-110 cursor-help"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
                <span className="text-[10px] font-mono text-slate-500 uppercase">{color.hex}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[64px]">{color.name}</span>
              </div>
            )) : <p className="text-slate-500 italic">Keine Farbpalette generiert</p>}
          </div>
        </div>

        {/* Creation Tool Prompt */}
        {strategy.creationToolPrompt && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-purple-400 uppercase tracking-[0.2em] font-mono">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Stitch.ai Masterprompt
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(strategy.creationToolPrompt || "");
                    const btn = document.activeElement as HTMLButtonElement;
                    const original = btn.innerHTML;
                    btn.innerHTML = "Copied!";
                    setTimeout(() => { btn.innerHTML = original; }, 1500);
                  }}
                  className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all border border-slate-700"
                >
                  Raw Copy
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(strategy.creationToolPrompt || "");
                    window.open("https://stitch.ai/portal", "_blank");
                  }}
                  className="text-[10px] font-black bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2"
                >
                  Execute Stitch Protocol
                </button>
              </div>
            </div>
            <div className="bg-[#0A0A0F] border border-purple-500/20 p-6 rounded-2xl relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <Sparkles className="w-12 h-12 text-purple-500" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap relative z-10 italic">
                {strategy.creationToolPrompt}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/5 rounded-lg border border-purple-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[9px] text-purple-400/60 font-bold uppercase tracking-widest font-mono">
                MCP Logic Engine Standby // Ready for direct ingestion
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
