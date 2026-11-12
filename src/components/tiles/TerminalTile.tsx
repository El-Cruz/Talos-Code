import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { WindowControls } from "@/components/ui/WindowControls";

export type TermTone = "beam" | "flare" | "faint" | "muted" | "core";

export interface TermLine {
  readonly prompt?: boolean;
  readonly text: string;
  readonly tone?: TermTone;
}

export interface TerminalTileProps {
  readonly title?: string;
  readonly lines: readonly TermLine[];
  readonly className?: string;
  readonly showCursor?: boolean;
}

const TONE: Record<TermTone, string> = {
  beam: "text-beam",
  flare: "text-flare",
  faint: "text-faint",
  muted: "text-muted",
  core: "text-core",
};

export function TerminalTile({
  title = "talos://bash",
  lines,
  className,
  showCursor = true,
}: TerminalTileProps) {
  return (
    <div className={cn("tile overflow-hidden shadow-glow-sm", className)}>
      <header className="flex items-center justify-between border-b border-grid bg-surface/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <WindowControls />
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
            {title}
          </span>
        </div>
        <span className="font-mono text-[11px] tracking-[0.2em] text-faint">
          bash
        </span>
      </header>
      <div className="overflow-x-auto px-5 py-4">
        {lines.map((line, index) => (
          <p
            key={index}
            className={cn(
              "whitespace-pre font-mono text-[13px] leading-6",
              TONE[line.tone ?? "core"],
            )}
          >
            {line.prompt ? (
              <span className="mr-2 select-none text-beam" aria-hidden="true">
                $
              </span>
            ) : null}
            {line.text}
          </p>
        ))}
        {showCursor ? (
          <p className="whitespace-pre font-mono text-[13px] leading-6 text-beam">
            <span className="mr-2 select-none" aria-hidden="true">
              $
            </span>
            <span className="inline-block h-4 w-2 translate-y-0.5 animate-blink bg-beam" aria-hidden="true" />
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TerminalQuote({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <blockquote className={cn("whitespace-pre-wrap font-mono text-sm leading-7 text-muted sm:text-[15px]", className)}>
      <span className="mr-2 select-none text-beam" aria-hidden="true">
        &gt;
      </span>
      {children}
    </blockquote>
  );
}