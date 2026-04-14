const API_BASE = "https://realtime-ai-camera.vercel.app";

export async function analyzeFrame(
  imageBase64: string,
  recentObservations: string[]
): Promise<{ analysis: string; timestamp: number }> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageBase64,
      recentObservations: recentObservations.slice(-3),
    }),
  });

  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}

export async function askClaude(
  question: string,
  imageBase64: string | null,
  recentAnalyses: { analysis: string; timestamp: number }[],
  conversationHistory: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      image: imageBase64,
      recentAnalyses: recentAnalyses.slice(-5),
      conversationHistory: conversationHistory.slice(-10),
    }),
  });

  if (!res.ok) throw new Error(`Ask failed: ${res.status}`);

  // React Native's fetch doesn't support ReadableStream reliably,
  // so we read the full SSE response as text and parse events.
  const fullText = await res.text();
  const lines = fullText.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data === "[DONE]" || !data) continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) onChunk(parsed.text);
      } catch {}
    }
  }
  onDone();
}
