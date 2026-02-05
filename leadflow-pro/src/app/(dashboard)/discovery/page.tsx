"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, FilterX, RefreshCcw } from "lucide-react";
import { DiscoveryResultCard, DiscoveryResult } from "@/components/discovery/DiscoveryResultCard";
import { saveLeadToCRM, createDiscoveryMission, getLatestMission, getMissionById, stopDiscoveryMission } from "@/lib/actions/server-actions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Map, Briefcase, AlertTriangle } from "lucide-react";

const INDUSTRIES = [
  // Beauty & Wellness
  "Coiffeur", "Beauty Salon", "Massage", "Nagelstudio", "Wellness Spa", "Kosmetik", "Waxing",
  // Gesundheit
  "Arzt", "Zahnarzt", "Physiotherapie", "Osteopathie", "Chiropraktik", "Podologie", "Naturheilpraxis",
  // Gastronomie & Retail
  "Restaurant", "Metzgerei",
  // Handwerk
  "Schreinerei", "Elektro", "Sanitär", "Gartenbau", "Malerei", "Dachdeckerei", "Schlosserei", "Polsterei", "Glaserei",
  // Dienstleistungen
  "Anwalt", "Treuhand", "Architekt",
  // Auto & Fitness
  "Fitnessstudio", "Garage"
];

const CANTONS = [
  "Zürich", "Bern", "Luzern", "Uri", "Schwyz", "Obwalden", "Nidwalden", "Glarus", "Zug", 
  "Freiburg", "Solothurn", "Basel-Stadt", "Basel-Landschaft", "Schaffhausen", 
  "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "St. Gallen", "Graubünden", 
  "Aargau", "Thurgau", "Tessin", "Waadt", "Wallis", "Neuenburg", "Genf", "Jura"
];

