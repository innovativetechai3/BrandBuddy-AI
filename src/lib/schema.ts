import { z } from "zod";

export const LANGUAGES = ["english", "urdu", "romanUrdu", "mixed"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  english: "English",
  urdu: "اردو (Urdu)",
  romanUrdu: "Roman Urdu",
  mixed: "Mixed (Eng + Urdu)",
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

export const GOALS = ["Get sales / orders", "New launch", "Brand awareness", "Engagement", "Visit our shop"] as const;

export const OCCASIONS = [
  "None",
  "Ramadan",
  "Eid ul Fitr",
  "Eid ul Adha",
  "14 August (Independence Day)",
  "Wedding season",
  "Summer",
  "Winter",
  "11.11 sale",
  "Black Friday sale",
] as const;

// The parts of a content pack that can be regenerated on their own.
export const SECTIONS = ["captions", "description", "ctas", "ideas", "plan", "carousel", "hashtags"] as const;
export type Section = (typeof SECTIONS)[number];

const text = (max: number) => z.string().trim().max(max);

export const briefSchema = z.object({
  product: text(120).min(2, "Please enter a product or service"),
  details: text(500).default(""),
  audience: text(200).min(2, "Please describe your audience"),
  businessType: z.enum(BUSINESS_TYPES),
  tone: z.enum(TONES),
  platform: z.enum(PLATFORMS),
  goal: z.enum(GOALS).default("Get sales / orders"),
  offer: text(150).default(""),
  occasion: z.enum(OCCASIONS).default("None"),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Pick at least one language"),
});
export type Brief = z.infer<typeof briefSchema>;

// Only the brand-kit fields the AI needs (colours, fonts and logo stay in the browser).
export const brandVoiceSchema = z.object({
  name: text(60).default(""),
  tagline: text(120).default(""),
  voice: text(400).default(""),
  bannedWords: text(300).default(""),
});
export type BrandVoice = z.infer<typeof brandVoiceSchema>;

export const generateRequestSchema = z.object({
  brief: briefSchema,
  brand: brandVoiceSchema.default({ name: "", tagline: "", voice: "", bannedWords: "" }),
  section: z.enum(SECTIONS).optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const slideSchema = z.object({ heading: z.string(), body: z.string() });
export type Slide = z.infer<typeof slideSchema>;

export const planDaySchema = z.object({
  day: z.string(),
  format: z.string(),
  idea: z.string(),
  caption: z.string(),
  bestTime: z.string(),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const languagePackSchema = z.object({
  captions: z.array(z.string()),
  description: z.string(),
  ctas: z.array(z.string()),
  ideas: z.array(z.object({ title: z.string(), description: z.string() })),
  plan: z.array(planDaySchema),
  carousel: z.array(slideSchema),
});
export type LanguagePack = z.infer<typeof languagePackSchema>;

export const hashtagsSchema = z.object({
  broad: z.array(z.string()),
  niche: z.array(z.string()),
  local: z.array(z.string()),
});
export type Hashtags = z.infer<typeof hashtagsSchema>;

export const contentPackSchema = z.object({
  hashtags: hashtagsSchema,
  languages: z.object({
    english: languagePackSchema.optional(),
    urdu: languagePackSchema.optional(),
    romanUrdu: languagePackSchema.optional(),
    mixed: languagePackSchema.optional(),
  }),
});
export type ContentPack = z.infer<typeof contentPackSchema>;

// A partial pack, returned when only one section is regenerated.
export const partialPackSchema = z.object({
  hashtags: hashtagsSchema.optional(),
  languages: z
    .object({
      english: languagePackSchema.partial().optional(),
      urdu: languagePackSchema.partial().optional(),
      romanUrdu: languagePackSchema.partial().optional(),
      mixed: languagePackSchema.partial().optional(),
    })
    .optional(),
});
export type PartialPack = z.infer<typeof partialPackSchema>;
