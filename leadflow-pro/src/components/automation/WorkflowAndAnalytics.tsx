"use client";

import { useState, useEffect, memo } from "react";
import { Lead } from "@/lib/actions/server-actions";

// ============================================
// WORKFLOW BUILDER COMPONENT
// ============================================

interface WorkflowBuilderProps {
  lead?: Lead;
  onExecute?: (workflowId: string) => void;
}

type TriggerType = "lead_created" | "lead_score_changed" | "website_status_changed" | "schedule" | "manual";

interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, string | number | boolean | null>;
}

interface WorkflowConfig {
  [key: string]: string | number | boolean | null;
}

export const WorkflowBuilder = memo(function WorkflowBuilder({ lead, onExecute }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<any[]>([]); // Keeping for now as it's part of the feature
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<Record<string, any> | null>(null);

  // Pre-built templates
  const templates = [
    {
      id: "welcome_new_leads",
      name: "👋 Willkommens-E-Mail",
      description: "Automatische Willkommens-E-Mail + Follow-up Task",
      trigger: "lead_created" as TriggerType,
      steps: [
        { type: "send_email", config: { template: "welcome", delay: 0 } },
        { type: "create_task", config: { title: "Neuen Lead kontaktieren", delay_hours: 24 } }
      ]
    },
    {
      id: "high_value_alert",
      name: "🔥 High-Value Alert",
      description: "Slack-Benachrichtigung bei Score > 80",
      trigger: "lead_score_changed" as TriggerType,
      conditions: [{ field: "calculated_score", operator: "greater_than", value: 80 }],
      steps: [
        { type: "notify_slack", config: { channel: "#sales-leads" } },
        { type: "create_task", config: { title: "URGENT: High-Value Lead", priority: "high" } }
      ]
    },
    {
      id: "website_followup",
      name: "🌐 Website Follow-up",
      description: "Automatische E-Mail bei fehlender Website",
      trigger: "website_status_changed" as TriggerType,
      conditions: [{ field: "website_status", operator: "contains", value: "KEINE" }],
      steps: [
        { type: "send_email", config: { template: "no_website_offer" } },
        { type: "delay", config: { hours: 48 } },
        { type: "send_email", config: { template: "reminder" } }
      ]
    },
    {
      id: "rating_followup",
      name: "⭐ Bewertungsanfrage",
      description: "Automatisierte Bitte um Google Bewertung",
      trigger: "schedule" as TriggerType,
      steps: [
        { type: "send_email", config: { template: "review_request" } },
        { type: "create_task", config: { title: "Review verfolgen", delay_days: 7 } }
      ]
    }
  ];

  const executeWorkflow = async (workflowId: string) => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: workflowId,
          lead_id: lead?.id,
          context: { ...lead }
        })
      });
      
      const result = await response.json();
      setExecutionResult(result);
      onExecute?.(workflowId);
    } catch (error) {
      setExecutionResult({ error: "Execution failed" });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">⚙️ Workflow Automation</h2>
      
      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => executeWorkflow(template.id)}
            disabled={isExecuting || !lead}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedWorkflow === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            } ${isExecuting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{template.description}</p>
              </div>
              <span className="text-2xl">
                {template.trigger === "lead_created" && "👋"}
                {template.trigger === "lead_score_changed" && "📈"}
                {template.trigger === "website_status_changed" && "🌐"}
                {template.trigger === "schedule" && "📅"}
              </span>
            </div>
            
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                Trigger: {template.trigger.replace("_", " ")}
              </span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                {template.steps.length} Actions
              </span>
              {template.conditions && (
                <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                  {template.conditions.length} Conditions
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* Execution Status */}
      {isExecuting && (
        <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
          <div className="animate-spin text-xl">⏳</div>
          <span>Workflow wird ausgeführt...</span>
        </div>
      )}
      
      {executionResult && (
        <div className={`p-4 rounded-lg ${
          executionResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
        }`}>
          <div className="flex items-center gap-2">
            <span>{executionResult.error ? "❌" : "✅"}</span>
            <span>
              {executionResult.error 
                ? executionResult.error 
                : `${executionResult.actions_executed?.length || 0} Actions ausgeführt`}
            </span>
          </div>
          
          {executionResult.actions_executed && (
            <div className="mt-2 text-sm">
              {executionResult.actions_executed.map((action: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span>→</span>
                  <span>{action.type}</span>
                  <span className="text-slate-500">
                    {action.result?.queued ? `(queued to ${action.result.to})` : ""}
                    {action.result?.task_created ? `(task created)` : ""}
                    {action.result?.slack_notified ? `(notified ${action.result.channel})` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {!lead && (
        <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700">
          ⚠️ Wählen Sie einen Lead aus, um Workflows auszuführen
        </div>
      )}
    </div>
  );
});

// ============================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================

interface AnalyticsDashboardProps {
  leadId?: string;
}

export const AnalyticsDashboard = memo(function AnalyticsDashboard({ leadId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Analytics fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin text-3xl mb-4">📊</div>
        <p>Analytics werden geladen...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 text-red-500">Daten konnten nicht geladen werden</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">📊 Performance Analytics</h2>
        <div className="flex gap-2">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === range 
                  ? "bg-blue-500 text-white" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Events" 
          value={data.overview?.events_24h || 0} 
          icon="📈"
          trend="+12%"
        />
        <MetricCard 
          title="Conversion Rate" 
          value={`${(data.overview?.conversion_rate_24h * 100).toFixed(1)}%`} 
          icon="🎯"
          trend="+2.3%"
        />
        <MetricCard 
          title="A/B Tests" 
          value={data.overview?.active_ab_tests || 0} 
          icon="🧪"
        />
        <MetricCard 
          title="Top Leads" 
          value={data.top_leads?.length || 0} 
          icon="⭐"
        />
      </div>
      
      {/* Funnel Visualization */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">📈 Conversion Funnel</h3>
        <div className="space-y-2">
          {data.conversion_funnel?.steps?.map((step: string, i: number) => {
            const count = data.conversion_funnel?.counts?.[i] || 0;
            const maxCount = Math.max(...(data.conversion_funnel?.counts || [1]));
            const width = Math.max(10, (count / maxCount) * 100);
            
            return (
              <div key={step} className="flex items-center gap-3">
                <span className="w-32 text-sm text-slate-600 truncate">
                  {step.replace("_", " ")}
                </span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-white text-xs font-medium">{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* A/B Tests */}
      {data.ab_tests && Object.keys(data.ab_tests).length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">🧪 A/B Tests</h3>
          <div className="space-y-3">
            {Object.entries(data.ab_tests).map(([id, test]: [string, any]) => (
              <div key={id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{test.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    test.status === "running" ? "bg-green-100 text-green-700" : "bg-slate-200"
                  }`}>
                    {test.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  {Object.entries(test.metrics || {}).map(([variant, metrics]: [string, any]) => (
                    <div key={variant}>
                      <span className="text-slate-500">{variant}:</span>
                      <span className="ml-1 font-medium">
                        {((metrics.conversion_rate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

function MetricCard({ title, value, icon, trend }: { 
  title: string; 
  value: string | number; 
  icon: string;
  trend?: string;
}) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
    </div>
  );
}

// ============================================
// GDPR COMPLIANCE COMPONENT
// ============================================

export function GDPRCompliancePanel() {
  const [activeTab, setActiveTab] = useState<"export" | "anonymize" | "consent">("export");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExport = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/gdpr/export", { method: "POST" });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Export failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleAnonymize = async () => {
    if (!confirm("Möchten Sie wirklich alle Daten anonymisieren? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch("/api/gdpr/anonymize", { method: "POST" });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Anonymization failed" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">🔒 GDPR Compliance</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "export", label: "📥 Daten exportieren" },
          { id: "anonymize", label: "🗑️ Daten löschen" },
          { id: "consent", label: "✅ Einwilligungen" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm ${
              activeTab === tab.id 
                ? "bg-blue-500 text-white" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      {activeTab === "export" && (
        <div>
          <p className="text-slate-600 mb-4">
            Exportieren Sie alle personenbezogenen Daten gemäß GDPR Artikel 20.
          </p>
          <button
            onClick={handleExport}
            disabled={processing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {processing ? "⏳ Export wird erstellt..." : "📥 Export starten"}
          </button>
        </div>
      )}
      
      {activeTab === "anonymize" && (
        <div>
          <div className="p-4 bg-red-50 rounded-lg mb-4">
            <p className="text-red-700 font-medium">⚠️ Achtung</p>
            <p className="text-red-600 text-sm mt-1">
              Diese Aktion löscht alle personenbezogenen Daten unwiderruflich.
            </p>
          </div>
          <button
            onClick={handleAnonymize}
            disabled={processing}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {processing ? "⏳ Wird gelöscht..." : "🗑️ Alle Daten löschen"}
          </button>
        </div>
      )}
      
      {activeTab === "consent" && (
        <div>
          <p className="text-slate-600 mb-4">
            Verwalten Sie die Einwilligungen für Marketing und Tracking.
          </p>
          <div className="space-y-3">
            {["marketing", "analytics", "third_party"].map((consent) => (
              <div key={consent} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="capitalize">{consent.replace("_", " ")}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {result.error ? `❌ ${result.error}` : "✅ Anfrage erfolgreich übermittelt"}
        </div>
      )}
    </div>
  );
}

export default WorkflowBuilder;
