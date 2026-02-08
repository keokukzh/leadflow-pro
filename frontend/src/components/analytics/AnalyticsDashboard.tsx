"use client";

import { memo, useMemo } from "react";
import { useAnalytics } from "@/lib/hooks/useLeads";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";

// ============================================
// ANALYTICS DASHBOARD
// Performance: Memoized components, lazy loaded
// ============================================

interface AnalyticsDashboardProps {
  dateRange?: { start: string; end: string };
}

export const AnalyticsDashboard = memo(function AnalyticsDashboard({
  dateRange // eslint-disable-line @typescript-eslint/no-unused-vars
}: AnalyticsDashboardProps) {
  const { data, isLoading, error } = useAnalytics();

  // All hooks MUST be called before any early returns
  const metrics = useMemo(() => ({
    totalLeads: data?.totalLeads ?? 0,
    convertedLeads: data?.convertedLeads ?? 0,
    totalRevenue: data?.totalRevenue ?? 0,
    conversionRate: data?.conversionRate ?? 0,
    avgDealSize: data?.avgDealSize ?? 0,
    responseTime: data?.responseTime ?? 0
  }), [data]);

  const stats = useMemo(() => [
    {
      label: "Total Leads",
      value: metrics.totalLeads,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      label: "Konversionen",
      value: metrics.convertedLeads,
      icon: Target,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      label: "Umsatz",
      value: `CHF ${metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10"
    },
    {
      label: "Konversionsrate",
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
  ], [metrics]);

  const chartData = useMemo(() => [
    { month: "Jan", leads: 24, conversions: 8 },
    { month: "Feb", leads: 35, conversions: 12 },
    { month: "Mar", leads: 48, conversions: 18 },
    { month: "Apr", leads: 62, conversions: 24 },
    { month: "May", leads: 75, conversions: 32 },
    { month: "Jun", leads: 89, conversions: 41 },
  ], []);

  // Early returns AFTER all hooks
  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600">Analytics konnten nicht geladen werden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`p-4 rounded-xl ${stat.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Lead Performance</h3>
        <div className="h-64 flex items-end gap-2">
          {chartData.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end h-48">
                <div
                  className="flex-1 bg-blue-500/50 rounded-t transition-all hover:bg-blue-500"
                  style={{ height: `${(item.leads / 100) * 100}%` }}
                />
                <div
                  className="flex-1 bg-green-500/50 rounded-t transition-all hover:bg-green-500"
                  style={{ height: `${(item.conversions / 100) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{item.month}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-400">Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-slate-400">Conversions</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Skeleton loader
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-80 bg-slate-800 rounded-xl" />
    </div>
  );
}
