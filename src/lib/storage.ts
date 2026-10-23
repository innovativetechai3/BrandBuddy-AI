import type { Brief, ContentPack } from "./schema";

// Browser-only storage. Everything stays on the user's device (no database).

export const FONT_PAIRS = {
  modern: { label: "Modern", css: "var(--font-geist-sans), sans-serif" },
  classic: { label: "Classic", css: "var(--font-classic), serif" },
  bold: { label: "Bold", css: "var(--font-bold), sans-serif" },
} as const;
export type FontPair = keyof typeof FONT_PAIRS;

export type BrandKit = {
  id: string;
  name: string;
  tagline: string;
  logo: string; // small data: URL, or ""
  primaryColor: string;
  accentColor: string;
  lightColor: string;
  font: FontPair;
  voice: string;
  bannedWords: string;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  brief: Brief;
  pack: ContentPack;
};

export function newBrandKit(): BrandKit {
  return {
    id: crypto.randomUUID(),
    name: "",
    tagline: "",
    logo: "",
    primaryColor: "#7c3aed",
    accentColor: "#f59e0b",
    lightColor: "#fdf8ff",
    font: "modern",
    voice: "",
    bannedWords: "",
  };
}

const KITS_KEY = "brandbuddy.brandKits";
const ACTIVE_KIT_KEY = "brandbuddy.activeKit";
const OLD_KIT_KEY = "brandbuddy.brandKit";
const HISTORY_KEY = "brandbuddy.history.v2";
const MAX_HISTORY = 10;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage may be full or blocked (private mode); the app still works without it.
    return false;
  }
}

export function loadBrandKits(): BrandKit[] {
  const kits = read<Partial<BrandKit>[]>(KITS_KEY, []);
  if (kits.length === 0) {
    // Carry over the single kit saved by the first version of the app.
    const old = read<Partial<BrandKit> | null>(OLD_KIT_KEY, null);
    if (old) kits.push(old);
  }
  return kits.map((k) => ({ ...newBrandKit(), ...k, id: k.id || crypto.randomUUID() }));
}
export const saveBrandKits = (kits: BrandKit[]) => write(KITS_KEY, kits);
export const loadActiveKitId = () => read<string>(ACTIVE_KIT_KEY, "");
export const saveActiveKitId = (id: string) => write(ACTIVE_KIT_KEY, id);

export const loadHistory = () => read<HistoryItem[]>(HISTORY_KEY, []);
export function addToHistory(item: HistoryItem): HistoryItem[] {
  const next = [item, ...loadHistory().filter((h) => h.id !== item.id)].slice(0, MAX_HISTORY);
  write(HISTORY_KEY, next);
  return next;
}
export function clearHistory() {
  write(HISTORY_KEY, []);
}

// Shrinks an uploaded image so it fits comfortably in localStorage.
export function imageToDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
