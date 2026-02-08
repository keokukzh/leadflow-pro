import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { Database, Activity, Layers } from "lucide-react";

export default function MemoryPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col space-y-12 overflow-hidden max-w-[1400px] mx-auto px-4">
      <header className="stagger-item space-y-3 pt-4">
        <div className="flex items-center space-x-2 text-primary/80 font-medium tracking-widest uppercase text-[10px]">
          <Database className="w-3 h-3" />
          <span>NeuralStorage // Pipeline Board</span>
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif text-white leading-tight">
              Memory <span className="text-primary italic">Architecture</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg font-light leading-relaxed">
              Real-time synchronization of Swiss market nodes within the acquisition lattice.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-6 glass-panel py-4 px-8 rounded-3xl border-white/5 shadow-xl bg-white/1">
            <div className="flex flex-col items-start min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Sync Latency</span>
              </div>
              <span className="text-sm font-mono text-white/60">0.02ms</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-start min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-3 h-3 text-accent" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Lattice Density</span>
              </div>
              <span className="text-sm font-mono text-accent">Active</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <PipelineBoard />
      </div>
    </div>
  );
}
