
import { useState } from "react";
import { Lead } from "@/lib/actions/server-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RefreshCw, ChevronRight, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface LeadSidebarProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function LeadSidebar({ 
  leads, 
  selectedLeadId, 
  onSelectLead, 
  isLoading, 
  onRefresh 
}: LeadSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredLeads = leads.filter(lead => 
    lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
    lead.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 flex flex-col h-full bg-slate-950/20 backdrop-blur-md border-r border-white/5">
      <div className="p-6 border-b border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <h2 className="font-serif text-xl tracking-tight text-white/90">Lead Portfolio</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh} 
            disabled={isLoading}
            className="text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Search market nodes..." 
            className="pl-10 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-accent/30 focus:ring-accent/10 transition-all duration-500 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1.5">
          {filteredLeads.map((lead, idx) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={clsx(
                "stagger-item w-full text-left p-4 rounded-xl text-sm transition-all duration-500 flex items-center justify-between group relative overflow-hidden",
                selectedLeadId === lead.id 
                  ? "bg-primary/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-primary/30" 
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              )}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Active Indicator Glow */}
              {selectedLeadId === lead.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(155,35,53,0.8)]" />
              )}
              
              <div className="overflow-hidden">
                <div className={clsx(
                  "font-medium truncate transition-colors duration-500",
                  selectedLeadId === lead.id ? "text-white" : "group-hover:text-white"
                )}>
                  {lead.company_name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/30 mt-1">
                  <span className="truncate">{lead.industry}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="truncate">{lead.location}</span>
                </div>
              </div>
              
              <ChevronRight className={clsx(
                "h-4 w-4 transition-all duration-500",
                selectedLeadId === lead.id 
                  ? "text-primary opacity-100" 
                  : "text-white/0 -translate-x-2 group-hover:text-white/20 group-hover:opacity-100 group-hover:translate-x-0"
              )} />
            </button>
          ))}
          
          {filteredLeads.length === 0 && (
             <div className="p-12 text-center space-y-3">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto">
                 <Search className="w-5 h-5 text-white/10" />
               </div>
               <p className="text-xs text-white/20 font-medium tracking-wide">
                 {isLoading ? "Synchronizing nodes..." : "No matching nodes found."}
               </p>
             </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
