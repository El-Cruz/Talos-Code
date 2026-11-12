const TICKER_ITEMS: readonly string[] = [
  "typescript",
  "react",
  "next.js",
  "node.js",
  "go",
  "rust",
  "postgres",
  "redis",
  "kafka",
  "grpc",
  "kubernetes",
  "terraform",
  "opentelemetry",
  "grafana",
  "edge computing",
  "llm-ops",
];

function TickerItem({ value }: { readonly value: string }) {
  return (
    <span className="flex items-center gap-6 whitespace-nowrap px-5 py-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-faint">
        {value}
      </span>
      <span className="font-mono text-[11px] text-beam/60" aria-hidden="true">
        ◆
      </span>
    </span>
  );
}

export function Marquee() {
  const items = TICKER_ITEMS.concat(TICKER_ITEMS);
  return (
    <div
      className="overflow-hidden border-y border-grid bg-surface/40"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee motion-reduce:[animation:none]">
        {items.map((item, index) => (
          <TickerItem key={index} value={item} />
        ))}
      </div>
    </div>
  );
}