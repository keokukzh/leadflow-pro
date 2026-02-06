
"use client";

import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { RefreshCw, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";

// Lazy load the main content component
const CreatorContent = lazy(() => import("./CreatorContent"));

function CreatorLoading() {
  return (
    <div className="flex h-full w-full bg-slate-950/40 backdrop-blur-md luxury-gradient">
      <div className="w-80 border-r border-white/5 bg-white/[0.02] p-6 space-y-6">
        <Skeleton className="h-8 w-3/4 bg-white/5" />
        <Skeleton className="h-10 w-full bg-white/5" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-6">
         <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center animate-pulse">
            <Zap className="w-10 h-10 text-white/10" />
         </div>
         <Skeleton className="h-4 w-48 bg-white/5" />
         <Skeleton className="h-2 w-64 bg-white/5" />
      </div>
    </div>
  );
}

function CreatorError({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8 bg-slate-950 luxury-gradient">
      <div className="max-w-md w-full p-10 glass-panel border-primary/20 bg-primary/5 text-center shadow-2xl rounded-[2rem]">
         <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-primary" />
         </div>
         <h3 className="font-serif text-2xl text-white/90 mb-3 tracking-tight">System Interrupt</h3>
         <p className="text-sm text-white/40 mb-8 font-medium leading-relaxed">
            {error?.message || "An unexpected error occurred during node synthesis."}
         </p>
         {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-xl border border-white/10 shadow-lg shadow-primary/20 transition-all duration-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Synthesis
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CreatorPage() {
  // Use negative margins to break out of the dashboard padding for full screen experience
  return (
    <div className="h-[calc(100vh-4rem)] -m-8 relative overflow-hidden">
      <ErrorBoundary
        fallback={(error, reset) => <CreatorError error={error} onRetry={reset} />}
      >
        <Suspense fallback={<CreatorLoading />}>
          <CreatorContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
