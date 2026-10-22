import { z } from "zod";

export const LANGUAGES = ["english", "urdu", "romanUrdu"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  english: "English",
  urdu: "اردو (Urdu)",
  romanUrdu: "Roman Urdu",
};

export const BUSINESS_TYPES = [
  "Clothing brand",
  "Restaurant / food",
  "Home business",
  "Beauty / salon",
  "Freelancer / services",
  "Other",
] as const;

export const TONES = ["Friendly", "Professional", "Festive", "Luxury", "Fun / playful"] as const;

export const PLATFORMS = ["Instagram", "Facebook", "WhatsApp", "TikTok"] as const;

// What the browser sends to /api/generate. Limits keep prompts (and free-tier token use) small.
export const generateRequestSchema = z.object({
  product: z.string().trim().min(2, "Please enter a product or service").max(120),
  details: z.string().trim().max(500).default(""),
  audience: z.string().trim().min(2, "Please describe your audience").max(200),
  businessType: z.enum(BUSINESS_TYPES),
  tone: z.enum(TONES),
  platform: z.enum(PLATFORMS),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Pick at least one language"),
  brand: z
    .object({
      name: z.string().trim().max(60).default(""),
      tagline: z.string().trim().max(120).default(""),
    })
    .default({ name: "", tagline: "" }),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const languagePackSchema = z.object({
  captions: z.array(z.string()).min(1),
  productDescription: z.string(),
  hashtags: z.array(z.string()),
  campaignIdeas: z.array(z.object({ title: z.string(), description: z.string() })),
});

export type LanguagePack = z.infer<typeof languagePackSchema>;

export const contentPackSchema = z.object({
  english: languagePackSchema.optional(),
  urdu: languagePackSchema.optional(),
  romanUrdu: languagePackSchema.optional(),
});

export type ContentPack = z.infer<typeof contentPackSchema>;
