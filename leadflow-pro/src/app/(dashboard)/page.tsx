"use client";

import { 
  Users, 
  Target, 
  Zap, 
  TrendingUp 
} from "lucide-react";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/lib/actions/server-actions";

interface DashboardStats {
  totalLeads: { value: number; growth: number };
  qualifiedLeads: { value: number; growth: number };
  strategiesCreated: { value: number; growth: number };
  contactedLeads: { value: number; growth: number };
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getDashboardStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  const statItems = [
    { 
      name: 'Total Leads', 
      value: stats?.totalLeads.value ?? 0, 
      icon: Users, 
      change: stats?.totalLeads.growth ? `+${stats.totalLeads.growth.toFixed(0)}%` : '0%', 
      changeType: (stats?.totalLeads.growth ?? 0) > 0 ? 'positive' : 'neutral' 
    },
    { 
      name: 'Qualified Leads', 
      value: stats?.qualifiedLeads.value ?? 0, 
      icon: Target, 
      change: stats?.qualifiedLeads.growth ? `+${stats.qualifiedLeads.growth.toFixed(0)}%` : '0%', 
      changeType: (stats?.qualifiedLeads.growth ?? 0) > 0 ? 'positive' : 'neutral' 
    },
    { 
      name: 'Active Strategies', 
      value: stats?.strategiesCreated.value ?? 0, 
      icon: Zap, 
      change: stats?.strategiesCreated.growth ? `+${stats.strategiesCreated.growth.toFixed(0)}%` : '0%', 
      changeType: (stats?.strategiesCreated.growth ?? 0) > 0 ? 'positive' : 'neutral' 
    },
    { 
      name: 'Contacted', 
      value: stats?.contactedLeads.value ?? 0, 
      icon: TrendingUp, 
      change: stats?.contactedLeads.growth ? `+${stats.contactedLeads.growth.toFixed(0)}%` : '0%', 
      changeType: (stats?.contactedLeads.growth ?? 0) > 0 ? 'positive' : 'neutral' 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <p className="text-slate-400 mt-2">Overview of your automated acquisition pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat) => (
          <div
            key={stat.name}
            className="bg-slate-900 overflow-hidden rounded-xl border border-slate-800 p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <stat.icon className="h-6 w-6 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-400 truncate">{stat.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">{stat.value}</div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-400' : 
                        stat.changeType === 'neutral' ? 'text-slate-500' : 'text-red-400'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-96">
          <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
          <div className="flex items-center justify-center h-full text-slate-500">
            Activity Chart Placeholder
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-96">
          <h3 className="text-lg font-medium text-white mb-4">Pipeline Status</h3>
          <div className="flex items-center justify-center h-full text-slate-500">
            Pipeline Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
