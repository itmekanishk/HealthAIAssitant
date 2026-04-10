import { extractPromptAndImages, readResponseError } from "../utils.js";

const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";

async function* streamSseText(response) {
  if (!response.body) throw new Error("Streaming body not available");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) yield delta;
        } catch {
          // ignore malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const createDeepseekProvider = (env) => {
  const apiKey = env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const model = env.DEEPSEEK_MODEL || env.VITE_DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;
  const baseUrl = env.DEEPSEEK_BASE_URL || env.VITE_DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL;

  return {
    name: "deepseek",
    supportsImages: false,
    async generate({ parts }) {
      const { prompt, hasImages } = extractPromptAndImages(parts);
      if (hasImages) {
        throw new Error(
          "This request includes an image. DeepSeek mode is configured but image analysis is only supported via Gemini in this project. Set AI_PROVIDER=gemini."
        );
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw await readResponseError(response);

      const payload = await response.json();
      return payload?.choices?.[0]?.message?.content ?? "";
    },
    async *stream({ parts }) {
      const { prompt, hasImages } = extractPromptAndImages(parts);
      if (hasImages) {
        throw new Error(
          "This request includes an image. DeepSeek mode is configured but image analysis is only supported via Gemini in this project. Set AI_PROVIDER=gemini."
        );
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model,
          stream: true,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw await readResponseError(response);

      yield* streamSseText(response);
    },
  };
};

