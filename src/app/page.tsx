"use client";

import { useCallback, useEffect, useRef } from "react";
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

export default function Home() {
  const { videoRef, isReady, error, facingMode, toggleCamera } = useCamera();
  const { latestFrame, isActive, frameCount, captureNow } = useFrameSampler(
    videoRef,
    isReady
  );
  const { latestAnalysis, recentAnalyses, isAnalyzing, error: analysisError } =
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
  const spokenCharsRef = useRef(0);

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

  // Speak sentences as they stream in (don't wait for completion)
  useEffect(() => {
    if (!isVoiceEnabled || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant" || !lastMessage.content) return;

    // New message — reset spoken position
    if (lastMessage.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = lastMessage.id;
      spokenCharsRef.current = 0;
    }

    const content = lastMessage.content;
    const unspoken = content.slice(spokenCharsRef.current);

    // Find complete sentences in the unspoken portion
    const sentenceMatch = unspoken.match(/^(.*?[.!?])\s/);

    if (sentenceMatch) {
      // Speak the complete sentence
      const sentence = sentenceMatch[1];
      spokenCharsRef.current += sentenceMatch[0].length;
      speak(sentence);
    } else if (!isStreaming && unspoken.trim().length > 0) {
      // Streaming done — speak any remaining text
      spokenCharsRef.current = content.length;
      speak(unspoken.trim());
    }
  }, [messages, isStreaming, isVoiceEnabled, speak]);

  const handleToggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // Always cancel speech (queue may have pending utterances even if isSpeaking is false)
      cancelSpeech();
      startListening();
    }
  }, [isListening, startListening, stopListening, cancelSpeech]);

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

      {/* Top: smooth animated observation banner */}
      <StatusIndicator
        analysis={latestAnalysis}
        isAnalyzing={isAnalyzing}
        isActive={isActive}
        error={analysisError}
      />

      {/* Bottom: detailed chat responses (Q&A only) */}
      <ChatPanel messages={messages} isStreaming={isStreaming} />

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
