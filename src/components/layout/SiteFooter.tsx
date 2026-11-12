import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/LogoMark";
import type { NavLink } from "@/types/content";

const EXPLORE_LINKS: readonly NavLink[] = [
  { label: "services", href: "#services" },
  { label: "process", href: "#process" },
  { label: "work", href: "#work" },
  { label: "signals", href: "#signals" },
  { label: "contact", href: "#contact" },
];

const CONNECT_LINKS: readonly NavLink[] = [
  { label: "github", href: "https://github.com" },
  { label: "x / twitter", href: "https://x.com" },
  { label: "linkedin", href: "https://linkedin.com" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-grid bg-surface/30">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-6">
            <a href="#top" className="flex items-center gap-3">
              <LogoMark />
              <span className="font-mono text-sm font-bold tracking-[0.18em] text-core">
                TALOS<span className="text-beam">:</span>CODE
              </span>
            </a>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              A software engineering agency designing, building, and operating
              precision-built digital products for founders and enterprises.
              Online since 2011.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
              $ uptime --all-time
              <span className="ml-2 text-beam">99.99%</span>
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-faint">
              § explore
            </h3>
            <ul className="flex flex-col gap-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-mono text-sm text-muted transition-colors duration-300 hover:text-beam"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-faint">
              § connect
            </h3>
            <ul className="flex flex-col gap-2.5">
              {CONNECT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-muted transition-colors duration-300 hover:text-beam"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
              § signal
            </h3>
            <a
              href="mailto:hello@taloscode.dev"
              className="font-mono text-sm text-beam transition-colors duration-300 hover:text-core"
            >
              hello@taloscode.dev
            </a>
            <p className="text-sm leading-relaxed text-muted">
              Remote-first. Americas time zones ± 3.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-grid pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            © {year} Talos Code — all systems operational
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            built with next.js <span className="text-beam">{"//"}</span> typescript
            <span className="text-beam"> {"//"}</span> the grid
          </p>
        </div>
      </Container>
    </footer>
  );
}