"use client";

import { useEffect, useState } from "react";
import { PipelineColumn } from "./PipelineColumn";
import { LeadHistoryModal } from "./LeadHistoryModal";
import { getLeads, deleteLead, Lead } from "@/lib/actions/server-actions";
import { 
  Database, 
  Activity, 
  Terminal, 
  Layers, 
  Cpu, 
  Network 
} from "lucide-react";
import clsx from "clsx";

const COLUMNS = [
  { id: 'DISCOVERED', title: 'DISCOVERED', icon: Network, color: 'text-blue-400' },
  { id: 'STRATEGY_CREATED', title: 'ANALYZED', icon: Cpu, color: 'text-purple-400' },
  { id: 'PREVIEW_READY', title: 'FORGED', icon: Layers, color: 'text-accent' },
  { id: 'CONTACTED', title: 'OUTREACH', icon: Activity, color: 'text-orange-400' },
  { id: 'WON', title: 'ACQUIRED', icon: Database, color: 'text-green-400' },
  { id: 'LOST', title: 'ARCHIVED', icon: Terminal, color: 'text-white/20' },
];

export function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      const data = await getLeads();
      setLeads(data);
      setIsLoading(false);
    };
    fetchLeads();
  }, []);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    await deleteLead(id);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Syncing Intelligence Pipeline</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-1 overflow-x-auto custom-scrollbar pb-8">
        <div className="inline-flex gap-8 h-full items-start px-0">
          {COLUMNS.map((col, idx) => (
            <PipelineColumn
              key={col.id}
              title={col.title}
              icon={col.icon}
              color={col.color}
              leads={leads.filter(l => l.status === col.id)}
              onLeadClick={handleLeadClick}
              onDeleteLead={handleDeleteLead}
              index={idx}
            />
          ))}
        </div>
      </div>

      <LeadHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
      />
    </div>
  );
}
