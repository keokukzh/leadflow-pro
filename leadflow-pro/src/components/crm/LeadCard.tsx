"use client";

import { formatDistanceToNow } from "date-fns";
import { MapPin, Star, Trash2, Eye, ShieldCheck, Zap } from "lucide-react";
import { Lead } from "@/lib/actions/server-actions";
import clsx from "clsx";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onDelete?: (id: string) => void;
  columnColor?: string;
}

export function LeadCard({ lead, onClick, onDelete, columnColor }: LeadCardProps) {
  const hasPreview = !!lead.preview_data;

  return (
    <div 
      className="glass-panel group relative p-5 rounded-[1.8rem] bg-white/1 border-white/5 hover:border-white/10 transition-all duration-700 cursor-pointer overflow-hidden"
      onClick={() => onClick(lead)}
    >
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <ShieldCheck className={clsx("w-3 h-3", columnColor || "text-primary")} />
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 font-mono">Process // Ready</span>
            </div>
            <h4 className="text-base font-serif text-white truncate group-hover:text-primary transition-colors pr-2">
              {lead.company_name}
            </h4>
          </div>
          
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
            {hasPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/preview/${lead.id}`, '_blank');
                }}
                className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-all"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Purge ${lead.company_name} from active memory?`)) {
                    onDelete(lead.id);
                  }
                }}
                className="p-1.5 hover:bg-primary/10 text-white/40 hover:text-primary rounded-lg transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {lead.industry && (
            <div className="flex items-center text-[10px] text-white/30 font-medium">
              <Zap className="h-3 w-3 mr-2 text-accent/60" />
              <span className="truncate tracking-tight uppercase tracking-widest">{lead.industry}</span>
            </div>
          )}
          {lead.location && (
            <div className="flex items-center text-[10px] text-white/30 font-medium">
              <MapPin className="h-3 w-3 mr-2 text-primary/60" />
              <span className="truncate tracking-tight">{lead.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md font-bold text-white/40">
            <Star className="h-2.5 w-2.5 fill-accent text-accent" />
            <span className="font-mono">{lead.rating}</span>
          </div>
          <div className="text-[10px] font-mono text-white/10 font-bold uppercase tracking-tighter">
             {formatDistanceToNow(new Date(lead.created_at))}
          </div>
        </div>
      </div>
      
      {/* Dynamic Background Hover Effect */}
      <div className={clsx(
        "absolute -bottom-8 -right-8 w-16 h-16 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-1000",
        columnColor ? columnColor.replace('text-', 'bg-') : "bg-primary"
      )} />
    </div>
  );
}
