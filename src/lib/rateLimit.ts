import "server-only";

// Best-effort daily cap per visitor so one person cannot burn the whole free
// Gemini quota. It lives in memory, so it resets when Vercel restarts the
// function; that is acceptable for a free MVP (no database needed).

const DAILY_LIMIT = Number(process.env.DAILY_LIMIT_PER_VISITOR || 20);
const hits = new Map<string, { day: string; count: number }>();

export function checkRateLimit(visitor: string): { ok: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const entry = hits.get(visitor);
  const count = entry && entry.day === day ? entry.count : 0;
  if (count >= DAILY_LIMIT) return { ok: false, remaining: 0 };
  hits.set(visitor, { day, count: count + 1 });
  if (hits.size > 5000) hits.clear();
  return { ok: true, remaining: DAILY_LIMIT - count - 1 };
}
