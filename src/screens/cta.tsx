import { Container } from "@/components/ui/Container";
import { GlowButton } from "@/components/ui/GlowButton";
import { WindowControls } from "@/components/ui/WindowControls";

export function ContactCta() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-16 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-beam/30 bg-surface/60 shadow-glow">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-grid-faint opacity-40" />
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(102,255,255,0.16),transparent)] blur-2xl" />
            <div className="absolute inset-0 bg-scanlines opacity-50" />
          </div>

          <div className="relative flex flex-col items-center gap-8 p-8 text-center sm:p-14">
            <div className="flex items-center gap-3 rounded-full border border-grid bg-surface/80 px-4 py-2 backdrop-blur-sm">
              <WindowControls />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                talos://open-channel
              </span>
            </div>

            <h2 className="max-w-3xl font-mono text-3xl font-bold uppercase leading-tight tracking-tight text-core sm:text-5xl">
              Ready to ship
              <br />
              <span className="text-glow text-beam">on the grid?</span>
            </h2>

            <p className="font-mono text-sm tracking-wide text-muted sm:text-base">
              <span className="text-beam">$</span> talos hire --team=you
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <GlowButton href="mailto:hello@taloscode.dev">
                START A PROJECT
              </GlowButton>
              <GlowButton href="mailto:hello@taloscode.dev?subject=Discovery%20call" variant="ghost" className="border-flare/40 hover:border-flare/70 hover:text-flare hover:shadow-flare">
                BOOK A CALL
              </GlowButton>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
              <span className="text-beam">response &lt; 24h</span>
              <span className="mx-2 text-grid">{"//"}</span> NDA on request
              <span className="mx-2 text-grid">{"//"}</span> hello@taloscode.dev
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}