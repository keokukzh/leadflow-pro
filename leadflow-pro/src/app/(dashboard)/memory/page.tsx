import { PipelineBoard } from "@/components/crm/PipelineBoard";

export default function MemoryPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col space-y-6 overflow-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Memory & CRM</h2>
        <p className="text-slate-400 mt-2">Track leads through the automated acquisition pipeline.</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <PipelineBoard />
      </div>
    </div>
  );
}
