"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  BrainCircuit, 
  Palette, 
  Mail, 
  Database,
  Settings,
  Activity,
  ChevronRight
} from "lucide-react";
import clsx from "clsx";
import { getGlobalAgentStatus, GlobalAgentStatus } from "@/lib/actions/server-actions";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Executive Suite", href: "/", icon: LayoutDashboard, key: "dashboard" },
  { name: "Market Discovery", href: "/discovery", icon: Search, key: "discovery" },
  { name: "Logic Engine", href: "/strategy", icon: BrainCircuit, key: "strategy" },
  { name: "Creative Studio", href: "/creator", icon: Palette, key: "creator" },
  { name: "Outreach Hub", href: "/contact", icon: Mail, key: "contact" },
  { name: "Lead Repository", href: "/memory", icon: Database, key: "memory" },
  { name: "System Vitals", href: "/health", icon: Activity, key: "health" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<GlobalAgentStatus>({
    discovery: false,
    strategy: false,
    creator: false,
    contact: false
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const s = await getGlobalAgentStatus();
        setStatus(s);
      } catch (err) {
        console.error("Failed to fetch agent status:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-72 p-4 z-50">
      <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
        {/* Logo Section */}
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(155,35,53,0.4)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold tracking-[0.2em] text-accent/60 uppercase">
              Swiss Intel
            </span>
          </div>
          <h1 className="text-3xl font-serif text-white leading-tight">
            LeadFlow<span className="text-primary italic">.</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 mb-4">
            Navigation
          </div>
          {navigation.map((item, idx) => {
            const isActive = pathname === item.href;
            const isAgentActive = item.key in status ? status[item.key as keyof GlobalAgentStatus] : false;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "stagger-item group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-500",
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center">
                  <div className={clsx(
                    "p-2 rounded-xl mr-3 transition-colors duration-500",
                    isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="tracking-tight">{item.name}</span>
                </div>
                
                {isAgentActive ? (
                  <div className="agent-active-glow w-2 h-2 rounded-full" />
                ) : (
                  <ChevronRight className={clsx(
                    "w-4 h-4 transition-all duration-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                    isActive ? "text-primary/50" : "text-white/20"
                  )} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings */}
        <div className="p-6 mt-auto border-t border-white/5 bg-white/2">
          <Link
            href="/settings"
            className="flex items-center justify-between px-4 py-3 text-sm font-medium text-white/40 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group"
          >
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-3 group-hover:rotate-45 transition-transform duration-500" />
              Settings
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-accent transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
