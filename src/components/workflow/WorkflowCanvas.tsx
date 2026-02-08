'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TaskNode from './TaskNode';
import { Save, Plus, Settings2, PlayCircle } from 'lucide-react';

const nodeTypes = {
  task: TaskNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'task',
    data: { 
      label: 'New Lead Detected', 
      type: 'webhook', 
      description: 'Triggered when a new lead is captured via API' 
    },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'task',
    data: { 
      label: 'Send Welcome Email', 
      type: 'email', 
      description: 'Personalized intro using Template V2' 
    },
    position: { x: 100, y: 250 },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1' } }
];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-[700px] bg-slate-950 rounded-4xl border border-white/10 shadow-3xl relative overflow-hidden group">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-dot-pattern"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff10" />
        <Controls className="!bg-slate-900 !border-white/10 !rounded-xl overflow-hidden shadow-2xl" />
        <MiniMap 
          nodeColor={(n: any) => '#1e293b'} 
          maskColor="rgba(0, 0, 0, 0.4)" 
          className="!bg-slate-900/80 !border-white/10 !rounded-2xl backdrop-blur-md"
        />
        
        {/* Top Control Panel */}
        <Panel position="top-right" className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-xl text-white text-sm font-medium transition-all backdrop-blur-xl">
            <Plus className="w-4 h-4" />
            Add Step
           </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 border border-white/20 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" />
            Save Workflow
          </button>
        </Panel>

        {/* Bottom Status Panel */}
        <Panel position="bottom-left" className="flex items-center gap-4 bg-slate-900/80 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Ready to Run</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex gap-1">
            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <PlayCircle className="w-4 h-4" />
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Grid Overlay Decoration */}
      <div className="absolute inset-0 pointer-events-none border-[32px] border-slate-950/20 rounded-4xl mask-edge" />
    </div>
  );
}
