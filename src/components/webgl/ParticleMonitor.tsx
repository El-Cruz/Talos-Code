"use client";

import { lazy, Suspense, useState } from "react";
import { useRenderingTier } from "./useRenderingTier";
import { MobileParticleVideo } from "./MobileParticleVideo";

const DesktopParticleMonitor = lazy(() => import("./DesktopParticleMonitor"));

export function ParticleMonitor({ activeTab, onReady }: { activeTab: string; onReady: () => void }) {
  const tier = useRenderingTier();
  const [failed, setFailed] = useState(false);
  if (!tier) return null;
  if (tier === 3 || failed) return <MobileParticleVideo onReady={onReady} />;
  return <Suspense fallback={null}><DesktopParticleMonitor activeTab={activeTab} count={tier === 1 ? 1048576 : 262144} onReady={onReady} onFailure={() => setFailed(true)} /></Suspense>;
}
