"use client";

import type { AnalysisResult } from "@/types";

interface StatusIndicatorProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  frameCount: number;
  isActive: boolean;
  error: string | null;
}

export function StatusIndicator({
  analysis,
  isAnalyzing,
  frameCount,
  isActive,
  error,
}: StatusIndicatorProps) {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none">
      {/* Status bar */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-green-400 animate-pulse" : "bg-red-400"
          }`}
        />
        <span className="text-xs text-white/60">
          {isActive ? `Watching` : "Inactive"}
          {frameCount > 0 && ` · ${frameCount} frames`}
          {isAnalyzing && " · Analyzing..."}
        </span>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/60 backdrop-blur-sm rounded-lg px-3 py-2 max-w-full mb-2">
          <p className="text-sm text-red-200 leading-snug">{error}</p>
        </div>
      )}

      {/* Latest analysis */}
      {analysis && (
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 max-w-full">
          <p className="text-sm text-white/90 leading-snug">
            {analysis.analysis}
          </p>
        </div>
      )}
    </div>
  );
}
