import "server-only";
import {
  contentPackSchema,
  LANGUAGE_LABELS,
  type ContentPack,
  type GenerateRequest,
} from "./schema";

// All AI calls live here so the provider (or a paid tier) can be swapped later
// without touching the UI. This file never reaches the browser ("server-only").

// Tried in order. GEMINI_MODEL, if set, is tried first.
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"];
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class AIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const languagePackJsonSchema = {
  type: "OBJECT",
  properties: {
    captions: { type: "ARRAY", items: { type: "STRING" } },
    productDescription: { type: "STRING" },
    hashtags: { type: "ARRAY", items: { type: "STRING" } },
    campaignIdeas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { title: { type: "STRING" }, description: { type: "STRING" } },
        required: ["title", "description"],
      },
    },
  },
  required: ["captions", "productDescription", "hashtags", "campaignIdeas"],
};

const SYSTEM_PROMPT = `You are a senior social media copywriter for small businesses in Pakistan.
Write marketing content that sounds natural to Pakistani customers.
Rules:
- "urdu" must be written in Urdu script (Nastaliq/Arabic letters), not Roman letters.
- "romanUrdu" must be Urdu written in English letters, the way people type on WhatsApp and Instagram (e.g. "Naya collection agaya hai!").
- "english" must be clear, simple English.
- Write each language natively; do not translate word for word.
- Give exactly 3 captions, 1 product description (60-100 words), 10-15 hashtags (each starting with #, no spaces), and 3 campaign ideas.
- Hashtags may mix English and Roman Urdu for every language; avoid Urdu-script hashtags.
- Do not invent prices, discounts, phone numbers or addresses unless the user gave them.
- Keep content respectful and culturally appropriate.`;

function buildUserPrompt(req: GenerateRequest): string {
  const langs = req.languages.map((l) => `${l} (${LANGUAGE_LABELS[l]})`).join(", ");
  return [
    `Product or service: ${req.product}`,
    req.details && `Details: ${req.details}`,
    `Business type: ${req.businessType}`,
    `Target audience: ${req.audience}`,
    `Tone: ${req.tone}`,
    `Platform: ${req.platform}`,
    req.brand.name && `Brand name: ${req.brand.name}`,
    req.brand.tagline && `Brand tagline: ${req.brand.tagline}`,
    `Generate content only for these languages: ${langs}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateContentPack(req: GenerateRequest): Promise<ContentPack> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "The server is missing GEMINI_API_KEY. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.",
      500,
    );
  }
  const properties = Object.fromEntries(req.languages.map((l) => [l, languagePackJsonSchema]));
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(req) }] }],
    generationConfig: {
      temperature: 0.9,
      responseMimeType: "application/json",
      responseSchema: { type: "OBJECT", properties, required: req.languages },
    },
  });

  // Free-tier models are often briefly overloaded (503), rate limited (429) or
  // retired (404), so try the next model in the list before giving up.
  const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean) as string[])];
  let res: Response | undefined;
  let lastStatus = 0;
  for (const model of models) {
    res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
    });
    if (res.ok) break;
    lastStatus = res.status;
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", model, res.status, detail.slice(0, 500));
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new AIError("Gemini rejected the request. Check that GEMINI_API_KEY is valid.", 502);
    }
  }

  if (!res?.ok) {
    if (lastStatus === 429) {
      throw new AIError(
        "The free Gemini quota is used up for now. Please wait a minute and try again (daily limits reset at midnight Pacific time).",
        429,
      );
    }
    throw new AIError("Google's free AI models are busy right now. Please try again in a minute.", 503);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) {
    throw new AIError("The AI returned an empty answer (it may have been blocked). Try rewording.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AIError("The AI answer could not be read. Please try again.", 502);
  }
  const result = contentPackSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIError("The AI answer was incomplete. Please try again.", 502);
  }
  return result.data;
}
