"use client";

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
  onUseFallback?: () => void;
}

export function ErrorMessage({ message, onRetry, onUseFallback }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mx-4 mt-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Preview konnte nicht geladen werden</h3>
          <p className="text-sm text-red-600 mt-1">{message}</p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
            >
              Erneut versuchen
            </button>
            {onUseFallback && (
              <button
                onClick={onUseFallback}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
              >
                Fallback verwenden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
