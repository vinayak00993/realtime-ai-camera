"use client";

import { useState, useCallback } from "react";

interface ControlBarProps {
  onSend: (text: string) => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleVoice: () => void;
  isListening: boolean;
  isVoiceEnabled: boolean;
  isSpeechSupported: boolean;
  isStreaming: boolean;
  transcript: string;
}

export function ControlBar({
  onSend,
  onToggleCamera,
  onToggleMic,
  onToggleVoice,
  isListening,
  isVoiceEnabled,
  isSpeechSupported,
  isStreaming,
  transcript,
}: ControlBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput("");
  }, [input, isStreaming, onSend]);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto">
      {/* Transcript preview */}
      {isListening && transcript && (
        <div className="mb-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg">
          <p className="text-sm text-white/70 italic">{transcript}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Camera toggle */}
        <button
          onClick={onToggleCamera}
          className="flex-shrink-0 h-11 w-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors"
          title="Switch camera"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
            <circle cx="12" cy="12" r="3" />
            <path d="m18 22-3-3 3-3" />
            <path d="m6 2 3 3-3 3" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1 flex items-center bg-white/15 backdrop-blur-sm rounded-full px-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={isListening ? "Listening..." : "Ask anything..."}
            className="flex-1 h-11 bg-transparent text-white placeholder-white/40 text-sm outline-none"
            disabled={isListening}
          />
        </div>

        {/* Mic button */}
        {isSpeechSupported && (
          <button
            onClick={onToggleMic}
            className={`flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? "bg-red-500 animate-pulse"
                : "bg-white/15 backdrop-blur-sm active:bg-white/25"
            }`}
            title={isListening ? "Stop listening" : "Start listening"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
        )}

        {/* Voice output toggle */}
        <button
          onClick={onToggleVoice}
          className={`flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
            isVoiceEnabled
              ? "bg-blue-500"
              : "bg-white/15 backdrop-blur-sm active:bg-white/25"
          }`}
          title={isVoiceEnabled ? "Disable voice" : "Enable voice"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            {isVoiceEnabled ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="22" x2="16" y1="9" y2="15" />
                <line x1="16" x2="22" y1="9" y2="15" />
              </>
            )}
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
          className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-500 flex items-center justify-center disabled:opacity-40 active:bg-blue-600 transition-colors"
          title="Send"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="h-5 w-5"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
