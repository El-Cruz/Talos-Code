"use client";

import { lazy, Suspense, useState, useSyncExternalStore } from "react";
import { selectPerformanceTier } from "./performanceTier";
import { MobileParticleCanvas } from "./MobileParticleCanvas";

const DesktopParticleMonitor = lazy(() => import("./DesktopParticleMonitor"));
const subscribeDevice = () => () => {};
const getDeviceTier = () => selectPerformanceTier({
  width: window.innerWidth, cores: navigator.hardwareConcurrency,
  mobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches),
  memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
}).name;

export function ParticleMonitor({ activeTab, onReady }: { activeTab: string; onReady: () => void }) {
  const tier = useSyncExternalStore(subscribeDevice, getDeviceTier, () => null);
  const [failed, setFailed] = useState(false);
  if (!tier) return null;
  if (tier === "mobile" || failed) return <MobileParticleCanvas onReady={onReady} />;
  return <Suspense fallback={null}><DesktopParticleMonitor activeTab={activeTab} count={tier === "high" ? 1048576 : 262144} onReady={onReady} onFailure={() => setFailed(true)} /></Suspense>;
}
