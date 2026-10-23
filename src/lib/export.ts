import { toPng } from "html-to-image";

// Client-side image export: nothing is uploaded anywhere.

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brandbuddy";
}

export async function nodeToPng(node: HTMLElement, pixelRatio = 1): Promise<string> {
  // Nastaliq and brand fonts must finish loading or the image falls back to a plain font.
  await document.fonts.ready;
  return toPng(node, { pixelRatio, cacheBust: true });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function downloadZip(files: { name: string; dataUrl: string }[], filename: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.dataUrl.split(",")[1], { base64: true });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
