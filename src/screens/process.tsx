import { Section } from "@/components/ui/Section";
import type { ProcessStep } from "@/types/content";
import { cn } from "@/utils/cn";

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    index: "0x01",
    command: "$ talos scan",
    name: "Discover",
    description:
      "A two-week discovery sprint. We map the domain, kill the wrong features early, and return a spec the whole team trusts.",
    outputs: ["Requirement map", "Risk register", "Scope cut"],
  },
  {
    index: "0x02",
    command: "$ talos plan",
    name: "Architect",
    description:
      "Production-grade architecture — models, contracts, and budgets decided up front, written down so they survive contact with reality.",
    outputs: ["Domain model", "ADRs", "Cost estimates"],
  },
  {
    index: "0x03",
    command: "$ talos build",
    name: "Build",
    description:
      "Weekly shippable increments, full test coverage, and a visible demo cadence. You watch real progress land every Friday.",
    outputs: ["Weekly shippables", "Test coverage", "Demo cadence"],
  },
  {
    index: "0x04",
    command: "$ talos run",
    name: "Scale",
    description:
      "Instrumentation, SLOs, and on-call training. We scale the system we built and hand over something that runs itself.",
    outputs: ["Observability", "Playbooks", "Team handoff"],
  },
];

function ProcessTile({
  step,
  className,
}: {
  readonly step: ProcessStep;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "tile tile-hover flex flex-col justify-between gap-6 p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-xs tracking-[0.3em] text-beam">
            [{step.index}]
          </span>
          <span className="font-mono text-[11px] text-faint">{step.command}</span>
        </div>
        <h3 className="font-mono text-lg font-bold uppercase tracking-tight text-core sm:text-xl">
          <span className="mr-2 select-none text-beam" aria-hidden="true">
            ▸
          </span>
          {step.name}
        </h3>
        <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
          {step.description}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5 border-t border-grid pt-4">
        {step.outputs.map((output) => (
          <li
            key={output}
            className="flex items-center gap-2 font-mono text-[12px] tracking-wide text-muted"
          >
            <span className="text-beam" aria-hidden="true">
              +
            </span>
            {output}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProcessSection() {
  return (
    <Section
      id="process"
      label="process"
      status="4 phases"
      index="0x03"
      title="The talos drill"
      description="A repeatable loop we run on every engagement — the same rigor whether it is a two-week spike or an eighteen-month platform."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <ProcessTile
          step={PROCESS_STEPS[0]}
          className="lg:col-span-2 lg:row-span-2"
        />
        <ProcessTile step={PROCESS_STEPS[1]} className="lg:col-span-2" />
        <ProcessTile step={PROCESS_STEPS[2]} className="lg:col-span-1" />
        <ProcessTile step={PROCESS_STEPS[3]} className="lg:col-span-1" />
      </div>
    </Section>
  );
}