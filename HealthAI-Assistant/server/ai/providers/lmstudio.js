import { extractPromptAndImages, readResponseError } from "../utils.js";

const DEFAULT_LMSTUDIO_MODEL = "llama-3.2-3b-instruct";
const DEFAULT_LMSTUDIO_BASE_URL = "http://127.0.0.1:1234";

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

export const createLmStudioProvider = (env) => {
  const model = env.LMSTUDIO_MODEL || env.VITE_LMSTUDIO_MODEL || DEFAULT_LMSTUDIO_MODEL;
  const baseUrl = env.LMSTUDIO_BASE_URL || env.VITE_LMSTUDIO_BASE_URL || DEFAULT_LMSTUDIO_BASE_URL;

  return {
    name: "lmstudio",
    supportsImages: false,
    async generate({ parts }) {
      const { prompt, hasImages } = extractPromptAndImages(parts);
      if (hasImages) {
        throw new Error(
          "This request includes an image. LM Studio mode is configured but image analysis is not supported by this proxy. Use AI_PROVIDER=gemini for image features."
        );
      }

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          "This request includes an image. LM Studio mode is configured but image analysis is not supported by this proxy. Use AI_PROVIDER=gemini for image features."
        );
      }

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
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

