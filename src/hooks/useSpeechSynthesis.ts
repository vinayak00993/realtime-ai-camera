"use client";

import { useCallback, useRef, useState } from "react";

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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const warmedUpRef = useRef(false);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Mobile browsers require a user-initiated speech event before TTS works.
  // We fire a silent utterance on the first enable toggle to "warm up" the engine.
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

      // Cancel any ongoing speech
      cancel();

      // Chrome mobile bug: long text gets cut off after ~15s.
      // Split into sentences and queue them.
      const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

      sentences.forEach((sentence, i) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;

        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (i === 0) {
          utterance.onstart = () => setIsSpeaking(true);
        }
        if (i === sentences.length - 1) {
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
        }

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    },
    [isEnabled, cancel]
  );

  return {
    isSpeaking,
    isEnabled,
    setIsEnabled: setIsEnabledWrapped,
    speak,
    cancel,
  };
}
