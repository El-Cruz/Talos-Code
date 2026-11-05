"use client";

import { useEffect, useState } from "react";

/** The renderer supplies assembled; CSS transitionend supplies titleRevealed. */
export function useHeroReveal(assembled: boolean, titleRevealed: boolean) {
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    if (!assembled) return;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      if (!titleRevealed && !reduced.matches) return;
      void document.fonts.ready.then(() => { if (!cancelled) setHeroReady(true); });
    };
    finish(); reduced.addEventListener("change", finish);
    return () => { cancelled = true; reduced.removeEventListener("change", finish); };
  }, [assembled, titleRevealed]);
  return heroReady;
}
