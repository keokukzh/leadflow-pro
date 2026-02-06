"use client";

import { LeadCard } from "./LeadCard";
import { Lead } from "@/lib/actions/server-actions";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface PipelineColumnProps {
  title: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  icon: LucideIcon;
  color: string;
  index: number;
}

export function PipelineColumn({ 
  title, 
  leads, 
  onLeadClick, 
  onDeleteLead,
  icon: Icon,
  color,
  index
}: PipelineColumnProps) {
  return (
    <div 
      className="flex flex-col w-72 md:w-80 shrink-0 h-[calc(100vh-280px)] stagger-item"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Technical Column Header */}
      <div className="mb-6 px-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx("p-2 rounded-xl bg-white/5 border border-white/5", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{title}</h3>
          </div>
          <span className="font-mono text-[10px] text-white/10 font-bold px-2 py-0.5 rounded-md border border-white/5">
            {leads.length.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="h-px w-full bg-linear-to-r from-white/10 to-transparent" />
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} onDelete={onDeleteLead} columnColor={color} />
        ))}
        {leads.length === 0 && (
          <div className="h-32 border border-dashed border-white/5 rounded-4xl flex flex-col items-center justify-center space-y-2 group transition-colors hover:border-white/10">
            <Icon className="w-5 h-5 text-white/5 group-hover:text-white/10 transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/10">Zero Nodes</span>
          </div>
        )}
      </div>
    </div>
  );
}
