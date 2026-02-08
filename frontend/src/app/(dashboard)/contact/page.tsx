"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Activity, 
  Terminal as TerminalIcon, 
  Search,
  Loader2
} from "lucide-react";
import { 
  getLeads, 
  getCombinedInteractions, 
  getOutreachSummary, 
  Lead, 
  Interaction,
  OutreachSummary
} from "@/lib/actions/server-actions";
import { ContactList } from "@/components/contact/ContactList";
import { ContactTelemetry } from "@/components/contact/ContactTelemetry";
import { ContactTransmission } from "@/components/contact/ContactTransmission";
import { ProtocolLog } from "@/components/contact/ProtocolLog";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function ContactPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [outreachSummary, setOutreachSummary] = useState<OutreachSummary | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Email State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  // Voice State
  const [voiceScript, setVoiceScript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  useEffect(() => {
    const fetchLeads = async () => {
      const allLeads = await getLeads();
      setLeads(allLeads.leads.filter(l => l.strategy_brief));
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId && selectedLead) {
      const fetchData = async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
          const [combined, summary] = await Promise.all([
            getCombinedInteractions(selectedLeadId),
            getOutreachSummary(selectedLeadId)
          ]);
          if (signal?.aborted) return;
          setInteractions(combined);
          setOutreachSummary(summary);
        } finally {
          setIsLoading(false);
        }
      };

      if (selectedLead) {
        setEmailSubject(`Strategic Proposal for ${selectedLead.company_name} // Alpha Logic`);
        setEmailBody(`
Hello ${selectedLead.company_name} Team,

I've been analyzing your market position in ${selectedLead.location}. 
Your current customer satisfaction rating of ${selectedLead.rating} indicates a strong foundation.

To further amplify your digital footprint, I've forged a high-precision website architecture specifically for your sector:
${window.location.origin}/preview/${selectedLead.id}

Our neural analysis suggests this structural pivot will optimize target acquisition by 40%.

Transmission Protocol 1.0.4.
LeadFlow Pro // Intelligence Unit
        `.trim());
      }
      
      const controller = new AbortController();
      fetchData(controller.signal);
      
      return () => controller.abort();
    }
  }, [selectedLeadId, selectedLead]);

  const refreshData = async () => {
    if (!selectedLeadId) return;
    setIsLoading(true);
    try {
      const [combined, summary] = await Promise.all([
        getCombinedInteractions(selectedLeadId),
        getOutreachSummary(selectedLeadId)
      ]);
      setInteractions(combined);
      setOutreachSummary(summary);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedLead) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/contact/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: selectedLead, subject: emailSubject, body: emailBody })
      });
      
      if (res.ok) {
        await refreshData();
      }
    } catch (error) {
      console.error("Email failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!selectedLead) return;
    setIsGeneratingVoice(true);
    try {
      const res = await fetch("/api/contact/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: selectedLead, strategy: selectedLead.strategy_brief })
      });
      const data = await res.json();
      setVoiceScript(data.script);
      setAudioUrl(data.audioUrl);
      
      await refreshData();
    } catch (error) {
      console.error("Voice failed:", error);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleInitiateCall = async () => {
    if (!selectedLead) return;
    setIsCalling(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: selectedLead, prompt: 'cold_call' })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (error) {
      console.error("Call failed:", error);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto px-4 pb-20">
      {/* Header telemetry */}
      <header className="stagger-item space-y-3 pt-4">
        <div className="flex items-center space-x-2 text-primary/80 font-medium tracking-widest uppercase text-[10px]">
          <Activity className="w-3 h-3" />
          <span>MissionControl // Outreach Module</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif text-white leading-tight">
              Command <span className="text-primary italic">Center</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg font-light leading-relaxed">
              Execute high-precision transmission protocols for Swiss market nodes.
            </p>
          </div>

          <div className="bg-white/1 p-1 rounded-[2.5rem] border border-white/5 w-full md:max-w-md backdrop-blur-3xl shadow-2xl">
            <div className="bg-white/1 p-3 rounded-[2.2rem] border border-white/5">
              <Select onValueChange={setSelectedLeadId} value={selectedLeadId}>
                <SelectTrigger className="bg-transparent border-none focus:ring-0 text-white font-mono text-xs font-black uppercase tracking-widest h-12 px-6 hover:bg-white/5 transition-colors rounded-[1.8rem]">
                  <div className="flex items-center gap-3">
                    <TerminalIcon className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="SELECT TARGET NODE..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0B] border-white/5 text-white/60 font-mono text-[10px] uppercase tracking-widest rounded-3xl">
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id} className="focus:bg-primary/10 focus:text-primary transition-colors py-3 hover:bg-white/5 cursor-pointer">
                      {lead.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {!selectedLeadId && leads.filter(l => l.status === 'CONTACTED').length === 0 ? (
          <div className="stagger-item glass-panel bg-white/1 border-white/5 border-dashed py-48 text-center rounded-[4rem]" style={{ animationDelay: '200ms' }}>
            <div className="relative inline-block mb-10">
              <Search className="w-24 h-24 mx-auto text-white/5" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            </div>
            <p className="text-white/20 font-black uppercase tracking-[1em] text-[10px]">Awaiting Node Selection</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-16 gap-8 stagger-item" style={{ animationDelay: '200ms' }}>
            {/* Left Telemetry Pane (Col 4/16) */}
            <div className="lg:col-span-4 space-y-8">
                {selectedLeadId ? (
                  <>
                    <ErrorBoundary>
                      <ContactTelemetry 
                        selectedLead={selectedLead} 
                        outreachSummary={outreachSummary} 
                      />
                    </ErrorBoundary>
                    {isLoading ? (
                      <div className="p-12 flex flex-col items-center justify-center space-y-4 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Syncing Ledger...</p>
                      </div>
                    ) : (
                      <ErrorBoundary>
                         <ProtocolLog interactions={interactions} />
                      </ErrorBoundary>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full border border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/10 font-mono">Telemetry Standby</p>
                  </div>
                )}
            </div>

            {/* Center Command Modules (Col 8/16) */}
            <div className="lg:col-span-8 space-y-8">
                {selectedLeadId ? (
                  <ErrorBoundary>
                    <ContactTransmission
                      selectedLead={selectedLead}
                      emailSubject={emailSubject}
                      setEmailSubject={setEmailSubject}
                      emailBody={emailBody}
                      setEmailBody={setEmailBody}
                      isSending={isSending}
                      handleSendEmail={handleSendEmail}
                      isGeneratingVoice={isGeneratingVoice}
                      handleGenerateVoice={handleGenerateVoice}
                      voiceScript={voiceScript}
                      audioUrl={audioUrl}
                      isCalling={isCalling}
                      handleInitiateCall={handleInitiateCall}
                    />
                  </ErrorBoundary>
                ) : (
                  <div className="stagger-item glass-panel bg-white/1 border-white/5 border-dashed py-48 text-center rounded-[4rem]" style={{ animationDelay: '200ms' }}>
                    <div className="relative inline-block mb-10" />
                    <p className="text-white/20 font-black uppercase tracking-[1em] text-[10px]">Awaiting Node Selection</p>
                  </div>
                )}
            </div>

            {/* Right Active Mission Sidebar (Col 4/16) */}
            <div className="lg:col-span-4 space-y-8">
                <ContactList 
                  leads={leads} 
                  selectedLeadId={selectedLeadId}
                  setSelectedLeadId={setSelectedLeadId}
                />
            </div>
        </div>
      )}
    </div>
  );
}
