import { extractPromptAndImages, readResponseError } from "../utils.js";

const DEFAULT_OLLAMA_MODEL = "llama3.2";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

async function* streamNdjsonMessageContent(response) {
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
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed);
          const chunk = json?.message?.content;
          if (typeof chunk === "string" && chunk) yield chunk;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const createOllamaProvider = (env) => {
  const model = env.OLLAMA_MODEL || env.VITE_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const baseUrl = env.OLLAMA_BASE_URL || env.VITE_OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;

  return {
    name: "ollama",
    supportsImages: false,
    async generate({ parts }) {
      const { prompt, hasImages } = extractPromptAndImages(parts);
      if (hasImages) {
        throw new Error(
          "This request includes an image. Ollama mode is configured but image analysis is not supported by this proxy. Use AI_PROVIDER=gemini for image features."
        );
      }

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw await readResponseError(response);

      const payload = await response.json();
      return payload?.message?.content ?? "";
    },
    async *stream({ parts }) {
      const { prompt, hasImages } = extractPromptAndImages(parts);
      if (hasImages) {
        throw new Error(
          "This request includes an image. Ollama mode is configured but image analysis is not supported by this proxy. Use AI_PROVIDER=gemini for image features."
        );
      }

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw await readResponseError(response);

      yield* streamNdjsonMessageContent(response);
    },
  };
};

