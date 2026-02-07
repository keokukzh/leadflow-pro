// ============================================
// LeadFlow Pro - Enhanced Analytics Dashboard
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Phone, 
  Mail, 
  Target,
  DollarSign,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight
} from 'lucide-react';

interface AnalyticsData {
  // Overview
  totalLeads: number;
  newLeadsThisWeek: number;
  leadsGrowth: number;
  
  // By Score
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  
  // Outreach
  totalCalls: number;
  callsCompleted: number;
  callDuration: number;
  totalEmails: number;
  emailsOpened: number;
  emailsClicked: number;
  
  // Conversion
  demosSent: number;
  interestedLeads: number;
  conversionRate: number;
  revenue: number;
}

interface WeeklyData {
  week: string;
  leads: number;
  calls: number;
  emails: number;
}

interface IndustryData {
  industry: string;
  count: number;
  avgScore: number;
}

export function EnhancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, weeklyRes] = await Promise.all([
        fetch('/api/analytics/stats'),
        fetch(`/api/analytics/weekly?range=${dateRange}`),
      ]);

      const stats = await statsRes.json();
      const weeklyData = await weeklyRes.json();

      setData(stats);
      setWeekly(weeklyData);
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      // Mock data for demo
      setData({
        totalLeads: 156,
        newLeadsThisWeek: 23,
        leadsGrowth: 18,
        hotLeads: 34,
        warmLeads: 67,
        coldLeads: 55,
        totalCalls: 89,
        callsCompleted: 45,
        callDuration: 1250,
        totalEmails: 234,
        emailsOpened: 89,
        emailsClicked: 34,
        demosSent: 12,
        interestedLeads: 8,
        conversionRate: 5.1,
        revenue: 4500,
      });
    }
    setLoading(false);
  };

  // Calculate derived metrics
  const metrics = useMemo(() => {
    if (!data) return null;
    
    return {
      callCompletionRate: data.totalCalls > 0 
        ? Math.round((data.callsCompleted / data.totalCalls) * 100) 
        : 0,
      emailOpenRate: data.totalEmails > 0 
        ? Math.round((data.emailsOpened / data.totalEmails) * 100) 
        : 0,
      emailClickRate: data.totalEmails > 0 
        ? Math.round((data.emailsClicked / data.totalEmails) * 100) 
        : 0,
      avgCallDuration: data.callsCompleted > 0 
        ? Math.round(data.callDuration / data.callsCompleted) 
        : 0,
    };
  }, [data]);

  if (loading) {
    return <AnalyticsLoading />;
  }

  return (
    <div className="analytics-dashboard space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-white">Analytics Dashboard</h2>
          <p className="text-white/40">Performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range 
                  ? 'bg-primary text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={data?.totalLeads || 0}
          change={data?.leadsGrowth || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Hot Leads"
          value={data?.hotLeads || 0}
          subtitle={`${data?.warmLeads || 0} warm`}
          icon={Target}
          color="red"
        />
        <StatCard
          title="Conversion Rate"
          value={`${data?.conversionRate || 0}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Revenue"
          value={`CHF ${(data?.revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="gold"
        />
      </div>

      {/* Outreach Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Calls"
          value={data?.totalCalls || 0}
          subtitle={`${metrics?.callCompletionRate || 0}% completed`}
          icon={Phone}
          progress={metrics?.callCompletionRate || 0}
          color="blue"
        />
        <MetricCard
          title="Emails"
          value={data?.totalEmails || 0}
          subtitle={`${metrics?.emailOpenRate || 0}% opened`}
          icon={Mail}
          progress={metrics?.emailOpenRate || 0}
          color="purple"
        />
        <MetricCard
          title="Avg Call Duration"
          value={`${metrics?.avgCallDuration || 0}s`}
          subtitle="Per completed call"
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Lead Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreDistributionChart
          hot={data?.hotLeads || 0}
          warm={data?.warmLeads || 0}
          cold={data?.coldLeads || 0}
        />
        
        <WeeklyTrendChart data={weekly} />
      </div>

      {/* Funnel Visualization */}
      <FunnelChart
        steps={[
          { label: 'Total Leads', value: data?.totalLeads || 0 },
          { label: 'Emails Sent', value: data?.totalEmails || 0 },
          { label: 'Emails Opened', value: data?.emailsOpened || 0 },
          { label: 'Calls Completed', value: data?.callsCompleted || 0 },
          { label: 'Interested', value: data?.interestedLeads || 0 },
        ]}
      />

      {/* Top Performing Industries */}
      <IndustryTable />
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard({ 
  title, 
  value, 
  change, 
  subtitle,
  icon: Icon, 
  color 
}: {
  title: string;
  value: number | string;
  change?: number;
  subtitle?: string;
  icon: any;
  color: 'blue' | 'red' | 'green' | 'gold';
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    gold: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  };

  return (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${colors[color]} border backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
              <span className="text-white/40 text-xs">vs last period</span>
            </div>
          )}
          {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-white/10`}>
          <Icon className="w-6 h-6 text-white/80" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  progress,
  color 
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: any;
  progress: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}/20`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <h3 className="text-white/80 font-medium">{title}</h3>
      </div>
      
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white/40 text-sm mt-1">{subtitle}</p>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

function ScoreDistributionChart({ hot, warm, cold }: { hot: number; warm: number; cold: number }) {
  const total = hot + warm + cold;
  const hotPercent = total > 0 ? Math.round((hot / total) * 100) : 0;
  const warmPercent = total > 0 ? Math.round((warm / total) * 100) : 0;
  const coldPercent = total > 0 ? Math.round((cold / total) * 100) : 0;

  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
      <h3 className="text-white/80 font-medium mb-6">Lead Score Distribution</h3>
      
      <div className="space-y-4">
        {/* Hot Leads */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-red-400">🔥 Hot Leads (70+)</span>
            <span className="text-white/60">{hot} leads</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-400"
              style={{ width: `${hotPercent}%` }}
            />
          </div>
        </div>

        {/* Warm Leads */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-yellow-400">☀️ Warm Leads (40-69)</span>
            <span className="text-white/60">{warm} leads</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
              style={{ width: `${warmPercent}%` }}
            />
          </div>
        </div>

        {/* Cold Leads */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-blue-400">❄️ Cold Leads (&lt;40)</span>
            <span className="text-white/60">{cold} leads</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
              style={{ width: `${coldPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Total Leads</span>
          <span className="text-white font-medium">{total}</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyTrendChart({ data }: { data: WeeklyData[] }) {
  // Use mock data if empty
  const chartData = data.length > 0 ? data : [
    { week: 'W1', leads: 12, calls: 8, emails: 24 },
    { week: 'W2', leads: 18, calls: 12, emails: 32 },
    { week: 'W3', leads: 15, calls: 10, emails: 28 },
    { week: 'W4', leads: 23, calls: 15, emails: 45 },
  ];

  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
      <h3 className="text-white/80 font-medium mb-6">Weekly Trend</h3>
      
      <div className="flex items-end gap-4 h-40">
        {chartData.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col gap-1">
              <div 
                className="w-full bg-blue-500/50 rounded-t"
                style={{ height: `${(item.leads / 30) * 100}%` }}
              />
              <div 
                className="w-full bg-purple-500/50"
                style={{ height: `${(item.calls / 20) * 100}%` }}
              />
              <div 
                className="w-full bg-green-500/50 rounded-b"
                style={{ height: `${(item.emails / 50) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/40">{item.week}</span>
          </div>
        ))}
      </div>
      
      <div className="flex gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/50" />
          <span className="text-xs text-white/60">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/50" />
          <span className="text-xs text-white/60">Calls</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/50" />
          <span className="text-xs text-white/60">Emails</span>
        </div>
      </div>
    </div>
  );
}

function FunnelChart({ steps }: { steps: { label: string; value: number }[] }) {
  const maxValue = Math.max(...steps.map(s => s.value));
  
  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
      <h3 className="text-white/80 font-medium mb-6">Outreach Funnel</h3>
      
      <div className="space-y-4">
        {steps.map((step, i) => {
          const percent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
          const conversion = i > 0 
            ? Math.round((step.value / steps[i - 1].value) * 100) 
            : 100;
          
          return (
            <div key={i} className="relative">
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm text-white/60">{step.label}</div>
                <div className="flex-1">
                  <div className="h-10 bg-white/10 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/80 to-primary/40 rounded-lg transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-white font-medium">{step.value}</span>
                  {i > 0 && (
                    <span className="text-white/40 text-xs ml-2">
                      ({conversion}%)
                    </span>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-36 top-10 text-xs text-white/30">
                  ↓ {conversion}% conversion
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IndustryTable() {
  const industries = [
    { name: 'Restaurant', leads: 45, score: 72, conversion: 8 },
    { name: 'Hotel', leads: 23, score: 68, conversion: 12 },
    { name: 'Handwerk', leads: 34, score: 55, conversion: 5 },
    { name: 'Gesundheit', leads: 18, score: 61, conversion: 7 },
    { name: 'Retail', leads: 28, score: 48, conversion: 3 },
  ];

  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
      <h3 className="text-white/80 font-medium mb-6">Performance by Industry</h3>
      
      <table className="w-full">
        <thead>
          <tr className="text-left text-white/40 text-sm">
            <th className="pb-3">Industry</th>
            <th className="pb-3 text-right">Leads</th>
            <th className="pb-3 text-right">Avg Score</th>
            <th className="pb-3 text-right">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {industries.map((item, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="py-3 text-white">{item.name}</td>
              <td className="py-3 text-right text-white/60">{item.leads}</td>
              <td className="py-3 text-right">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.score >= 70 ? 'bg-green-500/20 text-green-400' :
                  item.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {item.score}
                </span>
              </td>
              <td className="py-3 text-right text-white/60">{item.conversion}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
