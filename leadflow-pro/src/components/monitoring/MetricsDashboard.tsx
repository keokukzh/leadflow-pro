"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Zap, 
  CheckCircle2, 
  XCircle,
  BarChart3
} from 'lucide-react';

interface MetricPoint {
  timestamp: string;
  executions: number;
  success: number;
  failed: number;
  avgDuration: number;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);

  useEffect(() => {
    const loadMockData = async () => {
      // Generate mock data for visualization until backend is ready
      const mockData = Array.from({ length: 24 }).map((_, i) => ({
        timestamp: `${i}:00`,
        executions: Math.floor(Math.random() * 50) + 10,
        success: Math.floor(Math.random() * 40) + 10,
        failed: Math.floor(Math.random() * 5),
        avgDuration: Math.floor(Math.random() * 200) + 50,
      }));
      setMetrics(mockData);
    };
    loadMockData();
  }, []);

  const totalExecs = metrics.reduce((a, b) => a + b.executions, 0);
  const totalSuccess = metrics.reduce((a, b) => a + b.success, 0);
  const successRate = totalExecs > 0 ? ((totalSuccess / totalExecs) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Executions", value: totalExecs, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
          { title: "Success Rate", value: `${successRate}%`, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { title: "Avg Duration", value: "124ms", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { title: "Active Threads", value: "12", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel border-white/10 bg-slate-900/40 rounded-3xl overflow-hidden hover:bg-slate-900/60 transition-colors group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-widest text-white/30 uppercase">{stat.title}</p>
                <p className="text-xl font-mono font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 glass-panel border-white/10 bg-slate-900/50 rounded-4xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  LOGIC_LOAD_DISTRIBUTION
                </CardTitle>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Execution trends vs Reliability</p>
              </div>
              <BarChart3 className="w-4 h-4 text-white/20" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      fontSize: '10px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="executions" 
                    stroke="#6366f1" 
                    fillOpacity={1} 
                    fill="url(#colorExec)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="success" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorSuccess)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="glass-panel border-white/10 bg-slate-900/50 rounded-4xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              ERROR_VECTORS
            </CardTitle>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Failure classification</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {[
              { label: "Timeout (TCP/IP)", val: 65, color: "bg-amber-500" },
              { label: "Refused Connection", val: 42, color: "bg-rose-500" },
              { label: "Logic Error (JS)", val: 28, color: "bg-primary" },
              { label: "Auth Failure (401)", val: 12, color: "bg-slate-500" },
            ].map((err, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span className="text-white/60">{err.label}</span>
                  <span className="text-white">{err.val}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${err.color} shadow-lg`}
                    style={{ width: `${(err.val / 150) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t border-white/5">
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">Optimization Tip</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed italic">
                  &quot;Most failures occur at TCP handshake. Consider increasing retry delay.&quot;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
