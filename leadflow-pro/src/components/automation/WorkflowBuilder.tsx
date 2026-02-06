"use client";

import { useState, memo } from "react";
import { useWorkflowTemplates } from "@/lib/hooks/useLeads";
import { Lead } from "@/lib/actions/server-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// ============================================
// WORKFLOW BUILDER
// Performance: Lazy loaded, memoized
// ============================================

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: any) => void;
}

export const WorkflowBuilder = memo(function WorkflowBuilder({ 
  workflowId,
  onSave 
}: WorkflowBuilderProps) {
  const { data: templates, isLoading } = useWorkflowTemplates();
  const [activeTab, setActiveTab] = useState<"templates" | "builder">("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);

  const handleCreateFromTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setActiveTab("builder");
    // In a real implementation, fetch the template and create workflow
  };

  if (isLoading) {
    return <WorkflowSkeleton />;
  }

  if (activeTab === "templates") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Workflow Vorlagen</h2>
            <p className="text-slate-400">Wählen Sie eine Vorlage für Ihren Workflow</p>
          </div>
          <Button onClick={() => setActiveTab("builder")}>
            <Plus className="w-4 h-4 mr-2" />
            Eigener Workflow
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {templates?.map((template) => (
            <div
              key={template.id}
              className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
              onClick={() => handleCreateFromTemplate(template.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.steps?.length || 0} Schritte</Badge>
                    {template.active && (
                      <Badge variant="default">Aktiv</Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setActiveTab("templates")}>
          ← Zurück
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </Button>
          <Button onClick={() => onSave?.(workflow)}>
            <Play className="w-4 h-4 mr-2" />
            Speichern & Starten
          </Button>
        </div>
      </div>

      {/* Workflow Builder UI would go here */}
      <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-center">
        <Zap className="w-12 h-12 mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-medium mb-2">Workflow Builder</h3>
        <p className="text-slate-400">Drag & Drop Workflow Editor coming soon...</p>
      </div>
    </div>
  );
});

// Skeleton loader
function WorkflowSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