export default function DiscoveryPage() {
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCantons, setSelectedCantons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const startPolling = useCallback((missionId: string) => {
    stopPolling();
    pollInterval.current = setInterval(async () => {
      const mission = await getMissionById(missionId);
      if (mission) {
        setResults(mission.results as DiscoveryResult[]);
        if (mission.status !== 'IN_PROGRESS') {
          setIsLoading(false);
          stopPolling();
        }
      }
    }, 3000);
  }, [stopPolling]);

  // Load latest mission on mount
  useEffect(() => {
    const loadLatest = async () => {
      const mission = await getLatestMission();
      if (mission) {
        setResults(mission.results as DiscoveryResult[]);
        setHasScanned(true);
        if (mission.status === 'IN_PROGRESS') {
          setIsLoading(true);
          startPolling(mission.id);
        }
      }
    };
    loadLatest();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries(prev => 
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  };

  const toggleCanton = (canton: string) => {
    setSelectedCantons(prev => 
      prev.includes(canton) ? prev.filter(c => c !== canton) : [...prev, canton]
    );
  };

  const selectAllCantons = () => {
    setSelectedCantons(prev => prev.length === CANTONS.length ? [] : [...CANTONS]);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalIndustries = selectedIndustries.length > 0 ? selectedIndustries : (industry ? [industry] : []);
    const finalLocations = selectedCantons.length > 0 ? selectedCantons : (location.split(",").map(l => l.trim()).filter(l => l.length > 0));

    if (finalIndustries.length === 0 || finalLocations.length === 0) return;

    setIsLoading(true);
    setHasScanned(true);
    setResults([]);

    try {
      const mission = await createDiscoveryMission(finalIndustries.join(", "), finalLocations);
      startPolling(mission.id);

      fetch("/api/discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          industry: finalIndustries.join(", "), 
          locations: finalLocations,
          missionId: mission.id 
        })
      }).then(async (response) => {
        const data = await response.json();
        setIsSimulated(!!data.isSimulated);
      });
      
    } catch (error) {
      console.error("Scan failed:", error);
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    const mission = await getLatestMission();
    if (mission && mission.status === 'IN_PROGRESS') {
      await stopDiscoveryMission(mission.id);
      setIsLoading(false);
      stopPolling();
    }
  };

  const handleSave = async (result: DiscoveryResult) => {
    try {
      await saveLeadToCRM(result);
      setResults(prev => prev.map(r => 
        r.place_id === result.place_id ? { ...r, isInCRM: true } : r
      ));
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white">Discovery Agent</h2>
          <p className="text-slate-400">Suche nach potenziellen Kunden ohne Website.</p>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 flex-1 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Branchen wählen
              </div>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <Badge 
                    key={ind}
                    variant={selectedIndustries.includes(ind) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${selectedIndustries.includes(ind) ? "bg-blue-600 hover:bg-blue-500 scale-105" : "border-slate-700 hover:border-slate-500"}`}
                    onClick={() => toggleIndustry(ind)}
                  >
                    {ind}
                  </Badge>
                ))}
              </div>
              <div className="pt-2">
                <Input 
                  placeholder="Andere Branche..."
                  className="bg-slate-950 border-slate-800 h-9 text-xs"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-slate-300 font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-blue-400" />
                  Schweiz / Kantone
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] h-6 px-2 hover:bg-blue-500/10 text-blue-400"
                  onClick={selectAllCantons}
                >
                  {selectedCantons.length === CANTONS.length ? "Alle abwählen" : "Alle wählen"}
                </Button>
              </div>
              <ScrollArea className="h-[120px] rounded-md border border-slate-800 bg-slate-950 p-2">
                <div className="flex flex-wrap gap-1.5">
                  {CANTONS.map((c) => (
                    <Badge 
                      key={c}
                      variant={selectedCantons.includes(c) ? "secondary" : "outline"}
                      className={`text-[9px] cursor-pointer transition-all ${selectedCantons.includes(c) ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "border-slate-800 hover:border-slate-700 text-slate-500"}`}
                      onClick={() => toggleCanton(c)}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
              <div className="pt-2">
                 <Input 
                  placeholder="Zusätzliche Orte (z.B. Berlin, Zürich...)"
                  className="bg-slate-950 border-slate-800 h-9 text-xs"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-500 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3 h-3 ${selectedIndustries.length > 0 ? "text-green-500" : "text-slate-700"}`} />
                <span>{selectedIndustries.length || (industry ? 1 : 0)} Branchen gewählt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3 h-3 ${selectedCantons.length > 0 ? "text-green-500" : "text-slate-700"}`} />
                <span>{selectedCantons.length || (location ? location.split(",").length : 0)} Orte gewählt</span>
              </div>
            </div>
            <div className="flex gap-3">
              {isLoading && (
                <Button 
                  variant="outline"
                  className="h-12 border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold uppercase tracking-widest px-6"
                  onClick={handleStop}
                >
                  Stoppen
                </Button>
              )}
              <Button 
                disabled={isLoading || (selectedIndustries.length === 0 && !industry) || (selectedCantons.length === 0 && !location)}
                className="h-12 px-10 font-black text-sm uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                onClick={handleScan}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Mission aktiv...
                  </div>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-3" />
                    Mission starten
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {isSimulated && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4 text-amber-200 text-sm max-w-4xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p>
              <strong>Demo-Modus aktiv:</strong> In den Einstellungen ist kein SerpApi-Key hinterlegt. Die angezeigten Daten sind simulierte Beispiele zur Veranschaulichung der Analyse-Funktionen.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Ergebnisse {results.length > 0 && `(${results.length})`}
            </h3>
            {isLoading && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse text-[10px] py-0">
                Live Update
              </Badge>
            )}
            {!isLoading && results.length > 0 && hasScanned && (
                <Badge variant="outline" className="text-[10px] py-0 border-slate-700 text-slate-400">
                    Statisch (Suche beendet)
                </Badge>
            )}
          </div>
          {hasScanned && !isLoading && (
             <Button variant="ghost" size="sm" className="text-slate-500 h-8 text-xs hover:text-white" onClick={() => { setResults([]); setHasScanned(false); }}>
               <RefreshCcw className="w-3 h-3 mr-2" />
               Suche zurücksetzen
             </Button>
          )}
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <DiscoveryResultCard 
                key={result.place_id} 
                result={result} 
                onSave={handleSave} 
              />
            ))}
          </div>
        ) : hasScanned && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <div className="p-4 bg-slate-800 rounded-full">
              <FilterX className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-xl font-medium text-slate-300">Keine passenden Leads gefunden</p>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">Versuche es mit einer anderen Branche oder einem anderen Ort.</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
             <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <Search className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
             </div>
             <div className="space-y-2">
                <p className="text-xl font-bold text-white uppercase tracking-widest animate-pulse">Suche läuft...</p>
                <p className="text-slate-500 max-w-sm mx-auto">Der Search Specialist analysiert mehrere Standorte und Suchanfragen. Bleib dran, Ergebnisse erscheinen in Kürze.</p>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
            <Search className="w-12 h-12 mb-4 text-slate-600" />
            <p className="text-lg">Gib eine Branche und einen Ort ein, um die Suche zu starten.</p>
          </div>
        )}
      </div>
    </div>
  );
}
