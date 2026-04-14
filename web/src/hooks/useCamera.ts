"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  facingMode: "environment" | "user";
  toggleCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
        setError(null);
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions in your browser settings."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No camera found on this device."
            : "Failed to access camera. Please try again.";
      setError(message);
      setIsReady(false);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Stop all tracks helper
  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  useEffect(() => {
    startCamera(facingMode);

    // Release camera when page is hidden (user switches tabs, locks phone, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllTracks();
      } else {
        startCamera(facingMode);
      }
    };

    // Release camera when page unloads
    const handleBeforeUnload = () => {
      stopAllTracks();
    };

    // iOS Safari: release on pagehide (more reliable than beforeunload)
    const handlePageHide = () => {
      stopAllTracks();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      stopAllTracks();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, isReady, error, facingMode, toggleCamera };
}
