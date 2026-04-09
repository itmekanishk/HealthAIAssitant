// ===============================
// GEMINI SERVICE (RATE LIMITED)
// ===============================

const GEMINI_PROXY_BASE = "/api/gemini";
const QUOTA_HELP_URL =
  "https://ai.google.dev/gemini-api/docs/rate-limits";

let currentController = null;

// ===============================
// UTILS
// ===============================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MAX_RETRIES = 3;
const REQUEST_DELAY = 1200;

let lastRequestTime = 0;

async function rateLimitedFetch(url, options, retries = MAX_RETRIES) {
  const now = Date.now();
  const diff = now - lastRequestTime;

  if (diff < REQUEST_DELAY) {
    await sleep(REQUEST_DELAY - diff);
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    console.warn("Gemini rate limit reached. Retrying...");
    await sleep(4000);
    return rateLimitedFetch(url, options, retries - 1);
  }

  return response;
}

// ===============================
// ERROR HANDLING
// ===============================

async function parseGeminiProxyError(response) {
  let message = `Request failed with status ${response.status}`;

  try {
    const payload = await response.json();
    if (payload?.error) message = payload.error;
  } catch {}

  return new Error(message);
}

function buildFriendlyGeminiError(error) {
  const msg = error?.message || "";

  if (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit")
  ) {
    return new Error(
      `Gemini API quota exceeded. Wait a moment or upgrade quota. See ${QUOTA_HELP_URL}`
    );
  }

  return new Error("AI request failed. Please try again.");
}

// ===============================
// CORE REQUEST
// ===============================

