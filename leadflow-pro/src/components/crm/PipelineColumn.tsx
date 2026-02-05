"use client";

import { LeadCard } from "./LeadCard";
import { Lead } from "@/lib/actions/server-actions";

interface PipelineColumnProps {
  title: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
}

export function PipelineColumn({ title, leads, onLeadClick, onDeleteLead }: PipelineColumnProps) {
  return (
    <div className="flex flex-col w-72 shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 h-[calc(100vh-180px)]">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{title}</h3>
        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
          {leads.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} onDelete={onDeleteLead} />
        ))}
        {leads.length === 0 && (
          <div className="h-24 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center">
            <span className="text-slate-600 text-xs italic">No leads</span>
          </div>
        )}
      </div>
    </div>
  );
}
