"use client";

import { Suspense, lazy } from "react";
import { Skeleton, SkeletonCard } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load the main content component
const CreatorContent = lazy(() => import("./CreatorContent"));

function CreatorLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-64 h-4" />
        </div>
        <Skeleton className="w-32 h-8" />
      </div>

      {/* Lead Selection Skeleton */}
      <SkeletonCard />
    </div>
  );
}

function CreatorError({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <div className="p-8 bg-red-50 rounded-xl border border-red-200">
      <div className="flex items-center gap-3 text-red-700">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-medium">Creator konnte nicht geladen werden</h3>
          <p className="text-sm text-red-600 mt-1">{error?.message || "Unbekannter Fehler"}</p>
        </div>
      </div>
      {onRetry && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

export default function CreatorPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Creator</h1>
          <p className="text-slate-400">Erstellen Sie professionelle Websites für Ihre Leads</p>
        </div>
      </div>

      {/* Main Content with Error Boundary */}
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

