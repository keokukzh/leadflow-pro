"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Copy, 
  AlertCircle, 
  LucideLoader,
  CheckCircle,
  PenTool,
  Zap,
  Globe,
  Layers,
  Palette
} from "lucide-react";
import { getLeads, Lead, generateSiteConfig } from "@/lib/actions/server-actions";
import clsx from "clsx";

type Viewport = "desktop" | "tablet" | "mobile";

function CreatorContent() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const isGeneratingPersistent = selectedLead?.status === 'PREVIEW_GENERATING';
  const isLoading = isGenerating || isGeneratingPersistent;

  const handleGenerate = useCallback(async (overrideId?: string) => {
    const targetId = overrideId || selectedLeadId;
    if (!targetId) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      await generateSiteConfig(targetId);
      const refreshedLeads = await getLeads();
      setLeads(refreshedLeads.filter(l => l.strategy_brief));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler bei der Website-Erstellung");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedLeadId]);

  useEffect(() => {
    const init = async () => {
      const allLeads = await getLeads();
      const filtered = allLeads.filter(l => l.strategy_brief);
      setLeads(filtered);
      
      const leadId = searchParams.get("leadId");
      const autoStart = searchParams.get("autoStart") === "true";
      
      if (leadId) {
        setSelectedLeadId(leadId);
        if (autoStart && filtered.some(l => l.id === leadId)) {
          handleGenerate(leadId);
        }
      }
    };
    init();
    
    const interval = setInterval(async () => {
        const allLeads = await getLeads();
        setLeads(allLeads.filter(l => l.strategy_brief));
    }, 5000); 

    return () => clearInterval(interval);
  }, [searchParams, handleGenerate]);

  const previewUrl = selectedLeadId ? `${window.origin}/preview/${selectedLeadId}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyStitchPrompt = () => {
    if (!selectedLead) return;
    const prompt = selectedLead.strategy_brief?.creationToolPrompt 
      || `Create a high-converting website for ${selectedLead.company_name} in the ${selectedLead.industry} industry.`;
    navigator.clipboard.writeText(prompt);
    window.open('https://stitch.withgoogle.com/', '_blank');
  };

  const viewportWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]"
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-10 overflow-hidden max-w-7xl mx-auto">
      {/* Header with Visual Effects */}
      <header className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-accent/80 font-medium tracking-widest uppercase text-[10px]">
            <Layers className="w-3 h-3" />
            <span>Generative Interface Forge</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-white leading-[1.1]">
            Visual <span className="text-primary italic">Forge</span>
          </h1>
          <p className="text-white/40 max-w-lg text-lg font-light leading-relaxed">
            Atmospheric site generation powered by Swiss creative intelligence and structural engineering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 glass-panel p-2 rounded-2xl border-white/5 shadow-2xl">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
            {[
              { id: "desktop", icon: Monitor },
              { id: "tablet", icon: Tablet },
              { id: "mobile", icon: Smartphone }
            ].map(({ id, icon: Icon }) => (
              <button 
                key={id}
                onClick={() => setViewport(id as Viewport)}
                className={clsx(
                  "p-2.5 rounded-lg transition-all duration-500",
                  viewport === id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/30 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/5 mx-1" />

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
            disabled={!selectedLeadId}
            onClick={copyToClipboard}
          >
            {isCopied ? "Synced" : (
              <>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy Intercept
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => handleGenerate()}
            disabled={!selectedLeadId || isLoading}
            className="h-12 bg-primary hover:bg-primary/80 text-[11px] font-black uppercase tracking-widest px-8 rounded-xl shadow-[0_10px_30px_rgba(155,35,53,0.3)] hover:shadow-none transition-all"
          >
            {isLoading ? (
                <div className="flex items-center">
                    <LucideLoader className="w-4 h-4 mr-3 animate-spin" />
                    Forging...
                </div>
            ) : (
                <div className="flex items-center">
                    {selectedLead?.preview_data ? <RefreshCw className="w-4 h-4 mr-3" /> : <Sparkles className="w-4 h-4 mr-3" />}
                    {selectedLead?.preview_data ? "Re-Forge Site" : "Initiate Forge"}
                </div>
            )}
          </Button>
        </div>
      </header>

      {error && (
        <div className="stagger-item glass-panel border-primary/20 p-5 rounded-2xl flex items-center gap-4 text-primary bg-primary/5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex gap-10 overflow-hidden pb-10">
        <aside className="w-[340px] flex flex-col gap-8 stagger-item" style={{ animationDelay: '300ms' }}>
          <div className="glass-panel p-8 rounded-[2rem] space-y-8 bg-white/1 border-white/5">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">
                Target Intelligence
              </label>
              <Select onValueChange={setSelectedLeadId} value={selectedLeadId}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 text-white/80 rounded-2xl focus:ring-primary/40 px-6 font-medium">
                  <SelectValue placeholder="Select target lead..." />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/5 bg-slate-900/95 text-white p-2 rounded-2xl">
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id} className="rounded-xl focus:bg-primary/20 focus:text-white h-12">
                      {lead.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Studio Integration</span>
                  <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px] uppercase font-bold py-0.5">Premium Flow</Badge>
                </div>
                
                <div className="p-6 bg-white/3 border border-white/5 rounded-3xl space-y-4 group hover:border-accent/30 transition-all duration-700">
                    <p className="text-[11px] text-white/40 leading-relaxed font-light">
                        Deploy this strategy directly to Google Anthos or Stitch for experimental high-precision renders.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 border-accent/20 text-accent hover:bg-accent hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl"
                      disabled={!selectedLeadId}
                      onClick={copyStitchPrompt}
                    >
                        Export via Stitch
                    </Button>
                </div>
            </div>
          </div>

          {selectedLead && (
            <div className="glass-panel p-8 rounded-[2rem] flex-1 overflow-hidden flex flex-col bg-white/1 border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-primary" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Canvas Parameters</h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-white/20 font-mono px-2">
                        V4.2
                    </Badge>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4 p-5 bg-white/3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(155,35,53,0.6)]" />
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Atmosphere</p>
                      </div>
                      <p className="text-white font-serif italic text-lg leading-relaxed">&quot;{selectedLead.strategy_brief?.brandTone}&quot;</p>
                  </div>

                  <div className="space-y-4 p-5 bg-white/3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2">
                           <Zap className="w-4 h-4 text-accent" />
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Injection Status</p>
                      </div>
                      <div className="flex items-center gap-3">
                          {selectedLead.status === 'PREVIEW_GENERATING' ? (
                              <span className="flex items-center gap-3 text-accent font-bold text-xs uppercase tracking-widest">
                                  <LucideLoader className="w-4 h-4 animate-spin" /> Live Forge
                              </span>
                          ) : selectedLead.preview_data ? (
                              <span className="flex items-center gap-3 text-green-400 font-bold text-xs uppercase tracking-widest">
                                  <CheckCircle className="w-4 h-4" /> Ready for Live
                              </span>
                          ) : (
                              <span className="text-white/20 font-bold uppercase text-[10px] tracking-widest italic">Idle parameters...</span>
                          )}
                      </div>
                  </div>

                  <div className="pt-4 space-y-5">
                      <div className="flex items-center gap-2">
                           <PenTool className="w-4 h-4 text-primary" />
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Design Hooks</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                           <span className="bg-white/5 text-white/40 border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider">Swiss Minimal</span>
                           <span className="bg-white/5 text-white/40 border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider">OKLCH Palette</span>
                           <span className="bg-white/5 text-white/40 border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider">Fluid Reveal</span>
                      </div>
                  </div>
                </div>
            </div>
          )}
        </aside>

        {/* Device Laboratory */}
        <main className="flex-1 glass-panel rounded-[3rem] p-4 bg-white/1 border-white/5 overflow-hidden flex flex-col group relative stagger-item" style={{ animationDelay: '500ms' }}>
          <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[3rem]" />
          
          <div className="bg-white/2 border-b border-white/5 p-4 flex items-center justify-between rounded-t-[2.5rem] px-8">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary/20" />
              <div className="w-3 h-3 rounded-full bg-accent/20" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <div className="bg-black/40 border border-white/5 rounded-full px-6 py-1.5 text-[10px] text-white/30 font-mono w-full max-w-sm text-center truncate italic">
                {selectedLeadId ? previewUrl : "https://forge.leadflow.pro/id/..."}
            </div>
            <Globe className="w-4 h-4 text-white/20" />
          </div>

          <div className="flex-1 flex items-center justify-center bg-black/40 relative overflow-hidden p-10">
            {/* Visual background detail */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
            
            {selectedLeadId ? (
                <div className={clsx(
                  "h-full border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-700 overflow-hidden relative group/frame",
                  viewportWidths[viewport],
                  viewport === 'mobile' ? 'rounded-[3rem] border-8 border-slate-900' : 'rounded-2xl'
                )}>
                    <iframe 
                      src={previewUrl} 
                      className="w-full h-full border-none"
                      title="Forge Preview"
                      key={`${selectedLeadId}-${selectedLead?.preview_data ? 'ready' : 'empty'}`}
                    />
                </div>
            ) : (
                <div className="text-center space-y-8 max-w-sm px-10 py-20 rounded-[3rem] relative z-10">
                    <div className="p-8 bg-white/2 border border-white/5 rounded-full inline-block">
                      <Monitor className="w-16 h-16 mx-auto text-white/10 group-hover:text-primary/20 transition-colors" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-2xl font-serif text-white/20 leading-tight italic">Waiting for Creator <br/> Parameters</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10">Laboratory Connection Optimized</p>
                    </div>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CreatorPage() {
  return (
    <Suspense fallback={
        <div className="h-full flex items-center justify-center py-20 text-slate-100">
            <div className="flex flex-col items-center gap-6">
               <LucideLoader className="w-10 h-10 animate-spin text-primary" />
               <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Syncing Creative Engine</p>
            </div>
        </div>
    }>
      <CreatorContent />
    </Suspense>
  )
}
