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
import { Card, CardContent } from "@/components/ui/card";
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
  CheckCircle 
} from "lucide-react";
import { getLeads, Lead, generateSiteConfig } from "@/lib/actions/server-actions";

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
    }, 3000); 

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
    const prompt = `Create a high-converting website for ${selectedLead.company_name} in the ${selectedLead.industry} industry. 
    Tone: ${selectedLead.strategy_brief?.brandTone}. 
    Key Selling Points: ${selectedLead.strategy_brief?.keySells.join(', ')}.
    Design a modern, professional layout with sections for Hero, Services, Reviews, and Contact. 
    Location: ${selectedLead.location}.`;
    navigator.clipboard.writeText(prompt);
    window.open('https://stitch.withgoogle.com/', '_blank');
  };

  const viewportWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]"
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white">Creator Agent V2</h2>
          <p className="text-slate-400">Generiere hochkonvertierende Landingpages via Template-Injection.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button 
              onClick={() => setViewport("desktop")}
              className={`p-2 rounded-md transition-colors ${viewport === "desktop" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewport("tablet")}
              className={`p-2 rounded-md transition-colors ${viewport === "tablet" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewport("mobile")}
              className={`p-2 rounded-md transition-colors ${viewport === "mobile" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-2" />

          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-700 bg-slate-900 text-xs font-bold"
            disabled={!selectedLeadId}
            onClick={copyToClipboard}
          >
            {isCopied ? "Kopiert!" : (
              <>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Preview kopieren
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => handleGenerate()}
            disabled={!selectedLeadId || isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-xs font-bold shadow-lg shadow-blue-500/20 px-6"
          >
            {isLoading ? (
                <>
                    <LucideLoader className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Wird injiziert...
                </>
            ) : (
                <>
                    {selectedLead?.preview_data ? <RefreshCw className="w-3.5 h-3.5 mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                    {selectedLead?.preview_data ? "Neu generieren" : "Vorschau generieren"}
                </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        <aside className="w-80 flex flex-col gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                  Lead auswählen
                </label>
                <Select onValueChange={setSelectedLeadId} value={selectedLeadId}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Wähle einen Lead..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Alternative: Stitch AI</label>
                    <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full font-bold">Premium Design</span>
                  </div>
                  
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                          Nutze Google Stitch für extrem hochwertige AI-Vorschauen. Wir generieren dir den perfekten Prompt.
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white border-none text-[10px] font-bold"
                        disabled={!selectedLeadId}
                        onClick={copyStitchPrompt}
                      >
                          Prompt & Stitch öffnen
                      </Button>
                  </div>
              </div>
            </CardContent>
          </Card>

          {selectedLead && (
            <Card className="bg-slate-900 border-slate-800 flex-1 overflow-hidden">
                <CardContent className="p-4 space-y-5 overflow-y-auto h-full text-xs">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Agent Intelligence</h4>
                        <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 bg-blue-500/5 px-1.5 py-0">
                            v2.0 Active
                        </Badge>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Tonalität & Branding</p>
                        </div>
                        <p className="text-slate-200 font-medium italic text-sm leading-relaxed">&quot;{selectedLead.strategy_brief?.brandTone}&quot;</p>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${selectedLead.status === 'PREVIEW_GENERATING' ? 'bg-orange-500' : 'bg-green-500'} shadow-[0_0_8px_rgba(234,179,8,0.4)]`} />
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Prozess-Status</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedLead.status === 'PREVIEW_GENERATING' ? (
                                <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                                    <LucideLoader className="w-3.5 h-3.5 animate-spin" /> Injektion läuft...
                                </span>
                            ) : selectedLead.preview_data ? (
                                <span className="flex items-center gap-1.5 text-green-500 font-bold">
                                    <CheckCircle className="w-3.5 h-3.5" /> Site-Config Bereit
                                </span>
                            ) : (
                                <span className="text-slate-500 font-bold opacity-50">Warten auf Trigger</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                             <Sparkles className="w-3 h-3 text-purple-400" />
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Design Engine</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                             <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-medium">Distinctive Typo</span>
                             <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-medium">Bold Palettes</span>
                             <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[9px] font-medium">Spatial Motion</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
          )}
        </aside>

        <main className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col">
          <div className="bg-slate-900/80 border-b border-slate-800 p-3 flex items-center justify-center gap-2">
            <div className="bg-slate-950 border border-slate-800 rounded px-4 py-1 text-[10px] text-slate-500 font-mono w-full max-w-sm text-center truncate">
                {selectedLeadId ? previewUrl : "https://preview.leadflow-pro.ai/v1/..."}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 overflow-auto">
            {selectedLeadId ? (
                <div className={`h-full border border-slate-800 shadow-2xl transition-all duration-500 overflow-hidden rounded-md bg-white ${viewportWidths[viewport]}`}>
                    <iframe 
                      src={previewUrl} 
                      className="w-full h-full border-none"
                      title="Preview"
                      key={`${selectedLeadId}-${selectedLead?.preview_data ? 'ready' : 'empty'}`}
                    />
                </div>
            ) : (
                <div className="text-center space-y-4 opacity-30">
                    <Monitor className="w-16 h-16 mx-auto text-slate-700" />
                    <p className="text-xl font-medium text-white">Wähle einen Lead aus, um die Vorschau zu laden.</p>
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
            <LucideLoader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    }>
      <CreatorContent />
    </Suspense>
  )
}
