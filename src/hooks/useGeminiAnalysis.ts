"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AnalysisResult, FrameData } from "@/types";

interface UseGeminiAnalysisReturn {
  latestAnalysis: AnalysisResult | null;
  recentAnalyses: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
}

const MAX_RECENT = 10;

export function useGeminiAnalysis(
  latestFrame: FrameData | null
): UseGeminiAnalysisReturn {
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedTimestamp = useRef<number>(0);
  const isInFlightRef = useRef(false);
  const pendingFrameRef = useRef<FrameData | null>(null);
  const consecutiveErrorsRef = useRef(0);

  const analyze = useCallback(async (frame: FrameData) => {
    // Don't fire if a request is already in-flight — queue this frame instead
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
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis failed: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      consecutiveErrorsRef.current = 0;

      setLatestAnalysis(data);
      setRecentAnalyses((prev) => {
        const updated = [...prev, data];
        return updated.slice(-MAX_RECENT);
      });
    } catch (err) {
      consecutiveErrorsRef.current++;
      // Only show error after 3 consecutive failures to avoid flashing
      if (consecutiveErrorsRef.current >= 3) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      setIsAnalyzing(false);
      isInFlightRef.current = false;

      // Process the most recent pending frame (drop any older ones)
      const pending = pendingFrameRef.current;
      pendingFrameRef.current = null;
      if (pending) {
        // Small delay to avoid hammering the API
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
