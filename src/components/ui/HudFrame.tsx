import type { ElementType, ReactNode } from "react";
import { Spotlight } from "@/components/motion/Spotlight";

const tagClass = "pointer-events-none absolute font-mono text-[10px] uppercase tracking-[0.22em]";

/** Glass HUD plane: calibration marks, telemetry tags, scan band and pointer spotlight. */
export function HudFrame({ children, className = "", tag, status, as }: { children: ReactNode; className?: string; tag?: string; status?: string; as?: ElementType }) {
  return (
    <Spotlight as={as} className={`hud ${className}`}>
      <span aria-hidden="true" className="hud-scan" />
      <span aria-hidden="true" className="hud-c tl" />
      <span aria-hidden="true" className="hud-c br" />
      <span aria-hidden="true" className="hud-plus right-2.5 top-2">+</span>
      <span aria-hidden="true" className="hud-plus bottom-2 left-2.5">+</span>
      {tag && <span aria-hidden="true" className={`${tagClass} left-6 top-2 text-steel`}>{tag}</span>}
      {status && <span aria-hidden="true" className={`${tagClass} bottom-2 right-6 text-beam/80`}>{status}</span>}
      {children}
    </Spotlight>
  );
}
