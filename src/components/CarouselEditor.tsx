"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide as SlideText } from "@/lib/schema";
import { imageToDataUrl, type BrandKit } from "@/lib/storage";
import { downloadDataUrl, downloadZip, nodeToPng, slugify } from "@/lib/export";
import Slide, { ScaledSlide, TEMPLATES, type SlideColors, type Template } from "./Slide";
import { Field, inputClass, smallButton } from "./ui";

type Props = {
  slides: SlideText[];
  onChange: (slides: SlideText[]) => void;
  kit: BrandKit;
  rtl: boolean;
  fileLabel: string;
};

export default function CarouselEditor({ slides, onChange, kit, rtl, fileLabel }: Props) {
  const [current, setCurrent] = useState(0);
  const [template, setTemplate] = useState<Template>("bold");
  const [colors, setColors] = useState<SlideColors>({
    primary: kit.primaryColor,
    accent: kit.accentColor,
    light: kit.lightColor,
  });
  const [images, setImages] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState("");
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previewBox = useRef<HTMLDivElement>(null);
  const width = useWidth(previewBox, 320);

  // Follow the brand kit when the user switches kits.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColors({ primary: kit.primaryColor, accent: kit.accentColor, light: kit.lightColor });
  }, [kit.primaryColor, kit.accentColor, kit.lightColor]);

  const index = Math.min(current, slides.length - 1);
  const slide = slides[index];
  if (!slide) return null;

  const fileName = (i: number) => `${slugify(kit.name || fileLabel)}-slide-${i + 1}.png`;
  const common = { total: slides.length, template, colors, kit, rtl };

  function edit(patch: Partial<SlideText>) {
    onChange(slides.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function exportOne() {
    const node = exportRefs.current[index];
    if (!node) return;
    setBusy("one");
    try {
      downloadDataUrl(await nodeToPng(node), fileName(index));
    } catch (err) {
      console.error(err);
      alert("Sorry, the image could not be created in this browser.");
    } finally {
      setBusy("");
    }
  }

  async function exportAll() {
    setBusy("all");
    try {
      const files = [];
      for (let i = 0; i < slides.length; i++) {
        const node = exportRefs.current[i];
        if (node) files.push({ name: fileName(i), dataUrl: await nodeToPng(node) });
      }
      await downloadZip(files, `${slugify(kit.name || fileLabel)}-carousel.zip`);
    } catch (err) {
      console.error(err);
      alert("Sorry, the images could not be created in this browser.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <div ref={previewBox} className="mx-auto w-full max-w-[420px]">
          <ScaledSlide width={width}>
            <Slide slide={slide} index={index} image={images[index]} {...common} />
          </ScaledSlide>
        </div>
        <div className="flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-md ring-2 ${i === index ? "ring-violet-600" : "ring-transparent"}`}
            >
              <ScaledSlide width={48}>
                <Slide slide={s} index={i} image={images[i]} {...common} />
              </ScaledSlide>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <Field label={`Slide ${index + 1} heading`}>
          <input
            className={`${inputClass} ${rtl ? "urdu" : ""}`}
            dir={rtl ? "rtl" : "ltr"}
            value={slide.heading}
            onChange={(e) => edit({ heading: e.target.value })}
          />
        </Field>
        <Field label={`Slide ${index + 1} text`}>
          <textarea
            className={`${inputClass} ${rtl ? "urdu" : ""}`}
            dir={rtl ? "rtl" : "ltr"}
            rows={4}
            value={slide.body}
            onChange={(e) => edit({ body: e.target.value })}
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium">Layout</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TEMPLATES) as Template[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate(t)}
                aria-pressed={template === t}
                className={`rounded-full px-3 py-1.5 text-sm ring-1 ${
                  template === t ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-gray-700 ring-gray-300"
                }`}
              >
                {TEMPLATES[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {(["primary", "accent", "light"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 capitalize">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-gray-300"
              />
              {key === "light" ? "Background" : key === "primary" ? "Main" : "Accent"}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className={`${smallButton} cursor-pointer`}>
            {images[index] ? "Change photo" : "Add photo to this slide"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const dataUrl = await imageToDataUrl(file, 1080).catch(() => "");
                if (dataUrl) {
                  setImages({ ...images, [index]: dataUrl });
                  setTemplate("photo");
                }
                e.target.value = "";
              }}
            />
          </label>
          {images[index] && (
            <button
              type="button"
              className={smallButton}
              onClick={() => setImages(Object.fromEntries(Object.entries(images).filter(([k]) => Number(k) !== index)))}
            >
              Remove photo
            </button>
          )}
        </div>
        {template === "photo" && !images[index] && (
          <p className="text-xs text-gray-500">Tip: add your product photo to show it at the top of the slide.</p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={exportOne}
            disabled={!!busy}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "one" ? "Saving…" : "Download this slide (PNG)"}
          </button>
          <button
            type="button"
            onClick={exportAll}
            disabled={!!busy}
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "all" ? "Creating ZIP…" : "Download all 5 (ZIP)"}
          </button>
        </div>
        <p className="text-xs text-gray-500">Images are 1080 × 1350 px, the size Instagram uses for portrait posts.</p>
      </div>

      {/* Full-size copies used only for export, kept off screen. */}
      <div aria-hidden style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none" }}>
        {slides.map((s, i) => (
          <Slide
            key={i}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            slide={s}
            index={i}
            image={images[i]}
            {...common}
          />
        ))}
      </div>
    </div>
  );
}

function useWidth(ref: React.RefObject<HTMLElement | null>, fallback: number) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
