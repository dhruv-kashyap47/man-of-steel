import { ChatOpenAI } from "@langchain/openai";

export function createLLM() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return new ChatOpenAI({
    modelName: process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet",
    openAIApiKey: apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "MAN OF STEEL",
      },
    },
    temperature: 0.7,
    maxTokens: 4000,
  });
}

export async function invokeLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const llm = createLLM();
  if (!llm) return null;

  try {
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);
  } catch (err) {
    console.error("LLM invocation failed:", err);
    return null;
  }
}
