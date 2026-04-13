"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useFrameSampler } from "@/hooks/useFrameSampler";
import { useGeminiAnalysis } from "@/hooks/useGeminiAnalysis";
import { useClaudeReasoning } from "@/hooks/useClaudeReasoning";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { CameraView } from "@/components/CameraView";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ChatPanel } from "@/components/ChatPanel";
import { ControlBar } from "@/components/ControlBar";
import type { ChatMessage } from "@/types";

export default function Home() {
  const { videoRef, isReady, error, facingMode, toggleCamera } = useCamera();
  const { latestFrame, isActive, frameCount, captureNow } = useFrameSampler(
    videoRef,
    isReady
  );
  const { latestAnalysis, recentAnalyses, isAnalyzing, error: geminiError } =
    useGeminiAnalysis(latestFrame);
  const { messages, isStreaming, ask } = useClaudeReasoning();
  const {
    isSpeaking,
    isEnabled: isVoiceEnabled,
    setIsEnabled: setVoiceEnabled,
    speak,
    cancel: cancelSpeech,
  } = useSpeechSynthesis();

  const lastSpokenIdRef = useRef<string | null>(null);
  const lastAnalysisIdRef = useRef<string | null>(null);
  const geminiMessagesRef = useRef<ChatMessage[]>([]);

  // Convert Gemini analysis into a system chat message
  useEffect(() => {
    if (!latestAnalysis || latestAnalysis.analysis === lastAnalysisIdRef.current) return;
    lastAnalysisIdRef.current = latestAnalysis.analysis;

    const msg: ChatMessage = {
      id: `gemini-${latestAnalysis.timestamp}`,
      role: "system",
      content: latestAnalysis.analysis,
      timestamp: latestAnalysis.timestamp,
    };

    // Keep only the last 3 Gemini observations in chat
    geminiMessagesRef.current = [...geminiMessagesRef.current.slice(-2), msg];
  }, [latestAnalysis]);

  // Merge Gemini messages with Claude messages for display
  const allMessages = useMemo(() => {
    const combined = [...geminiMessagesRef.current, ...messages];
    combined.sort((a, b) => a.timestamp - b.timestamp);
    return combined;
  }, [messages, latestAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(
    (text: string) => {
      const frame = captureNow();
      ask(text, frame?.base64 ?? null, recentAnalyses);
    },
    [captureNow, ask, recentAnalyses]
  );

  const handleSpeechResult = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition(handleSpeechResult);

  // Auto-speak new assistant messages when voice is enabled
  useEffect(() => {
    if (!isVoiceEnabled || messages.length === 0 || isStreaming) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === "assistant" &&
      lastMessage.content &&
      lastMessage.id !== lastSpokenIdRef.current
    ) {
      lastSpokenIdRef.current = lastMessage.id;
      setTimeout(() => speak(lastMessage.content), 200);
    }
  }, [messages, isStreaming, isVoiceEnabled, speak]);

  const handleToggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) cancelSpeech();
      startListening();
    }
  }, [isListening, startListening, stopListening, isSpeaking, cancelSpeech]);

  const handleToggleVoice = useCallback(() => {
    if (isVoiceEnabled) cancelSpeech();
    setVoiceEnabled(!isVoiceEnabled);
  }, [isVoiceEnabled, setVoiceEnabled, cancelSpeech]);

  return (
    <main className="relative w-screen overflow-hidden select-none" style={{ height: '100dvh' }}>
      <CameraView
        videoRef={videoRef}
        isReady={isReady}
        error={error}
        facingMode={facingMode}
      />

      <StatusIndicator
        isAnalyzing={isAnalyzing}
        frameCount={frameCount}
        isActive={isActive}
        error={geminiError}
      />

      <ChatPanel messages={allMessages} isStreaming={isStreaming} />

      <ControlBar
        onSend={handleSend}
        onToggleCamera={toggleCamera}
        onToggleMic={handleToggleMic}
        onToggleVoice={handleToggleVoice}
        isListening={isListening}
        isVoiceEnabled={isVoiceEnabled}
        isSpeechSupported={isSpeechSupported}
        isStreaming={isStreaming}
        transcript={transcript}
      />
    </main>
  );
}
