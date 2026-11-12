import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import type { Service } from "@/types/content";
import { cn } from "@/utils/cn";

const SERVICES: readonly Service[] = [
  {
    index: "0x01",
    name: "Product platforms",
    description:
      "Full-stack product engineering for web and API-first platforms. From first commit to multi-region rollout, one senior squad owns the whole path.",
    capabilities: [
      "Next.js / React",
      "TypeScript everywhere",
      "PostgreSQL / Redis",
      "Payments & billing",
      "Design systems",
    ],
    accent: "beam",
    featured: true,
  },
  {
    index: "0x02",
    name: "Mobile & native",
    description:
      "React Native apps and native modules that ship to stores on a predictable cadence.",
    capabilities: ["React Native", "Swift / Kotlin", "Offline-first", "Store automation"],
    accent: "beam",
  },
  {
    index: "0x03",
    name: "AI & data",
    description:
      "RAG pipelines, evals, and LLM features measured for cost and quality before they ship.",
    capabilities: ["LLM evals", "RAG pipelines", "Vector search", "dbt / Python"],
    accent: "beam",
  },
  {
    index: "0x04",
    name: "Cloud & infrastructure",
    description:
      "Terraform-defined platforms with controlled cost, sane IAM, and zero surprise bills.",
    capabilities: ["AWS / GCP", "Kubernetes", "Terraform", "CDN & edge"],
    accent: "beam",
  },
  {
    index: "0x05",
    name: "Developer experience",
    description:
      "CI/CD, monorepos, CLIs, and docs that make teams faster the day they land.",
    capabilities: ["CI/CD", "Monorepos", "Tooling & CLIs", "Engineering docs"],
    accent: "beam",
  },
  {
    index: "0x06",
    name: "Reliability",
    description:
      "SLOs, on-call, and incident response run like an internal product — because we built it to be.",
    capabilities: ["SLOs", "On-call", "Incident response", "Chaos drills"],
    accent: "flare",
  },
];

function ServiceTile({ service }: { readonly service: Service }) {
  const featured = service.featured === true;
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-6 overflow-hidden",
        featured
          ? "tile p-6 sm:p-8 lg:col-span-2"
          : "tile tile-hover p-6",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span
            className={cn(
              "font-mono text-xs tracking-[0.3em]",
              service.accent === "flare" ? "text-flare" : "text-beam",
            )}
          >
            [{service.index}]
          </span>
          {featured ? (
            <Tag tone="beam">featured</Tag>
          ) : (
            <span className="font-mono text-[11px] text-faint">▲</span>
          )}
        </div>
        <h3 className="font-mono text-lg font-bold uppercase tracking-tight text-core sm:text-xl">
          {service.name}
        </h3>
        <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
          {service.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {service.capabilities.map((capability) => (
          <Tag
            key={capability}
            tone={service.accent === "flare" ? "flare" : "neutral"}
          >
            {capability}
          </Tag>
        ))}
      </div>
    </div>
  );
}

export function ServicesSection() {
  return (
    <Section
      id="services"
      label="services"
      status="6 disciplines"
      index="0x02"
      title="What we build"
      description="Six focused disciplines, one integrated squad per engagement — every engineer senior, every deliverable measurable."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <ServiceTile key={service.name} service={service} />
        ))}
      </div>
    </Section>
  );
}