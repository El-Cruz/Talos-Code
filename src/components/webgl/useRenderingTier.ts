"use client";

import { useEffect, useState } from "react";
import { chooseRenderingTier, type RenderingTier } from "./renderingTier";

type Adapter = { info?: { vendor?: string; architecture?: string; device?: string; description?: string; isFallbackAdapter?: boolean }; isFallbackAdapter?: boolean };
type GPU = { requestAdapter(): Promise<Adapter | null> };

/** Null means capability detection is pending; render a neutral placeholder then. */
export function useRenderingTier(): RenderingTier | null {
  const [tier, setTier] = useState<RenderingTier | null>(null);
  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const nav = navigator as Navigator & { gpu?: GPU; deviceMemory?: number };
      const mobile = /Mobi|Android|iPhone|iPad/i.test(nav.userAgent) ||
        (nav.maxTouchPoints > 1 && matchMedia("(pointer: coarse)").matches);
      const limited = (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) ||
        (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (mobile || limited) return 3;

      const canvas = document.createElement("canvas");
      let gl: WebGL2RenderingContext | null = null;
      let renderer = "";
      try {
        gl = canvas.getContext("webgl2");
        const debug = gl?.getExtension("WEBGL_debug_renderer_info");
        if (gl && debug) renderer = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
      } catch { /* GPU information may be blocked or unavailable. */ }
      let adapter: Adapter | null = null;
      try {
        // Avoid leaving the UI pending indefinitely if a driver never resolves.
        if (nav.gpu) adapter = await Promise.race([nav.gpu.requestAdapter(), new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))]);
      } catch { /* Fall back to WebGL2. */ }
      const info = adapter?.info;
      const identity = [renderer, info?.vendor, info?.architecture, info?.device, info?.description].filter(Boolean).join(" ");
      const software = /swiftshader|llvmpipe|software|basic render|virtual|integrated/i.test(identity) || adapter?.isFallbackAdapter || info?.isFallbackAdapter;
      // Renderer strings are optional and spoofable. Unknown devices stay on the fallback.
      const dedicated = !software && /nvidia|geforce|quadro|radeon\s+(?:rx|pro)|discrete/i.test(identity);
      return chooseRenderingTier({ mobile, limited, dedicated, webgpu: !!adapter, webgl2: !!gl });
    };
    void detect().then(result => { if (!cancelled) setTier(result); }).catch(() => { if (!cancelled) setTier(3); });
    return () => { cancelled = true; };
  }, []);
  return tier;
}
