"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Mail, Phone, FileText, CheckCircle2, Search, BrainCircuit, Loader2 } from "lucide-react";
import { getLeadInteractions, Lead, Interaction } from "@/lib/actions/server-actions";

interface LeadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const getIconForType = (type: string) => {
  switch (type.toUpperCase()) {
    case 'EMAIL': return <Mail className="h-4 w-4" />;
    case 'CALL': return <Phone className="h-4 w-4" />;
    case 'ANALYSIS': return <BrainCircuit className="h-4 w-4" />;
    case 'DISCOVERY': return <Search className="h-4 w-4" />;
    case 'STATUS_CHANGE': return <CheckCircle2 className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getAgentColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'EMAIL': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'CALL': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    default: return 'bg-slate-700 text-slate-300 border-slate-600';
  }
};

export function LeadHistoryModal({ isOpen, onClose, lead }: LeadHistoryModalProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      const fetchInteractions = async () => {
        setIsLoading(true);
        const data = await getLeadInteractions(lead.id);
        
        // Combine with discovery log if empty or as initial step
        const discoveryLog: Interaction = {
            id: 'discovery-' + lead.id,
            lead_id: lead.id,
            interaction_type: 'CALL', // We'll map discovery to a type or add a new one
            content: 'Lead in CRM gespeichert (Discovery Agent)',
            status: 'Done',
            created_at: lead.created_at
        };
        
        setInteractions([discoveryLog, ...data]);
        setIsLoading(false);
      };
      fetchInteractions();
    }
  }, [isOpen, lead]);

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <DialogTitle className="flex items-center gap-3">
             <span className="text-xl font-bold">{lead.company_name}</span>
             <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 border-slate-700">
                {lead.status}
             </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] p-6">
          {isLoading ? (
              <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
              </div>
          ) : (
            <div className="relative border-l border-slate-800 ml-3 space-y-8">
                {interactions.map((item) => (
                <div key={item.id} className="relative pl-8">
                    {/* Timeline Dot */}
                    <span className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-700 ring-4 ring-slate-900" />
                    
                    <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getAgentColor(item.interaction_type)}`}>
                            <span className="mr-1.5">{getIconForType(item.interaction_type)}</span>
                            {item.interaction_type}
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                            {format(new Date(item.created_at), "MMM d, HH:mm")}
                        </span>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-700/50">
                        {item.content}
                    </div>
                    </div>
                </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
