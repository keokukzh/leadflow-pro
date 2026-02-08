"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FilterX, RefreshCcw, Briefcase, Map, Activity, SearchIcon, Terminal, ChevronRight } from "lucide-react";
import { DiscoveryResultCard, DiscoveryResult } from "@/components/discovery/DiscoveryResultCard";
import { saveLeadToCRM, createDiscoveryMission, getLatestMission, getMissionById, stopDiscoveryMission } from "@/lib/actions/server-actions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import clsx from "clsx";

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
  const [limit, setLimit] = useState<string>("");

  
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
        // Dedup results based on place_id to prevent "Duplicate Key" crash from old/cached data
        const uniqueResults: DiscoveryResult[] = [];
        const seenIds = new Set();
        (mission.results as DiscoveryResult[]).forEach(r => {
          if (!seenIds.has(r.place_id)) {
            seenIds.add(r.place_id);
            uniqueResults.push(r);
          }
        });
        setResults(uniqueResults);
        if (mission.status !== 'IN_PROGRESS') {
          setIsLoading(false);
          stopPolling();
        }
      }
    }, 5000);
  }, [stopPolling]);

  useEffect(() => {
    const loadLatest = async () => {
      const mission = await getLatestMission();
      if (mission) {
        // Dedup results based on place_id to prevent "Duplicate Key" crash from old/cached data
        const uniqueResults: DiscoveryResult[] = [];
        const seenIds = new Set();
        (mission.results as DiscoveryResult[]).forEach(r => {
          if (!seenIds.has(r.place_id)) {
            seenIds.add(r.place_id);
            uniqueResults.push(r);
          }
        });
        setResults(uniqueResults);
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

  const toggleIndustryCategory = (industries: string[]) => {
    const allSelected = industries.every(ind => selectedIndustries.includes(ind));
    if (allSelected) {
      setSelectedIndustries(prev => prev.filter(ind => !industries.includes(ind)));
    } else {
      setSelectedIndustries(prev => Array.from(new Set([...prev, ...industries])));
    }
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
          missionId: mission.id,
          limit: limit ? parseInt(limit) : undefined
        })
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
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Technical Header */}
      <header className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-primary/80 font-mono tracking-widest uppercase text-[10px] font-bold">
            <Terminal className="w-3 h-3" />
            <span>Scanning Market Sectors</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-white leading-[1.1]">
            Market <span className="text-secondary-foreground italic">Intelligence</span>
          </h1>
          <p className="text-white/40 max-w-lg text-lg font-light leading-relaxed">
            Deep-scan algorithms identifying Swiss businesses with under-optimized digital presence.
          </p>
        </div>
        
        <div className="hidden lg:flex items-center gap-6 glass-panel py-4 px-8 rounded-3xl border-white/5 shadow-xl">
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Stability</span>
             <span className="text-white/60 font-mono">99.9%</span>
           </div>
           <div className="w-px h-8 bg-white/5" />
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Active nodes</span>
             <span className="text-primary font-mono font-bold animate-pulse">4 Nodes</span>
           </div>
        </div>
      </header>

      {/* Control Panel Section */}
      <div className="stagger-item glass-panel p-1 rounded-[2.5rem] bg-white/1 border-white/5" style={{ animationDelay: '200ms' }}>
        <div className="p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Sector module */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-xl">
                     <Briefcase className="w-5 h-5 text-primary" />
                   </div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Sector Selection</h3>
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 font-mono">
                  {selectedIndustries.length} Selected
                </Badge>
              </div>

              <ScrollArea className="h-[280px] rounded-2xl border border-white/5 bg-black/20 p-6">
                {[
                  { name: "Beauty & Wellness", color: "text-pink-400", sub: ["Coiffeur", "Beauty Salon", "Massage", "Nagelstudio", "Wellness Spa", "Kosmetik", "Waxing"] },
                  { name: "Gesundheit", color: "text-green-400", sub: ["Arzt", "Zahnarzt", "Physiotherapie", "Osteopathie", "Chiropraktik", "Podologie", "Naturheilpraxis"] },
                  { name: "Handwerk", color: "text-orange-400", sub: ["Schreinerei", "Elektro", "Sanitär", "Gartenbau", "Malerei", "Dachdeckerei", "Schlosserei", "Polsterei", "Glaserei"] },
                  { name: "Dienstleistungen", color: "text-blue-400", sub: ["Restaurant", "Metzgerei", "Anwalt", "Treuhand", "Architekt", "Fitnessstudio", "Garage"] }
                ].map((cat) => (
                  <div key={cat.name} className="mb-8 last:mb-0">
                    <div 
                      className="flex items-center justify-between group cursor-pointer mb-3"
                      onClick={() => toggleIndustryCategory(cat.sub)}
                    >
                      <span className={clsx("text-[10px] font-black uppercase tracking-[0.2em]", cat.color)}>{cat.name}</span>
                      <span className="text-[9px] text-white/20 group-hover:text-white transition-colors">Select Integrated Group</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.sub.map((ind) => {
                        const isSel = selectedIndustries.includes(ind);
                        return (
                          <div 
                            key={ind}
                            onClick={() => toggleIndustry(ind)}
                            className={clsx(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-300",
                              isSel ? "bg-primary text-white border-primary shadow-[0_5px_15px_rgba(155,35,53,0.3)]" : "bg-white/5 text-white/30 border-white/5 hover:border-white/20 hover:text-white"
                            )}
                          >
                            {ind}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </ScrollArea>
              
              <Input 
                 placeholder="Custom sector override..."
                 className="bg-white/5 border-white/10 h-14 rounded-xl px-6 text-sm text-white placeholder:text-white/20 focus:ring-primary/50 transition-all font-mono"
                 value={industry}
                 onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            {/* Geographical module */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-accent/10 rounded-xl">
                     <Map className="w-5 h-5 text-accent" />
                   </div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Geographical nodes</h3>
                </div>
                <button 
                  onClick={selectAllCantons}
                  className="text-[10px] font-bold text-accent hover:text-white transition-colors tracking-widest uppercase"
                >
                  {selectedCantons.length === CANTONS.length ? "De-cluster all" : "Sync all cantons"}
                </button>
              </div>

              <ScrollArea className="h-[280px] rounded-2xl border border-white/5 bg-black/20 p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CANTONS.map((c) => {
                    const isSel = selectedCantons.includes(c);
                    return (
                      <div 
                        key={c}
                        onClick={() => toggleCanton(c)}
                        className={clsx(
                          "flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-300 group",
                          isSel ? "bg-accent text-accent-foreground border-accent" : "bg-white/5 border-white/5 text-white/30 hover:border-white/20 hover:text-white"
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase">{c}</span>
                        {isSel ? <Activity className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Input 
                placeholder="Specific location sync (e.g. Zurich, Geneva)..."
                className="bg-white/5 border-white/10 h-14 rounded-xl px-6 text-sm text-white placeholder:text-white/20 focus:ring-accent/50 transition-all font-mono"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Intelligence Parameters */}
          <div className="pt-8 border-t border-white/5">
            <div className="max-w-xs space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-xl">
                   <Activity className="w-5 h-5 text-primary" />
                 </div>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Intelligence Depth</h3>
              </div>
              <Input 
                type="number"
                placeholder="Max Results (e.g. 50)"
                className="bg-white/5 border-white/10 h-14 rounded-xl px-6 text-sm text-white placeholder:text-white/20 focus:ring-primary/50 transition-all font-mono"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              <p className="text-[9px] text-white/20 font-mono">Set result limit to optimize synchronization speed. Leave empty for exhaustive scan.</p>
            </div>
          </div>


          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-8">
            <div className="flex flex-wrap gap-8 items-center text-white/40 font-mono text-[9px] uppercase tracking-widest font-bold">
               <div className="flex items-center gap-3">
                 <div className={clsx("w-2 h-2 rounded-full", (selectedIndustries.length > 0 || industry) ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(155,35,53,0.8)]" : "bg-white/10")} />
                 <span>Sector Locked: {(selectedIndustries.length || (industry ? 1 : 0))} node(s)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className={clsx("w-2 h-2 rounded-full", (selectedCantons.length > 0 || location) ? "bg-accent animate-pulse shadow-[0_0_10px_rgba(180,140,40,0.8)]" : "bg-white/10")} />
                 <span>Nodes Active: {(selectedCantons.length || (location ? location.split(",").length : 0))} region(s)</span>
               </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              {isLoading && (
                <Button 
                  variant="outline"
                  className="h-16 flex-1 md:flex-none border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold uppercase tracking-[0.2em] px-10 rounded-2xl"
                  onClick={handleStop}
                >
                  Terminate
                </Button>
              )}
              <Button 
                disabled={isLoading || (selectedIndustries.length === 0 && !industry) || (selectedCantons.length === 0 && !location)}
                className="h-16 flex-1 md:flex-none px-12 font-black text-xs uppercase tracking-[0.3em] bg-primary text-white hover:bg-primary/90 rounded-2xl border border-primary/50 shadow-[0_20px_40px_-10px_rgba(155,35,53,0.4)] disabled:shadow-none"
                onClick={handleScan}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Mission Processing
                  </div>
                ) : (
                  <>
                    <SearchIcon className="w-5 h-5 mr-3" />
                    Initiate Scan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
              Intelligence Stream {results.length > 0 && `// [LOADED: ${results.length}]`}
            </h3>
            {isLoading && (
              <div className="flex items-center gap-3">
                 <Badge className="bg-primary/10 text-primary border-primary/20 animate-pulse text-[9px] uppercase font-black px-3">
                    Broadcasting
                 </Badge>
              </div>
            )}
          </div>
          {hasScanned && !isLoading && (
             <button 
               onClick={() => { setResults([]); setHasScanned(false); }}
               className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
             >
               <RefreshCcw className="w-3 h-3" />
               Purge Database
             </button>
          )}
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((result) => (
              <DiscoveryResultCard 
                key={result.place_id} 
                result={result} 
                onSave={handleSave} 
              />
            ))}
          </div>
        ) : hasScanned && !isLoading ? (
          <div className="stagger-item glass-panel flex flex-col items-center justify-center py-24 text-center space-y-6 rounded-[2.5rem]">
            <div className="p-6 bg-white/5 rounded-full border border-white/5">
              <FilterX className="w-10 h-10 text-white/20" />
            </div>
            <div>
              <p className="text-2xl font-serif text-white">Zero Intelligence Intercepted</p>
              <p className="text-white/30 max-w-xs mx-auto mt-2 text-sm leading-relaxed">No matching sectors found in selected regional clusters. Adjust node parameters.</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-10">
             <div className="relative">
                <div className="w-32 h-32 rounded-full border-2 border-primary/20 border-t-primary animate-spin-slow shadow-[0_0_80px_rgba(155,35,53,0.15)]" />
                <Activity className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
             </div>
             <div className="space-y-4">
                <p className="text-3xl font-serif italic text-white leading-tight">Syncing Distributed Market Nodes...</p>
                <div className="flex items-center justify-center gap-3 font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Analyzing swiss regional infrastructure
                </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center opacity-30 gap-6">
            <div className="w-px h-24 bg-linear-to-b from-transparent via-white/10 to-transparent" />
            <div className="flex flex-col items-center gap-2">
               <SearchIcon className="w-12 h-12 text-white" />
               <p className="text-sm font-bold uppercase tracking-[0.3em]">Module Online // Ready for Parameters</p>
            </div>
            <div className="w-px h-24 bg-linear-to-b from-transparent via-white/10 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
