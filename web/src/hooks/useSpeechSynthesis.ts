"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  speak: (text: string) => void;
  cancel: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const warmedUpRef = useRef(false);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Find the best available voice on this device
  useEffect(() => {
    const findBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      // Prefer natural/enhanced voices, ranked by quality
      const preferred = [
        "Google UK English Female",
        "Google US English",
        "Samantha", // iOS high quality
        "Karen",    // iOS
        "Daniel",   // iOS
        "Microsoft Zira",
        "Microsoft David",
      ];

      for (const name of preferred) {
        const match = voices.find((v) => v.name.includes(name));
        if (match) {
          preferredVoiceRef.current = match;
          return;
        }
      }

      // Fallback: pick the first English voice
      const english = voices.find((v) => v.lang.startsWith("en"));
      if (english) preferredVoiceRef.current = english;
    };

    findBestVoice();
    window.speechSynthesis.onvoiceschanged = findBestVoice;
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const warmUp = useCallback(() => {
    if (warmedUpRef.current) return;
    const silent = new SpeechSynthesisUtterance("");
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
    warmedUpRef.current = true;
  }, []);

  const setIsEnabledWrapped = useCallback(
    (enabled: boolean) => {
      if (enabled) warmUp();
      setIsEnabled(enabled);
    },
    [warmUp]
  );

  const speak = useCallback(
    (text: string) => {
      if (!isEnabled || !text) return;

      // Queue the text as a single utterance (don't cancel ongoing speech)
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (preferredVoiceRef.current) {
        utterance.voice = preferredVoiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        // Only set not speaking if nothing else is queued
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isEnabled]
  );

  return {
    isSpeaking,
    isEnabled,
    setIsEnabled: setIsEnabledWrapped,
    speak,
    cancel,
  };
}
