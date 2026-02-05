"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Globe, Plus, Check } from "lucide-react";

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
    <Card className="bg-slate-900 border-slate-800 text-slate-100 overflow-hidden group hover:border-blue-500/50 transition-colors flex flex-col">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold truncate pr-2 group-hover:text-blue-400 transition-colors">
            {result.name}
          </CardTitle>
          <div className="flex flex-col items-end gap-1 shrink-0">
             <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-xs font-bold">
               <Star className="w-3 h-3 fill-current" />
               {result.rating}
             </div>
             {result.analysis && (
                <div className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter shadow-lg">
                  SC: {result.analysis.priorityScore}/10
                </div>
             )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 px-4 space-y-4 grow">
        <div className="space-y-2">
          <div className="flex items-center text-xs text-slate-400">
            <MapPin className="w-3 h-3 mr-2 text-slate-500" />
            <span className="truncate">{result.vicinity}</span>
          </div>
          
          <div className="flex items-center text-xs text-slate-400">
            <Globe className="w-3 h-3 mr-2 text-slate-500" />
            {result.website ? (
              <a href={result.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                {new URL(result.website).hostname}
              </a>
            ) : (
              <span className="italic text-red-400/80">Keine Website gefunden</span>
            )}
          </div>
        </div>

        {result.analysis && (
          <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Deep Lead Research</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${
                result.analysis.mainSentiment === 'Positiv' ? 'bg-green-500/10 text-green-500' : 
                result.analysis.mainSentiment === 'Negativ' ? 'bg-red-500/10 text-red-500' : 
                'bg-orange-500/10 text-orange-500'
              }`}>
                {result.analysis.mainSentiment}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Target Decision Maker</p>
              <p className="text-xs font-semibold text-blue-300">{result.analysis.targetDecisionMaker}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Pain Points</p>
              <div className="flex flex-wrap gap-1">
                {result.analysis.painPoints.map((p, i) => (
                  <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-blue-500/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Contact Strategy</p>
              <p className="text-[11px] leading-relaxed text-slate-300 italic">
                &ldquo;{result.analysis.conversationStarters[0]}&rdquo;
              </p>
              <p className="text-[10px] text-blue-300/60 leading-tight">
                {result.analysis.outreachStrategy}
              </p>
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 font-mono">
          {result.user_ratings_total} Bewertungen
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between gap-4">
        <Button 
          variant={result.isInCRM ? "secondary" : "default"}
          size="sm"
          className={`flex-1 text-xs font-bold transition-all ${
            result.isInCRM ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-blue-600 hover:bg-blue-500"
          }`}
          onClick={() => !result.isInCRM && onSave(result)}
          disabled={result.isInCRM || isSaving}
        >
          {result.isInCRM ? (
            <>
              <Check className="w-3 h-3 mr-2 font-black" />
              Gespeichert
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-2 font-black" />
              In CRM speichern
            </>
          )}
        </Button>
        {result.source_url && (
          <a 
            href={result.source_url} 
            target="_blank" 
            rel="noreferrer"
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-medium underline underline-offset-2 shrink-0"
          >
            Quelle öffnen
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
