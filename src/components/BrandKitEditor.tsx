"use client";

import { useRef, useState } from "react";
import { FONT_PAIRS, imageToDataUrl, type BrandKit, type FontPair } from "@/lib/storage";
import { downloadDataUrl } from "@/lib/export";
import { useBrandKits } from "@/lib/useBrandKits";
import { Field, inputClass, smallButton } from "./ui";

export default function BrandKitEditor() {
  const { kits, active, saveFailed, selectKit, updateActive, addKit, deleteActive, importKits } = useBrandKits();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  if (!active) return null;

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      updateActive({ logo: await imageToDataUrl(file, 256) });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  function exportKits() {
    const json = JSON.stringify({ app: "BrandBuddy AI", version: 1, kits }, null, 2);
    downloadDataUrl(`data:application/json;charset=utf-8,${encodeURIComponent(json)}`, "brandbuddy-brand-kits.json");
  }

  async function onImport(file: File | undefined) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : Array.isArray(data?.kits) ? data.kits : [data];
      importKits(list.filter((k: unknown) => k && typeof k === "object"));
      setMessage(`Imported ${list.length} brand kit${list.length === 1 ? "" : "s"}.`);
    } catch {
      setMessage("That file is not a BrandBuddy brand kit.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const color = (key: "primaryColor" | "accentColor" | "lightColor", label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="color"
        value={active[key]}
        onChange={(e) => updateActive({ [key]: e.target.value } as Partial<BrandKit>)}
        className="h-9 w-11 cursor-pointer rounded border border-gray-300"
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputClass} max-w-xs`} value={active.id} onChange={(e) => selectKit(e.target.value)}>
          {kits.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name || "Untitled brand"}
            </option>
          ))}
        </select>
        <button type="button" className={smallButton} onClick={addKit}>
          + New kit
        </button>
        <button
          type="button"
          className={smallButton}
          onClick={() => {
            if (confirm(`Delete "${active.name || "Untitled brand"}"?`)) deleteActive();
          }}
        >
          Delete
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand name">
          <input
            className={inputClass}
            value={active.name}
            maxLength={60}
            placeholder="e.g. Ayesha's Closet"
            onChange={(e) => updateActive({ name: e.target.value })}
          />
        </Field>
        <Field label="Tagline">
          <input
            className={inputClass}
            value={active.tagline}
            maxLength={120}
            placeholder="e.g. Pret & lawn, delivered"
            onChange={(e) => updateActive({ tagline: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
          {active.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.logo} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400">Logo</span>
          )}
        </div>
        <label className={`${smallButton} cursor-pointer`}>
          Upload logo
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
        </label>
        {active.logo && (
          <button type="button" className={smallButton} onClick={() => updateActive({ logo: "" })}>
            Remove logo
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Colours</p>
        <div className="flex flex-wrap gap-4">
          {color("primaryColor", "Main")}
          {color("accentColor", "Accent")}
          {color("lightColor", "Background")}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Font style (English and Roman Urdu)</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FONT_PAIRS) as FontPair[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => updateActive({ font: f })}
              aria-pressed={active.font === f}
              style={{ fontFamily: FONT_PAIRS[f].css }}
              className={`rounded-lg px-4 py-2 text-base ring-1 ${
                active.font === f ? "bg-violet-600 text-white ring-violet-600" : "bg-white ring-gray-300"
              }`}
            >
              {FONT_PAIRS[f].label} Aa
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Urdu always uses Noto Nastaliq Urdu.</p>
      </div>

      <Field label="Brand voice notes (the AI follows these)">
        <textarea
          className={inputClass}
          rows={3}
          maxLength={400}
          value={active.voice}
          placeholder="e.g. Warm and elegant, speaks like an older sister, uses 'aap' not 'tum'"
          onChange={(e) => updateActive({ voice: e.target.value })}
        />
      </Field>
      <Field label="Banned words (comma separated)">
        <input
          className={inputClass}
          maxLength={300}
          value={active.bannedWords}
          placeholder="e.g. cheap, sasta, guaranteed"
          onChange={(e) => updateActive({ bannedWords: e.target.value })}
        />
      </Field>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <button type="button" className={smallButton} onClick={exportKits}>
          Export all kits (JSON)
        </button>
        <label className={`${smallButton} cursor-pointer`}>
          Import kits
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onImport(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="text-xs text-gray-500">
        Kits are saved on this device only. Export them to keep a backup or move to another phone.
        {saveFailed && <span className="text-red-600"> Saving failed: the logo may be too large or storage is blocked.</span>}
      </p>
      {message && <p className="text-sm text-violet-700">{message}</p>}
    </div>
  );
}
