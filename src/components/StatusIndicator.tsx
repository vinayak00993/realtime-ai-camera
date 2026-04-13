"use client";

interface StatusIndicatorProps {
  isAnalyzing: boolean;
  frameCount: number;
  isActive: boolean;
  error: string | null;
}

export function StatusIndicator({
  isAnalyzing,
  frameCount,
  isActive,
  error,
}: StatusIndicatorProps) {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none">
      {/* Compact status bar */}
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-green-400 animate-pulse" : "bg-red-400"
          }`}
        />
        <span className="text-xs text-white/60">
          {isActive ? "Watching" : "Inactive"}
          {frameCount > 0 && ` · ${frameCount} frames`}
          {isAnalyzing && " · Analyzing..."}
        </span>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-2 bg-red-900/60 backdrop-blur-sm rounded-lg px-3 py-2 max-w-full">
          <p className="text-sm text-red-200 leading-snug">{error}</p>
        </div>
      )}
    </div>
  );
}
