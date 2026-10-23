import type { BrandVoice, Brief, Language, Section } from "./schema";

// Prompt wording lives here so it can be tuned without touching UI or API code.

export const SYSTEM_PROMPT = `You are a senior social media copywriter for small businesses in Pakistan.
Write marketing content that sounds natural to Pakistani customers and is ready to post.
Rules:
- Write each language natively from the brief. Never translate one language word for word into another.
- Do not invent prices, discounts, phone numbers, addresses or delivery promises that the brief does not give.
- No medical, health or guaranteed-result claims (important for beauty and food).
- Never use any word from the brand's banned-words list.
- Keep content respectful and culturally appropriate for Pakistan.
- Emojis: use a few where they fit the tone, never more than 3 per caption.`;

export const LANGUAGE_GUIDES: Record<Language, string> = {
  english: "english: clear, simple English that Pakistani customers use on Instagram. Short sentences.",
  urdu: "urdu: proper Urdu in Urdu script (Nastaliq / Arabic letters) only. No Roman letters except brand names. Warm and natural, not bookish.",
  romanUrdu:
    'romanUrdu: Urdu written in English letters the way people type on WhatsApp and Instagram (e.g. "Naya collection agaya hai! Jaldi order karein"). Not a transliteration of the Urdu output; write it fresh with its own casual rhythm. Every field (captions, CTAs, plan, carousel headings and text) must be Urdu sentences in English letters, never plain English sentences.',
  mixed:
    'mixed: the way Pakistani brands actually post: mostly English with natural Urdu phrases in Roman letters (e.g. "Eid vibes are here, aur yeh collection bilkul perfect hai!").',
};

export const SECTION_RULES: Record<Section, string> = {
  captions: "captions: exactly 3 captions. Caption 1 short (under 25 words), caption 2 medium, caption 3 long storytelling (60-90 words).",
  description: "description: one product description of 60-100 words.",
  ctas: 'ctas: exactly 5 short calls to action (e.g. "DM to order", "Order on WhatsApp").',
  ideas: "ideas: exactly 3 campaign ideas, each with a short title and a 1-2 sentence description.",
  plan: 'plan: exactly 7 days (day = "Day 1" ... "Day 7"). Each has a post format (Reel, Carousel, Story, Single image, Poll), a one-line idea, a ready caption, and a best posting time in Pakistan time (e.g. "8:30 PM").',
  carousel:
    "carousel: exactly 5 slides for an Instagram carousel. Slide 1 is a hook, slides 2-4 give benefits or details, slide 5 is a call to action. Heading under 8 words, body under 25 words.",
  hashtags:
    "hashtags: 15 hashtags in three tiers: broad (5 popular general tags), niche (5 for this product and industry), local (5 for the city or Pakistan). Each starts with #, no spaces, English or Roman Urdu only (no Urdu script).",
};

export function buildUserPrompt(brief: Brief, brand: BrandVoice, sections: readonly Section[]): string {
  const languageLines = brief.languages.map((l) => `- ${LANGUAGE_GUIDES[l]}`).join("\n");
  const sectionLines = sections.map((s) => `- ${SECTION_RULES[s]}`).join("\n");
  return [
    "BRIEF",
    `Product or service: ${brief.product}`,
    brief.details && `Details: ${brief.details}`,
    `Business type: ${brief.businessType}`,
    `Target audience: ${brief.audience}`,
    `Goal: ${brief.goal}`,
    brief.offer && `Offer: ${brief.offer}`,
    brief.occasion !== "None" && `Occasion to theme the content around: ${brief.occasion}`,
    `Tone: ${brief.tone}`,
    `Main platform: ${brief.platform}`,
    "",
    "BRAND",
    brand.name ? `Brand name: ${brand.name}` : "Brand name: not given (do not invent one)",
    brand.tagline && `Tagline: ${brand.tagline}`,
    brand.voice && `Brand voice notes: ${brand.voice}`,
    brand.bannedWords && `Banned words (never use): ${brand.bannedWords}`,
    "",
    "LANGUAGES (write every section in each of these, under its key; each key's text must be in that language only)",
    languageLines,
    "",
    "SECTIONS TO WRITE",
    sectionLines,
  ]
    .filter((line) => line !== false && line !== "")
    .join("\n");
}