async function generateGeminiContent(parts) {
  const controller = new AbortController();
  currentController = controller;

  const response = await rateLimitedFetch(
    `${GEMINI_PROXY_BASE}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parts }),
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    throw await parseGeminiProxyError(response);
  }

  const payload = await response.json();

  return payload.text ?? "";
}

// ===============================
// STREAMING REQUEST
// ===============================

async function* streamGeminiContent(parts) {
  const controller = new AbortController();
  currentController = controller;

  const response = await rateLimitedFetch(
    `${GEMINI_PROXY_BASE}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parts }),
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    throw await parseGeminiProxyError(response);
  }

  if (!response.body) {
    throw new Error("Streaming body not available");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

// ===============================
// SYSTEM PROMPT
// ===============================

const BASE_PROMPT = `
You are a helpful medical AI assistant.
Provide safe health information.

Rules:
- Do NOT diagnose
- Suggest consulting doctors
- Highlight emergency symptoms
- Be clear and concise
`;

// ===============================
// SYMPTOM ANALYSIS
// ===============================

export async function analyzeSymptoms(symptoms) {
  if (!symptoms.trim()) {
    throw new Error("Please describe your symptoms.");
  }

  const prompt = `
${BASE_PROMPT}

User Symptoms: ${symptoms}

Provide:

1. Possible causes
2. Severity (Low / Medium / High / Emergency)
3. Recommended next steps
4. Warning signs
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// DRUG INTERACTION
// ===============================

export async function checkDrugInteraction(drugs) {
  if (!drugs.length) {
    throw new Error("Enter at least one medication.");
  }

  const prompt = `
${BASE_PROMPT}

Check drug interaction for:

${drugs.join(", ")}

Provide:
- Interaction severity
- Explanation
- Advice
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// MEDICAL TERM EXPLAINER
// ===============================

export async function explainMedicalTerm(term) {
  if (!term.trim()) {
    throw new Error("Enter a medical term.");
  }

  const prompt = `
Explain this medical term simply:

${term}

Include:
- Simple meaning
- When used
- Example
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// REPORT SUMMARY
// ===============================

export async function summarizeMedicalReport(report) {
  if (!report.trim()) {
    throw new Error("No report provided.");
  }

  const prompt = `
Summarize this medical report:

${report}

Provide:
- Key findings
- Explanation
- Follow-up suggestions
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// VALIDATE MEDICATION NAME
// ===============================

export async function validateMedicationName(drugName) {
  if (!drugName?.trim()) return false;

  const prompt = `
Determine if "${drugName}" is a valid medication/drug name (generic or brand).

Reply with only: VALID or INVALID
`;

  try {
    const response = (await generateGeminiContent(prompt)).trim().toUpperCase();
    return response.includes("VALID") && !response.includes("INVALID");
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// VALIDATE MEDICAL TERM
// ===============================

export async function validateMedicalTerm(term) {
  if (!term?.trim()) return false;

  const prompt = `
Decide if this input is a legitimate medical term, condition, medication, or medical code.

Input: ${term}

Reply with only: VALID or INVALID
`;

  try {
    const response = (await generateGeminiContent(prompt)).trim().toUpperCase();
    return response.includes("VALID") && !response.includes("INVALID");
  } catch {
    return false;
  }
}

// ===============================
// VALIDATE MEDICAL REPORT
// ===============================

export async function validateMedicalReport(text) {
  if (!text?.trim()) return false;

  const prompt = `
Determine if the following text looks like a medical report/document.
Reply with only: VALID or INVALID

TEXT:
${text.substring(0, 2000)}
`;

  try {
    const response = (await generateGeminiContent(prompt)).trim().toUpperCase();
    return response.includes("VALID") && !response.includes("INVALID");
  } catch {
    return false;
  }
}

// ===============================
// QUERY MEDICAL REPORT
// ===============================

export async function queryMedicalReport(query, reportText) {
  if (!query?.trim()) {
    throw new Error("Please enter your question about the medical report.");
  }
  if (!reportText?.trim()) {
    throw new Error("No medical report provided to analyze.");
  }

  const prompt = `
You are an expert medical report assistant. Answer the user's question using the report text.
Be clear and patient-friendly. Quote specific values/lines when relevant. Add safety notes.

MEDICAL REPORT:
${reportText}

USER QUESTION:
${query}
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// VALIDATE POLICY DOCUMENT
// ===============================

export async function validatePolicyDocument(text) {
  if (!text?.trim()) return false;

  const prompt = `
Determine if the following text appears to be a health insurance policy / health policy document.
Reply with only: VALID or INVALID

TEXT:
${text.substring(0, 3000)}
`;

  try {
    const response = (await generateGeminiContent(prompt)).trim().toUpperCase();
    return response.includes("VALID") && !response.includes("INVALID");
  } catch {
    return false;
  }
}

// ===============================
// QUERY POLICY DOCUMENT
// ===============================

export async function queryPolicyDocument(query, policyText) {
  if (!query?.trim()) {
    throw new Error("Please enter your policy question.");
  }
  if (!policyText?.trim()) {
    throw new Error("No policy document provided to analyze.");
  }

  const prompt = `
You are an expert health insurance policy assistant. Answer the user's query strictly based on the policy.
Include:
- Decision (covered/not covered/approved/rejected)
- Amount/limits if present
- Clause references / excerpts
- Conditions (waiting periods, exclusions)

POLICY DOCUMENT:
${policyText}

USER QUERY:
${query}
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// MEDICAL IMAGE VALIDATION + ANALYSIS
// ===============================

export async function validateMedicalImage(imageBase64) {
  if (!imageBase64) return { isValid: false, message: "No image provided" };

  const prompt = `
You are an expert medical image validator. Determine if this is a legitimate medical image (X-ray/CT/MRI/Ultrasound/ECG/etc.).
Respond ONLY as JSON:
{"isValid":true/false,"confidence":0-100,"detectedType":"...","reason":"..."}
`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  try {
    const raw = (await generateGeminiContent([prompt, imagePart])).trim();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    if (parsed?.isValid && Number(parsed.confidence) >= 70) {
      return {
        isValid: true,
        message: `Medical image detected: ${parsed.detectedType}`,
        imageType: parsed.detectedType,
      };
    }

    return {
      isValid: false,
      message: `This doesn't appear to be a medical image. Detected: ${parsed.detectedType}. ${parsed.reason}`,
    };
  } catch {
    // Fail open: don't block the user if validation fails.
    return { isValid: true, message: "Unable to validate image type, proceeding with analysis" };
  }
}

export async function analyzeMedicalImage(imageBase64, additionalInfo = "") {
  if (!imageBase64) {
    throw new Error("Please upload a medical image.");
  }

  const context = additionalInfo?.trim()
    ? `\n\nPatient Context: ${additionalInfo.trim()}`
    : "";

  const prompt = `
You are an expert medical AI assistant specializing in medical image analysis.${context}

Return ONLY JSON in this exact shape:
{
  "imageType": "X-Ray/CT Scan/MRI/Ultrasound/ECG/etc.",
  "bodyPart": "Body part",
  "keyFindings": [{"finding":"","location":"","severity":"Normal|Mild|Moderate|Severe|Critical","significance":""}],
  "overallAssessment": {"status":"Normal|Attention Needed|Urgent Care Required","summary":"","urgencyLevel":"Low|Medium|High"},
  "recommendations": {"immediate":[],"followUp":[],"lifestyle":[]},
  "differentialDiagnosis": [],
  "redFlags": [],
  "nextSteps": [],
  "confidence": 0
}
`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  try {
    const raw = (await generateGeminiContent([prompt, imagePart])).trim();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    if (!parsed?.imageType) {
      throw new Error("Could not identify image type");
    }

    return parsed;
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// MEDICINE IMAGE VALIDATION + ANALYSIS
// ===============================

export async function validateMedicineImage(imageBase64) {
  if (!imageBase64) return { isValid: false, message: "No image provided" };

  const prompt = `
You are an expert pharmaceutical image validator. Determine if the image contains medicine/pharmaceutical products.
Respond ONLY as JSON:
{"isValid":true/false,"confidence":0-100,"detectedType":"...","reason":"..."}
`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  try {
    const raw = (await generateGeminiContent([prompt, imagePart])).trim();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    if (parsed?.isValid && Number(parsed.confidence) >= 70) {
      return {
        isValid: true,
        message: `Medicine detected: ${parsed.detectedType}`,
        medicineType: parsed.detectedType,
      };
    }

    return {
      isValid: false,
      message: `This doesn't appear to be a medicine image. Detected: ${parsed.detectedType}. ${parsed.reason}`,
    };
  } catch {
    return { isValid: true, message: "Unable to validate image type, proceeding with analysis" };
  }
}

export async function analyzeMedicine(imageBase64, additionalInfo = "") {
  if (!imageBase64) {
    throw new Error("Please upload a medicine image.");
  }

  const context = additionalInfo?.trim()
    ? `\n\nAdditional patient information: ${additionalInfo.trim()}`
    : "";

  const prompt = `
You are a pharmaceutical AI assistant. Analyze the medicine image and respond ONLY as JSON.${context}

{
  "medicineName": "",
  "activeIngredients": [],
  "whatItHelps": [],
  "severity": "Low|Medium|High",
  "doctorConsultationRequired": true,
  "whenToTake": {"timing":[],"withFood":"Before|After|With|Doesn't matter","frequency":""},
  "sideEffects": {"common":[],"serious":[],"patientSpecific":[]},
  "precautions": [],
  "interactions": [],
  "confidence": 0
}
`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  try {
    const raw = (await generateGeminiContent([prompt, imagePart])).trim();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    if (!parsed?.medicineName) {
      throw new Error("Could not identify medicine name");
    }

    return parsed;
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// GENERAL AI CHAT
// ===============================

export async function getAIResponse(message) {
  if (!message.trim()) {
    throw new Error("Enter a health question.");
  }

  const prompt = `
${BASE_PROMPT}

User Question:
${message}
`;

  try {
    return await generateGeminiContent(prompt);
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// STREAM CHAT
// ===============================

export async function* streamAIResponse(message) {
  const prompt = `
${BASE_PROMPT}

User: ${message}
Assistant:
`;

  try {
    for await (const chunk of streamGeminiContent(prompt)) {
      yield chunk;
    }
  } catch (err) {
    throw buildFriendlyGeminiError(err);
  }
}

// ===============================
// CANCEL REQUEST
// ===============================

export function cancelCurrentRequest() {
  if (currentController) {
    currentController.abort();
    currentController = null;
  }
}
