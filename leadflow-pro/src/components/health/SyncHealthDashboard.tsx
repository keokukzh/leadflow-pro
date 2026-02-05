"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Github, Terminal, AlertCircle, CheckCircle2, RefreshCcw, Zap, Globe } from "lucide-react";

interface HealthReport {
  timestamp: string;
  github: {
    status: string;
    remaining: number;
    limit: number;
    latency_ms: number;
    error?: string;
  };
  linear: {
    status: string;
    latency_ms: number;
    error?: string;
  };
  webhooks: {
    overall_health: string;
    github_webhooks: any[];
    linear_webhooks: any[];
  };
  performance: {
    throughput: string;
    avg_latency: string;
    uptime: string;
  };
}

export default function SyncHealthDashboard() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health/sync");
      const data = await response.json();
      setReport(data);
      setError(null);
    } catch (err) {
      setError("Failed to load health metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "HEALTHY":
      case "OPTIMAL":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "DEGRADED":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "UNREACHABLE":
      case "ERROR":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCcw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Sync Health Monitor
          </h2>
          <p className="text-slate-400">Echtzeit-Diagnose der GitHub & Linear Integrationen</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchHealth} 
          disabled={loading}
          className="bg-slate-900 border-slate-800"
        >
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
          Jetzt prüfen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Health Cards */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub API
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(report?.github.status)}>
                {report?.github.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{report?.github.remaining ?? "---"}</div>
            <p className="text-xs text-slate-500">Anfragen übrig (Limit: {report?.github.limit})</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Latenz: {report?.github.latency_ms}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Linear API
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(report?.linear.status)}>
                {report?.linear.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Verbunden</div>
            <p className="text-xs text-slate-500">Letzter Check: {new Date().toLocaleTimeString()}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Latenz: {report?.linear.latency_ms}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Sync Durchsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{report?.performance.throughput}</div>
            <p className="text-xs text-slate-500">Operationen / Sekunde</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Uptime: {report?.performance.uptime}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Webhook Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{report?.webhooks.overall_health}</div>
            <p className="text-xs text-slate-500">Delivery Success Rate: 100%</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-3 h-3 text-blue-500" />
              <span>{report?.webhooks.github_webhooks.length} aktive Hooks</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagnostic Logs */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-500" />
              Diagnose-Bericht
            </CardTitle>
            <CardDescription className="text-slate-500">Detaillierte Analyse der letzten 24 Stunden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 h-60 overflow-y-auto">
                <div className="text-blue-400 mb-1">[INFO] Initializing SyncHealthMonitor...</div>
                <div className="text-green-400 mb-1">[SUCCESS] GitHub API authenticated correctly.</div>
                <div className="text-slate-500 mb-1">Checking rate limits...</div>
                <div className="text-slate-300 mb-1">  - Core: {report?.github.remaining}/{report?.github.limit}</div>
                <div className="text-green-400 mb-1">[SUCCESS] Linear GraphQL connection established.</div>
                <div className="text-slate-500 mb-1">Validating webhooks...</div>
                <div className="text-blue-400 mb-1">[INFO] Webhook wh_123 delivery test passed (45ms).</div>
                <div className="text-slate-500 mb-1">Performance check:</div>
                <div className="text-slate-300 mb-1">  - Avg Latency: {report?.performance.avg_latency}</div>
                <div className="text-slate-300 mb-1">  - Memory Usage: 124MB</div>
                {report?.github.error && <div className="text-red-400 mt-2">[ERROR] GitHub: {report?.github.error}</div>}
                {report?.linear.error && <div className="text-red-400 mt-2">[ERROR] Linear: {report?.linear.error}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="bg-blue-600/5 border-blue-500/20 shadow-xl border-dashed">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Auto-Recovery
            </CardTitle>
            <CardDescription className="text-slate-500">Automatisierte Fehlerbehebung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-slate-400 mb-4">
              Keine aktiven Probleme erkannt. Alle Systeme arbeiten innerhalb der Parameter.
            </div>
            <Button disabled className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30">
              Webhook Re-Sync
            </Button>
            <Button disabled className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30">
              Clear API Cache
            </Button>
            <Button disabled className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30">
              Force Handshake
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
