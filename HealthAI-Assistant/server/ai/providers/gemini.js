import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

export const createGeminiProvider = (env) => {
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL_NAME });

  return {
    name: "gemini",
    supportsImages: true,
    async generate({ parts }) {
      const result = await model.generateContent(parts);
      return result.response.text();
    },
    async *stream({ parts }) {
      const result = await model.generateContentStream(parts);
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    },
  };
};

