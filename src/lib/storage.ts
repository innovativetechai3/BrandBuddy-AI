import type { ContentPack, GenerateRequest } from "./schema";

// Browser-only storage. Everything stays on the user's device (no database).

export type BrandKit = {
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  request: GenerateRequest;
  pack: ContentPack;
};

export const DEFAULT_BRAND: BrandKit = {
  name: "",
  tagline: "",
  primaryColor: "#7c3aed",
  accentColor: "#f59e0b",
};

const BRAND_KEY = "brandbuddy.brandKit";
const HISTORY_KEY = "brandbuddy.history";
const MAX_HISTORY = 10;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked (private mode); the app still works without it.
  }
}

export const loadBrandKit = () => ({ ...DEFAULT_BRAND, ...read<Partial<BrandKit>>(BRAND_KEY, {}) });
export const saveBrandKit = (kit: BrandKit) => write(BRAND_KEY, kit);

export const loadHistory = () => read<HistoryItem[]>(HISTORY_KEY, []);
export function addToHistory(item: HistoryItem): HistoryItem[] {
  const next = [item, ...loadHistory()].slice(0, MAX_HISTORY);
  write(HISTORY_KEY, next);
  return next;
}
export function clearHistory() {
  write(HISTORY_KEY, []);
}
