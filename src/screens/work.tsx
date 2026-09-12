import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/types/content";
import { cn } from "@/utils/cn";

const PROJECTS: readonly Project[] = [
  {
    name: "Heliograph",
    codename: "logistics mesh",
    summary:
      "Real-time fleet routing network spanning three continents — tracking, ETAs, and re-routing recomputed in under 40ms.",
    stack: ["Next.js", "Postgres", "Redis", "gRPC"],
    metric: "38ms",
    metricLabel: "route recompute",
    bars: [40, 62, 55, 78, 88, 70, 94, 82, 66, 90, 74, 88, 97, 85],
    featured: true,
  },
  {
    name: "Nocturne",
    codename: "fintech ledger",
    summary:
      "Multi-region double-entry ledger with audit provenance and a 99.99% uptime commitment, built to survive an audit.",
    stack: ["TypeScript", "Rust", "CockroachDB"],
    metric: "99.99%",
    metricLabel: "uptime",
    bars: [96, 99, 97, 98, 96, 99, 98, 97, 99, 96, 98, 99, 97, 98],
  },
  {
    name: "Aster",
    codename: "developer platform",
    summary:
      "Internal portal, CLI, and SDK that cut onboarding from days to hours across a 400-engineer org.",
    stack: ["React", "Node.js", "OpenAPI"],
    metric: "415%",
    metricLabel: "dev velocity",
    bars: [30, 42, 58, 64, 71, 80, 77, 86, 90, 84, 92, 95, 93, 98],
  },
  {
    name: "Sentinel",
    codename: "observability",
    summary:
      "Distributed tracing plane processing 1.2B events a day with alerting that engineers actually trust.",
    stack: ["Go", "ClickHouse", "Kafka"],
    metric: "1.2B",
    metricLabel: "events / day",
    bars: [50, 55, 62, 60, 71, 68, 79, 76, 88, 84, 92, 90, 96, 94],
  },
];

function ArtPanel({ project }: { readonly project: Project }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-grid bg-void",
        project.featured === true ? "aspect-[16/9] lg:aspect-auto lg:h-72" : "aspect-[16/9]",
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-grid-faint opacity-40" />
      <div className="absolute inset-0 bg-scanlines opacity-60" />
      <div className="absolute inset-3 rounded-lg border border-grid bg-surface/50 p-4 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
            {project.metricLabel}
          </span>
          <span className="font-mono text-sm font-bold text-beam tabular-nums">
            {project.metric}
          </span>
        </div>
        <div className="flex h-20 items-end gap-1.5">
          {project.bars.map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-sm bg-beam/60"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectTile({ project }: { readonly project: Project }) {
  const featured = project.featured === true;
  return (
    <div
      className={cn(
        "tile tile-hover overflow-hidden",
        featured && "md:col-span-2",
      )}
    >
      <div className={cn(featured && "lg:grid lg:grid-cols-12")}>
        <div className={cn(featured && "lg:col-span-5")}>
          <ArtPanel project={project} />
        </div>
        <div className={cn("flex flex-col gap-4 p-6", featured && "lg:col-span-7 lg:justify-center")}>
          <div className="flex items-center gap-3">
            <Tag tone="beam">{project.codename}</Tag>
            {featured ? (
              <span className="font-mono text-[11px] text-faint">flagship</span>
            ) : null}
          </div>
          <h3 className="font-mono text-xl font-bold uppercase tracking-tight text-core sm:text-2xl">
            {project.name}
          </h3>
          <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
            {project.summary}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkSection() {
  return (
    <Section
      id="work"
      label="work"
      status="2021 — 2026"
      index="0x04"
      title="Selected deployments"
      description="A sample of systems we architected, built, and still operate for our clients."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PROJECTS.map((project) => (
          <ProjectTile key={project.name} project={project} />
        ))}
      </div>
    </Section>
  );
}