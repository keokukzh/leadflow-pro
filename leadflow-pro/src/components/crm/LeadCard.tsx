"use client";

import { formatDistanceToNow } from "date-fns";
import { MapPin, Star, MoreHorizontal, Building2, Trash2, Eye } from "lucide-react";
import { Lead } from "@/lib/actions/server-actions";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onDelete?: (id: string) => void;
}

export function LeadCard({ lead, onClick, onDelete }: LeadCardProps) {
  const hasPreview = !!lead.preview_data;

  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer group relative"
      onClick={() => onClick(lead)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-100 truncate pr-2">{lead.company_name}</h4>
        <div className="flex items-center gap-1.5">
          {hasPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/preview/${lead.id}`, '_blank');
              }}
              title="Vorschau öffnen"
              className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-all"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Möchten Sie ${lead.company_name} wirklich löschen?`)) {
                  onDelete(lead.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <MoreHorizontal className="h-4 w-4 text-slate-500 group-hover:text-white transition-opacity" />
        </div>
      </div>
      
      <div className="space-y-1.5 mb-3">
        {lead.industry && (
          <div className="flex items-center text-xs text-slate-400">
            <Building2 className="h-3 w-3 mr-1.5" />
            <span className="truncate">{lead.industry}</span>
          </div>
        )}
        {lead.location && (
          <div className="flex items-center text-xs text-slate-400">
            <MapPin className="h-3 w-3 mr-1.5" />
            <span className="truncate">{lead.location}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/50">
        <div className="flex items-center text-yellow-500">
          <Star className="h-3 w-3 mr-1 fill-current" />
          <span className="font-medium">{lead.rating}</span>
        </div>
        <div className="text-slate-500">
           {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
