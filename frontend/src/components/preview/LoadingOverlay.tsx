"use client";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Preview wird geladen..." }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-slate-100/90 flex items-center justify-center z-20">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  );
}
