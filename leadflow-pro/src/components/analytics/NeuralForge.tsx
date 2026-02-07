"use client";

import { useState } from "react";
import { 
  Plus, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Type, 
  Star, 
  Cpu, 
  Zap, 
  X,
  Loader2,
  Database,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { synthesizeForgeLead, ForgeStash } from "@/lib/actions/server-actions";
import clsx from "clsx";

export function NeuralForge() {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [rating, setRating] = useState(0);
  const [links, setLinks] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSynthesize = async () => {
    if (!companyName) {
      setStatus({ type: 'error', msg: "Unternehmensname erforderlich" });
      return;
    }
    setIsSynthesizing(true);
    setStatus(null);
    
    const stash: ForgeStash = {
      companyName,
      ownerName,
      links,
      images,
      text,
      rating
    };
    
    try {
      const result = await synthesizeForgeLead(stash);
      if (result.success) {
        setStatus({ type: 'success', msg: "Lead erfolgreich synthetisiert" });
        // Reset form
        setCompanyName("");
        setOwnerName("");
        setRating(0);
        setLinks([]);
        setImages([]);
        setText("");
      } else {
        setStatus({ type: 'error', msg: "Synthese fehlgeschlagen: " + result.error });
      }
    } catch {
      setStatus({ type: 'error', msg: "Systemfehler während der Synthese" });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const addEmptyLink = () => setLinks([...links, ""]);
  
  const updateLink = (index: number, val: string) => {
    const newLinks = [...links];
    newLinks[index] = val;
    setLinks(newLinks);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-serif text-white">Neural Forge</h3>
          <p className="text-white/30 text-sm mt-1">Stash intelligence & synthesize the Masterprompt</p>
        </div>
        <div className="flex items-center gap-4">
          {status && (
            <div className={clsx(
              "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-right-4",
              status.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}>
              {status.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {status.msg}
              <button onClick={() => setStatus(null)} className="ml-2 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <Cpu className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">Active Buffer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">Company</label>
                <Input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Swiss Dental Clinic"
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-sm focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">Owner / Contact</label>
                <Input 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Dr. Hans Müller"
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-sm focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">Rating Intelligence</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    className={clsx(
                      "p-3 rounded-xl transition-all duration-300",
                      rating >= star ? "text-accent bg-accent/10 border border-accent/20" : "text-white/10 bg-white/5 border border-white/5"
                    )}
                  >
                    <Star className={clsx("w-4 h-4", rating >= star && "fill-accent")} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div 
              onDrop={(e) => {
                e.preventDefault();
                const url = e.dataTransfer.getData("text/plain");
                if (url) setLinks([...links, url]);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="group border-2 border-dashed border-white/5 rounded-4xl p-12 bg-white/1 hover:bg-white/2 hover:border-primary/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <Plus className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Drop Intelligence Here</p>
                <p className="text-[10px] text-white/20 mt-1 italic">Links, Images, or snippets to stash</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <Button variant="outline" className="bg-white/1 border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all rounded-2xl h-14 gap-2 flex-col" onClick={addEmptyLink}>
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">Add URL</span>
              </Button>
              <Button variant="outline" className="bg-white/1 border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all rounded-2xl h-14 gap-2 flex-col" onClick={() => setImages([...images, "Visual Buffer"])}>
                <ImageIcon className="w-4 h-4 text-accent" />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">Add Visual</span>
              </Button>
              <Button variant="outline" className="bg-white/1 border-white/5 hover:bg-white/10 transition-all rounded-2xl h-14 gap-2 flex-col" onClick={() => setText(text || "Neu Intelligence Log...")}>
                <Type className="w-4 h-4 text-white/40" />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">Log Notes</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-[#0A0A0B]/60 rounded-4xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/1">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-primary/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Neural Stash Feed // Units: {links.length + images.length + (text ? 1 : 0)}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {links.map((link, i) => (
              <div 
                key={`link-${i}`}
                className="bg-white/2 border border-white/5 p-4 rounded-2xl flex flex-col gap-2 group hover:bg-white/5 transition-all animate-in fade-in slide-in-from-right-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] font-mono">Metadata Link</span>
                  </div>
                  <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <Input 
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  placeholder="https://..."
                  className="h-8 bg-transparent border-none text-xs text-primary focus:ring-0 p-0 font-mono"
                  autoFocus={!link}
                />
              </div>
            ))}
            
            {images.map((img, i) => (
              <div 
                key={`img-${i}`}
                className="bg-white/2 border border-white/5 p-4 rounded-2xl flex items-center justify-between group animate-in fade-in slide-in-from-right-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/60 font-mono block">VISUAL_CAPTURE_${i+1}.DAT</span>
                    <span className="text-[9px] text-accent/40 font-black uppercase tracking-widest">Ready for Synthesis</span>
                  </div>
                </div>
                <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {text !== null && text !== "" && (
              <div className="bg-primary/5 border border-primary/10 p-6 rounded-4xl space-y-4 relative group animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] font-mono">Intelligence Snippet</span>
                  </div>
                  <button onClick={() => setText("")} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-white/60 focus:ring-0 p-0 font-serif leading-relaxed italic resize-none"
                  rows={4}
                />
              </div>
            )}

            {!links.length && !images.length && !text && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                <Database className="w-12 h-12 rotate-12" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Buffer Empty</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-white/2 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between px-2">
               <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] font-mono">Transmission Ready:</span>
               <span className={clsx(
                 "text-[9px] font-black uppercase tracking-widest font-mono",
                 companyName ? "text-primary" : "text-white/10"
               )}>{companyName ? 'STANDBY' : 'AWAITING METADATA'}</span>
            </div>
            <Button 
              className="w-full h-16 bg-primary hover:bg-primary/80 text-white rounded-3xl gap-4 shadow-2xl shadow-primary/20 group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSynthesizing || !companyName}
              onClick={handleSynthesize}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] font-mono">Synthesizing intelligence...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 group-hover:animate-pulse transition-all text-white" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">Send to Logic Engine</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
