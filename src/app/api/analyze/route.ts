import { geminiFlash } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await geminiFlash.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      },
      {
        text: `You are a real-time AI companion observing through a user's camera.
Describe what you see concisely in 1-2 sentences.
Note any changes, potential issues, or helpful observations.
Focus on what's actionable or interesting.
Be conversational and helpful, like a knowledgeable friend looking over their shoulder.`,
      },
    ]);

    const analysis = result.response.text();

    return Response.json({
      analysis,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Gemini analysis error:", err);
    return Response.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
