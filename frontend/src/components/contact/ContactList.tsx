"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, Activity } from "lucide-react";
import { format } from "date-fns";
import { Lead } from "@/lib/actions/server-actions";
import clsx from "clsx";

interface ContactListProps {
  leads: Lead[];
  selectedLeadId: string;
  setSelectedLeadId: (id: string) => void;
}

export function ContactList({ leads, selectedLeadId, setSelectedLeadId }: ContactListProps) {
  const contactedLeads = leads.filter(l => l.status === 'CONTACTED');

  return (
    <Card className="glass-panel bg-white/1 border-white/5 rounded-[3rem] flex flex-col h-full min-h-[600px] border-l-4 border-l-primary/30">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Active Outreach Nodes</h3>
        </div>
      </div>
      <CardContent className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {contactedLeads.length > 0 ? contactedLeads.map((mission) => (
            <button
              key={mission.id}
              onClick={() => setSelectedLeadId(mission.id)}
              className={clsx(
                "w-full text-left p-6 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden",
                selectedLeadId === mission.id 
                  ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" 
                  : "bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10"
              )}
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-serif text-white group-hover:text-primary transition-colors">{mission.company_name}</span>
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 font-mono">Status: WAITING_REACTION</span>
                  <span className="text-[10px] font-mono text-white/40">
                    {mission.location} {' // '} {mission.rating}★
                  </span>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">LIVE MISSION</span>
                  <span className="text-[9px] font-mono text-white/20">{mission.status_updated_at ? format(new Date(mission.status_updated_at), "MMM d, HH:mm") : format(new Date(mission.created_at), "MMM d, HH:mm")}</span>
                </div>
              </div>
              {selectedLeadId === mission.id && (
                <div className="absolute top-0 right-0 p-2">
                  <Zap className="w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                </div>
              )}
            </button>
          )) : (
            <div className="py-20 text-center space-y-4 opacity-10">
               <Activity className="w-8 h-8 mx-auto" />
               <p className="text-[9px] font-black uppercase tracking-widest">No Active Nodes</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
