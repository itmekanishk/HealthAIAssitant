import { normalizeProvider } from "./utils.js";
import { createDeepseekProvider } from "./providers/deepseek.js";
import { createGeminiProvider } from "./providers/gemini.js";
import { createLmStudioProvider } from "./providers/lmstudio.js";
import { createOllamaProvider } from "./providers/ollama.js";

export const selectProvider = (env) => {
  const requested = normalizeProvider(env.AI_PROVIDER || env.VITE_AI_PROVIDER || "gemini");

  if (requested === "deepseek") {
    const provider = createDeepseekProvider(env);
    if (!provider) {
      throw new Error(
        "DeepSeek API key is not configured on the server. Set DEEPSEEK_API_KEY (recommended) or VITE_DEEPSEEK_API_KEY in .env."
      );
    }
    return provider;
  }

  if (requested === "lmstudio") {
    return createLmStudioProvider(env);
  }

  if (requested === "ollama") {
    return createOllamaProvider(env);
  }

  const provider = createGeminiProvider(env);
  if (!provider) {
    throw new Error(
      "Gemini API key is not configured on the server. Set GEMINI_API_KEY (recommended) or VITE_GEMINI_API_KEY in .env."
    );
  }
  return provider;
};

