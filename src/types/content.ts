export type Accent = "beam" | "flare";

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface Service {
  readonly index: string;
  readonly name: string;
  readonly description: string;
  readonly capabilities: readonly string[];
  readonly accent: Accent;
  readonly featured?: boolean;
}

export interface Metric {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
  readonly delta?: string;
  readonly deltaTone?: Accent;
}

export interface ProcessStep {
  readonly index: string;
  readonly command: string;
  readonly name: string;
  readonly description: string;
  readonly outputs: readonly string[];
}

export interface Project {
  readonly name: string;
  readonly codename: string;
  readonly summary: string;
  readonly stack: readonly string[];
  readonly metric: string;
  readonly metricLabel: string;
  readonly bars: readonly number[];
  readonly featured?: boolean;
}

export interface Testimonial {
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly company: string;
}