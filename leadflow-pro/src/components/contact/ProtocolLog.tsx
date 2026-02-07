"use client";

import { Card, CardContent } from "@/components/ui/card";
import { History, Zap } from "lucide-react";
import { format } from "date-fns";
import { Interaction } from "@/lib/actions/server-actions";
import clsx from "clsx";

interface ProtocolLogProps {
  interactions: Interaction[];
}

export function ProtocolLog({ interactions }: ProtocolLogProps) {
  return (
    <Card className="glass-panel bg-white/1 border-white/5 rounded-[3rem] flex flex-col h-[400px]">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-4 h-4 text-white/20" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Protocol Log</h3>
        </div>
        <span className="font-mono text-[9px] text-white/10">{interactions.length} Entries</span>
      </div>
      <CardContent className="p-0 overflow-hidden flex-1">
        <div className="divide-y divide-white/5 overflow-y-auto h-full custom-scrollbar">
          {interactions.length > 0 ? interactions.map((item) => (
            <div key={item.id} className="p-6 space-y-4 hover:bg-white/2 transition-all duration-700 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={clsx(
                    "px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border",
                    item.interaction_type === 'EMAIL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  )}>
                    {item.interaction_type}
                  </div>
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">{item.method}</span>
                </div>
                <span className="text-[9px] text-white/10 font-mono font-bold">{format(new Date(item.created_at), "HH:mm, MMM d")}</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors line-clamp-3 italic">
                &quot;{item.content}&quot;
              </p>
              <div className="flex items-center gap-1.5 text-[9px] text-green-500/40 font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40 animate-pulse" />
                Commit // {item.status}
              </div>
            </div>
          )) : (
            <div className="p-20 text-center space-y-4 text-white/5 italic">
               <Zap className="w-10 h-10 mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-widest">Lattice Empty</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
