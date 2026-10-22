"use client";

import { useEffect, useState } from "react";
import {
  BUSINESS_TYPES,
  LANGUAGES,
  LANGUAGE_LABELS,
  PLATFORMS,
  TONES,
  type ContentPack,
  type GenerateRequest,
  type Language,
} from "@/lib/schema";
import {
  addToHistory,
  clearHistory,
  DEFAULT_BRAND,
  loadBrandKit,
  loadHistory,
  saveBrandKit,
  type BrandKit,
  type HistoryItem,
} from "@/lib/storage";
import Results from "./Results";

type FormState = Omit<GenerateRequest, "brand">;

const EMPTY_FORM: FormState = {
  product: "",
  details: "",
  audience: "",
  businessType: "Clothing brand",
  tone: "Friendly",
  platform: "Instagram",
  languages: ["english", "urdu", "romanUrdu"],
};

const EXAMPLE_FORM: FormState = {
  product: "Embroidered lawn suits – summer collection",
  details: "3-piece unstitched, pure cotton, 12 designs, free delivery across Karachi",
  audience: "Women aged 20–40 in Karachi and Lahore who shop on Instagram",
  businessType: "Clothing brand",
  tone: "Festive",
  platform: "Instagram",
  languages: ["english", "urdu", "romanUrdu"],
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200";

export default function Studio() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [brand, setBrand] = useState<BrandKit>(DEFAULT_BRAND);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  // localStorage only exists in the browser, so load it after the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrand(loadBrandKit());
    setHistory(loadHistory());
  }, []);

  function updateBrand(patch: Partial<BrandKit>) {
    const next = { ...brand, ...patch };
    setBrand(next);
    saveBrandKit(next);
  }

  function toggleLanguage(lang: Language) {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang],
    }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.languages.length === 0) {
      setError("Pick at least one language.");
      return;
    }
    setLoading(true);
    const request: GenerateRequest = { ...form, brand: { name: brand.name, tagline: brand.tagline } };
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setPack(data.pack);
      // On phones the results sit below the form, so bring them into view.
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
      setRemaining(typeof data.remaining === "number" ? data.remaining : null);
      setHistory(
        addToHistory({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), request, pack: data.pack }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 font-semibold">Brand kit</h2>
          <p className="mb-4 text-xs text-gray-500">Saved in this browser and used on every post image.</p>
          <div className="space-y-3">
            <input
              className={inputClass}
              placeholder="Brand name (e.g. Ayesha's Closet)"
              value={brand.name}
              maxLength={60}
              onChange={(e) => updateBrand({ name: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Tagline (optional)"
              value={brand.tagline}
              maxLength={120}
              onChange={(e) => updateBrand({ tagline: e.target.value })}
            />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.primaryColor}
                  onChange={(e) => updateBrand({ primaryColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-gray-300"
                />
                Main colour
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.accentColor}
                  onChange={(e) => updateBrand({ accentColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-gray-300"
                />
                Accent
              </label>
            </div>
          </div>
        </section>

        <form onSubmit={generate} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">What are you promoting?</h2>
            <button
              type="button"
              onClick={() => setForm(EXAMPLE_FORM)}
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              Try an example
            </button>
          </div>

          <Field label="Product or service *">
            <input
              className={inputClass}
              value={form.product}
              maxLength={120}
              required
              placeholder="e.g. Chicken biryani family deal"
              onChange={(e) => setForm({ ...form, product: e.target.value })}
            />
          </Field>
          <Field label="Details (optional)">
            <textarea
              className={inputClass}
              rows={3}
              value={form.details}
              maxLength={500}
              placeholder="Price, offer, ingredients, fabric, delivery area…"
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </Field>
          <Field label="Target audience *">
            <input
              className={inputClass}
              value={form.audience}
              maxLength={200}
              required
              placeholder="e.g. Families in Lahore who order dinner online"
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Business type">
              <select
                className={inputClass}
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value as FormState["businessType"] })}
              >
                {BUSINESS_TYPES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Tone">
              <select
                className={inputClass}
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value as FormState["tone"] })}
              >
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Platform">
              <select
                className={inputClass}
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value as FormState["platform"] })}
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
                const on = form.languages.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
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
          </fieldset>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Writing your content…" : "Generate content"}
          </button>
          {remaining !== null && (
            <p className="text-center text-xs text-gray-500">{remaining} free generations left today</p>
          )}
        </form>

        {history.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent</h2>
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
                      setPack(h.pack);
                      setForm({ ...EMPTY_FORM, ...h.request });
                    }}
                    className="w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                  >
                    {h.request.product}
                    <span className="ml-2 text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div id="results" className="min-w-0 scroll-mt-4">
        {pack ? (
          <Results pack={pack} brand={brand} />
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
            {loading ? (
              <p>Creating captions, descriptions, hashtags and ideas…</p>
            ) : (
              <p>
                Fill in the form and press <strong>Generate content</strong>.
                <br />
                Your results will appear here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
