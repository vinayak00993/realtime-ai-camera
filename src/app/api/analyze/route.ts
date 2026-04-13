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
      max_tokens: 80,
      system: `You are a real-time AI companion. Describe what you see in ONE short sentence (max 15 words). Be casual and observational. No questions, no suggestions, no elaboration.

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
              text: "Briefly note what you see.",
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
