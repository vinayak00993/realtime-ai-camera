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
  onDone: () => void,
  signal?: AbortSignal
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
    signal,
  });

  if (!res.ok) throw new Error(`Ask failed: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) onChunk(parsed.text);
        } catch {}
      }
    }
  }
  onDone();
}
