"use client";

import { useEffect, useState } from "react";
import {
  loadActiveKitId,
  loadBrandKits,
  newBrandKit,
  saveActiveKitId,
  saveBrandKits,
  type BrandKit,
} from "./storage";

// Brand kits saved in this browser, plus which one is in use.
export function useBrandKits() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [activeId, setActiveId] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  // localStorage only exists in the browser, so load it after the first render.
  useEffect(() => {
    let loaded = loadBrandKits();
    if (loaded.length === 0) loaded = [newBrandKit()];
    const stored = loadActiveKitId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKits(loaded);
    setActiveId(loaded.some((k) => k.id === stored) ? stored : loaded[0].id);
  }, []);

  function persist(next: BrandKit[]) {
    setKits(next);
    setSaveFailed(!saveBrandKits(next));
  }

  function selectKit(id: string) {
    setActiveId(id);
    saveActiveKitId(id);
  }

  const active = kits.find((k) => k.id === activeId) ?? kits[0];

  return {
    kits,
    active,
    saveFailed,
    selectKit,
    updateActive(patch: Partial<BrandKit>) {
      if (!active) return;
      persist(kits.map((k) => (k.id === active.id ? { ...k, ...patch } : k)));
    },
    addKit() {
      const kit = newBrandKit();
      persist([...kits, kit]);
      selectKit(kit.id);
    },
    deleteActive() {
      if (!active) return;
      const rest = kits.filter((k) => k.id !== active.id);
      const next = rest.length ? rest : [newBrandKit()];
      persist(next);
      selectKit(next[0].id);
    },
    importKits(imported: Partial<BrandKit>[]) {
      // Keep only known fields of the right type from the imported file.
      const clean = imported.map((k) => {
        const kit = newBrandKit();
        for (const key of Object.keys(kit) as (keyof BrandKit)[]) {
          if (key !== "id" && typeof k[key] === typeof kit[key]) Object.assign(kit, { [key]: k[key] });
        }
        return kit;
      });
      persist([...kits, ...clean]);
      if (clean[0]) selectKit(clean[0].id);
    },
  };
}
