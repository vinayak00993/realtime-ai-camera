import { anthropic } from "@/lib/anthropic";

export async function POST(request: Request) {
  try {
    const { image, recentObservations } = await request.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Build context from recent observations to avoid repetition
    const context =
      recentObservations && recentObservations.length > 0
        ? `Your recent observations (do NOT repeat these, only mention new/changed things):\n${recentObservations.map((o: string) => `- ${o}`).join("\n")}`
        : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system: `You are a real-time AI companion observing through a user's camera. Give a brief 1-2 sentence observation about what you see. Be conversational and helpful, like a friend looking over their shoulder. Focus on what's new or interesting. If nothing has changed, say so briefly.

${context}`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg" as const,
                data: image,
              },
            },
            {
              type: "text",
              text: "What do you see? Be brief.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const analysis = textBlock && "text" in textBlock ? textBlock.text : "";

    return Response.json({
      analysis,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return Response.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
