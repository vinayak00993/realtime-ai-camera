"use client";

import { useEffect, useState, useRef } from "react";
import type { AnalysisResult } from "@/types";

interface StatusIndicatorProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  isActive: boolean;
  error: string | null;
}

export function StatusIndicator({
  analysis,
  isAnalyzing,
  isActive,
  error,
}: StatusIndicatorProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevTextRef = useRef("");

  // Smooth text transition when analysis changes
  useEffect(() => {
    if (!analysis || analysis.analysis === prevTextRef.current) return;

    // Fade out
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      prevTextRef.current = analysis.analysis;
      setDisplayText(analysis.analysis);
      // Fade in
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [analysis]);

  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none z-10">
      {/* Gradient backdrop for readability */}
      <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent pt-2 pb-8 px-4">
        {/* Status dot */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              isActive ? "bg-green-400 animate-pulse" : "bg-red-400"
            }`}
          />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
            {isAnalyzing ? "Looking..." : isActive ? "Live" : "Inactive"}
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-300/80 mb-1">{error}</p>
        )}

        {/* Observation text with smooth fade transition */}
        {displayText && (
          <p
            className={`text-sm text-white/85 font-medium leading-snug transition-all duration-300 ease-in-out ${
              isTransitioning
                ? "opacity-0 translate-y-1"
                : "opacity-100 translate-y-0"
            }`}
          >
            {displayText}
          </p>
        )}
      </div>
    </div>
  );
}
