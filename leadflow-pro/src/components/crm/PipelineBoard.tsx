"use client";

import { useEffect, useState } from "react";
import { PipelineColumn } from "./PipelineColumn";
import { LeadHistoryModal } from "./LeadHistoryModal";
import { getLeads, deleteLead, Lead } from "@/lib/actions/server-actions";

const COLUMNS = [
  { id: 'DISCOVERED', title: 'Gefunden' },
  { id: 'STRATEGY_CREATED', title: 'Strategie erstellt' },
  { id: 'PREVIEW_READY', title: 'Vorschau fertig' },
  { id: 'CONTACTED', title: 'Kontaktiert' },
  { id: 'WON', title: 'Zusage' },
  { id: 'LOST', title: 'Absage' },
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
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="inline-flex gap-6 h-full items-start px-2">
          {COLUMNS.map((col) => (
            <PipelineColumn
              key={col.id}
              title={col.title}
              leads={leads.filter(l => l.status === col.id)}
              onLeadClick={handleLeadClick}
              onDeleteLead={handleDeleteLead}
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
