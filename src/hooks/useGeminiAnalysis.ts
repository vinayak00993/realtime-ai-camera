"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AnalysisResult, FrameData } from "@/types";

interface UseAnalysisReturn {
  latestAnalysis: AnalysisResult | null;
  recentAnalyses: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
}

const MAX_RECENT = 10;

export function useGeminiAnalysis(
  latestFrame: FrameData | null
): UseAnalysisReturn {
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedTimestamp = useRef<number>(0);
  const isInFlightRef = useRef(false);
  const pendingFrameRef = useRef<FrameData | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const recentTextsRef = useRef<string[]>([]);

  const analyze = useCallback(async (frame: FrameData) => {
    if (isInFlightRef.current) {
      pendingFrameRef.current = frame;
      return;
    }

    isInFlightRef.current = true;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: frame.base64,
          recentObservations: recentTextsRef.current.slice(-3),
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis failed: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      consecutiveErrorsRef.current = 0;

      // Track recent observation texts to avoid repetition
      recentTextsRef.current = [...recentTextsRef.current.slice(-4), data.analysis];

      setLatestAnalysis(data);
      setRecentAnalyses((prev) => {
        const updated = [...prev, data];
        return updated.slice(-MAX_RECENT);
      });
    } catch (err) {
      consecutiveErrorsRef.current++;
      if (consecutiveErrorsRef.current >= 3) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      setIsAnalyzing(false);
      isInFlightRef.current = false;

      const pending = pendingFrameRef.current;
      pendingFrameRef.current = null;
      if (pending) {
        setTimeout(() => analyze(pending), 500);
      }
    }
  }, []);

  useEffect(() => {
    if (!latestFrame || latestFrame.timestamp === lastProcessedTimestamp.current) return;
    lastProcessedTimestamp.current = latestFrame.timestamp;
    analyze(latestFrame);
  }, [latestFrame, analyze]);

  return { latestAnalysis, recentAnalyses, isAnalyzing, error };
}
