import { ML_CONFIG } from "@/lib/config";

const DIM = ML_CONFIG.embeddingDimensions;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function hashToken(token: string, dim: number): number[] {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < token.length; i++) {
    const idx = (token.charCodeAt(i) * (i + 1) * 31) % dim;
    vec[idx] += 1;
  }
  return vec;
}

function normalize(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

export function embedTextLocal(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array(DIM).fill(0);
  tokens.forEach((token) => {
    const hashed = hashToken(token, DIM);
    hashed.forEach((v, i) => (vec[i] += v));
  });
  return normalize(vec);
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return embedTextLocal(text);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      },
      body: JSON.stringify({
        model: ML_CONFIG.embeddingModel,
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) return embedTextLocal(text);
    const data = await res.json();
    return data.data?.[0]?.embedding ?? embedTextLocal(text);
  } catch {
    return embedTextLocal(text);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
