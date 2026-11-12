import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { WindowControls } from "@/components/ui/WindowControls";
import { cn } from "@/utils/cn";

export interface SectionProps {
  id?: string;
  label: string;
  status: string;
  index: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function Section({
  id,
  label,
  status,
  index,
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 py-16 sm:py-20", className)}>
      <Container>
        <div className="tile overflow-hidden">
          <header className="flex items-center justify-between gap-4 border-b border-grid bg-surface/60 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <WindowControls />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                talos://{label}
              </span>
            </div>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-beam" aria-hidden="true" />
              {status}
            </span>
          </header>
          <div className="p-5 sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-2 font-mono text-xs tracking-[0.3em] text-beam">
                  [{index}]
                </p>
                <h2 className="font-mono text-2xl font-bold uppercase tracking-tight text-core sm:text-3xl">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.25em] text-faint lg:pb-1">
                § {label}
              </p>
            </div>
            <div className={cn("flex flex-col", className)}>{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}