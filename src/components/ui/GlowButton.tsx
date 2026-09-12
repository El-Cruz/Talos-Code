import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type GlowButtonVariant = "beam" | "flare" | "ghost";

export interface GlowButtonProps {
  href: string;
  children: ReactNode;
  variant?: GlowButtonVariant;
  className?: string;
}

const VARIANT: Record<GlowButtonVariant, string> = {
  beam: "bg-beam text-void shadow-glow hover:shadow-glow-lg focus-visible:outline-beam",
  flare:
    "bg-flare text-void shadow-flare hover:shadow-flare-lg focus-visible:outline-flare",
  ghost:
    "border border-grid text-core hover:border-beam/60 hover:text-beam hover:shadow-glow-sm focus-visible:outline-beam",
};

export function GlowButton({
  href,
  children,
  variant = "beam",
  className,
}: GlowButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-mono text-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2",
        VARIANT[variant],
        className,
      )}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </a>
  );
}