import { Section } from "@/components/ui/Section";
import type { Metric } from "@/types/content";
import { cn } from "@/utils/cn";

const METRICS: readonly Metric[] = [
  {
    value: "120+",
    label: "projects shipped",
    detail: "across 9 industries since 2011",
    delta: "+14 this year",
    deltaTone: "beam",
  },
  {
    value: "99.99%",
    label: "production uptime",
    detail: "weighted mean across active systems",
  },
  {
    value: "38ms",
    label: "p95 edge latency",
    detail: "median across global edge regions",
  },
  {
    value: "98.7%",
    label: "client retention",
    detail: "trailing 24 months, all engagements",
    delta: "+4.2 pts",
    deltaTone: "flare",
  },
];

function MetricTile({ metric }: { readonly metric: Metric }) {
  return (
    <div className="tile tile-hover flex flex-col justify-between gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            "font-mono text-xl font-bold tabular-nums",
            metric.deltaTone === "flare" ? "text-flare" : "text-beam",
            !metric.delta && "text-core",
          )}
        >
          {metric.value}
        </span>
        {metric.delta ? (
          <span
            className={cn(
              "whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]",
              metric.deltaTone === "flare"
                ? "border-flare/40 bg-flare/10 text-flare"
                : "border-beam/40 bg-beam/10 text-beam",
            )}
          >
            {metric.delta}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.15em] text-core">
          {metric.label}
        </p>
        <p className="text-sm leading-relaxed text-muted">{metric.detail}</p>
      </div>
    </div>
  );
}

export function Metrics() {
  return (
    <Section
      id="metrics"
      label="metrics"
      status="systems nominal"
      index="0x01"
      title="Hard numbers"
      description="Fourteen years of shipping production software, compressed into a status bar."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <MetricTile key={metric.label} metric={metric} />
        ))}
      </div>
    </Section>
  );
}