
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLeads, useGenerateSiteConfig } from "@/lib/hooks/useLeads";
import { LeadSidebar } from "@/components/creator/LeadSidebar";
import { CreatorToolbar } from "@/components/creator/CreatorToolbar";
import { Monitor, Cpu, Fingerprint } from "lucide-react";
import { clsx } from "clsx";

type Viewport = "desktop" | "tablet" | "mobile";

export default function CreatorContent() {
  const searchParams = useSearchParams();
  
  const { 
    data, 
    isLoading, 
    refetch 
  } = useLeads({});
  
  const leads = data?.leads || [];
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isCopied, setIsCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const generateMutation = useGenerateSiteConfig();
  
  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const isGenerating = generateMutation.isPending || selectedLead?.status === 'PREVIEW_GENERATING';
  
  // Initialize from URL
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (leadId && leads.length > 0) {
      const exists = leads.find(l => l.id === leadId);
      if (exists && exists.id !== selectedLeadId) {
          setSelectedLeadId(exists.id);
      }
    }
  }, [searchParams, leads, selectedLeadId]);

  const handleGenerate = async () => {
    if (!selectedLeadId) return;
    setLocalError(null);
    try {
      await generateMutation.mutateAsync(selectedLeadId);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Analysis synth failure.");
    }
  };

  const previewUrl = selectedLeadId ? `${window.origin}/preview/${selectedLeadId}` : "";

  const copyToClipboard = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const deviceDimensions = {
    desktop: "w-full h-full border-none rounded-none shadow-none",
    tablet: "w-[768px] h-[1024px] border border-white/5 shadow-[0_48px_100px_rgba(0,0,0,0.6)] rounded-3xl my-12",
    mobile: "w-[375px] h-[667px] border border-white/5 shadow-[0_48px_100px_rgba(0,0,0,0.6)] rounded-[3rem] my-12"
  };


  return (
    <div className="flex h-full bg-slate-950 overflow-hidden luxury-gradient relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,35,53,0.05),transparent)] pointer-events-none" />
      
      {/* Sidebar - Integrated Glass */}
      <div className="w-80 shrink-0 h-full relative z-20">
         <LeadSidebar 
            leads={leads}
            selectedLeadId={selectedLeadId}
            onSelectLead={setSelectedLeadId}
            isLoading={isLoading}
            onRefresh={refetch}
          />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
        {selectedLead ? (
          <>
            <CreatorToolbar
              currentDevice={viewport}
              onDeviceChange={setViewport}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              previewUrl={previewUrl}
              onCopyLink={copyToClipboard}
              isCopied={isCopied}
              onOpenPreview={() => window.open(previewUrl, "_blank")}
            />
            
            <div className="flex-1 overflow-y-auto flex justify-center p-8 relative custom-scrollbar">
               <div 
                 className={clsx(
                   "bg-white transition-all duration-700 origin-top shadow-[0_0_80px_rgba(0,0,0,0.4)]",
                   deviceDimensions[viewport],
                   viewport !== 'desktop' && 'transform scale-[0.85] mt-4'
                 )}
                 style={viewport === 'desktop' ? { width: '100%', minHeight: '100%' } : {}}
               >
                 <iframe 
                   src={previewUrl} 
                   className="w-full h-full border-none"
                   title="Swiss Core Preview"
                 />
               </div>
            </div>
            
            {localError && (
              <div className="absolute bottom-12 right-12 glass-panel border-primary/20 bg-primary/10 text-primary-foreground px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-serif italic tracking-wide">{localError}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            </div>
            
            <div className="relative group hover:scale-105 transition-transform duration-700">
                <div className="w-32 h-32 bg-white/2 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl ring-1 ring-white/10 group-hover:ring-accent/20 transition-all duration-700">
                  <Fingerprint className="w-12 h-12 text-white/10 group-hover:text-accent/40 transition-colors duration-700" />
                </div>
            </div>
            
            <h2 className="text-3xl font-serif text-white/90 mb-4 tracking-tight">Select Market Node</h2>
            <p className="max-w-md text-center text-white/30 font-medium leading-relaxed tracking-wide text-sm">
              Initialize the Swiss Intelligence Creator by selecting a lead from the acquisition lattice to generate an optimized digital presence.
            </p>
            
            <div className="mt-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-accent/40 bg-accent/5 px-4 py-2 rounded-full border border-accent/10">
                <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                Awaiting Authorization
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
