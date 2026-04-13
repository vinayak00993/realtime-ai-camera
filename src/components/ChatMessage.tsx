"use client";

import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center mb-2">
        <div className="max-w-[90%] rounded-lg px-3 py-1.5 bg-white/8 border border-white/10">
          <p className="text-xs text-white/50 leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-white/15 text-white backdrop-blur-sm rounded-bl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content || (
            <span className="inline-flex gap-1">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:0.1s]">·</span>
              <span className="animate-bounce [animation-delay:0.2s]">·</span>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
