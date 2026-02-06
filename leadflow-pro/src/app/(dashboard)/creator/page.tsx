"use client";

import { Suspense, lazy } from "react";
import { SkeletonCard } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load the main content component
const CreatorContent = lazy(() => import("./CreatorContent"));

function CreatorLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-64 h-4" />
        </div>
        <Skeleton className="w-32 h-8" />
      </div>

      {/* Lead Selection Skeleton */}
      <SkeletonCard />
    </div>
  );
}

function CreatorError({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <div className="p-8 bg-red-50 rounded-xl border border-red-200">
      <div className="flex items-center gap-3 text-red-700">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-medium">Creator konnte nicht geladen werden</h3>
          <p className="text-sm text-red-600 mt-1">{error?.message || "Unbekannter Fehler"}</p>
        </div>
      </div>
      {onRetry && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

export default function CreatorPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Creator</h1>
          <p className="text-slate-400">Erstellen Sie professionelle Websites für Ihre Leads</p>
        </div>
      </div>

      {/* Main Content with Error Boundary */}
      <ErrorBoundary
        fallback={(error, reset) => <CreatorError error={error} onRetry={reset} />}
      >
        <Suspense fallback={<CreatorLoading />}>
          <CreatorContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

import { useState } from "react";
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
  Monitor, 
  Smartphone, 
  Tablet, 
  Copy, 
  CheckCircle 
} from "lucide-react";
import { useLeads, useGenerateSiteConfig, Lead } from "@/lib/hooks/useLeads";

type Viewport = "desktop" | "tablet" | "mobile";

function CreatorContentInner() {
  const searchParams = useSearchParams();
  
  const { 
    data, 
    isLoading, 
    refetch 
  } = useLeads({});
  
  const leads = data?.leads || [];
  const totalLeads = data?.total || 0;
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isCopied, setIsCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const generateMutation = useGenerateSiteConfig();
  
  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const isGenerating = generateMutation.isPending || selectedLead?.status === 'PREVIEW_GENERATING';
  
  const handleGenerate = async (overrideId?: string) => {
    const targetId = overrideId || selectedLeadId;
    if (!targetId) return;
    setLocalError(null);
    try {
      await generateMutation.mutateAsync(targetId);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Fehler bei der Website-Erstellung");
    }
  };

  // Initialize from URL
  const initFromParams = () => {
    const leadId = searchParams.get("leadId");
    const autoStart = searchParams.get("autoStart") === "true";
    if (leadId) {
      setSelectedLeadId(leadId);
      if (autoStart) setTimeout(() => handleGenerate(leadId), 100);
    }
  };

  if (leads.length > 0 && !selectedLeadId) {
    initFromParams();
  }

  const previewUrl = selectedLeadId ? `${window.origin}/preview/${selectedLeadId}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyStitchPrompt = () => {
    if (!selectedLead?.strategy_brief?.creationToolPrompt) return;
    navigator.clipboard.writeText(selectedLead.strategy_brief.creationToolPrompt);
  };

  const deviceDimensions = {
    desktop: "w-full",
    tablet: "max-w-[768px] mx-auto",
    mobile: "max-w-[375px] mx-auto"
  };

  return (
    <>
      {/* Lead Selection Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Lead auswählen</label>
            <Select 
              value={selectedLeadId} 
              onValueChange={setSelectedLeadId}
              disabled={isLoading || leads.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lead auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.company_name} - {lead.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Geräte-Vorschau</label>
            <div className="flex gap-2">
              <Button variant={viewport === "desktop" ? "default" : "outline"} size="sm" onClick={() => setViewport("desktop")}>
                <Monitor className="w-4 h-4" />
              </Button>
              <Button variant={viewport === "tablet" ? "default" : "outline"} size="sm" onClick={() => setViewport("tablet")}>
                <Tablet className="w-4 h-4" />
              </Button>
              <Button variant={viewport === "mobile" ? "default" : "outline"} size="sm" onClick={() => setViewport("mobile")}>
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{isLoading ? "Laden..." : `${totalLeads} Leads`}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {(localError || generateMutation.isError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <span>⚠️</span>
            <span>{localError || "Ein Fehler ist aufgetreten"}</span>
          </div>
        </div>
      )}

      {/* Preview Card */}
      {selectedLead && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{selectedLead.company_name}</h2>
              <p className="text-sm text-slate-400">{selectedLead.industry} • {selectedLead.location}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedLead.rating > 0 && <Badge variant="secondary">⭐ {selectedLead.rating}</Badge>}
              <Badge variant="outline">{selectedLead.status}</Badge>
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Website generieren
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={copyStitchPrompt}
              disabled={!selectedLead.strategy_brief?.creationToolPrompt}
            >
              <Copy className="w-4 h-4 mr-2" />
              Prompt
            </Button>
            
            <Button variant="outline" onClick={copyToClipboard} disabled={!previewUrl}>
              {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className={`${deviceDimensions[viewport]} transition-all duration-300`}>
            <iframe src={previewUrl} className="w-full h-[600px] border rounded-lg bg-white" title="Preview" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedLead && !isLoading && leads.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Sparkles className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Leads mit Strategie</h3>
          <p className="text-slate-400 mb-4">Generieren Sie zuerst eine Strategie.</p>
          <Button asChild>
            <a href="/strategy">Zur Strategie-Seite</a>
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && leads.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400">Laden...</p>
        </div>
      )}
    </>
  );
}

import { Skeleton } from "@/components/ui/loading";
