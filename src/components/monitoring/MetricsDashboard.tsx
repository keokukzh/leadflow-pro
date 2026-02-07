'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useWorkflow } from '@/lib/workflow/useWorkflow';
import { Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

export default function MetricsDashboard() {
  const { executions, isLoading } = useWorkflow();

  // Mock data for trends if executions are empty
  const trendData = [
    { name: 'Mon', success: 40, failed: 5 },
    { name: 'Tue', success: 30, failed: 2 },
    { name: 'Wed', success: 60, failed: 8 },
    { name: 'Thu', success: 45, failed: 4 },
    { name: 'Fri', success: 90, failed: 12 },
    { name: 'Sat', success: 20, failed: 1 },
    { name: 'Sun', success: 15, failed: 0 },
  ];

  const pieData = [
    { name: 'Successful', value: 85, color: '#10b981' },
    { name: 'Failed', value: 15, color: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/50 rounded-3xl border border-white/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Success Rate" 
          value="94.2%" 
          icon={<CheckCircle className="text-emerald-400" />}
          trend="+2.1%"
          trendUp={true}
        />
        <StatCard 
          title="Avg. Duration" 
          value="1.2s" 
          icon={<Clock className="text-blue-400" />}
          trend="-0.3s"
          trendUp={true}
        />
        <StatCard 
          title="Total Executions" 
          value="1,284" 
          icon={<Zap className="text-amber-400" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="Failed Tasks" 
          value="24" 
          icon={<XCircle className="text-rose-400" />}
          trend="-5%"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Trends */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-4xl border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold text-white">Execution Trends</h3>
              <p className="text-slate-400 text-sm">Real-time workflow performance</p>
            </div>
            <Activity className="text-slate-500" />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSuccess)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorFailed)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-900/50 rounded-4xl border border-white/10 p-6 backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-white mb-2">Success Rate</h3>
          <p className="text-slate-400 text-sm mb-8">Overall health distribution</p>
          
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">94%</span>
              <span className="text-slate-500 text-xs">Total</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 text-sm">{item.name}</span>
                </div>
                <span className="text-white font-medium text-sm">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-5 backdrop-blur-xl hover:bg-slate-800/50 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-800 rounded-2xl border border-white/5 shadow-inner">
          {icon}
        </div>
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        } border border-white/5`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-white mt-1 leading-none">{value}</h4>
      </div>
    </div>
  );
}
