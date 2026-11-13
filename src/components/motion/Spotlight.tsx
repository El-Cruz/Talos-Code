"use client";

import type { ElementType, ReactNode } from "react";

/** Border-light follows the pointer via CSS vars; the glow itself is an opacity transition (.spot in globals.css). */
export function Spotlight({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: ElementType }) {
  const move = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };
  return <Tag className={`spot ${className ?? ""}`} onPointerMove={move}>{children}</Tag>;
}
