import { Section } from "@/components/ui/Section";
import { TerminalQuote } from "@/components/tiles/TerminalTile";
import { WindowControls } from "@/components/ui/WindowControls";
import type { Testimonial } from "@/types/content";

const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote: "Talos shipped our platform in eight weeks and stayed past the deploy. They operate like an extension of the founding team.",
    author: "Maya Chen",
    role: "CTO",
    company: "Heliograph",
  },
  {
    quote: "Every line is reviewed, measured, and readable a year later. The rare agency that optimizes for the company, not the invoice.",
    author: "Samir Haddad",
    role: "VP Engineering",
    company: "Nocturne",
  },
  {
    quote: "On-call, incident reports, the lot. They run our reliability practice like it is their own product.",
    author: "Lena Ortiz",
    role: "Head of Infra",
    company: "Sentinel",
  },
];

function SignalTile({ testimonial }: { readonly testimonial: Testimonial }) {
  return (
    <figure className="tile tile-hover flex flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-grid bg-surface/60 px-4 py-2.5">
        <WindowControls />
        <span className="font-mono text-[11px] text-faint">signal.msgs</span>
      </header>
      <div className="flex flex-1 flex-col justify-between gap-6 p-6">
        <TerminalQuote>{testimonial.quote}</TerminalQuote>
        <figcaption className="flex flex-col gap-1 border-t border-grid pt-4">
          <span className="font-mono text-sm font-semibold text-core">
            — {testimonial.author}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            {testimonial.role} <span className="text-beam/70">@</span>{" "}
            {testimonial.company}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}

export function SignalsSection() {
  return (
    <Section
      id="signals"
      label="signals"
      status="n = 3"
      index="0x05"
      title="Signals from the grid"
      description="Unsolicited telemetry from clients who stayed on the network."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <SignalTile key={testimonial.author} testimonial={testimonial} />
        ))}
      </div>
    </Section>
  );
}