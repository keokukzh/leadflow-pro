"use client";

import { forwardRef } from "react";

interface PreviewFrameProps {
  html: string;
  isLoading: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export const PreviewFrame = forwardRef<HTMLIFrameElement, PreviewFrameProps>(
  function PreviewFrame({ html, isLoading, iframeRef }, ref) {
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Preview wird geladen...</p>
            </div>
          </div>
        )}
        <iframe
          ref={ref}
          srcDoc={html}
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
          title="Preview"
        />
      </div>
    );
  }
);
