import { forwardRef } from "react";
import { FONT_PAIRS, type BrandKit } from "@/lib/storage";
import type { Slide as SlideText } from "@/lib/schema";

export const SLIDE_W = 1080;
export const SLIDE_H = 1350;

export const TEMPLATES = {
  bold: "Bold gradient",
  minimal: "Clean minimal",
  photo: "Photo on top",
} as const;
export type Template = keyof typeof TEMPLATES;

export type SlideColors = { primary: string; accent: string; light: string };

type Props = {
  slide: SlideText;
  index: number;
  total: number;
  template: Template;
  colors: SlideColors;
  kit: BrandKit;
  rtl: boolean;
  image?: string;
};

// One Instagram portrait slide at full export size (1080 × 1350 px).
// Previews shrink it with a CSS transform on a wrapper, so exports stay sharp.
const Slide = forwardRef<HTMLDivElement, Props>(function Slide(
  { slide, index, total, template, colors, kit, rtl, image },
  ref,
) {
  const font = rtl
    ? 'var(--font-nastaliq), "Noto Nastaliq Urdu", serif'
    : (FONT_PAIRS[kit.font] ?? FONT_PAIRS.modern).css;
  const dark = template !== "minimal";
  const textColor = dark ? "#ffffff" : "#1c1a24";
  const lineHeight = rtl ? 2.1 : 1.2;

  const brandRow = (
    <div style={{ display: "flex", alignItems: "center", gap: 24, direction: "ltr" }}>
      {kit.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={kit.logo}
          alt=""
          style={{ width: 96, height: 96, objectFit: "contain", borderRadius: 20, background: "#fff", padding: 8 }}
        />
      )}
      <span
        style={{
          fontFamily: FONT_PAIRS.modern.css,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: dark ? "rgba(255,255,255,0.92)" : colors.primary,
        }}
      >
        {kit.name || "Your brand"}
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontFamily: FONT_PAIRS.modern.css,
          fontSize: 32,
          fontWeight: 600,
          color: dark ? "rgba(255,255,255,0.8)" : "#6b7280",
        }}
      >
        {index + 1}/{total}
      </span>
    </div>
  );

  const textBlock = (
    <div dir={rtl ? "rtl" : "ltr"} style={{ textAlign: rtl ? "right" : "left", fontFamily: font, color: textColor }}>
      {template === "minimal" && (
        <div style={{ width: 140, height: 14, background: colors.accent, borderRadius: 8, marginBottom: 48 }} />
      )}
      <h2
        style={{
          fontSize: rtl ? 76 : 92,
          fontWeight: 800,
          lineHeight,
          margin: 0,
          color: template === "minimal" ? colors.primary : textColor,
        }}
      >
        {slide.heading}
      </h2>
      <p style={{ fontSize: rtl ? 46 : 50, lineHeight: rtl ? 2.2 : 1.4, marginTop: 40, opacity: 0.95 }}>
        {slide.body}
      </p>
    </div>
  );

  const footer = kit.tagline && (
    <p
      style={{
        fontFamily: FONT_PAIRS.modern.css,
        fontSize: 32,
        color: dark ? "rgba(255,255,255,0.85)" : "#6b7280",
        margin: 0,
      }}
    >
      {kit.tagline}
    </p>
  );

  const base: React.CSSProperties = {
    width: SLIDE_W,
    height: SLIDE_H,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  if (template === "photo") {
    return (
      <div ref={ref} style={{ ...base, background: colors.primary }}>
        <div
          style={{
            height: 700,
            flexShrink: 0,
            padding: 64,
            boxSizing: "border-box",
            background: image
              ? `center / cover no-repeat url(${image})`
              : `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
          }}
        >
          {brandRow}
        </div>
        <div
          style={{ flex: 1, padding: 72, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          {textBlock}
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        ...base,
        padding: 88,
        justifyContent: "space-between",
        background:
          template === "bold" ? `linear-gradient(150deg, ${colors.primary} 10%, ${colors.accent})` : colors.light,
        borderLeft: template === "minimal" ? `28px solid ${colors.primary}` : undefined,
      }}
    >
      {brandRow}
      {textBlock}
      {footer || <span />}
    </div>
  );
});

export default Slide;

// Shows a full-size slide shrunk to fit `width` CSS pixels.
export function ScaledSlide({ width, children }: { width: number; children: React.ReactNode }) {
  const scale = width / SLIDE_W;
  return (
    <div style={{ width, height: SLIDE_H * scale, overflow: "hidden", borderRadius: 12 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: SLIDE_W, height: SLIDE_H }}>
        {children}
      </div>
    </div>
  );
}
