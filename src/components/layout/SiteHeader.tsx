import { Container } from "@/components/ui/Container";
import { GlowButton } from "@/components/ui/GlowButton";
import { LogoMark } from "@/components/ui/LogoMark";
import type { NavLink } from "@/types/content";

const NAV_LINKS: readonly NavLink[] = [
  { label: "services", href: "#services" },
  { label: "process", href: "#process" },
  { label: "work", href: "#work" },
  { label: "signals", href: "#signals" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-grid bg-void/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <a
          href="#top"
          className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-beam"
        >
          <LogoMark className="transition-shadow duration-300 group-hover:shadow-glow" />
          <span className="font-mono text-sm font-bold tracking-[0.18em] text-core">
            TALOS<span className="text-beam">:</span>CODE
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors duration-300 hover:bg-surface hover:text-beam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-beam"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2.5 font-mono text-[11px] tracking-[0.2em] text-muted sm:inline-flex">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beam opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-beam" />
            </span>
            STATUS: ONLINE
          </span>
          <GlowButton href="#contact" variant="flare" className="px-4 py-2 text-xs">
            HIRE US
          </GlowButton>
        </div>
      </Container>
    </header>
  );
}