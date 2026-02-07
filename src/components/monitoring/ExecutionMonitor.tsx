'use client';

import React, { useState } from 'react';
import { useWorkflow } from '@/lib/workflow/useWorkflow';
import { 
  Play, 
  Square, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ExecutionMonitor() {
  const { executions, isLoading, cancelExecution } = useWorkflow();
  const [filter, setFilter] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const filteredExecutions = executions.filter(e => 
    e.workflowName.toLowerCase().includes(filter.toLowerCase()) ||
    e.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-slate-900/50 rounded-4xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Live Execution Monitor</h3>
          <p className="text-slate-400 text-sm">Real-time status of all workflow instances</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filter executions..."
            className="bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Execution List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-slate-400 text-xs font-medium uppercase tracking-wider">
              <th className="px-6 py-4">Workflow</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Progress</th>
              <th className="px-6 py-4">Started</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && filteredExecutions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </td>
              </tr>
            ) : filteredExecutions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                  No executions found
                </td>
              </tr>
            ) : (
              filteredExecutions.map((execution) => (
                <ExecutionRow 
                  key={execution.id} 
                  execution={execution} 
                  onCancel={() => cancelExecution(execution.id)}
                  isSelected={selectedExecution === execution.id}
                  onSelect={() => setSelectedExecution(selectedExecution === execution.id ? null : execution.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExecutionRow({ execution, onCancel, isSelected, onSelect }: any) {
  const statusConfig: any = {
    running: { icon: <Play className="w-4 h-4 animate-pulse text-blue-400" />, class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    completed: { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    failed: { icon: <XCircle className="w-4 h-4 text-rose-400" />, class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    cancelled: { icon: <AlertCircle className="w-4 h-4 text-slate-400" />, class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    pending: { icon: <Clock className="w-4 h-4 text-amber-400" />, class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  };

  const config = statusConfig[execution.status] || statusConfig.pending;

  return (
    <>
      <tr 
        className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
        onClick={onSelect}
      >
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-white font-medium">{execution.workflowName}</span>
            <span className="text-slate-500 text-xs font-mono">{execution.id.slice(0, 8)}...</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium ${config.class}`}>
            {config.icon}
            <span className="capitalize">{execution.status}</span>
          </div>
        </td>
        <td className="px-6 py-4 min-w-[150px]">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                execution.status === 'failed' ? 'bg-rose-500' :
                execution.status === 'completed' ? 'bg-emerald-500' :
                'bg-primary'
              }`}
              style={{ width: `${execution.status === 'completed' ? 100 : execution.status === 'running' ? 45 : 0}%` }}
            />
          </div>
        </td>
        <td className="px-6 py-4 text-slate-400 text-sm">
          {formatDistanceToNow(new Date(execution.startTime), { addSuffix: true })}
        </td>
        <td className="px-6 py-4 text-slate-400 text-sm">
          {execution.duration ? `${execution.duration}s` : '--'}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
            {execution.status === 'running' && (
              <button 
                onClick={onCancel}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Cancel Execution"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}
            <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {isSelected && (
        <tr className="bg-black/20">
          <td colSpan={6} className="px-6 py-4 border-l-2 border-primary/50">
            <div className="animate-in slide-in-from-top-2 duration-300">
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Execution Steps</h5>
              <div className="space-y-3">
                {execution.steps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        step.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10' :
                        step.status === 'failed' ? 'text-rose-400 bg-rose-400/10' :
                        'text-slate-400 bg-slate-400/10'
                      }`}>
                        <ChevronRight className={`w-4 h-4 transform ${step.status === 'running' ? 'rotate-90' : ''}`} />
                      </div>
                      <span className="text-sm text-white font-medium">{step.stepName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 font-mono italic">{step.stepType}</span>
                      <span className="text-xs text-slate-400">{step.duration ? `${step.duration}s` : '--'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
