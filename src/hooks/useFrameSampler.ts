"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { captureFrame, computeFrameDiff, getSmallFrameData } from "@/lib/frame-utils";
import { DEFAULT_SAMPLER_CONFIG, type FrameData, type SamplerConfig } from "@/types";

interface UseFrameSamplerReturn {
  latestFrame: FrameData | null;
  isActive: boolean;
  frameCount: number;
  captureNow: () => FrameData | null;
}

export function useFrameSampler(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isReady: boolean,
  config: SamplerConfig = DEFAULT_SAMPLER_CONFIG
): UseFrameSamplerReturn {
  const [latestFrame, setLatestFrame] = useState<FrameData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousFrameDataRef = useRef<ImageData | null>(null);
  const lastSendTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get or create the diff canvas (160x120)
  const getDiffCanvas = useCallback(() => {
    if (!diffCanvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      diffCanvasRef.current = canvas;
    }
    return diffCanvasRef.current;
  }, []);

  // Force-capture the current frame regardless of diff
  const captureNow = useCallback((): FrameData | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const base64 = captureFrame(
      video,
      config.sendWidth,
      config.sendHeight,
      config.jpegQuality
    );
    if (!base64) return null;

    const frame: FrameData = {
      base64,
      width: config.sendWidth,
      height: config.sendHeight,
      timestamp: Date.now(),
    };

    lastSendTimeRef.current = Date.now();
    setLatestFrame(frame);
    setFrameCount((c) => c + 1);
    return frame;
  }, [videoRef, config]);

  useEffect(() => {
    if (!isReady) return;

    setIsActive(true);

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const now = Date.now();
      const timeSinceLastSend = now - lastSendTimeRef.current;

      // Don't send more frequently than minInterval
      if (timeSinceLastSend < config.minInterval) return;

      const diffCanvas = getDiffCanvas();
      const currentFrameData = getSmallFrameData(video, diffCanvas);
      if (!currentFrameData) return;

      let shouldSend = false;

      if (!previousFrameDataRef.current) {
        // First frame — always send
        shouldSend = true;
      } else if (timeSinceLastSend >= config.maxInterval) {
        // Max interval exceeded — force send
        shouldSend = true;
      } else {
        // Check pixel diff
        const diff = computeFrameDiff(currentFrameData, previousFrameDataRef.current);
        if (diff >= config.diffThreshold) {
          shouldSend = true;
        }
      }

      previousFrameDataRef.current = currentFrameData;

      if (shouldSend) {
        captureNow();
      }
    }, config.checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsActive(false);
    };
  }, [isReady, videoRef, config, getDiffCanvas, captureNow]);

  return { latestFrame, isActive, frameCount, captureNow };
}
