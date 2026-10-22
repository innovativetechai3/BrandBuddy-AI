"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { LANGUAGES, LANGUAGE_LABELS, type ContentPack, type Language } from "@/lib/schema";
import type { BrandKit } from "@/lib/storage";

export default function Results({ pack, brand }: { pack: ContentPack; brand: BrandKit }) {
  const available = LANGUAGES.filter((l) => pack[l]);
  const [chosen, setChosen] = useState<Language>(available[0]);
  const lang = available.includes(chosen) ? chosen : available[0];
  const content = lang ? pack[lang] : undefined;
  if (!lang || !content) return null;

  const isUrdu = lang === "urdu";
  const textClass = isUrdu ? "urdu text-lg" : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist">
        {available.map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={l === lang}
            onClick={() => setChosen(l)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              l === lang ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-300"
            }`}
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>

      <Section title="Captions">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {content.captions.map((c, i) => (
            <PostCard key={`${lang}-${i}`} caption={c} brand={brand} isUrdu={isUrdu} index={i} />
          ))}
        </div>
      </Section>

      <Section title="Product description" copyText={content.productDescription}>
        <p className={`whitespace-pre-line text-sm text-gray-800 ${textClass}`}>{content.productDescription}</p>
      </Section>

      <Section title="Hashtags" copyText={content.hashtags.join(" ")}>
        <div className="flex flex-wrap gap-2">
          {content.hashtags.map((h) => (
            <span key={h} className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">
              {h}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Campaign ideas">
        <ol className="space-y-3">
          {content.campaignIdeas.map((idea, i) => (
            <li key={i} className={`rounded-lg bg-gray-50 p-3 ${textClass}`}>
              <p className="font-semibold">{idea.title}</p>
              <p className="text-sm text-gray-700">{idea.description}</p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function Section({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {copyText && <CopyButton text={copyText} />}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard can be blocked; the user can still select the text manually.
        }
      }}
      className="rounded-md px-2 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function PostCard({
  caption,
  brand,
  isUrdu,
  index,
}: {
  caption: string;
  brand: BrandKit;
  isUrdu: boolean;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadPng() {
    if (!ref.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(brand.name || "brandbuddy").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-post-${index + 1}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the image could not be created in this browser.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={ref}
        className="flex aspect-square flex-col justify-between overflow-hidden rounded-xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}
      >
        <p className="text-xs font-bold uppercase tracking-widest opacity-90">{brand.name || "Your brand"}</p>
        <p className={`${caption.length > 180 ? "text-sm" : "text-base"} font-semibold leading-snug ${isUrdu ? "urdu" : ""}`}>
          {caption}
        </p>
        <p className="text-xs opacity-80">{brand.tagline}</p>
      </div>
      <div className="flex gap-2">
        <CopyButton text={caption} />
        <button
          type="button"
          onClick={downloadPng}
          disabled={saving}
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Download PNG"}
        </button>
      </div>
    </div>
  );
}
