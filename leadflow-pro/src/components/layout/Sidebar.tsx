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
  Activity
} from "lucide-react";
import clsx from "clsx";
import { getGlobalAgentStatus, GlobalAgentStatus } from "@/lib/actions/server-actions";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, key: "dashboard" as keyof GlobalAgentStatus | "dashboard" | "memory" },
  { name: "Discovery Agent", href: "/discovery", icon: Search, key: "discovery" as keyof GlobalAgentStatus },
  { name: "Strategy Agent", href: "/strategy", icon: BrainCircuit, key: "strategy" as keyof GlobalAgentStatus },
  { name: "Creator Agent", href: "/creator", icon: Palette, key: "creator" as keyof GlobalAgentStatus },
  { name: "Contact Agent", href: "/contact", icon: Mail, key: "contact" as keyof GlobalAgentStatus },
  { name: "Memory / CRM", href: "/memory", icon: Database, key: "memory" as keyof GlobalAgentStatus | "dashboard" | "memory" },
  { name: "System Health", href: "/health", icon: Activity, key: "health" as string },
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
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 text-white border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          LeadFlow Pro
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isAgentActive = item.key in status ? status[item.key as keyof GlobalAgentStatus] : false;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center">
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </div>
              
              {isAgentActive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/settings"
          className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </div>
    </div>
  );
}
