"use client";

import { useState, useEffect } from "react";
// ... (rest of imports same)
import { useRouter } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Loader2, Save, Sparkles, AlertCircle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { getLeads, updateLeadStrategy, generateStrategyAction, Lead } from "@/lib/actions/server-actions";
import { Badge } from "@/components/ui/badge";
import { StrategyCard, StrategyBrief } from "@/components/strategy/StrategyCard";
import { useSearchParams } from "next/navigation";

export default function StrategyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<StrategyBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      const data = await getLeads();
      setLeads(data.leads);
      
      const leadId = searchParams.get("leadId");
      if (leadId) setSelectedLeadId(leadId);
    };
    fetchLeads();
  }, [searchParams]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  useEffect(() => {
    if (selectedLead?.strategy_brief) {
      setGeneratedStrategy(selectedLead.strategy_brief as StrategyBrief);
      setIsSaved(true);
    } else {
      setGeneratedStrategy(null);
      setIsSaved(false);
    }
  }, [selectedLead]);

  const handleGenerate = async () => {
    if (!selectedLead) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedStrategy(null);
    setIsSaved(false);

    try {
      const data = await generateStrategyAction(selectedLeadId);
      setGeneratedStrategy(data.strategy);
      setIsSaved(true); // Strategy is now auto-saved by generateStrategyAction
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generierung fehlgeschlagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLeadId || !generatedStrategy) return;
    
    setIsSaving(true);
    try {
      await updateLeadStrategy(selectedLeadId, generatedStrategy);
      setIsSaved(true);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToCreator = () => {
    if (selectedLeadId) {
      router.push(`/creator?leadId=${selectedLeadId}&autoStart=true`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Strategy Agent</h2>
        <p className="text-slate-400">Analysiere Leads und erstelle maßgeschneiderte Design-Konzepte.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                Lead auswählen
              </label>
              <Select onValueChange={setSelectedLeadId} value={selectedLeadId}>
                <SelectTrigger className="bg-slate-950 border-slate-800 h-12">
                  <SelectValue placeholder="Wähle einen Lead aus dem CRM..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} ({lead.location})
                    </SelectItem>
                  ))}
                  {leads.length === 0 && (
                    <div className="p-2 text-sm text-slate-500 italic">Keine Leads im CRM gefunden</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedLead && (
              <div className="flex flex-col gap-2 mb-2">
                {selectedLead.analysis ? (
                   <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1 px-3">
                     <CheckCircle2 className="w-3 h-3 mr-1.5" /> Deep Research verfügbar
                   </Badge>
                ) : (
                   <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20 py-1 px-3">
                     <Info className="w-3 h-3 mr-1.5" /> Basis-Konzept (Kein Research)
                   </Badge>
                )}
              </div>
            )}

            <Button 
              size="lg"
              className="h-12 px-8 bg-blue-600 hover:bg-blue-500 font-bold"
              disabled={!selectedLeadId || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Konzept wird erstellt...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5 mr-3" />
                  Konzept generieren
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {generatedStrategy && selectedLead && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StrategyCard 
            strategy={generatedStrategy} 
            companyName={selectedLead.company_name} 
          />
          
          <div className="flex justify-end gap-4">
            {isSaved ? (
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-500 h-14 px-10 text-lg font-black shadow-lg shadow-blue-900/20 animate-in zoom-in duration-300"
                onClick={handleGoToCreator}
              >
                <ArrowRight className="w-6 h-6 mr-3" />
                Weiter zum Website-Entwurf
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-500 h-14 px-10 text-lg font-black shadow-lg shadow-green-900/20"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Save className="w-6 h-6 mr-3" />
                    Strategie im CRM speichern
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {!generatedStrategy && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 border-2 border-dashed border-slate-800 rounded-3xl">
          <Sparkles className="w-16 h-16 mb-4 text-slate-700" />
          <p className="text-xl">Wähle einen Lead aus, um eine KI-gestützte Strategie zu generieren.</p>
        </div>
      )}
    </div>
  );
}
