"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/types";
import { ChatMessage } from "./ChatMessage";

interface ChatPanelProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
}

export function ChatPanel({ messages, isStreaming }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-auto"
      style={{ bottom: "calc(6.5rem + env(safe-area-inset-bottom, 16px))" }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mx-3 mb-1 px-3 py-1 text-xs text-white/60 bg-black/30 rounded-full backdrop-blur-sm"
      >
        {isCollapsed ? "Show chat" : "Hide chat"}
        {isStreaming && !isCollapsed && " · Streaming..."}
      </button>

      {!isCollapsed && (
        <div
          ref={scrollRef}
          className="mx-2 max-h-[40vh] overflow-y-auto rounded-xl bg-black/30 backdrop-blur-md p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
