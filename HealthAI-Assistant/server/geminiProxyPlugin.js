import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadEnv } from "vite";

const MODEL_NAME = "gemini-2.0-flash";

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    if (!body) {
      resolve({});
      return;
    }

    try {
      resolve(JSON.parse(body));
    } catch {
      reject(new Error("Invalid JSON request body"));
    }
  });

  req.on("error", reject);
});

const getStatusCode = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (message.includes("[429")) return 429;
  if (message.includes("[401")) return 401;
  if (message.includes("[403")) return 403;

  return 500;
};

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const createGeminiHandler = (mode) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  const model = apiKey
    ? new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL_NAME })
    : null;

  return async (req, res) => {
    if (!req.url) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (!model) {
      sendJson(res, 500, {
        error:
          "Gemini API key is not configured on the server. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env.",
      });
      return;
    }

    try {
      const { parts } = await readJsonBody(req);

      if (!parts) {
        sendJson(res, 400, { error: "Request body must include `parts`." });
        return;
      }

      if (req.url === "/generate") {
        const result = await model.generateContent(parts);
        sendJson(res, 200, { text: result.response.text() });
        return;
      }

      if (req.url === "/stream") {
        const result = await model.generateContentStream(parts);

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of result.stream) {
          res.write(chunk.text());
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
