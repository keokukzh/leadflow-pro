"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Activity
} from 'lucide-react';
import { ExecutionEvent, ExecutionStatus } from '@/lib/workflow/types';
import { format } from 'date-fns';

interface ExecutionMonitorProps {
  executionId: string;
  initialEvents?: ExecutionEvent[];
}

export function ExecutionMonitor({ executionId, initialEvents = [] }: ExecutionMonitorProps) {
  const [events] = useState<ExecutionEvent[]>(initialEvents);
  const [status] = useState<ExecutionStatus>('running');

  // Simulate real-time events for demo if no real backend stream yet
  useEffect(() => {
    if (events.length === 0 && executionId) {
      // Logic for real EventSource would go here
      // For now, we'll assume events are passed in or fetched
    }
  }, [executionId, events.length]);

  const getStatusIcon = (eventStatus: string) => {
    switch (eventStatus) {
      case 'started': return <Play className="w-3 h-3 text-emerald-400" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-blue-400" />;
      case 'failed': return <XCircle className="w-3 h-3 text-rose-400" />;
      case 'retry': return <Activity className="w-3 h-3 text-amber-400" />;
      default: return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
    }
  };

  const currentProgress = events.length > 0 
    ? Math.max(...events.map(e => e.progress)) 
    : 0;

  return (
    <Card className="glass-panel border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            EXECUTION_NODE::{executionId.slice(0, 8)}
          </CardTitle>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Real-time Logic Stream</p>
        </div>
        <Badge variant="outline" className={`
          rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-white/10
          ${status === 'running' ? 'bg-emerald-500/10 text-emerald-400' : ''}
          ${status === 'completed' ? 'bg-blue-500/10 text-blue-400' : ''}
          ${status === 'failed' ? 'bg-rose-500/10 text-rose-400' : ''}
        `}>
          {status}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/5">
          <div 
            className="h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-in-out"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        <ScrollArea className="h-[400px] p-6">
          <div className="space-y-4">
            {events.length > 0 ? events.map((event, i) => (
              <div 
                key={i} 
                className="group relative flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Timeline Line */}
                {i !== events.length - 1 && (
                  <div className="absolute left-[7px] top-6 w-px h-full bg-white/5 group-hover:bg-white/10 transition-colors" />
                )}
                
                <div className={`
                  mt-1 w-4 h-4 rounded-full flex items-center justify-center border border-white/10 bg-slate-800 z-10
                  ${event.type === 'completed' ? 'border-blue-500/30' : ''}
                  ${event.type === 'failed' ? 'border-rose-500/30' : ''}
                `}>
                  {getStatusIcon(event.type)}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[11px] font-bold text-white/90">
                      {event.stepName || 'SYSTEM_LOG'}
                    </h4>
                    <span className="text-[9px] font-mono text-white/20">
                      {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 font-mono leading-relaxed bg-white/2 p-2 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                    <span className="text-primary/60 pr-2">❯</span>
                    {event.message}
                  </p>
                  
                  {event.data && (
                    <div className="mt-2 text-[9px] font-mono text-white/30 bg-black/20 p-2 rounded-md border border-white/5">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Waiting for logic feed...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
