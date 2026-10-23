import type { Brief } from "./schema";

type Preset = Pick<Brief, "tone" | "goal" | "platform"> & { product: string; audience: string };

// Smart defaults per niche: picking a business type pre-fills tone, goal and
// platform, and shows matching examples in the empty fields.
export const NICHE_PRESETS: Record<Brief["businessType"], Preset> = {
  "Clothing brand": {
    tone: "Festive",
    goal: "Get sales / orders",
    platform: "Instagram",
    product: "e.g. Embroidered lawn 3-piece suits",
    audience: "e.g. Women aged 20–40 in Karachi and Lahore",
  },
  "Restaurant / food": {
    tone: "Friendly",
    goal: "Get sales / orders",
    platform: "Facebook",
    product: "e.g. Chicken biryani family deal",
    audience: "e.g. Families in Gulshan ordering dinner online",
  },
  "Home business": {
    tone: "Friendly",
    goal: "Get sales / orders",
    platform: "WhatsApp",
    product: "e.g. Homemade achar and frozen samosas",
    audience: "e.g. Working mothers in Islamabad",
  },
  "Beauty / salon": {
    tone: "Luxury",
    goal: "Visit our shop",
    platform: "Instagram",
    product: "e.g. Bridal makeup package",
    audience: "e.g. Brides-to-be in Lahore",
  },
  "Freelancer / services": {
    tone: "Professional",
    goal: "Brand awareness",
    platform: "Facebook",
    product: "e.g. Logo and social media design",
    audience: "e.g. New small businesses in Pakistan",
  },
  Other: {
    tone: "Friendly",
    goal: "Get sales / orders",
    platform: "Instagram",
    product: "e.g. Your product or service",
    audience: "e.g. Who should buy it, and where they live",
  },
};

export const EMPTY_BRIEF: Brief = {
  product: "",
  details: "",
  audience: "",
  businessType: "Clothing brand",
  tone: "Festive",
  platform: "Instagram",
  goal: "Get sales / orders",
  offer: "",
  occasion: "None",
  languages: ["english", "urdu", "romanUrdu"],
};

export const EXAMPLE_BRIEF: Brief = {
  product: "Embroidered lawn suits – summer collection",
  details: "3-piece unstitched, pure cotton, 12 designs",
  audience: "Women aged 20–40 in Karachi and Lahore who shop on Instagram",
  businessType: "Clothing brand",
  tone: "Festive",
  platform: "Instagram",
  goal: "New launch",
  offer: "Free delivery across Karachi this week",
  occasion: "Eid ul Fitr",
  languages: ["english", "urdu", "romanUrdu"],
};
