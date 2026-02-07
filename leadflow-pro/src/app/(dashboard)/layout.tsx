"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "@/components/providers/QueryProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Sidebar />
      <main className="flex-1 bg-slate-950 p-8">
        {children}
      </main>
    </Providers>
  );
}
