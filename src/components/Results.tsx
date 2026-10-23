"use client";

import { useRef, useState } from "react";
import { LANGUAGES, LANGUAGE_LABELS, type ContentPack, type Language, type Section } from "@/lib/schema";
import { FONT_PAIRS, type BrandKit } from "@/lib/storage";
import { downloadDataUrl, nodeToPng, slugify } from "@/lib/export";
import CarouselEditor from "./CarouselEditor";
import { Card, CopyButton, RegenerateButton, smallButton } from "./ui";

const TABS = [
  ["captions", "Captions"],
  ["hashtags", "Hashtags & CTAs"],
  ["plan", "7-day plan"],
  ["carousel", "Carousel"],
  ["more", "Description & ideas"],
] as const;
type Tab = (typeof TABS)[number][0];

type Props = {
  pack: ContentPack;
  kit: BrandKit;
  product: string;
  regenerating: Section | null;
  onRegenerate: (section: Section) => void;
  onPackChange: (pack: ContentPack) => void;
};

export default function Results({ pack, kit, product, regenerating, onRegenerate, onPackChange }: Props) {
  const available = LANGUAGES.filter((l) => pack.languages[l]);
  const [chosenLang, setChosenLang] = useState<Language>(available[0]);
  const [tab, setTab] = useState<Tab>("captions");
  const lang = available.includes(chosenLang) ? chosenLang : available[0];
  const content = lang ? pack.languages[lang] : undefined;
  if (!lang || !content) return null;

  const rtl = lang === "urdu";
  const textClass = rtl ? "urdu text-lg" : "";
  const regen = (section: Section) => (
    <RegenerateButton onClick={() => onRegenerate(section)} busy={regenerating === section} />
  );
  const allHashtags = [...pack.hashtags.broad, ...pack.hashtags.niche, ...pack.hashtags.local];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Language">
        {available.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={l === lang}
            onClick={() => setChosenLang(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              l === lang ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-300"
            }`}
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        <div className="flex w-max gap-1 rounded-xl bg-gray-200/70 p-1">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === id ? "bg-white shadow-sm" : "text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "captions" && (
        <Card title="Captions" actions={regen("captions")}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {content.captions.map((c, i) => (
              <PostCard key={`${lang}-${i}-${c.slice(0, 12)}`} caption={c} kit={kit} rtl={rtl} index={i} />
            ))}
          </div>
        </Card>
      )}

      {tab === "hashtags" && (
        <>
          <Card
            title="Hashtags"
            actions={
              <>
                <CopyButton text={allHashtags.join(" ")} label="Copy all 15" />
                {regen("hashtags")}
              </>
            }
          >
            {(["broad", "niche", "local"] as const).map((tier) => (
              <div key={tier} className="mb-3 last:mb-0">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{tier}</p>
                <div className="flex flex-wrap gap-2">
                  {pack.hashtags[tier].map((h) => (
                    <span key={h} className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="mt-3 text-xs text-gray-500">Hashtags are shared by all languages.</p>
          </Card>
          <Card title="Calls to action" actions={regen("ctas")}>
            <ul className="space-y-2">
              {content.ctas.map((cta, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                  <span className={textClass}>{cta}</span>
                  <CopyButton text={cta} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {tab === "plan" && (
        <Card title="7-day posting plan" actions={regen("plan")}>
          <ol className="space-y-3">
            {content.plan.map((d, i) => (
              <li key={i} className="rounded-xl bg-gray-50 p-3 sm:p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-gray-900 px-2 py-0.5 font-semibold text-white">{d.day}</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-700">{d.format}</span>
                  <span className="text-gray-500">🕒 {d.bestTime}</span>
                </div>
                <p className={`font-medium ${textClass}`}>{d.idea}</p>
                <p className={`mt-1 text-sm text-gray-700 ${textClass}`}>{d.caption}</p>
                <div className="mt-2">
                  <CopyButton text={d.caption} label="Copy caption" />
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {tab === "carousel" && (
        <Card title="Carousel (5 slides)" actions={regen("carousel")}>
          <CarouselEditor
            key={lang}
            slides={content.carousel}
            kit={kit}
            rtl={rtl}
            fileLabel={product}
            onChange={(carousel) =>
              onPackChange({ ...pack, languages: { ...pack.languages, [lang]: { ...content, carousel } } })
            }
          />
        </Card>
      )}

      {tab === "more" && (
        <>
          <Card
            title="Product description"
            actions={
              <>
                <CopyButton text={content.description} />
                {regen("description")}
              </>
            }
          >
            <p className={`whitespace-pre-line text-sm text-gray-800 ${textClass}`}>{content.description}</p>
          </Card>
          <Card title="Campaign ideas" actions={regen("ideas")}>
            <ol className="space-y-3">
              {content.ideas.map((idea, i) => (
                <li key={i} className={`rounded-lg bg-gray-50 p-3 ${textClass}`}>
                  <p className="font-semibold">{idea.title}</p>
                  <p className="text-sm text-gray-700">{idea.description}</p>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}

function PostCard({ caption, kit, rtl, index }: { caption: string; kit: BrandKit; rtl: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadPng() {
    if (!ref.current) return;
    setSaving(true);
    try {
      downloadDataUrl(await nodeToPng(ref.current, 3), `${slugify(kit.name)}-post-${index + 1}.png`);
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
        style={{
          background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor})`,
          fontFamily: (FONT_PAIRS[kit.font] ?? FONT_PAIRS.modern).css,
        }}
      >
        <div className="flex items-center gap-2">
          {kit.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logo} alt="" className="h-7 w-7 rounded bg-white object-contain p-0.5" />
          )}
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">{kit.name || "Your brand"}</p>
        </div>
        <p
          className={`${caption.length > 180 ? "text-sm" : "text-base"} font-semibold leading-snug ${rtl ? "urdu" : ""}`}
        >
          {caption}
        </p>
        <p className="text-xs opacity-80">{kit.tagline}</p>
      </div>
      <div className="flex gap-2">
        <CopyButton text={caption} />
        <button type="button" onClick={downloadPng} disabled={saving} className={smallButton}>
          {saving ? "Saving…" : "Download PNG"}
        </button>
      </div>
    </div>
  );
}
