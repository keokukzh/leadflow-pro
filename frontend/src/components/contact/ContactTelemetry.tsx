"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Zap } from "lucide-react";
import { format } from "date-fns";
import { Lead } from "@/lib/actions/server-actions";

interface ContactTelemetryProps {
  selectedLead: Lead | undefined;
  outreachSummary: any;
}

export function ContactTelemetry({ selectedLead, outreachSummary }: ContactTelemetryProps) {
  if (!selectedLead) return null;

  return (
    <div className="space-y-8">
      {/* Node Stats */}
      <Card className="glass-panel bg-white/1 border-white/5 rounded-[3rem] p-8 space-y-8 overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Node Telemetry</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Entity // Label</span>
              <span className="text-2xl font-serif text-white">{selectedLead.company_name}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Index</span>
                <span className="text-xs font-mono text-white/60">{selectedLead.rating} SF</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Status</span>
                <span className="text-xs font-mono text-accent uppercase">{selectedLead.status}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Outreach Mainboard Summary */}
      {outreachSummary && (
        <Card className="glass-panel bg-primary/5 border-primary/10 rounded-[3rem] p-8 space-y-6 border-l-4 border-l-primary animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 font-mono">Transmission Summary</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">First Transmission</span>
              <span className="text-[10px] font-mono text-white/60">
                {outreachSummary.firstContactAt ? format(new Date(outreachSummary.firstContactAt), "MMM d, yyyy") : 'N/A' } {' // '} {outreachSummary.firstContactMethod || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Total Protocols</span>
              <span className="text-[10px] font-mono text-primary font-black">{outreachSummary.totalAttempts} UNITS</span>
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Current Reaction</span>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-serif italic text-accent leading-relaxed">
                  &quot;{outreachSummary.latestReaction}&quot;
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
