import { Container } from "@/components/ui/Container";
import { GlowButton } from "@/components/ui/GlowButton";
import { WindowControls } from "@/components/ui/WindowControls";
import type { TermLine } from "@/components/tiles/TerminalTile";
import { TerminalTile } from "@/components/tiles/TerminalTile";

const BOOT_LINES: readonly TermLine[] = [
  { prompt: true, text: "talos deploy --target=production" },
  { text: "> compiling modules .......... [OK]", tone: "faint" },
  { text: "> running unit suite ......... 147/147 [OK]", tone: "faint" },
  { text: "> provisioning edge .......... 3 regions [OK]", tone: "faint" },
  { text: "> shipping build ............. v2.4.0 [OK]", tone: "faint" },
  { text: "> uptime 99.99% | all systems nominal", tone: "beam" },
];

const SPARK_BARS: readonly number[] = [
  34, 58, 42, 76, 51, 88, 63, 90, 71, 58, 84, 66, 96, 78,
];

function EditorTile() {
  return (
    <div className="tile overflow-hidden shadow-glow-sm">
      <header className="flex items-center justify-between border-b border-grid bg-surface/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <WindowControls />
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
            talos://core/ship.ts
          </span>
        </div>
        <span className="font-mono text-[11px] tracking-[0.2em] text-faint">
          typescript
        </span>
      </header>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-6 text-core">
        <p>
          <span className="text-faint">{"// core/ship.ts"}</span>
        </p>
        <p>
          <span className="text-beam">export async function</span>{" "}
          <span className="text-core">ship</span>(
          <span className="text-core">scope</span>:{" "}
          <span className="text-flare">Scope</span>):{" "}
          <span className="text-core">Promise</span>
          {"<"}
          <span className="text-flare">Release</span>
          {">"} {"{"}
        </p>
        <p className="pl-4">
          <span className="text-core">await</span>{" "}
          <span className="text-core">iterate</span>(scope,{" "}
          {"{"}week: 1{"}"})
        </p>
        <p className="pl-4">
          <span className="text-core">return</span>{" "}
          <span className="text-core">release</span>
        </p>
        <p>{"}"}</p>
      </pre>
    </div>
  );
}

function SparkTile() {
  return (
    <div className="tile overflow-hidden shadow-glow-sm">
      <header className="flex items-center justify-between border-b border-grid bg-surface/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <WindowControls />
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
            talos://edge/latency
          </span>
        </div>
        <span className="font-mono text-[11px] tracking-[0.2em] text-faint">
          live
        </span>
      </header>
      <div className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-mono text-lg font-bold text-beam tabular-nums">
            22ms
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
            p95 global
          </span>
        </div>
        <div className="flex h-14 items-end gap-1" aria-hidden="true">
          {SPARK_BARS.map((height, index) => (
            <span
              key={index}
              className={index === 7 ? "flex-1 rounded-sm bg-flare/70" : "flex-1 rounded-sm bg-beam/40"}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-faint opacity-60 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-44 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(102,255,255,0.14),transparent)] blur-2xl" />
        <div className="absolute -bottom-40 -right-24 h-[440px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,102,0,0.09),transparent)] blur-2xl" />
        <div className="absolute inset-0 bg-scanlines opacity-50" />
      </div>

      <Container className="relative z-10 flex flex-col gap-16 py-20 md:py-28 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-32">
        <div className="flex max-w-2xl flex-col items-start gap-8 lg:col-span-6">
          <p className="font-mono text-xs tracking-[0.25em] text-beam">
            &gt; talos_code --bootstrap --target=your_company
          </p>

          <h1 className="font-mono text-4xl font-bold leading-[1.08] tracking-tight text-core sm:text-5xl lg:text-6xl">
            Software engineered
            <br />
            <span className="text-glow text-beam">to outlast</span>
            <br />
            the grid.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Talos Code is a software engineering agency partnering with founders
            and enterprises to design, build, and scale digital products —
            clean, modular, and obsessively maintainable.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <GlowButton href="#contact">START A PROJECT</GlowButton>
            <GlowButton href="#work" variant="ghost">
              VIEW OUR WORK
            </GlowButton>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            <span className="text-flare">~ 2 slots open</span>
            <span className="mx-2 text-grid">{"//"}</span> response &lt; 24h
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="flex flex-col">
            <TerminalTile title="talos://deploy" lines={BOOT_LINES} className="z-10" />
            <div className="relative z-20 -mt-10 ml-6 w-[92%] rotate-[0.8deg] sm:ml-12 sm:w-[86%]">
              <EditorTile />
            </div>
            <div className="relative z-30 -mt-12 mr-4 w-[78%] self-end rotate-[-1deg] sm:mr-8 sm:w-[70%]">
              <SparkTile />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}