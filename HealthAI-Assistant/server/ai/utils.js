export const readJsonBody = (req) => new Promise((resolve, reject) => {
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

export const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

export const getStatusCode = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (message.includes("[429")) return 429;
  if (message.includes("[400")) return 400;
  if (message.includes("[401")) return 401;
  if (message.includes("[403")) return 403;

  return 500;
};

export const normalizeProvider = (value) => String(value || "").trim().toLowerCase();

export const extractPromptAndImages = (parts) => {
  if (typeof parts === "string") {
    return { prompt: parts, hasImages: false };
  }

  if (!Array.isArray(parts)) {
    return { prompt: "", hasImages: false };
  }

  const prompt = parts.find((item) => typeof item === "string") || "";
  const hasImages = parts.some(
    (item) => item && typeof item === "object" && item.inlineData?.data
  );

  return { prompt, hasImages };
};

export const readResponseError = async (response) => {
  let message = `Request failed with status ${response.status}`;

  try {
    const json = await response.json();
    if (json?.error?.message) message = json.error.message;
    else if (json?.error) message = typeof json.error === "string" ? json.error : message;
    else if (json?.message) message = json.message;
  } catch {
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {}
  }

  return new Error(`[${response.status}] ${message}`);
};

