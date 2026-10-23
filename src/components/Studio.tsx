"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BUSINESS_TYPES,
  GOALS,
  LANGUAGES,
  LANGUAGE_LABELS,
  OCCASIONS,
  PLATFORMS,
  TONES,
  type Brief,
  type ContentPack,
  type Language,
  type PartialPack,
  type Section,
} from "@/lib/schema";
import { EMPTY_BRIEF, EXAMPLE_BRIEF, NICHE_PRESETS } from "@/lib/presets";
import { addToHistory, clearHistory, loadHistory, type BrandKit, type HistoryItem } from "@/lib/storage";
import { useBrandKits } from "@/lib/useBrandKits";
import Results from "./Results";
import { Field, inputClass } from "./ui";

type Current = { id: string; brief: Brief; pack: ContentPack };

async function callApi(brief: Brief, kit: BrandKit | undefined, section?: Section) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brief,
      brand: { name: kit?.name ?? "", tagline: kit?.tagline ?? "", voice: kit?.voice ?? "", bannedWords: kit?.bannedWords ?? "" },
      section,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as { pack: ContentPack | PartialPack; remaining: number };
}

// Puts one regenerated section into the existing pack.
function mergeSection(pack: ContentPack, update: PartialPack): ContentPack {
  const languages = { ...pack.languages };
  for (const l of Object.keys(update.languages ?? {}) as Language[]) {
    const current = languages[l];
    const patch = update.languages?.[l];
    if (current && patch) languages[l] = { ...current, ...patch };
  }
  return { hashtags: update.hashtags ?? pack.hashtags, languages };
}

export default function Studio() {
  const { kits, active: kit, selectKit } = useBrandKits();
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [current, setCurrent] = useState<Current | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState<Section | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
  }, []);

  const preset = NICHE_PRESETS[brief.businessType];
  const set = (patch: Partial<Brief>) => setBrief((b) => ({ ...b, ...patch }));

  function save(next: Current) {
    setCurrent(next);
    setHistory(addToHistory({ ...next, createdAt: new Date().toISOString() }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (brief.languages.length === 0) {
      setError("Pick at least one language.");
      return;
    }
    setLoading(true);
    try {
      const data = await callApi(brief, kit);
      save({ id: crypto.randomUUID(), brief, pack: data.pack as ContentPack });
      setRemaining(data.remaining);
      // On phones the results sit below the form, so bring them into view.
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(section: Section) {
    if (!current) return;
    setRegenerating(section);
    setError("");
    try {
      const data = await callApi(current.brief, kit, section);
      save({ ...current, pack: mergeSection(current.pack, data.pack as PartialPack) });
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRegenerating(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <form onSubmit={generate} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your brief</h2>
            <button
              type="button"
              onClick={() => setBrief(EXAMPLE_BRIEF)}
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              Try an example
            </button>
          </div>

          <Field label="Brand kit">
            <div className="flex gap-2">
              <select className={inputClass} value={kit?.id ?? ""} onChange={(e) => selectKit(e.target.value)}>
                {kits.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name || "Untitled brand"}
                  </option>
                ))}
              </select>
              <Link
                href="/brand-kit"
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50"
              >
                Edit
              </Link>
            </div>
          </Field>

          <Field label="Business type">
            <select
              className={inputClass}
              value={brief.businessType}
              onChange={(e) => {
                const businessType = e.target.value as Brief["businessType"];
                const p = NICHE_PRESETS[businessType];
                set({ businessType, tone: p.tone, goal: p.goal, platform: p.platform });
              }}
            >
              {BUSINESS_TYPES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>

          <Field label="Product or service *">
            <input
              className={inputClass}
              value={brief.product}
              maxLength={120}
              required
              placeholder={preset.product}
              onChange={(e) => set({ product: e.target.value })}
            />
          </Field>
          <Field label="Details (optional)">
            <textarea
              className={inputClass}
              rows={2}
              value={brief.details}
              maxLength={500}
              placeholder="Fabric, ingredients, sizes, delivery area…"
              onChange={(e) => set({ details: e.target.value })}
            />
          </Field>
          <Field label="Target audience *">
            <input
              className={inputClass}
              value={brief.audience}
              maxLength={200}
              required
              placeholder={preset.audience}
              onChange={(e) => set({ audience: e.target.value })}
            />
          </Field>
          <Field label="Offer (optional)">
            <input
              className={inputClass}
              value={brief.offer}
              maxLength={150}
              placeholder="e.g. 20% off till Sunday, free delivery"
              onChange={(e) => set({ offer: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Goal">
              <select
                className={inputClass}
                value={brief.goal}
                onChange={(e) => set({ goal: e.target.value as Brief["goal"] })}
              >
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Occasion">
              <select
                className={inputClass}
                value={brief.occasion}
                onChange={(e) => set({ occasion: e.target.value as Brief["occasion"] })}
              >
                {OCCASIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Tone">
              <select
                className={inputClass}
                value={brief.tone}
                onChange={(e) => set({ tone: e.target.value as Brief["tone"] })}
              >
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Platform">
              <select
                className={inputClass}
                value={brief.platform}
                onChange={(e) => set({ platform: e.target.value as Brief["platform"] })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Languages</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const on = brief.languages.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() =>
                      set({ languages: on ? brief.languages.filter((l) => l !== lang) : [...brief.languages, lang] })
                    }
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                      on ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-gray-700 ring-gray-300"
                    }`}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500">Fewer languages = faster results.</p>
          </fieldset>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Writing your content pack…" : "Generate content pack"}
          </button>
          {remaining !== null && (
            <p className="text-center text-xs text-gray-500">{remaining} free generations left today</p>
          )}
        </form>

        {history.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent packs</h2>
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline"
                onClick={() => {
                  clearHistory();
                  setHistory([]);
                }}
              >
                Clear
              </button>
            </div>
            <ul className="space-y-1">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrent({ id: h.id, brief: h.brief, pack: h.pack });
                      setBrief(h.brief);
                    }}
                    className="w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                  >
                    {h.brief.product}
                    <span className="ml-2 text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div id="results" className="min-w-0 scroll-mt-4">
        {current && kit ? (
          <Results
            key={current.id}
            pack={current.pack}
            kit={kit}
            product={current.brief.product}
            regenerating={regenerating}
            onRegenerate={regenerate}
            onPackChange={(pack) => save({ ...current, pack })}
          />
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
            {loading ? (
              <p>Writing captions, hashtags, CTAs, a 7-day plan and a carousel… this can take up to a minute.</p>
            ) : (
              <p>
                Fill in the brief and press <strong>Generate content pack</strong>.
                <br />
                You&apos;ll get captions, hashtags, CTAs, a 7-day plan and a 5-slide carousel.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
