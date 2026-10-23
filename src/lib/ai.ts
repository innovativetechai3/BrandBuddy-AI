import "server-only";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import {
  contentPackSchema,
  partialPackSchema,
  SECTIONS,
  type BrandVoice,
  type Brief,
  type ContentPack,
  type PartialPack,
  type Section,
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

const STRING = { type: "STRING" };
const STRINGS = { type: "ARRAY", items: STRING };
const obj = (properties: Record<string, unknown>) => ({
  type: "OBJECT",
  properties,
  required: Object.keys(properties),
});

// Gemini response schemas for each section of one language.
const LANGUAGE_SECTION_SCHEMAS: Record<Exclude<Section, "hashtags">, unknown> = {
  captions: STRINGS,
  description: STRING,
  ctas: STRINGS,
  ideas: { type: "ARRAY", items: obj({ title: STRING, description: STRING }) },
  plan: {
    type: "ARRAY",
    items: obj({ day: STRING, format: STRING, idea: STRING, caption: STRING, bestTime: STRING }),
  },
  carousel: { type: "ARRAY", items: obj({ heading: STRING, body: STRING }) },
};
const HASHTAGS_SCHEMA = obj({ broad: STRINGS, niche: STRINGS, local: STRINGS });

function buildResponseSchema(brief: Brief, sections: readonly Section[]) {
  const properties: Record<string, unknown> = {};
  if (sections.includes("hashtags")) properties.hashtags = HASHTAGS_SCHEMA;
  const languageSections = sections.filter((s): s is Exclude<Section, "hashtags"> => s !== "hashtags");
  if (languageSections.length) {
    const pack = obj(Object.fromEntries(languageSections.map((s) => [s, LANGUAGE_SECTION_SCHEMAS[s]])));
    properties.languages = obj(Object.fromEntries(brief.languages.map((l) => [l, pack])));
  }
  return obj(properties);
}

async function callGemini(apiKey: string, body: string): Promise<unknown> {
  // Free-tier models are often briefly overloaded (503), rate limited (429) or
  // retired (404), so try the next model in the list before giving up.
  const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean) as string[])];
  let lastStatus = 0;
  for (const model of models) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
      if (!text) {
        throw new AIError("The AI returned an empty answer (it may have been blocked). Try rewording.", 502);
      }
      try {
        return JSON.parse(text);
      } catch {
        return undefined;
      }
    }
    lastStatus = res.status;
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", model, res.status, detail.slice(0, 500));
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new AIError("Gemini rejected the request. Check that GEMINI_API_KEY is valid.", 502);
    }
  }
  if (lastStatus === 429) {
    throw new AIError(
      "The free Gemini quota is used up for now. Please wait a minute and try again (daily limits reset at midnight Pacific time).",
      429,
    );
  }
  throw new AIError("Google's free AI models are busy right now. Please try again in a minute.", 503);
}

export async function generate(brief: Brief, brand: BrandVoice): Promise<ContentPack>;
export async function generate(brief: Brief, brand: BrandVoice, section: Section): Promise<PartialPack>;
export async function generate(brief: Brief, brand: BrandVoice, section?: Section) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "The server is missing GEMINI_API_KEY. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.",
      500,
    );
  }
  const sections = section ? [section] : SECTIONS;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(brief, brand, sections) }] }],
    generationConfig: {
      temperature: 0.9,
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(brief, sections),
    },
  });
  const schema = section ? partialPackSchema : contentPackSchema;

  // One automatic retry if the answer is not valid JSON in the expected shape.
  for (let attempt = 0; attempt < 2; attempt++) {
    const parsed = schema.safeParse(await callGemini(apiKey, body));
    if (parsed.success) return parsed.data;
    console.error("Invalid AI answer", parsed.error.issues.slice(0, 3));
  }
  throw new AIError("The AI answer was incomplete. Please try again.", 502);
}
