import { lazy, Suspense, memo } from "react";

// ============================================
// LAZY LOADING UTILITIES
// Performance: Code splitting for large components
// ============================================

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper = memo(function LazyWrapper({ 
  children, 
  fallback = <DefaultSkeleton />
}: LazyWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
});

// Default skeleton for lazy loaded components
function DefaultSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-800 rounded w-1/4" />
      <div className="h-32 bg-slate-800 rounded" />
      <div className="h-32 bg-slate-800 rounded" />
    </div>
  );
}

// Lazy loaded heavy components
export const LazyPreview = lazy(() => 
  import("@/components/preview/LivePreview").then(mod => ({ default: mod.LivePreview }))
);

export const LazyAnalytics = lazy(() => 
  import("@/components/analytics/AnalyticsDashboard").then(mod => ({ default: mod.AnalyticsDashboard }))
);

export const LazyWorkflowBuilder = lazy(() => 
  import("@/components/automation/WorkflowBuilder").then(mod => ({ default: mod.WorkflowBuilder }))
);

// ============================================
// DYNAMIC IMPORTS FOR ROUTES
// Used in Next.js dynamic routes for code splitting
// ============================================

export const lazyImports = {
  preview: () => import("@/components/preview/LivePreview"),
  analytics: () => import("@/components/analytics/AnalyticsDashboard"),
  workflows: () => import("@/components/automation/WorkflowBuilder"),
  creator: () => import("@/app/(dashboard)/creator/page"),
} as const;

// ============================================
// PRELOAD HELPER
// Performance: Load critical components in advance
// ============================================

export function preloadComponent(componentName: keyof typeof lazyImports) {
  if (typeof window !== "undefined") {
    const preload = lazyImports[componentName];
    preload().catch(() => {
      // Silently fail - preload is best effort
    });
  }
}
