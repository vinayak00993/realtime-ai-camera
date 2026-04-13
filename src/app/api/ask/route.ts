import { anthropic } from "@/lib/anthropic";
import type { AnalysisResult } from "@/types";

export async function POST(request: Request) {
  try {
    const { question, image, recentAnalyses, conversationHistory } =
      await request.json();

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    // Build context from recent Gemini analyses
    const analysisContext =
      recentAnalyses && recentAnalyses.length > 0
        ? `Recent scene observations:\n${(recentAnalyses as AnalysisResult[])
            .map((a) => `- ${a.analysis}`)
            .join("\n")}`
        : "";

    // Build message content with optional image
    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
    > = [];

    if (image) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg" as const,
          data: image,
        },
      });
    }

    userContent.push({
      type: "text",
      text: question,
    });

    // Build conversation messages
    const messages: Array<{ role: "user" | "assistant"; content: string | typeof userContent }> = [];

    // Add prior conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message with image
    messages.push({
      role: "user",
      content: userContent,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: `You are a helpful real-time AI companion. The user is showing you what they're working on through their camera. Be conversational, practical, and concise. Give actionable advice.

${analysisContext}`,
            messages,
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Claude streaming error:", err);
          const errMsg = JSON.stringify({
            error: "Streaming failed",
          });
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("Ask endpoint error:", err);
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
