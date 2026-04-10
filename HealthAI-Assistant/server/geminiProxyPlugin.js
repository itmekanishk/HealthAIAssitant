import { loadEnv } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonBody, sendJson, getStatusCode, extractPromptAndImages } from "./ai/utils.js";
import { selectProvider } from "./ai/selectProvider.js";

const ENV_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const createGeminiHandler = (mode) => {
  return async (req, res) => {
    const env = loadEnv(mode, ENV_DIR, "");
    const provider = selectProvider(env);

    if (!req.url) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    try {
      const { parts } = await readJsonBody(req);

      if (!parts) {
        sendJson(res, 400, { error: "Request body must include `parts`." });
        return;
      }

      res.setHeader("X-AI-Provider", provider.name);

      const { hasImages } = extractPromptAndImages(parts);
      if (hasImages && !provider.supportsImages) {
        sendJson(res, 400, {
          error:
            "This request includes an image, but the selected provider does not support image analysis via this proxy. Set AI_PROVIDER=gemini for image features.",
        });
        return;
      }

      if (req.url === "/generate") {
        const text = await provider.generate({ parts });
        sendJson(res, 200, { text, provider: provider.name });
        return;
      }

      if (req.url === "/stream") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of provider.stream({ parts })) {
          res.write(chunk);
        }

        res.end();
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      sendJson(res, getStatusCode(error), {
        error: error instanceof Error ? error.message : "Gemini proxy request failed",
      });
    }
  };
};

export const geminiProxyPlugin = (mode) => {
  const handler = createGeminiHandler(mode);

  return {
    name: "gemini-proxy-plugin",
    configureServer(server) {
      server.middlewares.use("/api/gemini", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/gemini", handler);
    },
  };
};
