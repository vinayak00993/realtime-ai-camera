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
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (frame: FrameData) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: frame.base64,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Analysis failed: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();

      setLatestAnalysis(data);
      setRecentAnalyses((prev) => {
        const updated = [...prev, data];
        return updated.slice(-MAX_RECENT);
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (!latestFrame || latestFrame.timestamp === lastProcessedTimestamp.current) return;
    lastProcessedTimestamp.current = latestFrame.timestamp;
    analyze(latestFrame);
  }, [latestFrame, analyze]);

  return { latestAnalysis, recentAnalyses, isAnalyzing, error };
}
