"use client";

import { 
  Users, 
  Target, 
  Zap, 
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Briefcase
} from "lucide-react";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/lib/actions/server-actions";
import clsx from "clsx";

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
      name: 'Total Intelligence', 
      value: stats?.totalLeads.value ?? 0, 
      icon: Users, 
      change: stats?.totalLeads.growth ? `+${stats.totalLeads.growth.toFixed(0)}%` : '0%', 
      color: "primary"
    },
    { 
      name: 'High-Value Targets', 
      value: stats?.qualifiedLeads.value ?? 0, 
      icon: Target, 
      change: stats?.qualifiedLeads.growth ? `+${stats.qualifiedLeads.growth.toFixed(0)}%` : '0%', 
      color: "accent"
    },
    { 
      name: 'Engineered Strategies', 
      value: stats?.strategiesCreated.value ?? 0, 
      icon: Zap, 
      change: stats?.strategiesCreated.growth ? `+${stats.strategiesCreated.growth.toFixed(0)}%` : '0%', 
      color: "primary"
    },
    { 
      name: 'Conversion Rate', 
      value: `${stats?.contactedLeads.value ?? 0}%`, 
      icon: TrendingUp, 
      change: stats?.contactedLeads.growth ? `+${stats.contactedLeads.growth.toFixed(0)}%` : '0%', 
      color: "accent"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <header className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-accent/80 font-medium tracking-widest uppercase text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Intelligence Suite</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-white leading-[1.1]">
            Executive <span className="text-primary italic">Suite</span>
          </h1>
          <p className="text-white/40 max-w-lg text-lg font-light leading-relaxed">
            Real-time visual monitoring of your automated Swiss acquisition pipeline and lead repository.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-white/40">
                A{i}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 font-medium">3 Agents <br/> Active Now</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, idx) => (
          <div
            key={stat.name}
            className="stagger-item glass-panel group relative overflow-hidden rounded-3xl p-8 hover:bg-white/3 transition-all duration-700"
            style={{ animationDelay: `${idx * 100 + 100}ms` }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={clsx(
                  "p-3 rounded-2xl",
                  stat.color === 'primary' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                )}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-white/20 group-hover:text-primary transition-colors duration-500">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              
              <dl>
                <dt className="text-xs font-bold text-white/30 uppercase tracking-[0.15em] mb-1">{stat.name}</dt>
                <dd className="flex items-baseline justify-between">
                  <div className="text-4xl font-serif text-white tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-white/40 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    {stat.change}
                  </div>
                </dd>
              </dl>
            </div>
            
            {/* Background Accent Decorative */}
            <div className={clsx(
              "absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000",
              stat.color === 'primary' ? "bg-primary" : "bg-accent"
            )} />
          </div>
        ))}
      </div>

      {/* Main Grid: Data Visualization */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 stagger-item glass-panel rounded-[2.5rem] p-10 h-[500px] relative overflow-hidden" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-serif text-white">Pipeline Velocity</h3>
              <p className="text-white/30 text-sm mt-1">Growth progression of high-value targets</p>
            </div>
            <div className="flex gap-2">
              {['24H', '7D', '30D'].map((t) => (
                <button key={t} className="px-4 py-2 rounded-xl text-[10px] font-bold text-white/20 hover:text-white hover:bg-white/5 transition-all">
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="absolute inset-x-10 bottom-10 top-32 border border-white/5 rounded-3xl bg-white/1 flex items-center justify-center group overflow-hidden">
             <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="text-white/20 font-bold tracking-widest text-xs uppercase flex items-center space-x-2">
               <Globe className="w-4 h-4 animate-spin-slow" />
               <span>Generating Real-time Map Visuals</span>
             </div>
          </div>
        </div>

        <div className="stagger-item glass-panel rounded-[2.5rem] p-10 h-[500px] flex flex-col" style={{ animationDelay: '600ms' }}>
          <div className="mb-10">
            <h3 className="text-2xl font-serif text-white">Market Sector</h3>
            <p className="text-white/30 text-sm mt-1">Active lead distribution</p>
          </div>
          
          <div className="flex-1 space-y-6">
            {[
              { name: "Gastronomy", val: "42%", color: "primary" },
              { name: "Real Estate", val: "28%", color: "accent" },
              { name: "Tech", val: "18%", color: "white/20" },
              { name: "Medical", val: "12%", color: "white/10" }
            ].map((sector) => (
              <div key={sector.name} className="space-y-2 group">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-white/40 group-hover:text-white transition-colors">{sector.name}</span>
                  <span className="text-white/60">{sector.val}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={clsx(
                      "h-full rounded-full transition-all duration-1000 delay-500",
                      sector.color === 'primary' ? "bg-primary" : sector.color === 'accent' ? "bg-accent" : `bg-${sector.color}`
                    )}
                    style={{ width: sector.val }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-8 w-full py-4 rounded-2xl bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-500 flex items-center justify-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Deep Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
}
