import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type TagTone = "beam" | "flare" | "neutral";

export interface TagProps {
  children: ReactNode;
  tone?: TagTone;
  className?: string;
}

const TONE: Record<TagTone, string> = {
  beam: "border-beam/40 bg-beam/10 text-beam",
  flare: "border-flare/40 bg-flare/10 text-flare",
  neutral: "border-grid bg-surface/60 text-muted",
};

export function Tag({ children, tone = "neutral", className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.18em]",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}