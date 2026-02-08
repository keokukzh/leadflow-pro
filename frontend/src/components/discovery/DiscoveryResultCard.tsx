"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Globe, Plus, Check, Shield, Zap, Info } from "lucide-react";
import clsx from "clsx";

export interface DiscoveryResult {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  vicinity: string;
  industry?: string;
  website?: string | null;
  source_url?: string;
  isInCRM?: boolean;
  analysis?: {
    priorityScore: number;
    mainSentiment: string;
    painPoints: string[];
    targetDecisionMaker: string;
    valueProposition: string;
    outreachStrategy: string;
    conversationStarters: string[];
  } | null;
}

interface DiscoveryResultCardProps {
  result: DiscoveryResult;
  onSave: (result: DiscoveryResult) => void;
  isSaving?: boolean;
}

export function DiscoveryResultCard({ 
  result, 
  onSave, 
  isSaving 
}: DiscoveryResultCardProps) {
  return (
    <Card className="glass-panel border-white/5 text-white overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col rounded-3xl stagger-item">
      {/* Technical Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/3 border-b border-white/5 font-mono text-[9px] uppercase tracking-widest text-white/30">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-primary" />
          <span>Lead Intelligence v4.0</span>
        </div>
        <span>ID: {result.place_id.substring(0, 8)}</span>
      </div>

      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl font-serif text-white leading-tight group-hover:text-primary transition-colors">
            {result.name}
          </CardTitle>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
             <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-lg text-[10px] font-bold">
               <Star className="w-3 h-3 fill-current" />
               {result.rating || "N/A"}
             </div>
             {result.analysis && (
                <div className="bg-primary text-white border border-primary/50 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-[0_0_15px_rgba(155,35,53,0.3)]">
                  SC: {result.analysis.priorityScore}/10
                </div>
             )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6 px-6 space-y-6 grow">
        <div className="space-y-3">
          <div className="flex items-center text-xs text-white/40 group-hover:text-white/60 transition-colors">
            <MapPin className="w-3.5 h-3.5 mr-2.5 text-primary/60" />
            <span className="truncate tracking-tight">{result.vicinity}</span>
          </div>
          
          <div className="flex items-center text-xs text-white/40">
            <Globe className="w-3.5 h-3.5 mr-2.5 text-accent/60" />
            {result.website ? (
              <a href={result.website} target="_blank" rel="noreferrer" className="text-accent hover:underline font-medium">
                {new URL(result.website).hostname}
              </a>
            ) : (
              <span className="italic text-primary/80 font-medium">Missing Digital Presence</span>
            )}
          </div>
        </div>

        {result.analysis && (
          <div className="bg-white/3 rounded-2xl p-5 border border-white/5 space-y-4 group-hover:border-primary/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Strategic Analysis</span>
              </div>
              <span className={clsx(
                "text-[9px] px-2 py-0.5 rounded-md font-bold border",
                result.analysis.mainSentiment === 'Positiv' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                result.analysis.mainSentiment === 'Negativ' ? 'bg-primary/10 text-primary border-primary/20' : 
                'bg-accent/10 text-accent border-accent/20'
              )}>
                {result.analysis.mainSentiment}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Stakeholder</p>
                <p className="text-[11px] font-semibold text-white/80">{result.analysis.targetDecisionMaker}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Pain Points</p>
                <div className="flex flex-wrap gap-1">
                   {result.analysis.painPoints.slice(0, 2).map((p, i) => (
                    <span key={i} className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded border border-white/5">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed text-white/60 italic font-serif">
                  &ldquo;{result.analysis.conversationStarters[0]}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] font-mono text-white/20 pt-2">
          <span>{result.user_ratings_total} ANALYTIC DATA PTS</span>
          <span>STABILITY 98%</span>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0 flex items-center gap-3">
        <Button 
          variant={result.isInCRM ? "secondary" : "default"}
          size="lg"
          className={clsx(
            "flex-1 h-12 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
            result.isInCRM 
              ? "bg-white/5 text-primary border border-primary/20 hover:bg-white/10" 
              : "bg-primary text-white hover:bg-primary/80 shadow-[0_4px_20px_rgba(155,35,53,0.3)] hover:shadow-none"
          )}
          onClick={() => !result.isInCRM && onSave(result)}
          disabled={result.isInCRM || isSaving}
        >
          {result.isInCRM ? (
            <>
              <Check className="w-3.5 h-3.5 mr-2 font-black" />
              Integrated
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-2 font-black" />
              Add to Suite
            </>
          )}
        </Button>
        {result.source_url && (
          <a 
            href={result.source_url} 
            target="_blank" 
            rel="noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all stagger-item"
            style={{ animationDelay: '200ms' }}
          >
            <Globe className="w-5 h-5" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
