'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Mail, 
  Phone, 
  Clock, 
  GitBranch, 
  Webhook, 
  Bell, 
  Database, 
  Globe, 
  Code,
  Layers,
  MoreHorizontal
} from 'lucide-react';
import { StepType } from '@/lib/workflow/types';

const nodeIcons: Record<StepType, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  wait: <Clock className="w-4 h-4" />,
  condition: <GitBranch className="w-4 h-4" />,
  webhook: <Webhook className="w-4 h-4" />,
  notification: <Bell className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  api: <Globe className="w-4 h-4" />,
  script: <Code className="w-4 h-4" />,
  branch: <GitBranch className="w-4 h-4" />,
  parallel: <Layers className="w-4 h-4" />
};

const nodeColors: Record<string, string> = {
  email: 'bg-blue-500',
  call: 'bg-emerald-500',
  wait: 'bg-amber-500',
  condition: 'bg-purple-500',
  webhook: 'bg-rose-500',
  notification: 'bg-indigo-500',
  database: 'bg-cyan-500',
  api: 'bg-sky-500',
  script: 'bg-slate-700',
  branch: 'bg-violet-500',
  parallel: 'bg-orange-500'
};

const TaskNode = ({ data, selected }: NodeProps) => {
  const stepType = (data.type as StepType) || 'email';
  const icon = nodeIcons[stepType] || <MoreHorizontal className="w-4 h-4" />;
  const colorClass = nodeColors[stepType] || 'bg-slate-500';

  return (
    <div className={`
      relative min-w-[200px] p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300
      ${selected ? 'border-primary ring-4 ring-primary/20 scale-[1.02]' : 'border-white/10 hover:border-white/20'}
      bg-slate-900/80 shadow-2xl
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-slate-700 !border-2 !border-slate-800"
      />
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl border border-white/10 ${colorClass} shadow-lg shadow-black/20`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 text-white' })}
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate">
            {data.label as string}
          </h4>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
            {stepType}
          </p>
        </div>
      </div>

      {data.description && (
        <div className="mt-3 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {data.description as string}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-slate-700 !border-2 !border-slate-800"
      />
    </div>
  );
};

export default memo(TaskNode);
